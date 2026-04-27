import app from "./app";
import { createBot } from "./bot/telegram";
import { startScheduler } from "./bot/scheduler";

// безопасный логгер если файла нет
let logger: any = console;

try {
  logger = require("./lib/logger").logger;
} catch {
  console.warn("Custom logger not found, using console");
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err?: Error) => {
  if (err) {
    logger.error?.({ err }, "Error listening on port");
    console.error(err);
    process.exit(1);
  }

  logger.info?.({ port }, "Server listening");

  if (process.env.NODE_ENV === "production") {
    try {
      createBot();
      startScheduler();

      logger.info?.("Telegram bot and scheduler initialized");
    } catch (err) {
      logger.error?.({ err }, "Failed to initialize bot or scheduler");
    }
  } else {
    logger.info?.(
      "Development mode — bot polling disabled to avoid conflict with production"
    );
  }
});
