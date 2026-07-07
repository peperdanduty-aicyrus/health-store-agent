export function formatChinaDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间未知";

  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}/${values.month}/${values.day} ${values.hour}:${values.minute}:${values.second}`;
}
