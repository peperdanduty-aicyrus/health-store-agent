type SurveyAccountWindow = {
  enabled: boolean;
  expiresAt: string;
  startsAt: string;
};

export type SurveyTermMonths = 3 | 6 | 12;

export function isSurveyAccountActive(account: SurveyAccountWindow, now = new Date()): boolean {
  if (!account.enabled) {
    return false;
  }
  const today = toDateOnly(now);
  return account.startsAt <= today && account.expiresAt >= today;
}

export function canOpenNewSurveyPeriod(account: SurveyAccountWindow, now = new Date()): boolean {
  return isSurveyAccountActive(account, now);
}

export function applySurveyTermPreset(startsAt: string, months: SurveyTermMonths) {
  const [year, month, day] = startsAt.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day || 1));
  const expires = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 0));
  return {
    startsAt: toDateOnly(start),
    expiresAt: toDateOnly(expires),
  };
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
