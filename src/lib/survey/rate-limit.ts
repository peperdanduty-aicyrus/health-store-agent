type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  limit: number;
  now?: number;
  windowMs: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

export function checkSurveyRateLimit(scope: string, key: string, options: RateLimitOptions): boolean {
  const now = options.now ?? Date.now();
  const bucketKey = `${scope}:${key || "anonymous"}`;
  const current = rateLimitBuckets.get(bucketKey);
  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
    return true;
  }

  if (current.count >= options.limit) {
    return false;
  }

  current.count += 1;
  return true;
}

export function getSurveyClientKey(headersList: Pick<Headers, "get">): string {
  const forwardedFor = headersList.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = headersList.get("cf-connecting-ip") || headersList.get("x-real-ip") || forwardedFor || "local";
  const userAgent = headersList.get("user-agent") || "unknown";
  return `${ip}:${userAgent.slice(0, 80)}`;
}

export function resetSurveyRateLimitForTests() {
  rateLimitBuckets.clear();
}
