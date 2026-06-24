import type { SurveyReportType, SurveySalesSource } from "../survey/types";

export type SurveyReportStoreSnapshot = {
  category: string;
  followUpSummary: Array<{ status: string; subject: string }>;
  merchantInput: {
    mainPromotion: string;
    nextActionPlan: string;
    otherReasonText: string | null;
    reasonCodes: string[];
    selfRating: string;
  };
  metrics: {
    effectiveSalesWan: number | null;
    momRate: number | null;
    peerGapRate: number | null;
    salesPerSqm: number | null;
    salesPerStaff: number | null;
    salesSource: SurveySalesSource;
    selfPosDiffRate: number | null;
    targetCompletionRate: number | null;
    yoyRate: number | null;
  };
  peerReference: {
    peerAverageSalesWan: number | null;
    peerCount: number;
    peerGapRate: number | null;
  };
  storeId: string;
  storeName: string;
  warningFlags: string[];
};

export type SurveyReportSnapshot = {
  categoryMetrics: Array<{
    category: string;
    downStoreCount: number;
    momRate: number | null;
    salesWan: number;
    targetCompletionRate: number | null;
    upStoreCount: number;
    yoyRate: number | null;
  }>;
  dataQuality: {
    activeStoreCount: number;
    posCoverageRate: number;
    posStoreCount: number;
    submissionRate: number;
    submittedStoreCount: number;
    yoyAvailableStoreCount: number;
  };
  generatedAt: string;
  mallId: string;
  overallMetrics: {
    criticalStoreCount: number;
    momRate: number | null;
    salesWan: number;
    targetCompletionRate: number | null;
    warningCount: number;
    yoyRate: number | null;
  };
  periodMonth: string;
  reasonStatistics: {
    declineReasons: Array<{ code: string; count: number }>;
    growthReasons: Array<{ code: string; count: number }>;
  };
  specialMetrics: {
    education: Array<Record<string, unknown>>;
    kidsEntertainment: Array<Record<string, unknown>>;
  };
  storeMap: Array<{ anonymousId: string; displayName: string; storeId: string }>;
  stores: SurveyReportStoreSnapshot[];
};

export type SurveyAnonymizedReportInput = Omit<SurveyReportSnapshot, "storeMap" | "stores"> & {
  stores: Array<Omit<SurveyReportStoreSnapshot, "storeId" | "storeName"> & { storeId: string }>;
};

export type SurveyReportProviderResult = {
  content: string;
  elapsedMs: number;
  model: string;
  provider: string;
  usage: Record<string, unknown> | null;
};

export type SurveyReportProvider = {
  completeJson(input: { prompt: string; reportType: SurveyReportType; timeoutMs?: number }): Promise<SurveyReportProviderResult>;
};

export type SurveyGenerateReportResult = {
  errorMessage?: string;
  jobId: string;
  reportId?: string;
  status: "failed" | "succeeded";
};
