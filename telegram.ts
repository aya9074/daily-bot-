import TelegramBot from "node-telegram-bot-api";
import { logger } from "../lib/logger";

import {
  generateDailyMessage,
  generatePostIdea,
  generateContentIdea,
  generateVideoIdea,
  parseReminderCommand,
} from "./ai";

import {
  addReminder,
  deleteReminder,
  getReminders,
} from "./scheduler";

import {
  getTodayTask,
  getTodayDayName,
} from "./schedule";

const token = process.env["TELEGRAM_BOT_TOKEN"];
const chatId = process.env["TELEGRAM_CHAT_ID"];

if (!token) throw new Error("TELEGRAM_BOT_TOKEN is required");
if (!chatId) throw new Error("TELEGRAM_CHAT_ID is required");

let bot: TelegramBot | null = null;

//
// ─────────────────────────────────────────
// LOADING PHRASES
// ─────────────────────────────────────────
//

const LOADING_PHRASES = [
  "ща ща.. я уже работаю",
  "занимаюсь твоей командой",
  "опа! жди, сейчас всё будет",
  "секунду, думаю...",
  "уже кумекаю",
  "ок, момент",
  "принято, обрабатываю",
  "почти готово",
];

function randomLoading() {
  return LOADING_PHRASES[
    Math.floor(Math.random() * LOADING_PHRASES.length)
  ];
}

//
// ─────────────────────────────────────────
// BOT CREATION
// ─────────────────────────────────────────
//

export function createBot() {
  if (bot) return bot;

  bot = new TelegramBot(token!, { polling: true });

  logger.info("Telegram bot started");

  //
  // /start
  //
  bot.onText(/\/start/, async (msg) => {
    bot!.sendMessage(msg.chat.id, "бот запущен 👑");
  });

  //
  // /ping
  //
  bot.onText(/\/ping/, async (msg) => {
    bot!.sendMessage(msg.chat.id, "pong");
  });

  //
  // /nextday
  //
  bot.onText(/\/nextday/, async (msg) => {
    const text = await generateDailyMessage();
    bot!.sendMessage(msg.chat.id, text);
  });

  //
  // /ideapost
  //
  bot.onText(/\/ideapost/, async (msg) => {
    bot!.sendMessage(msg.chat.id, randomLoading());
    const idea = await generatePostIdea();
    bot!.sendMessage(msg.chat.id, idea);
  });

  //
  // /ideacontent
  //
  bot.onText(/\/ideacontent/, async (msg) => {
    bot!.sendMessage(msg.chat.id, randomLoading());
    const idea = await generateContentIdea();
    bot!.sendMessage(msg.chat.id, idea);
  });

  //
  // /ideavideo
  //
  bot.onText(/\/ideavideo/, async (msg) => {
    bot!.sendMessage(msg.chat.id, randomLoading());
    const idea = await generateVideoIdea();
    bot!.sendMessage(msg.chat.id, idea);
  });

  //
  // /status
  //
  bot.onText(/\/status/, async (msg) => {
    const day = getTodayDayName();
    const task = getTodayTask();

    const reminders = getReminders();

    let text = `📊 статус:\nдень: ${day}\nзадача: ${task || "нет"}\n\n`;

    text += "📌 напоминания:\n";
    if (reminders.length === 0) text += "нет\n";
    else {
      reminders.forEach((r) => {
        text += `${r.id}. ${r.text}\n`;
      });
    }

    bot!.sendMessage(msg.chat.id, text);
  });

  //
  // ─────────────────────────────────────────
  // AI-ОБРАБОТКА ВСЕХ СООБЩЕНИЙ
  // ─────────────────────────────────────────
  //

  bot.on("message", async (msg) => {
    if (!msg.text || msg.text.startsWith("/")) return;

    const text = msg.text.toLowerCase();

    // AI парсер команд
    const command = await parseReminderCommand(text);

    //
    // ADD REMINDER
    //
    if (command.action === "add" && command.text) {
      const id = addReminder(command.text);
      return bot!.sendMessage(msg.chat.id, `📌 Напоминание #${id} добавлено`);
    }

    //
    // DELETE REMINDER
    //
    if (command.action === "delete") {
      const ok = deleteReminder(command.id);

      return bot!.sendMessage(
        msg.chat.id,
        ok ? "🗑 удалено" : "не найдено"
      );
    }

    //
    // LIST REMINDERS
    //
    if (command.action === "list") {
      const list = getReminders();

      if (list.length === 0) {
        return bot!.sendMessage(msg.chat.id, "нет напоминаний");
      }

      const text = list.map((r) => `${r.id}. ${r.text}`).join("\n");

      return bot!.sendMessage(msg.chat.id, `📌 напоминания:\n${text}`);
    }

    //
    // fallback
    //
    bot!.sendMessage(msg.chat.id, "не понял команду 🤔");
  });

  return bot;
}

//
// ─────────────────────────────────────────
// SCHEDULED MESSAGE
// ─────────────────────────────────────────
//

export async function sendScheduledMessage() {
  if (!bot) return;

  const text = await generateDailyMessage();

  bot.sendMessage(chatId!, text, {
    parse_mode: "Markdown",
  });

  logger.info("Scheduled message sent");
}
