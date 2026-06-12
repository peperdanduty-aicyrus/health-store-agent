export const demoDailyLimit = 10;
export const demoUsageCookieName = "hsa_demo_usage";

export type DemoUsage = {
  count: number;
  date: string;
};

export type DemoUsageResult = {
  allowed: boolean;
  remaining: number;
  usage: DemoUsage;
};

export function getTodayKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Shanghai",
    year: "numeric",
  }).format(date);
}

export function parseDemoUsage(rawValue: string | undefined, today = getTodayKey()): DemoUsage {
  if (!rawValue) {
    return { count: 0, date: today };
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<DemoUsage>;
    if (parsed.date !== today || typeof parsed.count !== "number" || !Number.isFinite(parsed.count)) {
      return { count: 0, date: today };
    }
    return {
      count: Math.max(0, Math.min(demoDailyLimit, Math.floor(parsed.count))),
      date: today,
    };
  } catch {
    return { count: 0, date: today };
  }
}

export function serializeDemoUsage(usage: DemoUsage): string {
  return JSON.stringify(usage);
}

export function advanceDemoUsage(rawValue: string | undefined, today = getTodayKey()): DemoUsageResult {
  const current = parseDemoUsage(rawValue, today);
  if (current.count >= demoDailyLimit) {
    return {
      allowed: false,
      remaining: 0,
      usage: current,
    };
  }

  const usage = {
    count: current.count + 1,
    date: today,
  };

  return {
    allowed: true,
    remaining: demoDailyLimit - usage.count,
    usage,
  };
}
