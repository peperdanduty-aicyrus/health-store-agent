const chinaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function chinaDate(value: Date | string = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = chinaDateFormatter.formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function currentChinaMonth(value: Date | string = new Date()) {
  return chinaDate(value).slice(0, 7);
}

export function monthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = `${year}-${String(monthNumber).padStart(2, "0")}-01`;
  const next = new Date(Date.UTC(year, monthNumber, 1));
  next.setUTCDate(next.getUTCDate() - 1);
  const end = next.toISOString().slice(0, 10);
  return { start, end };
}

export function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function weekRange(today = chinaDate()) {
  const date = new Date(`${today}T00:00:00.000Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  const start = date.toISOString().slice(0, 10);
  return { start, end: addDays(start, 6) };
}
