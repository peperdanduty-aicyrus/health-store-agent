import type { SurveyAnonymizedReportInput, SurveyReportSnapshot } from "./report-types";

export type SurveyStoreAnonymization = {
  anonymousId: string;
  displayName: string;
  storeId: string;
};

export function anonymizeReportSnapshot(snapshot: SurveyReportSnapshot): {
  input: SurveyAnonymizedReportInput;
  mapping: SurveyStoreAnonymization[];
} {
  const mapping = snapshot.stores.map((store, index) => ({
    anonymousId: `STORE_${String(index + 1).padStart(3, "0")}`,
    displayName: store.storeName,
    storeId: store.storeId,
  }));
  const idByStore = new Map(mapping.map((item) => [item.storeId, item.anonymousId]));
  return {
    input: {
      categoryMetrics: snapshot.categoryMetrics.map((item) => ({ ...item })),
      dataQuality: { ...snapshot.dataQuality },
      generatedAt: snapshot.generatedAt,
      mallId: snapshot.mallId,
      overallMetrics: { ...snapshot.overallMetrics },
      periodMonth: snapshot.periodMonth,
      reasonStatistics: {
        declineReasons: [...snapshot.reasonStatistics.declineReasons],
        growthReasons: [...snapshot.reasonStatistics.growthReasons],
      },
      specialMetrics: {
        education: snapshot.specialMetrics.education,
        kidsEntertainment: snapshot.specialMetrics.kidsEntertainment,
      },
      stores: snapshot.stores.map(({ storeId, storeName: _storeName, ...store }) => ({
        ...store,
        storeId: idByStore.get(storeId) ?? storeId,
      })),
    },
    mapping,
  };
}

export function restoreReportStoreNames<T>(content: T, mapping: SurveyStoreAnonymization[]): T {
  const known = new Map(mapping.map((item) => [item.anonymousId, item.displayName]));
  const cloned = JSON.parse(JSON.stringify(content)) as unknown;
  return walkAndRestore(cloned, known) as T;
}

function walkAndRestore(value: unknown, known: Map<string, string>): unknown {
  if (typeof value === "string") {
    return restoreStoreIdsInText(value, known);
  }
  if (Array.isArray(value)) {
    return value.map((item) => walkAndRestore(item, known));
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  const record = value as Record<string, unknown>;
  for (const [key, item] of Object.entries(record)) {
    if (typeof item === "string") {
      record[key] = restoreStoreIdsInText(item, known);
    } else {
      record[key] = walkAndRestore(item, known);
    }
  }
  return record;
}

function restoreStoreIdsInText(value: string, known: Map<string, string>) {
  return value.replace(/STORE_\d{3}/g, (id) => {
    const mapped = known.get(id);
    if (!mapped) throw new Error(`未知脱敏门店ID：${id}`);
    return mapped;
  });
}
