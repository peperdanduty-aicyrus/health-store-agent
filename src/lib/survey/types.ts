export type SurveyStaffRole = "super_admin" | "operator";
export type SurveyStoreStatus = "active" | "disabled" | "archived";
export type SurveyImportRow = Record<string, string>;

export type SurveyMall = {
  id: string;
  name: string;
  status: "active" | "disabled";
  createdAt: string;
  updatedAt: string;
};

export type SurveyStaffAccount = {
  id: string;
  mallId: string;
  loginName: string;
  phone: string;
  passwordHash: string;
  role: SurveyStaffRole;
  displayName: string;
  enabled: boolean;
  startsAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SurveyBrand = {
  id: string;
  mallId: string;
  name: string;
  normalizedName: string;
  createdAt: string;
  updatedAt: string;
};

export type SurveyCategory = {
  id: string;
  mallId: string;
  name: string;
  sortOrder: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SurveySubcategory = {
  id: string;
  mallId: string;
  categoryId: string;
  name: string;
  sortOrder: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SurveyStore = {
  id: string;
  mallId: string;
  mallName: string;
  brandId: string;
  brandName: string;
  storeName: string;
  storeCode: string;
  floor: string;
  unitNo: string;
  displayLocation: string;
  categoryId: string;
  categoryName: string;
  formCategoryCode?: string;
  subcategoryId: string;
  subcategoryName: string;
  contractStartDate: string;
  contractEndDate: string;
  areaSqm: number;
  staffCount: number;
  managerName: string;
  contactPhone: string;
  operationMode: string;
  chainStore: boolean;
  operatorName: string;
  rentMode: string;
  status: SurveyStoreStatus;
  searchText: string;
  createdAt: string;
  updatedAt: string;
};

export type SurveyStoreAlias = {
  id: string;
  storeId: string;
  alias: string;
  normalizedAlias: string;
  createdAt: string;
};

export type SurveyStoredFormField = {
  id: string;
  mallId: string;
  categoryId: string | null;
  fieldKey: string;
  label: string;
  type: string;
  required: boolean;
  unit: string;
  precision: number | null;
  optionsJson: string;
  visibleRuleJson: string;
  sortOrder: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SurveyAuditLog = {
  id: string;
  mallId: string;
  actorType: "system" | "staff";
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  detailJson: string;
  createdAt: string;
};

export type SurveyPeerSalesRow = {
  mallName: string;
  salesWan: number;
};

export type SurveyMerchantSubmission = {
  id: string;
  mallId: string;
  storeId: string;
  periodMonth: string;
  categoryName: string;
  status: "submitted";
  isLate: boolean;
  firstSubmittedAt: string;
  lastModifiedAt: string;
  merchantEditUntil: string;
  merchantEditTokenHash: string;
  selfReportedSalesWan: number;
  salesTargetWan: number;
  memberRechargeWan: number;
  noLocalPeerStores: boolean;
  fieldValuesJson: string;
  createdAt: string;
  updatedAt: string;
};

export type SurveySubmissionChangeLog = {
  id: string;
  submissionId: string;
  actorType: "merchant" | "operator" | "super_admin";
  actorId: string;
  fieldKey: string;
  oldValue: string;
  newValue: string;
  changedAt: string;
};

export type CreateSurveyMerchantSubmissionInput = {
  categoryName: string;
  editToken?: string;
  fieldValues: Record<string, unknown>;
  isLate: boolean;
  mallId: string;
  memberRechargeWan: number;
  noLocalPeerStores: boolean;
  peerRows: SurveyPeerSalesRow[];
  periodMonth: string;
  salesTargetWan: number;
  selfReportedSalesWan: number;
  storeId: string;
};

export type UpdateSurveyMerchantSubmissionInput = {
  editToken: string;
  fieldValues: Record<string, unknown>;
  id: string;
  memberRechargeWan?: number;
  now: Date;
  peerRows: SurveyPeerSalesRow[];
  salesTargetWan: number;
  selfReportedSalesWan: number;
};

export type SurveyStoreInput = {
  id?: string;
  mallId: string;
  brandId: string;
  storeName: string;
  storeCode: string;
  floor: string;
  unitNo: string;
  displayLocation: string;
  categoryId: string;
  formCategoryCode?: string;
  subcategoryId: string;
  subcategoryName?: string;
  contractStartDate: string;
  contractEndDate: string;
  areaSqm: number;
  staffCount: number;
  managerName: string;
  contactPhone: string;
  operationMode: string;
  chainStore: boolean;
  operatorName: string;
  rentMode: string;
  status: SurveyStoreStatus;
};

export type SurveyStoreImportCandidate = {
  aliases: string[];
  areaSqm: number;
  brandName: string;
  categoryName: string;
  chainStore: boolean;
  contactPhone: string;
  contractEndDate: string;
  contractStartDate: string;
  displayLocation: string;
  floor: string;
  managerName: string;
  operationMode: string;
  operatorName: string;
  rentMode: string;
  staffCount: number;
  storeCode: string;
  storeId: string;
  storeName: string;
  subcategoryName: string;
  unitNo: string;
};

export type SurveyStoreImportError = {
  reason: string;
  row: SurveyImportRow;
  rowNumber: number;
};

export type SurveyStoreImportResult = {
  errorRows: SurveyStoreImportError[];
  validRows: SurveyStoreImportCandidate[];
};

export type SurveySalesSource = "merchant" | "missing" | "pos";

export type SurveyMonthlyMetricInput = {
  areaSqm: number | null;
  fieldValues: Record<string, unknown>;
  isLate: boolean;
  merchantSalesWan: number | null;
  periodMonth: string;
  posSalesWan: number | null;
  previousMonthEffectiveSalesWan: number | null;
  salesTargetWan: number | null;
  sameMonthLastYearEffectiveSalesWan: number | null;
  staffCount: number | null;
  storeId: string;
};

export type SurveyMonthlyMetric = {
  areaSqmSnapshot: number | null;
  effectiveSalesWan: number | null;
  fieldValues: Record<string, unknown>;
  isLate: boolean;
  merchantSalesWan: number | null;
  momRate: number | null;
  periodMonth: string;
  posSalesWan: number | null;
  salesPerSqm: number | null;
  salesPerStaff: number | null;
  salesSource: SurveySalesSource;
  salesTargetWan: number | null;
  selfPosDiffRate: number | null;
  selfPosDiffWan: number | null;
  staffCountSnapshot: number | null;
  storeId: string;
  targetCompletionRate: number | null;
  yoyRate: number | null;
};

export type SurveyWarning = {
  code: string;
  message: string;
  severity: "一般" | "严重" | "重要";
};

export type SurveyPosSale = {
  createdAt: string;
  id: string;
  mallId: string;
  periodMonth: string;
  remark: string;
  salesWan: number | null;
  source: string;
  storeId: string;
  targetSalesWan: number | null;
  updatedAt: string;
  updatedBy: string;
};

export type UpsertSurveyPosSaleInput = {
  actorId: string;
  mallId: string;
  periodMonth: string;
  remark?: string;
  salesWan: number | null;
  source?: string;
  storeId: string;
  targetSalesWan: number | null;
};

export type SurveyMonthlyPeriod = {
  closedAt: string | null;
  closedBy: string | null;
  createdAt: string;
  id: string;
  mallId: string;
  normalFillEndsAt: string | null;
  normalFillStartsAt: string | null;
  openedAt: string | null;
  openedBy: string | null;
  periodMonth: string;
  reopenedBy: string | null;
  reopenedUntil: string | null;
  status: "closed" | "open" | "reopened";
  updatedAt: string;
};

export type UpsertSurveyPeriodInput = {
  actorId: string;
  mallId: string;
  normalFillEndsAt?: string | null;
  normalFillStartsAt?: string | null;
  periodMonth: string;
  reopenedUntil?: string | null;
};

export type SurveyFollowUp = {
  createdAt: string;
  followUpDate: string;
  followUpItem: string;
  followUpMethod: string;
  id: string;
  mallId: string;
  merchantFeedback: string;
  nextAction: string;
  nextFollowUpDate: string | null;
  ownerName: string;
  periodMonth: string;
  status: "待联系" | "已联系" | "整改中" | "待跟进" | "跟进中" | "待复查" | "已完成" | "暂不处理";
  storeId: string;
  updatedAt: string;
  warningId: string;
};

export type UpsertSurveyFollowUpInput = {
  actorId: string;
  followUpDate: string;
  followUpItem: string;
  followUpMethod: string;
  id?: string;
  mallId: string;
  merchantFeedback: string;
  nextAction: string;
  nextFollowUpDate?: string | null;
  ownerName: string;
  periodMonth: string;
  status: SurveyFollowUp["status"];
  storeId: string;
  warningId?: string;
};

export type SurveyAiReportStatus = "failed" | "retrying" | "succeeded";
export type SurveyReportType = "full_analysis" | "leadership_brief" | "oral_briefing" | "store_analysis";
export type SurveyReportStatus = "archived" | "confirmed" | "draft" | "pending_review";
export type SurveyReportVersionKind = "ai_original" | "manual_edit";

export type SurveyAiReportJob = {
  createdAt: string;
  createdBy: string;
  desensitizedInputJson: string;
  elapsedMs: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  id: string;
  inputSnapshotJson: string;
  mallId: string;
  modelName: string;
  modelProvider: string;
  outputText: string;
  periodMonth: string;
  reportType: SurveyReportType;
  status: SurveyAiReportStatus;
  tokenUsageJson: string;
};

export type SurveyReportSnapshotRecord = {
  createdAt: string;
  createdBy: string;
  desensitizedInputJson: string;
  id: string;
  mallId: string;
  periodMonth: string;
  reportType: SurveyReportType;
  snapshotJson: string;
};

export type SurveyReport = {
  confirmedVersionId: string | null;
  createdAt: string;
  currentVersionId: string | null;
  id: string;
  mallId: string;
  periodMonth: string;
  reportType: SurveyReportType;
  snapshotId: string;
  status: SurveyReportStatus;
  title: string;
  updatedAt: string;
};

export type SurveyReportVersion = {
  aiRawJson: string | null;
  contentJson: string;
  createdAt: string;
  createdBy: string;
  id: string;
  reportId: string;
  title: string;
  versionKind: SurveyReportVersionKind;
  versionNo: number;
  versionNote: string;
};

export type CreateSurveyAiReportJobInput = {
  createdBy: string;
  desensitizedInputJson: string;
  elapsedMs?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  inputSnapshotJson: string;
  mallId: string;
  modelName: string;
  modelProvider: string;
  outputText?: string;
  periodMonth: string;
  reportType: SurveyReportType;
  status: SurveyAiReportStatus;
  tokenUsageJson?: string;
};

export type CreateSurveyReportSnapshotInput = {
  createdBy: string;
  desensitizedInputJson: string;
  mallId: string;
  periodMonth: string;
  reportType: SurveyReportType;
  snapshotJson: string;
};

export type CreateSurveyReportWithVersionInput = {
  actorId: string;
  aiRawJson: string;
  contentJson: string;
  jobId: string;
  mallId: string;
  periodMonth: string;
  reportType: SurveyReportType;
  snapshotId: string;
  title: string;
  versionNote: string;
};

export type CreateSurveyReportVersionInput = {
  actorId: string;
  aiRawJson?: string | null;
  contentJson: string;
  reportId: string;
  title: string;
  versionKind: SurveyReportVersionKind;
  versionNote: string;
};

export type ConfirmSurveyReportVersionInput = {
  actorId: string;
  reportId: string;
  versionId: string;
};

export type SetSurveyReportCurrentVersionInput = {
  actorId: string;
  reportId: string;
  versionId: string;
};

export type UpdateConfirmedSurveyReportVersionInput = {
  actorId: string;
  contentJson: string;
  reportId: string;
  title: string;
  versionId: string;
};
