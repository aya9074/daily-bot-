import json
import os
from typing import Dict

from config import REMINDERS_FILE


def load_reminders() -> Dict[str, str]:
    if not os.path.exists(REMINDERS_FILE):
        return {}

    with open(REMINDERS_FILE, "r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, dict):
        return {}

    return {str(k): str(v) for k, v in data.items()}


def save_reminders(data: Dict[str, str]) -> None:
    parent = os.path.dirname(REMINDERS_FILE)
    if parent:
        os.makedirs(parent, exist_ok=True)

    with open(REMINDERS_FILE, "w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)
