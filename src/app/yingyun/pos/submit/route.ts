import { NextRequest, NextResponse } from "next/server";
import { getSurveyStore } from "@/lib/survey/repository";
import { getSurveyStaffFromRequest } from "@/lib/survey/route-auth";

export async function POST(request: NextRequest) {
  const staff = await getSurveyStaffFromRequest(request);
  if (!staff || staff.role !== "operator") return new NextResponse("Unauthorized", { status: 401 });
  const formData = await request.formData();
  const periodMonth = String(formData.get("periodMonth") || "");
  const pasteText = String(formData.get("posPasteText") || "");
  const store = await getSurveyStore();
  const stores = await store.listStores();
  const storeByCode = new Map(stores.map((item) => [item.storeCode.trim().toLowerCase(), item]));
  for (const line of pasteText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)) {
    const [storeCode, salesRaw, targetRaw, ...remarkParts] = line.split(/\t|,/).map((item) => item.trim());
    const targetStore = storeByCode.get(storeCode.toLowerCase());
    if (!targetStore || targetStore.mallId !== staff.mallId) continue;
    await store.upsertPosSale({
      actorId: staff.id,
      mallId: staff.mallId,
      periodMonth,
      remark: remarkParts.join(" ") || "批量粘贴",
      salesWan: parseOptionalOneDecimal(salesRaw),
      source: "excel_paste",
      storeId: targetStore.id,
      targetSalesWan: parseOptionalOneDecimal(targetRaw),
    });
  }
  return NextResponse.redirect(new URL("/yingyun/pos", request.url), 303);
}

function parseOptionalOneDecimal(raw: string): number | null {
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || Math.round(value * 10) !== value * 10) {
    throw new Error("请输入非负数字，最多保留1位小数。");
  }
  return value;
}
