from storage import load_reminders, save_reminders

def add_reminder(text):
    data = load_reminders()

    if data:
        new_id = str(int(max(data.keys())) + 1)
    else:
        new_id = "1"

    data[new_id] = text
    save_reminders(data)

    return new_id

def delete_reminder(reminder_id):
    data = load_reminders()

    if reminder_id in data:
        del data[reminder_id]
        save_reminders(data)
        return True

    return False

def list_reminders():
    return load_reminders()
