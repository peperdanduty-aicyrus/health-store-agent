export function getMerchantEditCookieName(storeId: string, periodMonth: string): string {
  return `survey_merchant_edit_${storeId.replace(/[^a-zA-Z0-9_]/g, "_")}_${periodMonth.replace(/[^0-9]/g, "")}`;
}
