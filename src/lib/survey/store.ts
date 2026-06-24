import { buildStoreSearchText, normalizeStoreSearchText } from "./search";
import { applySurveyTermPreset, type SurveyTermMonths } from "./access";
import { createMerchantEditToken, hashMerchantEditToken, verifyMerchantEditToken } from "./merchant-token";
import { buildDefaultSurveyFormFieldRecords, categoryNameToCode, validatePeerSalesRows } from "./merchant-form";
import { hashSurveyPassword, verifySurveyPassword } from "./password";
import { importFinalSurveyStores } from "./real-store-data";
import type {
  CreateSurveyMerchantSubmissionInput,
  ConfirmSurveyReportVersionInput,
  CreateSurveyAiReportJobInput,
  CreateSurveyReportSnapshotInput,
  CreateSurveyReportVersionInput,
  CreateSurveyReportWithVersionInput,
  SurveyAuditLog,
  SurveyAiReportJob,
  SurveyBrand,
  SurveyCategory,
  SurveyFollowUp,
  SurveyMall,
  SurveyMerchantSubmission,
  SurveyMonthlyMetric,
  SurveyMonthlyPeriod,
  SurveyPeerSalesRow,
  SurveyPosSale,
  SurveyReport,
  SurveyReportSnapshotRecord,
  SurveyReportVersion,
  SetSurveyReportCurrentVersionInput,
  SurveyStaffAccount,
  SurveyStore,
  SurveyStoreAlias,
  SurveyStoreInput,
  SurveyStoredFormField,
  SurveySubmissionChangeLog,
  SurveySubcategory,
  UpsertSurveyFollowUpInput,
  UpsertSurveyPeriodInput,
  UpsertSurveyPosSaleInput,
  UpdateConfirmedSurveyReportVersionInput,
  UpdateSurveyMerchantSubmissionInput,
} from "./types";
import { computeMonthlyMetric, evaluateStoreWarnings } from "./analytics";

type SurveyState = {
  aliases: SurveyStoreAlias[];
  auditLogs: SurveyAuditLog[];
  brands: SurveyBrand[];
  categories: SurveyCategory[];
  followUps: SurveyFollowUp[];
  formFields: SurveyStoredFormField[];
  monthlyMetrics: SurveyMonthlyMetric[];
  periods: SurveyMonthlyPeriod[];
  peerSalesRows: Array<SurveyPeerSalesRow & { id: string; submissionId: string; sortOrder: number }>;
  posSales: SurveyPosSale[];
  reportJobs: SurveyAiReportJob[];
  reportSnapshots: SurveyReportSnapshotRecord[];
  reportVersions: SurveyReportVersion[];
  reports: SurveyReport[];
  malls: SurveyMall[];
  staffAccounts: SurveyStaffAccount[];
  stores: SurveyStore[];
  submissionChangeLogs: SurveySubmissionChangeLog[];
  submissions: SurveyMerchantSubmission[];
  subcategories: SurveySubcategory[];
};

const now = "2026-06-23T00:00:00.000Z";
const defaultMall: SurveyMall = {
  id: "survey_mall_001",
  name: "第一版测试商场",
  status: "active",
  createdAt: now,
  updatedAt: now,
};

export const defaultSurveyCategoryNames = ["3C数码", "儿童鞋服", "儿童用品", "家电及家用", "个护、健康品及美妆护肤", "儿童游乐", "教培"];

export const surveyTestAccounts = {
  operator: {
    displayName: "营运测试账号",
    loginName: "yingyun01",
    password: "SurveyOps@2026",
  },
  superAdmin: {
    displayName: "总管理员测试账号",
    loginName: "cyrus_admin",
    password: "SurveyAdmin@2026",
  },
};

export type CreateSurveyStaffAccountInput = {
  displayName: string;
  loginName: string;
  mallId: string;
  password: string;
  phone: string;
  role: SurveyStaffAccount["role"];
  startsAt: string;
  termMonths: SurveyTermMonths;
};

export function createSurveyMemoryStore(initialState?: Partial<SurveyState>) {
  const state: SurveyState = {
    aliases: clone(initialState?.aliases ?? []),
    auditLogs: clone(initialState?.auditLogs ?? []),
    brands: clone(initialState?.brands ?? []),
    categories: clone(
      initialState?.categories ??
        defaultSurveyCategoryNames.map((name, index) => ({
          id: makeId("survey_category", index + 1),
          mallId: defaultMall.id,
          name,
          sortOrder: index + 1,
          enabled: true,
          createdAt: now,
          updatedAt: now,
        })),
    ),
    formFields: clone(initialState?.formFields ?? []),
    followUps: clone(initialState?.followUps ?? []),
    monthlyMetrics: clone(initialState?.monthlyMetrics ?? []),
    periods: clone(initialState?.periods ?? []),
    peerSalesRows: clone(initialState?.peerSalesRows ?? []),
    posSales: clone(initialState?.posSales ?? []),
    reportJobs: clone(initialState?.reportJobs ?? []),
    reportSnapshots: clone(initialState?.reportSnapshots ?? []),
    reportVersions: clone(initialState?.reportVersions ?? []),
    reports: clone(initialState?.reports ?? []),
    malls: clone(initialState?.malls ?? [defaultMall]),
    staffAccounts: clone(initialState?.staffAccounts ?? []),
    stores: clone(initialState?.stores ?? []),
    submissionChangeLogs: clone(initialState?.submissionChangeLogs ?? []),
    submissions: clone(initialState?.submissions ?? []),
    subcategories: clone(initialState?.subcategories ?? []),
  };

  return {
    async createAuditLog(input: Omit<SurveyAuditLog, "id" | "createdAt">): Promise<SurveyAuditLog> {
      const log: SurveyAuditLog = {
        ...input,
        id: makeId("survey_audit", state.auditLogs.length + 1),
        createdAt: new Date().toISOString(),
      };
      state.auditLogs.unshift(log);
      return log;
    },

    async createCategory(input: Omit<SurveyCategory, "id" | "createdAt" | "updatedAt">): Promise<SurveyCategory> {
      const category: SurveyCategory = {
        ...input,
        id: makeId("survey_category", state.categories.length + 1),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.categories.push(category);
      return category;
    },

    async createMerchantSubmission(input: CreateSurveyMerchantSubmissionInput): Promise<SurveyMerchantSubmission> {
      const existing = state.submissions.find((item) => item.storeId === input.storeId && item.periodMonth === input.periodMonth);
      if (existing) {
        throw new Error("本店本月数据已提交");
      }
      const peerValidation = validatePeerSalesRows(input.peerRows, input.noLocalPeerStores);
      if (peerValidation) {
        throw new Error(peerValidation);
      }
      const now = new Date();
      const token = input.editToken
        ? { hash: await hashMerchantEditToken(input.editToken), token: input.editToken }
        : await createMerchantEditToken();
      const submission: SurveyMerchantSubmission = {
        categoryName: input.categoryName,
        createdAt: now.toISOString(),
        fieldValuesJson: JSON.stringify(input.fieldValues),
        firstSubmittedAt: now.toISOString(),
        id: makeId("survey_submission", state.submissions.length + 1),
        isLate: input.isLate,
        lastModifiedAt: now.toISOString(),
        mallId: input.mallId,
        memberRechargeWan: input.memberRechargeWan,
        merchantEditTokenHash: token.hash,
        merchantEditUntil: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        noLocalPeerStores: input.noLocalPeerStores,
        periodMonth: input.periodMonth,
        salesTargetWan: input.salesTargetWan,
        selfReportedSalesWan: input.selfReportedSalesWan,
        status: "submitted",
        storeId: input.storeId,
        updatedAt: now.toISOString(),
      };
      state.submissions.push(submission);
      setPeerRows(submission.id, input.peerRows);
      return submission;
    },

    async createStaffAccount(input: CreateSurveyStaffAccountInput): Promise<SurveyStaffAccount> {
      const term = applySurveyTermPreset(input.startsAt, input.termMonths);
      const account: SurveyStaffAccount = {
        displayName: input.displayName,
        enabled: true,
        expiresAt: term.expiresAt,
        id: makeId("survey_staff", state.staffAccounts.length + 1),
        loginName: input.loginName,
        mallId: input.mallId,
        passwordHash: await hashSurveyPassword(input.password),
        phone: input.phone,
        role: input.role,
        startsAt: term.startsAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.staffAccounts.push(account);
      return account;
    },

    async createStore(input: SurveyStoreInput): Promise<SurveyStore> {
      const mall = state.malls.find((item) => item.id === input.mallId) ?? defaultMall;
      const brand = state.brands.find((item) => item.id === input.brandId);
      const category = state.categories.find((item) => item.id === input.categoryId);
      const subcategory = state.subcategories.find((item) => item.id === input.subcategoryId);
      const record: SurveyStore = {
        ...input,
        brandName: brand?.name ?? "",
        categoryName: category?.name ?? "",
        createdAt: new Date().toISOString(),
        formCategoryCode: input.formCategoryCode ?? categoryNameToCode(input.subcategoryName || category?.name || ""),
        id: input.id || makeId("survey_store", state.stores.length + 1),
        mallName: mall.name,
        searchText: buildStoreSearchText({
          aliases: [],
          brandName: brand?.name ?? "",
          storeName: input.storeName,
        }),
        subcategoryName: subcategory?.name ?? input.subcategoryName ?? "",
        updatedAt: new Date().toISOString(),
      };
      state.stores.push(record);
      return record;
    },

    async createSubcategory(input: Omit<SurveySubcategory, "id" | "createdAt" | "updatedAt">): Promise<SurveySubcategory> {
      const subcategory: SurveySubcategory = {
        ...input,
        id: makeId("survey_subcategory", state.subcategories.length + 1),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.subcategories.push(subcategory);
      return subcategory;
    },

    async ensureSurveyDemoStores() {
      const mall = state.malls[0];
      seedDefaultFormFields();
      if (state.stores.length === 0) {
        await importFinalSurveyStores(this as ReturnType<typeof createSurveyMemoryStore>, mall.id);
      }
      const findByCode = (storeCode: string) => state.stores.find((store) => store.storeCode === storeCode)!;
      return {
        beauty: findByCode("L0115N01"),
        drKong: findByCode("L0401N04"),
        edu: findByCode("L0308N02"),
        home: findByCode("L0219N02"),
        honor: findByCode("B0177N001"),
        mall,
        mo: findByCode("L0467N01"),
        play: findByCode("L0316N01"),
      };
    },

    async findStaffById(id: string): Promise<SurveyStaffAccount | null> {
      return state.staffAccounts.find((account) => account.id === id) ?? null;
    },

    async getDefaultMall(): Promise<SurveyMall> {
      return state.malls[0];
    },

    async listAliases(storeId?: string): Promise<SurveyStoreAlias[]> {
      return storeId ? state.aliases.filter((alias) => alias.storeId === storeId) : [...state.aliases];
    },

    async listAuditLogs(): Promise<SurveyAuditLog[]> {
      return [...state.auditLogs];
    },

    async createSurveyAiReportJob(input: CreateSurveyAiReportJobInput): Promise<SurveyAiReportJob> {
      const job: SurveyAiReportJob = {
        createdAt: new Date().toISOString(),
        createdBy: input.createdBy,
        desensitizedInputJson: input.desensitizedInputJson,
        elapsedMs: input.elapsedMs ?? null,
        errorCode: input.errorCode ?? null,
        errorMessage: input.errorMessage ?? null,
        id: makeId("survey_ai_job", state.reportJobs.length + 1),
        inputSnapshotJson: input.inputSnapshotJson,
        mallId: input.mallId,
        modelName: input.modelName,
        modelProvider: input.modelProvider,
        outputText: input.outputText ?? "",
        periodMonth: input.periodMonth,
        reportType: input.reportType,
        status: input.status,
        tokenUsageJson: input.tokenUsageJson ?? "{}",
      };
      state.reportJobs.unshift(job);
      await this.createAuditLog({ action: `ai_report.${job.status}`, actorId: input.createdBy, actorType: "staff", detailJson: JSON.stringify({ errorCode: job.errorCode, reportType: job.reportType }), mallId: input.mallId, targetId: job.id, targetType: "ai_report_job" });
      return clone(job);
    },

    async listSurveyAiReportJobs(mallId: string): Promise<SurveyAiReportJob[]> {
      return state.reportJobs.filter((item) => item.mallId === mallId).map(clone);
    },

    async createSurveyReportSnapshot(input: CreateSurveyReportSnapshotInput): Promise<SurveyReportSnapshotRecord> {
      const snapshot: SurveyReportSnapshotRecord = {
        createdAt: new Date().toISOString(),
        createdBy: input.createdBy,
        desensitizedInputJson: input.desensitizedInputJson,
        id: makeId("survey_report_snapshot", state.reportSnapshots.length + 1),
        mallId: input.mallId,
        periodMonth: input.periodMonth,
        reportType: input.reportType,
        snapshotJson: input.snapshotJson,
      };
      state.reportSnapshots.unshift(snapshot);
      return clone(snapshot);
    },

    async createSurveyReportWithVersion(input: CreateSurveyReportWithVersionInput): Promise<SurveyReport> {
      const timestamp = new Date().toISOString();
      const report: SurveyReport = {
        confirmedVersionId: null,
        createdAt: timestamp,
        currentVersionId: null,
        id: makeId("survey_report", state.reports.length + 1),
        mallId: input.mallId,
        periodMonth: input.periodMonth,
        reportType: input.reportType,
        snapshotId: input.snapshotId,
        status: "draft",
        title: input.title,
        updatedAt: timestamp,
      };
      state.reports.unshift(report);
      const version = await this.createSurveyReportVersion({
        actorId: input.actorId,
        aiRawJson: input.aiRawJson,
        contentJson: input.contentJson,
        reportId: report.id,
        title: input.title,
        versionKind: "ai_original",
        versionNote: input.versionNote,
      });
      report.currentVersionId = version.id;
      await this.createAuditLog({ action: "report.create", actorId: input.actorId, actorType: "staff", detailJson: JSON.stringify({ jobId: input.jobId, reportType: input.reportType }), mallId: input.mallId, targetId: report.id, targetType: "report" });
      return clone(report);
    },

    async createSurveyReportVersion(input: CreateSurveyReportVersionInput): Promise<SurveyReportVersion> {
      const report = state.reports.find((item) => item.id === input.reportId);
      if (!report) throw new Error("报告不存在。");
      const version: SurveyReportVersion = {
        aiRawJson: input.aiRawJson ?? null,
        contentJson: input.contentJson,
        createdAt: new Date().toISOString(),
        createdBy: input.actorId,
        id: makeId("survey_report_version", state.reportVersions.length + 1),
        reportId: input.reportId,
        title: input.title,
        versionKind: input.versionKind,
        versionNo: state.reportVersions.filter((item) => item.reportId === input.reportId).length + 1,
        versionNote: input.versionNote,
      };
      state.reportVersions.push(version);
      report.currentVersionId = version.id;
      report.title = input.title;
      report.status = input.versionKind === "manual_edit" ? "pending_review" : report.status;
      report.updatedAt = version.createdAt;
      await this.createAuditLog({ action: "report.version.create", actorId: input.actorId, actorType: "staff", detailJson: JSON.stringify({ versionKind: version.versionKind, versionNo: version.versionNo }), mallId: report.mallId, targetId: version.id, targetType: "report_version" });
      return clone(version);
    },

    async confirmSurveyReportVersion(input: ConfirmSurveyReportVersionInput): Promise<SurveyReport> {
      const report = state.reports.find((item) => item.id === input.reportId);
      const version = state.reportVersions.find((item) => item.id === input.versionId && item.reportId === input.reportId);
      if (!report || !version) throw new Error("报告版本不存在。");
      report.confirmedVersionId = input.versionId;
      report.currentVersionId = input.versionId;
      report.status = "confirmed";
      report.title = version.title;
      report.updatedAt = new Date().toISOString();
      await this.createAuditLog({ action: "report.confirm", actorId: input.actorId, actorType: "staff", detailJson: JSON.stringify({ versionId: input.versionId }), mallId: report.mallId, targetId: report.id, targetType: "report" });
      return clone(report);
    },

    async setSurveyReportCurrentVersion(input: SetSurveyReportCurrentVersionInput): Promise<SurveyReport> {
      const report = state.reports.find((item) => item.id === input.reportId);
      const version = state.reportVersions.find((item) => item.id === input.versionId && item.reportId === input.reportId);
      if (!report || !version) throw new Error("报告版本不存在。");
      report.currentVersionId = input.versionId;
      report.title = version.title;
      report.updatedAt = new Date().toISOString();
      await this.createAuditLog({ action: "report.current.set", actorId: input.actorId, actorType: "staff", detailJson: JSON.stringify({ versionId: input.versionId }), mallId: report.mallId, targetId: report.id, targetType: "report" });
      return clone(report);
    },

    async updateConfirmedSurveyReportVersion(_input: UpdateConfirmedSurveyReportVersionInput): Promise<SurveyReportVersion> {
      throw new Error("已确认版本不得直接覆盖，请创建新的人工编辑版本。");
    },

    async listSurveyReports(mallId: string): Promise<SurveyReport[]> {
      return state.reports.filter((item) => item.mallId === mallId).map(clone);
    },

    async getSurveyReport(id: string): Promise<SurveyReport | null> {
      return state.reports.find((item) => item.id === id) ?? null;
    },

    async listSurveyReportVersions(reportId: string): Promise<SurveyReportVersion[]> {
      return state.reportVersions.filter((item) => item.reportId === reportId).map(clone).sort((left, right) => left.versionNo - right.versionNo);
    },

    async listPeerSalesRows(submissionId: string) {
      return state.peerSalesRows.filter((row) => row.submissionId === submissionId).sort((left, right) => left.sortOrder - right.sortOrder);
    },

    async listBrands(): Promise<SurveyBrand[]> {
      return [...state.brands];
    },

    async listCategories(): Promise<SurveyCategory[]> {
      return [...state.categories].sort((left, right) => left.sortOrder - right.sortOrder);
    },

    async listEnabledFormFields(mallId: string, categoryId: string): Promise<SurveyStoredFormField[]> {
      return state.formFields
        .filter((field) => field.mallId === mallId && field.enabled && (field.categoryId === null || field.categoryId === categoryId))
        .sort((left, right) => left.sortOrder - right.sortOrder);
    },

    async upsertPosSale(input: UpsertSurveyPosSaleInput): Promise<SurveyPosSale> {
      assertNonNegativeOneDecimal(input.salesWan, "POS正式销售额");
      assertNonNegativeOneDecimal(input.targetSalesWan, "销售目标");
      const existing = state.posSales.find((item) => item.mallId === input.mallId && item.storeId === input.storeId && item.periodMonth === input.periodMonth);
      const before = existing ? clone(existing) : null;
      const timestamp = new Date().toISOString();
      const record: SurveyPosSale = existing
        ? Object.assign(existing, {
            remark: input.remark ?? "",
            salesWan: input.salesWan,
            source: input.source ?? existing.source,
            targetSalesWan: input.targetSalesWan,
            updatedAt: timestamp,
            updatedBy: input.actorId,
          })
        : {
            createdAt: timestamp,
            id: makeId("survey_pos", state.posSales.length + 1),
            mallId: input.mallId,
            periodMonth: input.periodMonth,
            remark: input.remark ?? "",
            salesWan: input.salesWan,
            source: input.source ?? "manual_entry",
            storeId: input.storeId,
            targetSalesWan: input.targetSalesWan,
            updatedAt: timestamp,
            updatedBy: input.actorId,
          };
      if (!existing) {
        state.posSales.push(record);
      }
      await this.createAuditLog({
        action: existing ? "pos.update" : "pos.create",
        actorId: input.actorId,
        actorType: "staff",
        detailJson: JSON.stringify({ newValue: record, oldValue: before }),
        mallId: input.mallId,
        targetId: record.id,
        targetType: "pos_sale",
      });
      await recomputeStoreMonth(input.mallId, input.storeId, input.periodMonth);
      return clone(record);
    },

    async listPosSales(periodMonth: string, mallId?: string): Promise<SurveyPosSale[]> {
      return state.posSales
        .filter((item) => item.periodMonth === periodMonth && (!mallId || item.mallId === mallId))
        .map(clone)
        .sort((left, right) => left.storeId.localeCompare(right.storeId));
    },

    async recomputeStoreMonth(input: { mallId: string; periodMonth: string; storeId: string }): Promise<SurveyMonthlyMetric> {
      return recomputeStoreMonth(input.mallId, input.storeId, input.periodMonth);
    },

    async listMonthlyMetrics(periodMonth: string, mallId?: string): Promise<SurveyMonthlyMetric[]> {
      return state.monthlyMetrics
        .filter((item) => item.periodMonth === periodMonth && (!mallId || state.stores.find((store) => store.id === item.storeId)?.mallId === mallId))
        .map(clone);
    },

    async listWarningRecords(periodMonth: string, mallId?: string) {
      const metrics = await this.listMonthlyMetrics(periodMonth, mallId);
      return metrics.flatMap((metric) => {
        const peerRows = state.submissions.find((item) => item.storeId === metric.storeId && item.periodMonth === periodMonth)?.id;
        const warnings = evaluateStoreWarnings({
          current: metric,
          peerRows: peerRows ? state.peerSalesRows.filter((row) => row.submissionId === peerRows) : [],
          previousMetrics: state.monthlyMetrics.filter((item) => item.storeId === metric.storeId && item.periodMonth < periodMonth).sort((left, right) => right.periodMonth.localeCompare(left.periodMonth)),
        });
        return warnings.map((warning) => ({ ...warning, periodMonth, storeId: metric.storeId }));
      });
    },

    async openSurveyPeriod(input: UpsertSurveyPeriodInput): Promise<SurveyMonthlyPeriod> {
      const timestamp = new Date().toISOString();
      const existing = state.periods.find((item) => item.mallId === input.mallId && item.periodMonth === input.periodMonth);
      const period: SurveyMonthlyPeriod = existing
        ? Object.assign(existing, {
            closedAt: null,
            closedBy: null,
            normalFillEndsAt: input.normalFillEndsAt ?? existing.normalFillEndsAt,
            normalFillStartsAt: input.normalFillStartsAt ?? existing.normalFillStartsAt,
            openedAt: timestamp,
            openedBy: input.actorId,
            reopenedBy: null,
            reopenedUntil: null,
            status: "open" as const,
            updatedAt: timestamp,
          })
        : {
            closedAt: null,
            closedBy: null,
            createdAt: timestamp,
            id: makeId("survey_period", state.periods.length + 1),
            mallId: input.mallId,
            normalFillEndsAt: input.normalFillEndsAt ?? null,
            normalFillStartsAt: input.normalFillStartsAt ?? null,
            openedAt: timestamp,
            openedBy: input.actorId,
            periodMonth: input.periodMonth,
            reopenedBy: null,
            reopenedUntil: null,
            status: "open",
            updatedAt: timestamp,
          };
      if (!existing) state.periods.push(period);
      await this.createAuditLog({ action: "period.open", actorId: input.actorId, actorType: "staff", detailJson: JSON.stringify(period), mallId: input.mallId, targetId: period.id, targetType: "period" });
      return clone(period);
    },

    async reopenSurveyPeriod(input: UpsertSurveyPeriodInput): Promise<SurveyMonthlyPeriod> {
      const period = await this.openSurveyPeriod(input);
      period.status = "reopened";
      period.reopenedBy = input.actorId;
      period.reopenedUntil = input.reopenedUntil ?? null;
      period.updatedAt = new Date().toISOString();
      const existing = state.periods.find((item) => item.id === period.id);
      if (existing) Object.assign(existing, period);
      await this.createAuditLog({ action: "period.reopen", actorId: input.actorId, actorType: "staff", detailJson: JSON.stringify(period), mallId: input.mallId, targetId: period.id, targetType: "period" });
      return clone(period);
    },

    async closeSurveyPeriod(input: { actorId: string; mallId: string; periodMonth: string }): Promise<SurveyMonthlyPeriod> {
      const timestamp = new Date().toISOString();
      const existing = state.periods.find((item) => item.mallId === input.mallId && item.periodMonth === input.periodMonth);
      const period = existing ?? (await this.openSurveyPeriod({ actorId: input.actorId, mallId: input.mallId, periodMonth: input.periodMonth }));
      Object.assign(period, { closedAt: timestamp, closedBy: input.actorId, status: "closed" as const, updatedAt: timestamp });
      await this.createAuditLog({ action: "period.close", actorId: input.actorId, actorType: "staff", detailJson: JSON.stringify(period), mallId: input.mallId, targetId: period.id, targetType: "period" });
      return clone(period);
    },

    async listSurveyPeriods(mallId: string): Promise<SurveyMonthlyPeriod[]> {
      return state.periods.filter((item) => item.mallId === mallId).map(clone).sort((left, right) => right.periodMonth.localeCompare(left.periodMonth));
    },

    async resolveMerchantFillPeriods(mallId: string, nowDate = new Date()): Promise<SurveyMonthlyPeriod[]> {
      const today = nowDate.toISOString().slice(0, 10);
      return state.periods
        .filter((item) => item.mallId === mallId && (item.status === "open" || (item.status === "reopened" && (!item.reopenedUntil || item.reopenedUntil >= today))))
        .map(clone)
        .sort((left, right) => right.periodMonth.localeCompare(left.periodMonth));
    },

    async createFollowUp(input: UpsertSurveyFollowUpInput): Promise<SurveyFollowUp> {
      const record: SurveyFollowUp = {
        createdAt: new Date().toISOString(),
        followUpDate: input.followUpDate,
        followUpItem: input.followUpItem,
        followUpMethod: input.followUpMethod,
        id: input.id ?? makeId("survey_follow", state.followUps.length + 1),
        mallId: input.mallId,
        merchantFeedback: input.merchantFeedback,
        nextAction: input.nextAction,
        nextFollowUpDate: input.nextFollowUpDate ?? null,
        ownerName: input.ownerName,
        periodMonth: input.periodMonth,
        status: input.status,
        storeId: input.storeId,
        updatedAt: new Date().toISOString(),
        warningId: input.warningId ?? "",
      };
      state.followUps.unshift(record);
      await this.createAuditLog({ action: "follow_up.create", actorId: input.actorId, actorType: "staff", detailJson: JSON.stringify(record), mallId: input.mallId, targetId: record.id, targetType: "follow_up" });
      return clone(record);
    },

    async updateFollowUp(input: UpsertSurveyFollowUpInput & { id: string }): Promise<SurveyFollowUp | null> {
      const existing = state.followUps.find((item) => item.id === input.id);
      if (!existing) return null;
      const before = clone(existing);
      Object.assign(existing, {
        followUpDate: input.followUpDate,
        followUpItem: input.followUpItem,
        followUpMethod: input.followUpMethod,
        merchantFeedback: input.merchantFeedback,
        nextAction: input.nextAction,
        nextFollowUpDate: input.nextFollowUpDate ?? null,
        ownerName: input.ownerName,
        periodMonth: input.periodMonth,
        status: input.status,
        storeId: input.storeId,
        updatedAt: new Date().toISOString(),
        warningId: input.warningId ?? "",
      });
      await this.createAuditLog({ action: "follow_up.update", actorId: input.actorId, actorType: "staff", detailJson: JSON.stringify({ oldValue: before, newValue: existing }), mallId: input.mallId, targetId: existing.id, targetType: "follow_up" });
      return clone(existing);
    },

    async listFollowUps(periodMonth?: string, mallId?: string): Promise<SurveyFollowUp[]> {
      return state.followUps
        .filter((item) => (!periodMonth || item.periodMonth === periodMonth) && (!mallId || item.mallId === mallId))
        .map(clone)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    },

    async listStaffAccounts(): Promise<SurveyStaffAccount[]> {
      return [...state.staffAccounts];
    },

    async listStores(): Promise<SurveyStore[]> {
      return [...state.stores];
    },

    async listSubmissionChangeLogs(submissionId: string): Promise<SurveySubmissionChangeLog[]> {
      return state.submissionChangeLogs.filter((log) => log.submissionId === submissionId);
    },

    async listSubcategories(): Promise<SurveySubcategory[]> {
      return [...state.subcategories].sort((left, right) => left.sortOrder - right.sortOrder);
    },

    async loginStaff(loginName: string, password: string): Promise<SurveyStaffAccount | null> {
      const account = state.staffAccounts.find((item) => item.loginName === loginName && item.enabled);
      if (!account) {
        return null;
      }
      return (await verifySurveyPassword(password, account.passwordHash)) ? account : null;
    },

    async searchPublicStores(query: string): Promise<Array<Pick<SurveyStore, "brandName" | "categoryName" | "displayLocation" | "id" | "storeName">>> {
      const normalized = normalizeStoreSearchText(query);
      if (!normalized) {
        return [];
      }
      return state.stores
        .filter((store) => store.status === "active" && store.searchText.includes(normalized))
        .map((store) => ({
          brandName: store.brandName,
          categoryName: store.subcategoryName || store.categoryName,
          displayLocation: store.displayLocation,
          id: store.id,
          storeName: store.storeName,
        }));
    },

    async getMerchantSubmissionForStoreMonth(storeId: string, periodMonth: string): Promise<SurveyMerchantSubmission | null> {
      return state.submissions.find((item) => item.storeId === storeId && item.periodMonth === periodMonth) ?? null;
    },

    async getMerchantSubmissionById(id: string): Promise<SurveyMerchantSubmission | null> {
      return state.submissions.find((item) => item.id === id) ?? null;
    },

    async getStoreById(id: string): Promise<SurveyStore | null> {
      return state.stores.find((item) => item.id === id) ?? null;
    },

    async setStoreAliases(storeId: string, aliases: string[]): Promise<SurveyStoreAlias[]> {
      state.aliases = state.aliases.filter((alias) => alias.storeId !== storeId);
      const created = aliases
        .map((alias) => alias.trim())
        .filter(Boolean)
        .map((alias, index) => ({
          alias,
          createdAt: new Date().toISOString(),
          id: makeId("survey_alias", state.aliases.length + index + 1),
          normalizedAlias: normalizeStoreSearchText(alias),
          storeId,
        }));
      state.aliases.push(...created);
      const store = state.stores.find((item) => item.id === storeId);
      if (store) {
        store.searchText = buildStoreSearchText({
          aliases: created.map((alias) => alias.alias),
          brandName: store.brandName,
          storeName: store.storeName,
        });
        store.updatedAt = new Date().toISOString();
      }
      return created;
    },

    async toggleCategoryEnabled(id: string, enabled: boolean): Promise<SurveyCategory | null> {
      const category = state.categories.find((item) => item.id === id);
      if (!category) {
        return null;
      }
      category.enabled = enabled;
      category.updatedAt = new Date().toISOString();
      return category;
    },

    async toggleSubcategoryEnabled(id: string, enabled: boolean): Promise<SurveySubcategory | null> {
      const subcategory = state.subcategories.find((item) => item.id === id);
      if (!subcategory) {
        return null;
      }
      subcategory.enabled = enabled;
      subcategory.updatedAt = new Date().toISOString();
      return subcategory;
    },

    async updateStaffAccountEnabled(id: string, enabled: boolean): Promise<SurveyStaffAccount | null> {
      const account = state.staffAccounts.find((item) => item.id === id);
      if (!account) {
        return null;
      }
      account.enabled = enabled;
      account.updatedAt = new Date().toISOString();
      return account;
    },

    async updateStaffAccountTerm(id: string, startsAt: string, termMonths: SurveyTermMonths): Promise<SurveyStaffAccount | null> {
      const account = state.staffAccounts.find((item) => item.id === id);
      if (!account) {
        return null;
      }
      const term = applySurveyTermPreset(startsAt, termMonths);
      account.startsAt = term.startsAt;
      account.expiresAt = term.expiresAt;
      account.updatedAt = new Date().toISOString();
      return account;
    },

    async updateStore(input: SurveyStoreInput & { id: string }): Promise<SurveyStore | null> {
      const existing = state.stores.find((item) => item.id === input.id);
      if (!existing) {
        return null;
      }
      const mall = state.malls.find((item) => item.id === input.mallId) ?? defaultMall;
      const brand = state.brands.find((item) => item.id === input.brandId);
      const category = state.categories.find((item) => item.id === input.categoryId);
      const subcategory = state.subcategories.find((item) => item.id === input.subcategoryId);
      Object.assign(existing, {
        ...input,
        brandName: brand?.name ?? existing.brandName,
        categoryName: category?.name ?? existing.categoryName,
        formCategoryCode: input.formCategoryCode ?? categoryNameToCode(input.subcategoryName || existing.subcategoryName || existing.categoryName),
        mallName: mall.name,
        searchText: buildStoreSearchText({
          aliases: state.aliases.filter((alias) => alias.storeId === input.id).map((alias) => alias.alias),
          brandName: brand?.name ?? existing.brandName,
          storeName: input.storeName,
        }),
        subcategoryName: subcategory?.name ?? input.subcategoryName ?? "",
        updatedAt: new Date().toISOString(),
      });
      return existing;
    },

    async updateStoreStatus(id: string, status: SurveyStore["status"]): Promise<SurveyStore | null> {
      const store = state.stores.find((item) => item.id === id);
      if (!store) {
        return null;
      }
      store.status = status;
      store.updatedAt = new Date().toISOString();
      return store;
    },

    async updateMerchantSubmissionWithToken(input: UpdateSurveyMerchantSubmissionInput): Promise<SurveyMerchantSubmission> {
      const submission = state.submissions.find((item) => item.id === input.id);
      if (!submission || new Date(input.now) > new Date(submission.merchantEditUntil) || !(await verifyMerchantEditToken(input.editToken, submission.merchantEditTokenHash))) {
        throw new Error("当前浏览器没有本次填报的有效修改权限");
      }
      const beforePeerRows = state.peerSalesRows.filter((row) => row.submissionId === submission.id);
      const oldValues = {
        fieldValuesJson: submission.fieldValuesJson,
        salesTargetWan: submission.salesTargetWan,
        selfReportedSalesWan: submission.selfReportedSalesWan,
      };
      submission.fieldValuesJson = JSON.stringify(input.fieldValues);
      submission.memberRechargeWan = input.memberRechargeWan ?? submission.memberRechargeWan;
      submission.salesTargetWan = input.salesTargetWan;
      submission.selfReportedSalesWan = input.selfReportedSalesWan;
      submission.lastModifiedAt = input.now.toISOString();
      submission.updatedAt = input.now.toISOString();
      setPeerRows(submission.id, input.peerRows);
      pushChangeLog(submission.id, "selfReportedSalesWan", String(oldValues.selfReportedSalesWan), String(input.selfReportedSalesWan));
      pushChangeLog(submission.id, "salesTargetWan", String(oldValues.salesTargetWan), String(input.salesTargetWan));
      pushChangeLog(submission.id, "fieldValuesJson", oldValues.fieldValuesJson, submission.fieldValuesJson);
      pushChangeLog(submission.id, "cityPeerStoreSales", JSON.stringify(beforePeerRows), JSON.stringify(input.peerRows));
      return submission;
    },

    async upsertBrand(input: { mallId: string; name: string }): Promise<SurveyBrand> {
      const normalizedName = normalizeStoreSearchText(input.name);
      const existing = state.brands.find((brand) => brand.mallId === input.mallId && brand.normalizedName === normalizedName);
      if (existing) {
        return existing;
      }
      const brand: SurveyBrand = {
        ...input,
        id: makeId("survey_brand", state.brands.length + 1),
        normalizedName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.brands.push(brand);
      return brand;
    },
  };

  function setPeerRows(submissionId: string, rows: SurveyPeerSalesRow[]) {
    state.peerSalesRows = state.peerSalesRows.filter((row) => row.submissionId !== submissionId);
    rows.forEach((row, index) => {
      state.peerSalesRows.push({
        ...row,
        id: makeId("survey_peer", state.peerSalesRows.length + 1),
        sortOrder: index + 1,
        submissionId,
      });
    });
  }

  function pushChangeLog(submissionId: string, fieldKey: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) {
      return;
    }
    state.submissionChangeLogs.push({
      actorId: "",
      actorType: "merchant",
      changedAt: new Date().toISOString(),
      fieldKey,
      id: makeId("survey_change", state.submissionChangeLogs.length + 1),
      newValue,
      oldValue,
      submissionId,
    });
  }

  async function recomputeStoreMonth(mallId: string, storeId: string, periodMonth: string): Promise<SurveyMonthlyMetric> {
    const store = state.stores.find((item) => item.id === storeId);
    const submission = state.submissions.find((item) => item.storeId === storeId && item.periodMonth === periodMonth);
    const pos = state.posSales.find((item) => item.mallId === mallId && item.storeId === storeId && item.periodMonth === periodMonth);
    const previous = state.monthlyMetrics
      .filter((item) => item.storeId === storeId && item.periodMonth < periodMonth)
      .sort((left, right) => right.periodMonth.localeCompare(left.periodMonth));
    const lastYearMonth = `${Number(periodMonth.slice(0, 4)) - 1}${periodMonth.slice(4)}`;
    const lastYear = state.monthlyMetrics.find((item) => item.storeId === storeId && item.periodMonth === lastYearMonth);
    const metric = computeMonthlyMetric({
      areaSqm: store?.areaSqm ?? null,
      fieldValues: submission ? (JSON.parse(submission.fieldValuesJson || "{}") as Record<string, unknown>) : {},
      isLate: submission?.isLate ?? false,
      merchantSalesWan: submission?.selfReportedSalesWan ?? null,
      periodMonth,
      posSalesWan: pos?.salesWan ?? null,
      previousMonthEffectiveSalesWan: previous[0]?.effectiveSalesWan ?? null,
      salesTargetWan: pos?.targetSalesWan ?? submission?.salesTargetWan ?? null,
      sameMonthLastYearEffectiveSalesWan: lastYear?.effectiveSalesWan ?? null,
      staffCount: store?.staffCount ?? null,
      storeId,
    });
    state.monthlyMetrics = state.monthlyMetrics.filter((item) => !(item.storeId === storeId && item.periodMonth === periodMonth));
    state.monthlyMetrics.push(metric);
    return clone(metric);
  }

  function seedDefaultFormFields() {
    state.formFields = state.formFields.filter((field) => !field.id.startsWith("survey_field_"));
    state.formFields.push(...buildDefaultSurveyFormFieldRecords(state.malls[0]?.id ?? defaultMall.id, state.categories));
  }
}

export async function createSeededSurveyMemoryStore() {
  const store = createSurveyMemoryStore();
  const mall = await store.getDefaultMall();
  const accounts = await store.listStaffAccounts();
  if (!accounts.some((account) => account.loginName === surveyTestAccounts.superAdmin.loginName)) {
    await store.createStaffAccount({
      displayName: surveyTestAccounts.superAdmin.displayName,
      loginName: surveyTestAccounts.superAdmin.loginName,
      mallId: mall.id,
      password: surveyTestAccounts.superAdmin.password,
      phone: "",
      role: "super_admin",
      startsAt: "2026-06-01",
      termMonths: 12,
    });
  }
  if (!accounts.some((account) => account.loginName === surveyTestAccounts.operator.loginName)) {
    await store.createStaffAccount({
      displayName: surveyTestAccounts.operator.displayName,
      loginName: surveyTestAccounts.operator.loginName,
      mallId: mall.id,
      password: surveyTestAccounts.operator.password,
      phone: "",
      role: "operator",
      startsAt: "2026-06-01",
      termMonths: 12,
    });
  }
  return store;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function makeId(prefix: string, index: number) {
  return `${prefix}_${String(index).padStart(3, "0")}`;
}

function assertNonNegativeOneDecimal(value: number | null, label: string) {
  if (value === null) {
    return;
  }
  if (!Number.isFinite(value) || value < 0 || Math.round(value * 10) !== value * 10) {
    throw new Error(`${label}必须为非负数字，最多保留1位小数。`);
  }
}
