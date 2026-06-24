import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSurveyStore } from "./repository";
import type { SurveyStaffAccount } from "./types";

export const surveySessionCookieName = "survey_staff_session";

export async function getCurrentSurveyStaff(): Promise<SurveyStaffAccount | null> {
  const cookieStore = await cookies();
  const staffId = cookieStore.get(surveySessionCookieName)?.value;
  if (!staffId) {
    return null;
  }

  return (await getSurveyStore()).findStaffById(staffId);
}

export async function requireSurveyStaff(): Promise<SurveyStaffAccount> {
  const staff = await getCurrentSurveyStaff();
  if (!staff) {
    redirect("/yingyun");
  }
  return staff;
}

export async function requireSurveySuperAdmin(): Promise<SurveyStaffAccount> {
  const staff = await getCurrentSurveyStaff();
  if (!staff || staff.role !== "super_admin") {
    redirect("/cyrus");
  }
  return staff;
}
