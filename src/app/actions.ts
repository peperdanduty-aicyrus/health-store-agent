"use server";

import { mockStore } from "@/lib/data/store";

export type TrialApplicationFormState = {
  message: string;
  success: boolean;
};

const requiredFields = ["storeName", "storeType", "cityArea", "contactName", "phone"];

export async function submitTrialApplication(
  _previousState: TrialApplicationFormState,
  formData: FormData,
): Promise<TrialApplicationFormState> {
  const values = Object.fromEntries(formData.entries());

  for (const field of requiredFields) {
    if (!String(values[field] || "").trim()) {
      return {
        message: "请先填写门店名称、门店类型、城市 / 区域、联系人和手机号。",
        success: false,
      };
    }
  }

  mockStore.createTrialApplication({
    cityArea: String(values.cityArea),
    contactName: String(values.contactName),
    interestedFeatures: String(values.interestedFeatures || ""),
    note: String(values.note || ""),
    phone: String(values.phone),
    storeName: String(values.storeName),
    storeType: String(values.storeType),
    wechatId: String(values.wechatId || ""),
  });

  return {
    message: "申请已提交，请添加微信，人工开通体验权限。",
    success: true,
  };
}

