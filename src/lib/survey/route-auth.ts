import type { NextRequest } from "next/server";
import { getSurveyStore } from "./repository";
import { surveySessionCookieName } from "./session";
import type { SurveyStaffAccount } from "./types";

export async function getSurveyStaffFromRequest(request: NextRequest): Promise<SurveyStaffAccount | null> {
  const staffId = request.cookies.get(surveySessionCookieName)?.value;
  if (!staffId) {
    return null;
  }
  return (await getSurveyStore()).findStaffById(staffId);
}
