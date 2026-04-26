import requests

GROQ_API_KEY = "gsk_XXXXX"

def parse_command(message):

    prompt = f"""
Ты анализатор команд.

Определи намерение пользователя.

Возможные команды:

ADD_REMINDER: добавить напоминание
DELETE_REMINDER: удалить напоминание
NONE: обычное сообщение

Сообщение:
{message}

Ответ только JSON:

{{
 "action": "...",
 "text": "...",
 "id": "..."
}}
"""

    r = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}"
        },
        json={
            "model": "llama3-70b-8192",
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }
    )

    return r.json()["choices"][0]["message"]["content"]
