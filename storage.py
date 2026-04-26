import json
import os

FILE = "reminders.json"

def load_reminders():
    if not os.path.exists(FILE):
        return {}
    with open(FILE, "r") as f:
        return json.load(f)

def save_reminders(data):
    with open(FILE, "w") as f:
        json.dump(data, f, indent=2)
