import OpenAI from "openai";
import { logger } from "../lib/logger";
import {
  getTodayTask,
  getTodayDayName,
  getPostponedTask,
  clearPostponedTask,
} from "./schedule";

const openai = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env["GROQ_API_KEY"],
});

// ═══════════════════════════════════════════════════════════════
// 🎯 НАСТРОЙКА ИИ
// ═══════════════════════════════════════════════════════════════

const MY_WORK_DESCRIPTION = `
Я — Госпожа, веду Telegram-канал в нише фемдом и финдом. Контент — ноу-нюд.
В постах обычно одна фотография: ножки, каблуки, взгляд сверху вниз, поза доминирования.
В кружочках — короткие фразы: стою, показываю ножки, подмигиваю, говорю что-то властное.
`;

const MY_GOALS = `
- Публиковать контент по расписанию
- Делать разнообразный контент
- Привлекать подписчиков
- Монетизировать канал
`;

// ═══════════════════════════════════════════════════════════════

async function callAI(systemPrompt: string, userPrompt: string): Promise<string | null> {
  try {
    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content ?? null;
  } catch (err) {
    logger.error({ err }, "Groq call failed");
    return null;
  }
}

//
// ═══════════════════════════════════════════════════════════════
// AI ПАРСИНГ КОМАНД НАПОМИНАНИЙ
// ═══════════════════════════════════════════════════════════════
//

export type ReminderCommand =
  | { action: "add"; text: string }
  | { action: "delete"; id: number }
  | { action: "list" }
  | { action: "none" };

export async function parseReminderCommand(
  message: string
): Promise<ReminderCommand> {
  const system = `
Ты анализируешь сообщения пользователя.

Определи, является ли сообщение командой для напоминаний.

Возможные действия:

ADD — добавить напоминание
DELETE — удалить напоминание по номеру
LIST — показать список
NONE — обычное сообщение

Отвечай только JSON.
`;

  const user = `
Сообщение пользователя:
"${message}"

Ответ JSON:

{
 "action": "add | delete | list | none",
 "text": "текст напоминания",
 "id": number
}
`;

  const result = await callAI(system, user);

  if (!result) return { action: "none" };

  try {
    const parsed = JSON.parse(result);

    if (parsed.action === "add")
      return { action: "add", text: parsed.text };

    if (parsed.action === "delete")
      return { action: "delete", id: Number(parsed.id) };

    if (parsed.action === "list")
      return { action: "list" };

    return { action: "none" };
  } catch {
    return { action: "none" };
  }
}

//
// ═══════════════════════════════════════════════════════════════
// СЕРДЕЧКИ
// ═══════════════════════════════════════════════════════════════
//

const HEARTS = ["🩷", "🤍", "💛", "🧡", "💜", "🩵", "🤎", "💙"];

const DAY_EMOJIS: Record<number, string> = {
  0: "🌸",
  1: "☕",
  2: "✍️",
  3: "🌿",
  4: "🎬",
  5: "💅",
  6: "👑",
};

//
// ═══════════════════════════════════════════════════════════════
// DAILY MESSAGE
// ═══════════════════════════════════════════════════════════════
//

export async function generateDailyMessage(): Promise<string> {
  const dayName = getTodayDayName();
  const todayTask = getTodayTask();
  const postponed = getPostponedTask();

  const tasks: string[] = [];
  if (postponed) tasks.push(postponed);
  if (todayTask) tasks.push(todayTask);

  const tasksText =
    tasks.length > 0
      ? tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")
      : "Сегодня свободный день 🌿";

  const systemPrompt = `Ты — персональный коуч Telegram автора.
${MY_WORK_DESCRIPTION}
${MY_GOALS}

Пиши тепло, коротко, без воды.
`;

  const userPrompt = `Сегодня ${dayName}.
Задачи: ${tasks.join(", ") || "свободный день"}.

Ответ:

ПОСТ:
КОНТЕНТ:
МОТИВАЦИЯ:
СОВЕТ:
`;

  const aiResult = await callAI(systemPrompt, userPrompt);

  let postIdea = "Пост про зависимость от Госпожи";
  let contentIdea = "Фото каблуков снизу вверх";
  let motivation = "Каждый пост приближает тебя к свободе";
  let tip = "Лучше живой контент чем идеальный";

  if (aiResult) {
    const lines = aiResult.split("\n");

    for (const line of lines) {
      if (line.startsWith("ПОСТ:"))
        postIdea = line.replace("ПОСТ:", "").trim();

      if (line.startsWith("КОНТЕНТ:"))
        contentIdea = line.replace("КОНТЕНТ:", "").trim();

      if (line.startsWith("МОТИВАЦЦИЯ:"))
        motivation = line.replace("МОТИВАЦИЯ:", "").trim();

      if (line.startsWith("СОВЕТ:"))
        tip = line.replace("СОВЕТ:", "").trim();
    }
  }

  clearPostponedTask();

  const heart = HEARTS[Math.floor(Math.random() * HEARTS.length)];
  const dayEmoji = DAY_EMOJIS[new Date().getDay()];

  return `Привет! Сегодня ${dayName} ${dayEmoji}

📋 План:
${tasksText}

💡 Пост: "${postIdea}"

🎬 Контент: "${contentIdea}"

✨ ${motivation}

📌 Совет:
${tip}

Удачи ${heart}`;
}
