export const WEEKLY_SCHEDULE: Record<number, string> = {
  0: "",                   // воскресенье — свободный день
  1: "запись контента",    // понедельник
  2: "пост в канал",       // вторник
  3: "",                   // среда — свободный день
  4: "кружочек",           // четверг
  5: "пост-зазывалка",     // пятница
  6: "пост-зазывалка",     // суббота
};

export const DAY_NAMES: Record<number, string> = {
  0: "воскресенье",
  1: "понедельник",
  2: "вторник",
  3: "среда",
  4: "четверг",
  5: "пятница",
  6: "суббота",
};

let postponedTask: string | null = null;

export function getTodayTask(): string | null {
  const day = new Date().getDay();
  const task = WEEKLY_SCHEDULE[day];

  if (!task || task.trim() === "") return null;

  return task;
}

export function getTodayDayName(): string {
  const day = new Date().getDay();
  return DAY_NAMES[day] ?? "день";
}

export function getPostponedTask(): string | null {
  return postponedTask;
}

export function setPostponedTask(task: string): void {
  postponedTask = task;
}

export function clearPostponedTask(): void {
  postponedTask = null;
}
