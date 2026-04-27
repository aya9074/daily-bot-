import cron from "node-cron";
import fs from "fs";
import path from "path";
import { sendScheduledMessage } from "./telegram";
import { logger } from "../lib/logger";

const SCHEDULE = "0 13 * * *"; // 16:00 МСК
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

const REMINDERS_FILE = path.join(process.cwd(), "reminders.json");

type Reminder = {
  id: number;
  text: string;
};

let reminders: Reminder[] = [];

//
// ─────────────────────────────────────────
// LOAD / SAVE
// ─────────────────────────────────────────
//

function loadReminders() {
  try {
    if (fs.existsSync(REMINDERS_FILE)) {
      const raw = fs.readFileSync(REMINDERS_FILE, "utf8");
      reminders = JSON.parse(raw);
    }
  } catch (err) {
    logger.error({ err }, "Failed to load reminders");
  }
}

function saveReminders() {
  try {
    fs.writeFileSync(REMINDERS_FILE, JSON.stringify(reminders, null, 2));
  } catch (err) {
    logger.error({ err }, "Failed to save reminders");
  }
}

//
// ─────────────────────────────────────────
// REMINDER FUNCTIONS
// ─────────────────────────────────────────
//

export function addReminder(text: string): number {
  const id = reminders.length > 0 ? reminders[reminders.length - 1].id + 1 : 1;

  reminders.push({ id, text });

  saveReminders();

  logger.info({ id, text }, "Reminder added");

  return id;
}

export function deleteReminder(id: number): boolean {
  const index = reminders.findIndex((r) => r.id === id);

  if (index === -1) return false;

  reminders.splice(index, 1);

  saveReminders();

  logger.info({ id }, "Reminder deleted");

  return true;
}

export function getReminders(): Reminder[] {
  return reminders;
}

//
// ─────────────────────────────────────────
// HEARTBEAT
// ─────────────────────────────────────────
//

const HEARTBEAT_PHRASES = [
  "ожидаю отправки сообщения",
  "жду своего часа",
  "всё тихо, работаю в фоне",
  "на связи, жду 16:00",
  "готова к работе, жду команды",
];

function randomHeartbeat(): string {
  return HEARTBEAT_PHRASES[
    Math.floor(Math.random() * HEARTBEAT_PHRASES.length)
  ];
}

//
// ─────────────────────────────────────────
// START SCHEDULER
// ─────────────────────────────────────────
//

export function startScheduler(): void {
  loadReminders();

  cron.schedule(
    SCHEDULE,
    async () => {
      logger.info("Running scheduled daily message job");

      await sendScheduledMessage();
    },
    { timezone: "UTC" }
  );

  setInterval(() => {
    logger.info(randomHeartbeat());
  }, HEARTBEAT_INTERVAL_MS);

  logger.info(
    { schedule: SCHEDULE, localTime: "16:00 Moscow (UTC+3)" },
    "Scheduler started"
  );
}
