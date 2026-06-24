export const surveyHostName = "survey.81366776.xyz";

export function isSurveyHost(host: string | null | undefined, env: Record<string, string | undefined> = process.env): boolean {
  const normalizedHost = String(host || "").split(":")[0].toLowerCase();
  return normalizedHost === surveyHostName || env.NEXT_PUBLIC_SURVEY_ENTRY_ENABLED === "true";
}
