from ai_parser import parse_command
from reminders import add_reminder, delete_reminder, list_reminders

def handle_message(msg):

    cmd = parse_command(msg)

    if cmd["action"] == "ADD_REMINDER":

        rid = add_reminder(cmd["text"])

        return f"Напоминание #{rid} добавлено"

    if cmd["action"] == "DELETE_REMINDER":

        ok = delete_reminder(cmd["id"])

        if ok:
            return "Напоминание удалено"
        else:
            return "Такого напоминания нет"

    return "Обычное сообщение"
