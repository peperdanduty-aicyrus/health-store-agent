import { NextRequest, NextResponse } from "next/server";
import { getSurveyStore } from "@/lib/survey/repository";
import { getSurveyStaffFromRequest } from "@/lib/survey/route-auth";
import type { SurveyFollowUp } from "@/lib/survey/types";

export async function POST(request: NextRequest) {
  const staff = await getSurveyStaffFromRequest(request);
  if (!staff || staff.role !== "operator") return new NextResponse("Unauthorized", { status: 401 });
  const formData = await request.formData();
  const input = {
    actorId: staff.id,
    followUpDate: String(formData.get("followUpDate") || new Date().toISOString().slice(0, 10)),
    followUpItem: String(formData.get("followUpItem") || ""),
    followUpMethod: String(formData.get("followUpMethod") || ""),
    id: String(formData.get("followUpId") || "") || undefined,
    mallId: staff.mallId,
    merchantFeedback: String(formData.get("merchantFeedback") || ""),
    nextAction: String(formData.get("nextAction") || ""),
    nextFollowUpDate: String(formData.get("nextFollowUpDate") || "") || null,
    ownerName: String(formData.get("ownerName") || staff.displayName),
    periodMonth: String(formData.get("periodMonth") || ""),
    status: readStatus(formData),
    storeId: String(formData.get("storeId") || ""),
    warningId: String(formData.get("warningId") || ""),
  };
  const store = await getSurveyStore();
  if (input.id) {
    await store.updateFollowUp({ ...input, id: input.id });
  } else {
    await store.createFollowUp(input);
  }
  return NextResponse.redirect(new URL("/yingyun/follow-ups", request.url), 303);
}

function readStatus(formData: FormData): SurveyFollowUp["status"] {
  const value = String(formData.get("status") || "待联系");
  return ["待联系", "已联系", "整改中", "待跟进", "跟进中", "待复查", "已完成", "暂不处理"].includes(value) ? value as SurveyFollowUp["status"] : "待联系";
}
