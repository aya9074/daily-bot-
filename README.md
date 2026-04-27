# Daily Bot (Python + Groq)

Бот полностью на Python (без TypeScript) для стабильного деплоя на DigitalOcean.

## Где теперь "обучение" и задачи AI
Чтобы не потерялась важная логика из старых `ai.ts` и `schedule.ts`:
- `ai_context.py` — описание ниши, тона и целей (контекст для AI).
- `schedule.py` — недельное расписание и функции работы с задачами дня.
- `ai_parser.py` — использует оба файла в prompt при анализе команд.
- `bot_texts.py` — настройки эмодзи и фраз ответов на команды.

## Что умеет
- Добавлять напоминания в чате (через AI-разбор текста).
- Удалять напоминания по номеру.
- Показывать актуальный список напоминаний.
- На обычное сообщение тоже показывает текущие напоминания (пока не удалишь).

## Команды естественным языком
Примеры фраз:
- `добавь в напоминания купить кофе`
- `удали напоминание 2`
- `покажи напоминания`

## Переменные окружения
Скопируй `.env.example` в `.env`:

```bash
cp .env.example .env
```

Заполни:
- `TELEGRAM_BOT_TOKEN`
- `GROQ_API_KEY`

## Локальный запуск
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export $(grep -v '^#' .env | xargs)
python3 main.py
```

## Деплой на DigitalOcean (Ubuntu Droplet)

### 1) Установка
```bash
sudo apt update
sudo apt install -y python3 python3-venv git
```

### 2) Клонирование и окружение
```bash
git clone <YOUR_REPO_URL> /opt/daily-bot
cd /opt/daily-bot
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
nano .env
```

### 3) systemd сервис
Создай `/etc/systemd/system/daily-bot.service`:

```ini
[Unit]
Description=Daily Telegram Bot
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/daily-bot
EnvironmentFile=/opt/daily-bot/.env
ExecStart=/opt/daily-bot/.venv/bin/python /opt/daily-bot/main.py
Restart=always
RestartSec=5
User=root

[Install]
WantedBy=multi-user.target
```

### 4) Запуск
```bash
sudo systemctl daemon-reload
sudo systemctl enable daily-bot
sudo systemctl start daily-bot
sudo systemctl status daily-bot
```

Логи:
```bash
sudo journalctl -u daily-bot -f
```
