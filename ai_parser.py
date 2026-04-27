import json
from typing import Any, Dict

import requests

from ai_context import build_assistant_context
from config import GROQ_API_KEY, GROQ_MODEL
from schedule import get_today_day_name, get_today_task


BASE_URL = "https://api.groq.com/openai/v1/chat/completions"


# Набор возможных ответов парсера
DEFAULT_RESULT: Dict[str, Any] = {
    "action": "NONE",
    "text": "",
    "id": 0,
}


def _extract_json(text: str) -> Dict[str, Any]:
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # На случай, если модель вернула JSON с лишним текстом
    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1 or end <= start:
        return DEFAULT_RESULT

    snippet = text[start : end + 1]

    try:
        return json.loads(snippet)
    except json.JSONDecodeError:
        return DEFAULT_RESULT


def parse_command(message: str) -> Dict[str, Any]:
    if not GROQ_API_KEY:
        return DEFAULT_RESULT

    today_day = get_today_day_name()
    today_task = get_today_task() or "свободный день"

    prompt = f"""
Ты анализатор команд для Telegram-бота.

Контекст проекта:
{build_assistant_context()}

Сегодня: {today_day}
Задача дня: {today_task}

Задача:
Определи, является ли сообщение командой напоминаний.

Поддерживаемые команды:
- ADD_REMINDER: добавить напоминание
- DELETE_REMINDER: удалить напоминание по номеру
- LIST_REMINDERS: показать список
- NONE: обычный текст, не команда

Важно:
- ADD_REMINDER только если пользователь явно просит добавить/запомнить/внести в напоминания.
- DELETE_REMINDER только если есть явное удаление и номер.
- LIST_REMINDERS только если запрос показать/список напоминаний.
- Если сомневаешься, выбирай NONE.

Сообщение пользователя:
{message}

Ответ строго JSON формата:
{{
  "action": "ADD_REMINDER | DELETE_REMINDER | LIST_REMINDERS | NONE",
  "text": "строка для добавления или пусто",
  "id": 0
}}
"""

    response = requests.post(
        BASE_URL,
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        },
        timeout=45,
        json={
            "model": GROQ_MODEL,
            "temperature": 0,
            "messages": [
                {
                    "role": "system",
                    "content": "Отвечай только валидным JSON без пояснений.",
                },
                {"role": "user", "content": prompt},
            ],
        },
    )

    response.raise_for_status()

    content = response.json()["choices"][0]["message"]["content"]
    parsed = _extract_json(content)

    action = str(parsed.get("action", "NONE")).upper()
    text = str(parsed.get("text", "")).strip()

    raw_id = parsed.get("id", 0)
    try:
        reminder_id = int(raw_id)
    except (TypeError, ValueError):
        reminder_id = 0

    if action not in {"ADD_REMINDER", "DELETE_REMINDER", "LIST_REMINDERS", "NONE"}:
        action = "NONE"

    return {
        "action": action,
        "text": text,
        "id": reminder_id,
    }
