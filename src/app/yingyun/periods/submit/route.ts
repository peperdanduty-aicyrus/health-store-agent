import { NextRequest, NextResponse } from "next/server";
import { getSurveyStore } from "@/lib/survey/repository";
import { getSurveyStaffFromRequest } from "@/lib/survey/route-auth";

export async function POST(request: NextRequest) {
  const staff = await getSurveyStaffFromRequest(request);
  if (!staff || staff.role !== "operator") return new NextResponse("Unauthorized", { status: 401 });
  const formData = await request.formData();
  const action = String(formData.get("periodAction") || "open");
  const input = {
    actorId: staff.id,
    mallId: staff.mallId,
    normalFillEndsAt: String(formData.get("normalFillEndsAt") || "") || null,
    normalFillStartsAt: String(formData.get("normalFillStartsAt") || "") || null,
    periodMonth: String(formData.get("periodMonth") || ""),
    reopenedUntil: String(formData.get("reopenedUntil") || "") || null,
  };
  const store = await getSurveyStore();
  if (action === "close") {
    await store.closeSurveyPeriod(input);
  } else if (action === "reopen") {
    await store.reopenSurveyPeriod(input);
  } else {
    await store.openSurveyPeriod(input);
  }
  return NextResponse.redirect(new URL("/yingyun/periods", request.url), 303);
}
