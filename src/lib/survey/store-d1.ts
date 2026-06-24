import { applySurveyTermPreset, type SurveyTermMonths } from "./access";
import { createMerchantEditToken, hashMerchantEditToken, verifyMerchantEditToken } from "./merchant-token";
import { buildDefaultSurveyFormFieldRecords, categoryNameToCode, validatePeerSalesRows } from "./merchant-form";
import { computeMonthlyMetric, evaluateStoreWarnings } from "./analytics";
import { hashSurveyPassword, verifySurveyPassword } from "./password";
import { buildStoreSearchText, normalizeStoreSearchText } from "./search";
import { defaultSurveyCategoryNames, surveyTestAccounts, type CreateSurveyStaffAccountInput } from "./store";
import { importFinalSurveyStores } from "./real-store-data";
import type {
  SurveyAuditLog,
  SurveyBrand,
  SurveyCategory,
  CreateSurveyMerchantSubmissionInput,
  SurveyFollowUp,
  SurveyMall,
  SurveyMerchantSubmission,
  SurveyMonthlyMetric,
  SurveyMonthlyPeriod,
  SurveyPeerSalesRow,
  SurveyPosSale,
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
  UpdateSurveyMerchantSubmissionInput,
} from "./types";

export type SurveyD1DatabaseLike = {
  prepare(sql: string): SurveyD1PreparedStatementLike;
};

type SurveyD1PreparedStatementLike = {
  all<T = unknown>(): Promise<{ results?: T[] }>;
  bind(...values: unknown[]): SurveyD1PreparedStatementLike;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<unknown>;
};

type BoolRow<T> = Omit<T, "chainStore" | "enabled"> & {
  chain_store?: number;
  enabled?: number;
};

const seedMall: SurveyMall = {
  id: "survey_mall_001",
  name: "第一版测试商场",
  status: "active",
  createdAt: "2026-06-23T00:00:00.000Z",
  updatedAt: "2026-06-23T00:00:00.000Z",
};

export async function createSurveyD1Store(db: SurveyD1DatabaseLike) {
  await ensureSurveyRuntimeSchema(db);
  await ensureSurveySeedData(db);

  return {
    async createAuditLog(input: Omit<SurveyAuditLog, "id" | "createdAt">): Promise<SurveyAuditLog> {
      const log: SurveyAuditLog = {
        ...input,
        id: makeId("survey_audit"),
        createdAt: new Date().toISOString(),
      };
      await db
        .prepare(
          `INSERT INTO survey_audit_logs
           (id, mall_id, actor_type, actor_id, action, target_type, target_id, detail_json, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(log.id, log.mallId, log.actorType, log.actorId, log.action, log.targetType, log.targetId, log.detailJson, log.createdAt)
        .run();
      return log;
    },

    async createCategory(input: Omit<SurveyCategory, "id" | "createdAt" | "updatedAt">): Promise<SurveyCategory> {
      const category: SurveyCategory = {
        ...input,
        id: makeId("survey_category"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db
        .prepare(
          `INSERT INTO survey_business_categories (id, mall_id, name, sort_order, enabled, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(category.id, category.mallId, category.name, category.sortOrder, category.enabled ? 1 : 0, category.createdAt, category.updatedAt)
        .run();
      return category;
    },

    async createMerchantSubmission(input: CreateSurveyMerchantSubmissionInput): Promise<SurveyMerchantSubmission> {
      const existing = await db
        .prepare("SELECT id FROM survey_merchant_submissions WHERE store_id = ? AND period_month = ?")
        .bind(input.storeId, input.periodMonth)
        .first();
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
        id: makeId("survey_submission"),
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
      await insertSubmission(db, submission);
      await replacePeerRows(db, submission.id, input.peerRows);
      return submission;
    },

    async createStaffAccount(input: CreateSurveyStaffAccountInput): Promise<SurveyStaffAccount> {
      const term = applySurveyTermPreset(input.startsAt, input.termMonths);
      const account: SurveyStaffAccount = {
        displayName: input.displayName,
        enabled: true,
        expiresAt: term.expiresAt,
        id: makeId("survey_staff"),
        loginName: input.loginName,
        mallId: input.mallId,
        passwordHash: await hashSurveyPassword(input.password),
        phone: input.phone,
        role: input.role,
        startsAt: term.startsAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await insertStaff(db, account);
      return account;
    },

    async createStore(input: SurveyStoreInput): Promise<SurveyStore> {
      const record = await buildStoreRecord(db, input, input.id || makeId("survey_store"));
      await insertStore(db, record);
      return record;
    },

    async createSubcategory(input: Omit<SurveySubcategory, "id" | "createdAt" | "updatedAt">): Promise<SurveySubcategory> {
      const subcategory: SurveySubcategory = {
        ...input,
        id: makeId("survey_subcategory"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db
        .prepare(
          `INSERT INTO survey_business_subcategories (id, mall_id, category_id, name, sort_order, enabled, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          subcategory.id,
          subcategory.mallId,
          subcategory.categoryId,
          subcategory.name,
          subcategory.sortOrder,
          subcategory.enabled ? 1 : 0,
          subcategory.createdAt,
          subcategory.updatedAt,
        )
        .run();
      return subcategory;
    },

    async ensureSurveyDemoStores() {
      const mall = await this.getDefaultMall();
      const existingCount = await db.prepare("SELECT COUNT(*) AS count FROM survey_stores WHERE mall_id = ? AND status = 'active'").bind(mall.id).first<{ count: number }>();
      if (Number(existingCount?.count || 0) === 0) {
        await importFinalSurveyStores(this, mall.id);
      }
      const stores = await this.listStores();
      const findByCode = (storeCode: string) => stores.find((store) => store.storeCode === storeCode)!;
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
      const row = await db.prepare("SELECT * FROM survey_staff_accounts WHERE id = ?").bind(id).first<Record<string, unknown>>();
      return row ? mapStaff(row) : null;
    },

    async getDefaultMall(): Promise<SurveyMall> {
      const row = await db.prepare("SELECT * FROM survey_malls ORDER BY created_at LIMIT 1").first<Record<string, unknown>>();
      return row ? mapMall(row) : seedMall;
    },

    async listAliases(storeId?: string): Promise<SurveyStoreAlias[]> {
      const query = storeId
        ? db.prepare("SELECT * FROM survey_store_aliases WHERE store_id = ? ORDER BY created_at").bind(storeId)
        : db.prepare("SELECT * FROM survey_store_aliases ORDER BY created_at");
      const rows = await query.all<Record<string, unknown>>();
      return (rows.results ?? []).map(mapAlias);
    },

    async listAuditLogs(): Promise<SurveyAuditLog[]> {
      const rows = await db.prepare("SELECT * FROM survey_audit_logs ORDER BY created_at DESC LIMIT 50").all<Record<string, unknown>>();
      return (rows.results ?? []).map(mapAuditLog);
    },

    async listPeerSalesRows(submissionId: string) {
      const rows = await db
        .prepare("SELECT * FROM survey_city_peer_store_sales WHERE submission_id = ? ORDER BY sort_order")
        .bind(submissionId)
        .all<Record<string, unknown>>();
      return (rows.results ?? []).map((row) => ({
        id: String(row.id || ""),
        mallName: String(row.mall_name || ""),
        salesWan: Number(row.sales_wan || 0),
        sortOrder: Number(row.sort_order || 0),
        submissionId: String(row.submission_id || ""),
      }));
    },

    async listBrands(): Promise<SurveyBrand[]> {
      const rows = await db.prepare("SELECT * FROM survey_brands ORDER BY name").all<Record<string, unknown>>();
      return (rows.results ?? []).map(mapBrand);
    },

    async listCategories(): Promise<SurveyCategory[]> {
      const rows = await db.prepare("SELECT * FROM survey_business_categories ORDER BY sort_order, name").all<Record<string, unknown>>();
      return (rows.results ?? []).map(mapCategory);
    },

    async listEnabledFormFields(mallId: string, categoryId: string): Promise<SurveyStoredFormField[]> {
      const rows = await db
        .prepare(
          `SELECT * FROM survey_form_fields
           WHERE mall_id = ? AND enabled = 1 AND (category_id IS NULL OR category_id = ?)
           ORDER BY sort_order, label`,
        )
        .bind(mallId, categoryId)
        .all<Record<string, unknown>>();
      return (rows.results ?? []).map(mapStoredFormField);
    },

    async upsertPosSale(input: UpsertSurveyPosSaleInput): Promise<SurveyPosSale> {
      assertNonNegativeOneDecimal(input.salesWan, "POS正式销售额");
      assertNonNegativeOneDecimal(input.targetSalesWan, "销售目标");
      const existing = await getPosSale(db, input.mallId, input.storeId, input.periodMonth);
      const now = new Date().toISOString();
      const id = existing?.id ?? makeId("survey_pos");
      await db
        .prepare(
          `INSERT INTO survey_pos_sales (id, mall_id, store_id, period_month, sales_wan, target_sales_wan, source, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(mall_id, store_id, period_month)
           DO UPDATE SET sales_wan = excluded.sales_wan, target_sales_wan = excluded.target_sales_wan, source = excluded.source, updated_at = excluded.updated_at`,
        )
        .bind(id, input.mallId, input.storeId, input.periodMonth, input.salesWan, input.targetSalesWan, input.source ?? "manual_entry", now, now)
        .run();
      const saved = await getPosSale(db, input.mallId, input.storeId, input.periodMonth);
      if (!saved) throw new Error("POS保存失败。");
      await db
        .prepare(
          `INSERT INTO survey_pos_sale_details (pos_sale_id, remark, updated_by, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(pos_sale_id) DO UPDATE SET remark = excluded.remark, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
        )
        .bind(saved.id, input.remark ?? "", input.actorId, now)
        .run();
      const withDetail = { ...saved, remark: input.remark ?? "", updatedBy: input.actorId, updatedAt: now };
      await this.createAuditLog({
        action: existing ? "pos.update" : "pos.create",
        actorId: input.actorId,
        actorType: "staff",
        detailJson: JSON.stringify({ newValue: withDetail, oldValue: existing }),
        mallId: input.mallId,
        targetId: saved.id,
        targetType: "pos_sale",
      });
      await this.recomputeStoreMonth({ mallId: input.mallId, periodMonth: input.periodMonth, storeId: input.storeId });
      return withDetail;
    },

    async listPosSales(periodMonth: string, mallId?: string): Promise<SurveyPosSale[]> {
      const query = mallId
        ? db.prepare(
            `SELECT p.*, d.remark, d.updated_by
             FROM survey_pos_sales p LEFT JOIN survey_pos_sale_details d ON d.pos_sale_id = p.id
             WHERE p.period_month = ? AND p.mall_id = ? ORDER BY p.store_id`,
          ).bind(periodMonth, mallId)
        : db.prepare(
            `SELECT p.*, d.remark, d.updated_by
             FROM survey_pos_sales p LEFT JOIN survey_pos_sale_details d ON d.pos_sale_id = p.id
             WHERE p.period_month = ? ORDER BY p.store_id`,
          ).bind(periodMonth);
      const rows = await query.all<Record<string, unknown>>();
      return (rows.results ?? []).map(mapPosSale);
    },

    async recomputeStoreMonth(input: { mallId: string; periodMonth: string; storeId: string }): Promise<SurveyMonthlyMetric> {
      const metric = await buildMetricForStoreMonth(db, input.mallId, input.storeId, input.periodMonth);
      const now = new Date().toISOString();
      await db.prepare("DELETE FROM survey_monthly_store_metrics WHERE mall_id = ? AND store_id = ? AND period_month = ?").bind(input.mallId, input.storeId, input.periodMonth).run();
      await db
        .prepare(
          `INSERT INTO survey_monthly_store_metrics
           (id, mall_id, store_id, period_month, effective_sales_wan, sales_source, mom_rate, yoy_rate, mall_rank, category_rank, sales_per_sqm, sales_per_staff, target_completion_rate, self_pos_diff_wan, self_pos_diff_rate, warning_flags_json, computed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          makeId("survey_metric"),
          input.mallId,
          input.storeId,
          input.periodMonth,
          metric.effectiveSalesWan,
          metric.salesSource,
          metric.momRate,
          metric.yoyRate,
          null,
          null,
          metric.salesPerSqm,
          metric.salesPerStaff,
          metric.targetCompletionRate,
          metric.selfPosDiffWan,
          metric.selfPosDiffRate,
          "[]",
          now,
        )
        .run();
      await db
        .prepare(
          `INSERT INTO survey_monthly_metric_snapshots (id, mall_id, store_id, period_month, area_sqm_snapshot, staff_count_snapshot, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(store_id, period_month) DO UPDATE SET area_sqm_snapshot = excluded.area_sqm_snapshot, staff_count_snapshot = excluded.staff_count_snapshot, updated_at = excluded.updated_at`,
        )
        .bind(makeId("survey_snapshot"), input.mallId, input.storeId, input.periodMonth, metric.areaSqmSnapshot, metric.staffCountSnapshot, now, now)
        .run();
      const peerRows = await getPeerRowsForStoreMonth(db, input.storeId, input.periodMonth);
      const previousMetrics = await listMetricsForStore(db, input.storeId, input.periodMonth);
      const warnings = evaluateStoreWarnings({ current: metric, peerRows, previousMetrics });
      await db.prepare("DELETE FROM survey_warning_records WHERE mall_id = ? AND store_id = ? AND period_month = ?").bind(input.mallId, input.storeId, input.periodMonth).run();
      for (const item of warnings) {
        await db
          .prepare(
            `INSERT INTO survey_warning_records
             (id, mall_id, store_id, period_month, warning_code, warning_name, severity, detail_json, resolved, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(makeId("survey_warning"), input.mallId, input.storeId, input.periodMonth, item.code, item.message, item.severity, JSON.stringify(item), 0, now, now)
          .run();
      }
      return metric;
    },

    async listMonthlyMetrics(periodMonth: string, mallId?: string): Promise<SurveyMonthlyMetric[]> {
      const rows = mallId
        ? await db.prepare("SELECT id FROM survey_stores WHERE mall_id = ? AND status = 'active' ORDER BY brand_name").bind(mallId).all<Record<string, unknown>>()
        : await db.prepare("SELECT id, mall_id FROM survey_stores WHERE status = 'active' ORDER BY brand_name").all<Record<string, unknown>>();
      const metrics: SurveyMonthlyMetric[] = [];
      for (const row of rows.results ?? []) {
        metrics.push(await buildMetricForStoreMonth(db, mallId ?? String(row.mall_id || seedMall.id), String(row.id || ""), periodMonth));
      }
      return metrics;
    },

    async listWarningRecords(periodMonth: string, mallId?: string) {
      const query = mallId
        ? db.prepare("SELECT * FROM survey_warning_records WHERE period_month = ? AND mall_id = ? ORDER BY severity DESC, warning_code").bind(periodMonth, mallId)
        : db.prepare("SELECT * FROM survey_warning_records WHERE period_month = ? ORDER BY severity DESC, warning_code").bind(periodMonth);
      const rows = await query.all<Record<string, unknown>>();
      return (rows.results ?? []).map(mapWarningRecord);
    },

    async openSurveyPeriod(input: UpsertSurveyPeriodInput): Promise<SurveyMonthlyPeriod> {
      return upsertPeriod(db, input, "open");
    },

    async reopenSurveyPeriod(input: UpsertSurveyPeriodInput): Promise<SurveyMonthlyPeriod> {
      return upsertPeriod(db, input, "reopened");
    },

    async closeSurveyPeriod(input: { actorId: string; mallId: string; periodMonth: string }): Promise<SurveyMonthlyPeriod> {
      const now = new Date().toISOString();
      await db
        .prepare(
          `INSERT INTO survey_monthly_periods (id, mall_id, period_month, status, normal_fill_starts_at, normal_fill_ends_at, reopened_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(mall_id, period_month) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at`,
        )
        .bind(makeId("survey_period"), input.mallId, input.periodMonth, "closed", null, null, null, now, now)
        .run();
      const period = await getPeriod(db, input.mallId, input.periodMonth);
      if (!period) throw new Error("月份关闭失败。");
      await db
        .prepare(
          `INSERT INTO survey_period_details (period_id, opened_by, opened_at, closed_by, closed_at, reopened_until, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(period_id) DO UPDATE SET closed_by = excluded.closed_by, closed_at = excluded.closed_at, reopened_until = NULL, updated_at = excluded.updated_at`,
        )
        .bind(period.id, period.openedBy, period.openedAt, input.actorId, now, null, now)
        .run();
      await this.createAuditLog({ action: "period.close", actorId: input.actorId, actorType: "staff", detailJson: JSON.stringify(period), mallId: input.mallId, targetId: period.id, targetType: "period" });
      return (await getPeriod(db, input.mallId, input.periodMonth))!;
    },

    async listSurveyPeriods(mallId: string): Promise<SurveyMonthlyPeriod[]> {
      const rows = await db
        .prepare(
          `SELECT p.*, d.opened_by, d.opened_at, d.closed_by, d.closed_at, d.reopened_until
           FROM survey_monthly_periods p LEFT JOIN survey_period_details d ON d.period_id = p.id
           WHERE p.mall_id = ? ORDER BY p.period_month DESC`,
        )
        .bind(mallId)
        .all<Record<string, unknown>>();
      return (rows.results ?? []).map(mapPeriod);
    },

    async resolveMerchantFillPeriods(mallId: string, nowDate = new Date()): Promise<SurveyMonthlyPeriod[]> {
      const today = nowDate.toISOString().slice(0, 10);
      const periods = await this.listSurveyPeriods(mallId);
      return periods.filter((item) => item.status === "open" || (item.status === "reopened" && (!item.reopenedUntil || item.reopenedUntil >= today)));
    },

    async createFollowUp(input: UpsertSurveyFollowUpInput): Promise<SurveyFollowUp> {
      return upsertFollowUp(db, input);
    },

    async updateFollowUp(input: UpsertSurveyFollowUpInput & { id: string }): Promise<SurveyFollowUp | null> {
      return upsertFollowUp(db, input);
    },

    async listFollowUps(periodMonth?: string, mallId?: string): Promise<SurveyFollowUp[]> {
      const rows = periodMonth && mallId
        ? await db.prepare(
            `SELECT f.*, d.warning_id, d.owner_name, d.deleted
             FROM survey_follow_up_records f LEFT JOIN survey_follow_up_details d ON d.follow_up_id = f.id
             WHERE f.period_month = ? AND f.mall_id = ? AND COALESCE(d.deleted, 0) = 0 ORDER BY f.updated_at DESC`,
          ).bind(periodMonth, mallId).all<Record<string, unknown>>()
        : await db.prepare(
            `SELECT f.*, d.warning_id, d.owner_name, d.deleted
             FROM survey_follow_up_records f LEFT JOIN survey_follow_up_details d ON d.follow_up_id = f.id
             WHERE COALESCE(d.deleted, 0) = 0 ORDER BY f.updated_at DESC`,
          ).all<Record<string, unknown>>();
      return (rows.results ?? []).map(mapFollowUp);
    },

    async listStaffAccounts(): Promise<SurveyStaffAccount[]> {
      const rows = await db.prepare("SELECT * FROM survey_staff_accounts ORDER BY created_at").all<Record<string, unknown>>();
      return (rows.results ?? []).map(mapStaff);
    },

    async listStores(): Promise<SurveyStore[]> {
      const rows = await db.prepare("SELECT * FROM survey_stores ORDER BY brand_name, display_location").all<Record<string, unknown>>();
      return (rows.results ?? []).map(mapStore);
    },

    async listSubcategories(): Promise<SurveySubcategory[]> {
      const rows = await db.prepare("SELECT * FROM survey_business_subcategories ORDER BY sort_order, name").all<Record<string, unknown>>();
      return (rows.results ?? []).map(mapSubcategory);
    },

    async listSubmissionChangeLogs(submissionId: string): Promise<SurveySubmissionChangeLog[]> {
      const rows = await db
        .prepare("SELECT * FROM survey_submission_change_logs WHERE submission_id = ? ORDER BY changed_at")
        .bind(submissionId)
        .all<Record<string, unknown>>();
      return (rows.results ?? []).map(mapChangeLog);
    },

    async loginStaff(loginName: string, password: string): Promise<SurveyStaffAccount | null> {
      const row = await db.prepare("SELECT * FROM survey_staff_accounts WHERE login_name = ? AND enabled = 1").bind(loginName).first<Record<string, unknown>>();
      if (!row) {
        return null;
      }
      const account = mapStaff(row);
      return (await verifySurveyPassword(password, account.passwordHash)) ? account : null;
    },

    async searchPublicStores(query: string) {
      const normalized = normalizeStoreSearchText(query);
      if (!normalized) {
        return [];
      }
      const rows = await db
        .prepare(
          `SELECT id, brand_name, store_name, display_location, category_name
           FROM survey_stores WHERE status = 'active' AND search_text LIKE ? ORDER BY brand_name LIMIT 20`,
        )
        .bind(`%${normalized}%`)
        .all<Record<string, unknown>>();
      return (rows.results ?? []).map((row) => ({
        brandName: String(row.brand_name || ""),
        categoryName: String(row.subcategory_name || row.category_name || ""),
        displayLocation: String(row.display_location || ""),
        id: String(row.id || ""),
        storeName: String(row.store_name || ""),
      }));
    },

    async getMerchantSubmissionForStoreMonth(storeId: string, periodMonth: string): Promise<SurveyMerchantSubmission | null> {
      const row = await db
        .prepare("SELECT * FROM survey_merchant_submissions WHERE store_id = ? AND period_month = ?")
        .bind(storeId, periodMonth)
        .first<Record<string, unknown>>();
      return row ? mapSubmission(row) : null;
    },

    async getMerchantSubmissionById(id: string): Promise<SurveyMerchantSubmission | null> {
      const row = await db.prepare("SELECT * FROM survey_merchant_submissions WHERE id = ?").bind(id).first<Record<string, unknown>>();
      return row ? mapSubmission(row) : null;
    },

    async getStoreById(id: string): Promise<SurveyStore | null> {
      const row = await db.prepare("SELECT * FROM survey_stores WHERE id = ?").bind(id).first<Record<string, unknown>>();
      return row ? mapStore(row) : null;
    },

    async setStoreAliases(storeId: string, aliases: string[]): Promise<SurveyStoreAlias[]> {
      await db.prepare("DELETE FROM survey_store_aliases WHERE store_id = ?").bind(storeId).run();
      const created: SurveyStoreAlias[] = [];
      for (const alias of aliases.map((item) => item.trim()).filter(Boolean)) {
        const record = {
          alias,
          createdAt: new Date().toISOString(),
          id: makeId("survey_alias"),
          normalizedAlias: normalizeStoreSearchText(alias),
          storeId,
        };
        await db
          .prepare("INSERT INTO survey_store_aliases (id, store_id, alias, normalized_alias, created_at) VALUES (?, ?, ?, ?, ?)")
          .bind(record.id, record.storeId, record.alias, record.normalizedAlias, record.createdAt)
          .run();
        created.push(record);
      }
      const store = await db.prepare("SELECT * FROM survey_stores WHERE id = ?").bind(storeId).first<Record<string, unknown>>();
      if (store) {
        await db
          .prepare("UPDATE survey_stores SET search_text = ?, updated_at = ? WHERE id = ?")
          .bind(
            buildStoreSearchText({
              aliases,
              brandName: String(store.brand_name || ""),
              storeName: String(store.store_name || ""),
            }),
            new Date().toISOString(),
            storeId,
          )
          .run();
      }
      return created;
    },

    async toggleCategoryEnabled(id: string, enabled: boolean): Promise<SurveyCategory | null> {
      await db.prepare("UPDATE survey_business_categories SET enabled = ?, updated_at = ? WHERE id = ?").bind(enabled ? 1 : 0, new Date().toISOString(), id).run();
      const row = await db.prepare("SELECT * FROM survey_business_categories WHERE id = ?").bind(id).first<Record<string, unknown>>();
      return row ? mapCategory(row) : null;
    },

    async toggleSubcategoryEnabled(id: string, enabled: boolean): Promise<SurveySubcategory | null> {
      await db.prepare("UPDATE survey_business_subcategories SET enabled = ?, updated_at = ? WHERE id = ?").bind(enabled ? 1 : 0, new Date().toISOString(), id).run();
      const row = await db.prepare("SELECT * FROM survey_business_subcategories WHERE id = ?").bind(id).first<Record<string, unknown>>();
      return row ? mapSubcategory(row) : null;
    },

    async updateStaffAccountEnabled(id: string, enabled: boolean): Promise<SurveyStaffAccount | null> {
      await db.prepare("UPDATE survey_staff_accounts SET enabled = ?, updated_at = ? WHERE id = ?").bind(enabled ? 1 : 0, new Date().toISOString(), id).run();
      const row = await db.prepare("SELECT * FROM survey_staff_accounts WHERE id = ?").bind(id).first<Record<string, unknown>>();
      return row ? mapStaff(row) : null;
    },

    async updateStaffAccountTerm(id: string, startsAt: string, termMonths: SurveyTermMonths): Promise<SurveyStaffAccount | null> {
      const term = applySurveyTermPreset(startsAt, termMonths);
      await db
        .prepare("UPDATE survey_staff_accounts SET starts_at = ?, expires_at = ?, updated_at = ? WHERE id = ?")
        .bind(term.startsAt, term.expiresAt, new Date().toISOString(), id)
        .run();
      const row = await db.prepare("SELECT * FROM survey_staff_accounts WHERE id = ?").bind(id).first<Record<string, unknown>>();
      return row ? mapStaff(row) : null;
    },

    async updateStore(input: SurveyStoreInput & { id: string }): Promise<SurveyStore | null> {
      await db.prepare("DELETE FROM survey_stores WHERE id = ?").bind(input.id).run();
      const record = await buildStoreRecord(db, input, input.id);
      await insertStore(db, record);
      return record;
    },

    async updateStoreStatus(id: string, status: SurveyStore["status"]): Promise<SurveyStore | null> {
      await db.prepare("UPDATE survey_stores SET status = ?, updated_at = ? WHERE id = ?").bind(status, new Date().toISOString(), id).run();
      const row = await db.prepare("SELECT * FROM survey_stores WHERE id = ?").bind(id).first<Record<string, unknown>>();
      return row ? mapStore(row) : null;
    },

    async updateMerchantSubmissionWithToken(input: UpdateSurveyMerchantSubmissionInput): Promise<SurveyMerchantSubmission> {
      const row = await db.prepare("SELECT * FROM survey_merchant_submissions WHERE id = ?").bind(input.id).first<Record<string, unknown>>();
      const submission = row ? mapSubmission(row) : null;
      if (!submission || new Date(input.now) > new Date(submission.merchantEditUntil) || !(await verifyMerchantEditToken(input.editToken, submission.merchantEditTokenHash))) {
        throw new Error("当前浏览器没有本次填报的有效修改权限");
      }
      const beforePeerRows = await this.listPeerSalesRows(submission.id);
      const nextFieldValuesJson = JSON.stringify(input.fieldValues);
      await db
        .prepare(
          `UPDATE survey_merchant_submissions
           SET self_reported_sales_wan = ?, sales_target_wan = ?, member_recharge_wan = ?, field_values_json = ?, last_modified_at = ?, updated_at = ?
           WHERE id = ?`,
        )
        .bind(input.selfReportedSalesWan, input.salesTargetWan, input.memberRechargeWan ?? submission.memberRechargeWan, nextFieldValuesJson, input.now.toISOString(), input.now.toISOString(), input.id)
        .run();
      await replacePeerRows(db, submission.id, input.peerRows);
      await insertChangeLog(db, submission.id, "selfReportedSalesWan", String(submission.selfReportedSalesWan), String(input.selfReportedSalesWan));
      await insertChangeLog(db, submission.id, "salesTargetWan", String(submission.salesTargetWan), String(input.salesTargetWan));
      await insertChangeLog(db, submission.id, "fieldValuesJson", submission.fieldValuesJson, nextFieldValuesJson);
      await insertChangeLog(db, submission.id, "cityPeerStoreSales", JSON.stringify(beforePeerRows), JSON.stringify(input.peerRows));
      const updated = await db.prepare("SELECT * FROM survey_merchant_submissions WHERE id = ?").bind(input.id).first<Record<string, unknown>>();
      if (!updated) {
        throw new Error("提交记录更新后未找到。");
      }
      return mapSubmission(updated);
    },

    async upsertBrand(input: { mallId: string; name: string }): Promise<SurveyBrand> {
      const normalizedName = normalizeStoreSearchText(input.name);
      const existing = await db
        .prepare("SELECT * FROM survey_brands WHERE mall_id = ? AND normalized_name = ?")
        .bind(input.mallId, normalizedName)
        .first<Record<string, unknown>>();
      if (existing) {
        return mapBrand(existing);
      }
      const brand: SurveyBrand = {
        ...input,
        id: makeId("survey_brand"),
        normalizedName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db
        .prepare("INSERT INTO survey_brands (id, mall_id, name, normalized_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(brand.id, brand.mallId, brand.name, brand.normalizedName, brand.createdAt, brand.updatedAt)
        .run();
      return brand;
    },
  };
}

async function ensureSurveyRuntimeSchema(db: SurveyD1DatabaseLike) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS survey_malls (id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS survey_staff_accounts (id TEXT PRIMARY KEY, mall_id TEXT NOT NULL, login_name TEXT NOT NULL UNIQUE, phone TEXT, password_hash TEXT NOT NULL, role TEXT NOT NULL, display_name TEXT NOT NULL, enabled INTEGER NOT NULL, starts_at TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS survey_brands (id TEXT PRIMARY KEY, mall_id TEXT NOT NULL, name TEXT NOT NULL, normalized_name TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE (mall_id, normalized_name))`,
    `CREATE TABLE IF NOT EXISTS survey_business_categories (id TEXT PRIMARY KEY, mall_id TEXT NOT NULL, name TEXT NOT NULL, sort_order INTEGER NOT NULL, enabled INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE (mall_id, name))`,
    `CREATE TABLE IF NOT EXISTS survey_business_subcategories (id TEXT PRIMARY KEY, mall_id TEXT NOT NULL, category_id TEXT NOT NULL, name TEXT NOT NULL, sort_order INTEGER NOT NULL, enabled INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE (category_id, name))`,
    `CREATE TABLE IF NOT EXISTS survey_stores (id TEXT PRIMARY KEY, mall_id TEXT NOT NULL, mall_name TEXT NOT NULL, brand_id TEXT NOT NULL, brand_name TEXT NOT NULL, store_name TEXT NOT NULL, store_code TEXT NOT NULL, floor TEXT NOT NULL, unit_no TEXT NOT NULL, display_location TEXT NOT NULL, category_id TEXT NOT NULL, category_name TEXT NOT NULL, subcategory_id TEXT, subcategory_name TEXT, contract_start_date TEXT, contract_end_date TEXT, area_sqm REAL, staff_count INTEGER, manager_name TEXT, contact_phone TEXT, operation_mode TEXT, chain_store INTEGER NOT NULL, operator_name TEXT, rent_mode TEXT, status TEXT NOT NULL, search_text TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS survey_store_aliases (id TEXT PRIMARY KEY, store_id TEXT NOT NULL, alias TEXT NOT NULL, normalized_alias TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS survey_form_fields (id TEXT PRIMARY KEY, mall_id TEXT NOT NULL, category_id TEXT, field_key TEXT NOT NULL, label TEXT NOT NULL, type TEXT NOT NULL, required INTEGER NOT NULL, unit TEXT, precision INTEGER, options_json TEXT, visible_rule_json TEXT, sort_order INTEGER NOT NULL, enabled INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS survey_audit_logs (id TEXT PRIMARY KEY, mall_id TEXT NOT NULL, actor_type TEXT NOT NULL, actor_id TEXT NOT NULL, action TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT NOT NULL, detail_json TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS survey_merchant_submissions (id TEXT PRIMARY KEY, mall_id TEXT NOT NULL, store_id TEXT NOT NULL, period_month TEXT NOT NULL, category_name TEXT, status TEXT NOT NULL, is_late INTEGER NOT NULL, first_submitted_at TEXT, last_modified_at TEXT, merchant_edit_until TEXT, merchant_edit_token_hash TEXT, submitted_by_name TEXT, submitted_by_phone TEXT, self_reported_sales_wan REAL, sales_target_wan REAL, member_recharge_wan REAL, no_local_peer_stores INTEGER NOT NULL DEFAULT 0, field_values_json TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS survey_city_peer_store_sales (id TEXT PRIMARY KEY, submission_id TEXT NOT NULL, mall_name TEXT NOT NULL, sales_wan REAL NOT NULL, sort_order INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS survey_submission_change_logs (id TEXT PRIMARY KEY, submission_id TEXT NOT NULL, actor_type TEXT NOT NULL, actor_id TEXT NOT NULL, field_key TEXT NOT NULL, old_value TEXT, new_value TEXT, changed_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS survey_monthly_periods (id TEXT PRIMARY KEY, mall_id TEXT NOT NULL, period_month TEXT NOT NULL, status TEXT NOT NULL, normal_fill_starts_at TEXT, normal_fill_ends_at TEXT, reopened_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE (mall_id, period_month))`,
    `CREATE TABLE IF NOT EXISTS survey_pos_sales (id TEXT PRIMARY KEY, mall_id TEXT NOT NULL, store_id TEXT NOT NULL, period_month TEXT NOT NULL, sales_wan REAL, target_sales_wan REAL, source TEXT NOT NULL DEFAULT 'manual_entry', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE (mall_id, store_id, period_month))`,
    `CREATE TABLE IF NOT EXISTS survey_pos_sale_details (pos_sale_id TEXT PRIMARY KEY, remark TEXT, updated_by TEXT, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS survey_monthly_store_metrics (id TEXT PRIMARY KEY, mall_id TEXT NOT NULL, store_id TEXT NOT NULL, period_month TEXT NOT NULL, effective_sales_wan REAL, sales_source TEXT, mom_rate REAL, yoy_rate REAL, mall_rank INTEGER, category_rank INTEGER, sales_per_sqm REAL, sales_per_staff REAL, target_completion_rate REAL, self_pos_diff_wan REAL, self_pos_diff_rate REAL, warning_flags_json TEXT, computed_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS survey_monthly_metric_snapshots (id TEXT PRIMARY KEY, mall_id TEXT NOT NULL, store_id TEXT NOT NULL, period_month TEXT NOT NULL, area_sqm_snapshot REAL, staff_count_snapshot INTEGER, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE (store_id, period_month))`,
    `CREATE TABLE IF NOT EXISTS survey_warning_records (id TEXT PRIMARY KEY, mall_id TEXT NOT NULL, store_id TEXT NOT NULL, period_month TEXT NOT NULL, warning_code TEXT NOT NULL, warning_name TEXT NOT NULL, severity TEXT NOT NULL, detail_json TEXT NOT NULL, resolved INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE (store_id, period_month, warning_code))`,
    `CREATE TABLE IF NOT EXISTS survey_period_details (period_id TEXT PRIMARY KEY, opened_by TEXT, opened_at TEXT, closed_by TEXT, closed_at TEXT, reopened_until TEXT, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS survey_follow_up_records (id TEXT PRIMARY KEY, mall_id TEXT NOT NULL, store_id TEXT NOT NULL, period_month TEXT, follow_up_date TEXT, follow_up_method TEXT, follow_up_subject TEXT, store_feedback TEXT, next_action TEXT, next_follow_up_date TEXT, status TEXT NOT NULL, owner_account_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS survey_follow_up_details (follow_up_id TEXT PRIMARY KEY, warning_id TEXT, owner_name TEXT, deleted INTEGER NOT NULL DEFAULT 0, updated_by TEXT, updated_at TEXT NOT NULL)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_merchant_submissions_store_month ON survey_merchant_submissions (store_id, period_month)`,
  ];
  for (const statement of statements) {
    await db.prepare(statement).run();
  }
}

async function ensureSurveySeedData(db: SurveyD1DatabaseLike) {
  const existingMall = await db.prepare("SELECT id FROM survey_malls WHERE id = ?").bind(seedMall.id).first();
  if (!existingMall) {
    await db
      .prepare("INSERT INTO survey_malls (id, name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)")
      .bind(seedMall.id, seedMall.name, seedMall.status, seedMall.createdAt, seedMall.updatedAt)
      .run();
  }
  for (const [index, name] of defaultSurveyCategoryNames.entries()) {
    const id = `survey_category_${String(index + 1).padStart(3, "0")}`;
    const existing = await db.prepare("SELECT id FROM survey_business_categories WHERE id = ?").bind(id).first();
    if (!existing) {
      await db
        .prepare("INSERT INTO survey_business_categories (id, mall_id, name, sort_order, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(id, seedMall.id, name, index + 1, 1, seedMall.createdAt, seedMall.updatedAt)
        .run();
    }
  }
  const defaultMallRow = await db.prepare("SELECT * FROM survey_malls ORDER BY created_at LIMIT 1").first<Record<string, unknown>>();
  const fieldMallId = String(defaultMallRow?.id || seedMall.id);
  const categoryRows = await db.prepare("SELECT * FROM survey_business_categories ORDER BY sort_order").all<Record<string, unknown>>();
  const categories = (categoryRows.results ?? []).map(mapCategory);
  await db.prepare("DELETE FROM survey_form_fields WHERE id LIKE 'survey_field_%'").run();
  for (const field of buildDefaultSurveyFormFieldRecords(fieldMallId, categories)) {
    await db
      .prepare(
        `INSERT INTO survey_form_fields
         (id, mall_id, category_id, field_key, label, type, required, unit, precision, options_json, visible_rule_json, sort_order, enabled, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        field.id,
        field.mallId,
        field.categoryId,
        field.fieldKey,
        field.label,
        field.type,
        field.required ? 1 : 0,
        field.unit,
        field.precision,
        field.optionsJson,
        field.visibleRuleJson,
        field.sortOrder,
        field.enabled ? 1 : 0,
        field.createdAt,
        field.updatedAt,
      )
      .run();
  }
  await ensureStaff(db, {
    displayName: surveyTestAccounts.superAdmin.displayName,
    loginName: surveyTestAccounts.superAdmin.loginName,
    mallId: seedMall.id,
    password: surveyTestAccounts.superAdmin.password,
    phone: "",
    role: "super_admin",
    startsAt: "2026-06-01",
    termMonths: 12,
  });
  await ensureStaff(db, {
    displayName: surveyTestAccounts.operator.displayName,
    loginName: surveyTestAccounts.operator.loginName,
    mallId: seedMall.id,
    password: surveyTestAccounts.operator.password,
    phone: "",
    role: "operator",
    startsAt: "2026-06-01",
    termMonths: 12,
  });
}

async function ensureStaff(db: SurveyD1DatabaseLike, input: CreateSurveyStaffAccountInput) {
  const existing = await db.prepare("SELECT id FROM survey_staff_accounts WHERE login_name = ?").bind(input.loginName).first();
  if (existing) {
    return;
  }
  const term = applySurveyTermPreset(input.startsAt, input.termMonths);
  await insertStaff(db, {
    displayName: input.displayName,
    enabled: true,
    expiresAt: term.expiresAt,
    id: makeId("survey_staff"),
    loginName: input.loginName,
    mallId: input.mallId,
    passwordHash: await hashSurveyPassword(input.password),
    phone: input.phone,
    role: input.role,
    startsAt: term.startsAt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

async function buildStoreRecord(db: SurveyD1DatabaseLike, input: SurveyStoreInput, id: string): Promise<SurveyStore> {
  const mall = await db.prepare("SELECT * FROM survey_malls WHERE id = ?").bind(input.mallId).first<Record<string, unknown>>();
  const brand = await db.prepare("SELECT * FROM survey_brands WHERE id = ?").bind(input.brandId).first<Record<string, unknown>>();
  const category = await db.prepare("SELECT * FROM survey_business_categories WHERE id = ?").bind(input.categoryId).first<Record<string, unknown>>();
  const subcategory = input.subcategoryId
    ? await db.prepare("SELECT * FROM survey_business_subcategories WHERE id = ?").bind(input.subcategoryId).first<Record<string, unknown>>()
    : null;
  const now = new Date().toISOString();
  return {
    ...input,
    brandName: String(brand?.name || ""),
    categoryName: String(category?.name || ""),
    createdAt: now,
    id,
    mallName: String(mall?.name || seedMall.name),
    searchText: buildStoreSearchText({ aliases: [], brandName: String(brand?.name || ""), storeName: input.storeName }),
    formCategoryCode: input.formCategoryCode ?? categoryNameToCode(input.subcategoryName || String(subcategory?.name || category?.name || "")),
    subcategoryName: String(subcategory?.name || input.subcategoryName || ""),
    updatedAt: now,
  };
}

async function insertStaff(db: SurveyD1DatabaseLike, account: SurveyStaffAccount) {
  await db
    .prepare(
      `INSERT INTO survey_staff_accounts
       (id, mall_id, login_name, phone, password_hash, role, display_name, enabled, starts_at, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      account.id,
      account.mallId,
      account.loginName,
      account.phone,
      account.passwordHash,
      account.role,
      account.displayName,
      account.enabled ? 1 : 0,
      account.startsAt,
      account.expiresAt,
      account.createdAt,
      account.updatedAt,
    )
    .run();
}

async function insertStore(db: SurveyD1DatabaseLike, store: SurveyStore) {
  await db
    .prepare(
      `INSERT INTO survey_stores (
        id, mall_id, mall_name, brand_id, brand_name, store_name, store_code, floor, unit_no,
        display_location, category_id, category_name, subcategory_id, subcategory_name,
        contract_start_date, contract_end_date, area_sqm, staff_count, manager_name,
        contact_phone, operation_mode, chain_store, operator_name, rent_mode, status,
        search_text, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      store.id,
      store.mallId,
      store.mallName,
      store.brandId,
      store.brandName,
      store.storeName,
      store.storeCode,
      store.floor,
      store.unitNo,
      store.displayLocation,
      store.categoryId,
      store.categoryName,
      store.subcategoryId,
      store.subcategoryName,
      store.contractStartDate,
      store.contractEndDate,
      store.areaSqm,
      store.staffCount,
      store.managerName,
      store.contactPhone,
      store.operationMode,
      store.chainStore ? 1 : 0,
      store.operatorName,
      store.rentMode,
      store.status,
      store.searchText,
      store.createdAt,
      store.updatedAt,
    )
    .run();
}

async function insertSubmission(db: SurveyD1DatabaseLike, submission: SurveyMerchantSubmission) {
  await db
    .prepare(
      `INSERT INTO survey_merchant_submissions (
        id, mall_id, store_id, period_month, category_name, status, is_late,
        first_submitted_at, last_modified_at, merchant_edit_until, merchant_edit_token_hash,
        self_reported_sales_wan, sales_target_wan, member_recharge_wan,
        no_local_peer_stores, field_values_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      submission.id,
      submission.mallId,
      submission.storeId,
      submission.periodMonth,
      submission.categoryName,
      submission.status,
      submission.isLate ? 1 : 0,
      submission.firstSubmittedAt,
      submission.lastModifiedAt,
      submission.merchantEditUntil,
      submission.merchantEditTokenHash,
      submission.selfReportedSalesWan,
      submission.salesTargetWan,
      submission.memberRechargeWan,
      submission.noLocalPeerStores ? 1 : 0,
      submission.fieldValuesJson,
      submission.createdAt,
      submission.updatedAt,
    )
    .run();
}

async function replacePeerRows(db: SurveyD1DatabaseLike, submissionId: string, rows: SurveyPeerSalesRow[]) {
  await db.prepare("DELETE FROM survey_city_peer_store_sales WHERE submission_id = ?").bind(submissionId).run();
  for (const [index, row] of rows.entries()) {
    const now = new Date().toISOString();
    await db
      .prepare(
        `INSERT INTO survey_city_peer_store_sales
         (id, submission_id, mall_name, sales_wan, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(makeId("survey_peer"), submissionId, row.mallName, row.salesWan, index + 1, now, now)
      .run();
  }
}

async function insertChangeLog(db: SurveyD1DatabaseLike, submissionId: string, fieldKey: string, oldValue: string, newValue: string) {
  if (oldValue === newValue) {
    return;
  }
  await db
    .prepare(
      `INSERT INTO survey_submission_change_logs
       (id, submission_id, actor_type, actor_id, field_key, old_value, new_value, changed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(makeId("survey_change"), submissionId, "merchant", "", fieldKey, oldValue, newValue, new Date().toISOString())
    .run();
}

async function getPosSale(db: SurveyD1DatabaseLike, mallId: string, storeId: string, periodMonth: string): Promise<SurveyPosSale | null> {
  const row = await db
    .prepare(
      `SELECT p.*, d.remark, d.updated_by
       FROM survey_pos_sales p LEFT JOIN survey_pos_sale_details d ON d.pos_sale_id = p.id
       WHERE p.mall_id = ? AND p.store_id = ? AND p.period_month = ?`,
    )
    .bind(mallId, storeId, periodMonth)
    .first<Record<string, unknown>>();
  return row ? mapPosSale(row) : null;
}

async function buildMetricForStoreMonth(db: SurveyD1DatabaseLike, mallId: string, storeId: string, periodMonth: string): Promise<SurveyMonthlyMetric> {
  const storeRow = await db.prepare("SELECT * FROM survey_stores WHERE id = ?").bind(storeId).first<Record<string, unknown>>();
  const store = storeRow ? mapStore(storeRow) : null;
  const submissionRow = await db
    .prepare("SELECT * FROM survey_merchant_submissions WHERE store_id = ? AND period_month = ?")
    .bind(storeId, periodMonth)
    .first<Record<string, unknown>>();
  const submission = submissionRow ? mapSubmission(submissionRow) : null;
  const pos = await getPosSale(db, mallId, storeId, periodMonth);
  const previousMetrics = await listMetricsForStore(db, storeId, periodMonth);
  const lastYearMonth = `${Number(periodMonth.slice(0, 4)) - 1}${periodMonth.slice(4)}`;
  const lastYear = previousMetrics.find((item) => item.periodMonth === lastYearMonth) ?? null;
  return computeMonthlyMetric({
    areaSqm: store?.areaSqm ?? null,
    fieldValues: submission ? (JSON.parse(submission.fieldValuesJson || "{}") as Record<string, unknown>) : {},
    isLate: submission?.isLate ?? false,
    merchantSalesWan: submission?.selfReportedSalesWan ?? null,
    periodMonth,
    posSalesWan: pos?.salesWan ?? null,
    previousMonthEffectiveSalesWan: previousMetrics[0]?.effectiveSalesWan ?? null,
    salesTargetWan: pos?.targetSalesWan ?? submission?.salesTargetWan ?? null,
    sameMonthLastYearEffectiveSalesWan: lastYear?.effectiveSalesWan ?? null,
    staffCount: store?.staffCount ?? null,
    storeId,
  });
}

async function listMetricsForStore(db: SurveyD1DatabaseLike, storeId: string, beforePeriodMonth: string): Promise<SurveyMonthlyMetric[]> {
  const rows = await db
    .prepare(
      `SELECT m.*, s.area_sqm_snapshot, s.staff_count_snapshot
       FROM survey_monthly_store_metrics m LEFT JOIN survey_monthly_metric_snapshots s
       ON s.store_id = m.store_id AND s.period_month = m.period_month
       WHERE m.store_id = ? AND m.period_month < ?
       ORDER BY m.period_month DESC`,
    )
    .bind(storeId, beforePeriodMonth)
    .all<Record<string, unknown>>();
  return (rows.results ?? []).map(mapMonthlyMetric);
}

async function getPeerRowsForStoreMonth(db: SurveyD1DatabaseLike, storeId: string, periodMonth: string): Promise<SurveyPeerSalesRow[]> {
  const submission = await db
    .prepare("SELECT id FROM survey_merchant_submissions WHERE store_id = ? AND period_month = ?")
    .bind(storeId, periodMonth)
    .first<Record<string, unknown>>();
  if (!submission) {
    return [];
  }
  const rows = await db
    .prepare("SELECT mall_name, sales_wan FROM survey_city_peer_store_sales WHERE submission_id = ? ORDER BY sort_order")
    .bind(String(submission.id || ""))
    .all<Record<string, unknown>>();
  return (rows.results ?? []).map((row) => ({ mallName: String(row.mall_name || ""), salesWan: Number(row.sales_wan || 0) }));
}

async function upsertPeriod(db: SurveyD1DatabaseLike, input: UpsertSurveyPeriodInput, status: SurveyMonthlyPeriod["status"]): Promise<SurveyMonthlyPeriod> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO survey_monthly_periods (id, mall_id, period_month, status, normal_fill_starts_at, normal_fill_ends_at, reopened_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(mall_id, period_month)
       DO UPDATE SET status = excluded.status, normal_fill_starts_at = excluded.normal_fill_starts_at, normal_fill_ends_at = excluded.normal_fill_ends_at, reopened_by = excluded.reopened_by, updated_at = excluded.updated_at`,
    )
    .bind(
      makeId("survey_period"),
      input.mallId,
      input.periodMonth,
      status,
      input.normalFillStartsAt ?? null,
      input.normalFillEndsAt ?? null,
      status === "reopened" ? input.actorId : null,
      now,
      now,
    )
    .run();
  const period = await getPeriod(db, input.mallId, input.periodMonth);
  if (!period) throw new Error("月份保存失败。");
  await db
    .prepare(
      `INSERT INTO survey_period_details (period_id, opened_by, opened_at, closed_by, closed_at, reopened_until, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(period_id) DO UPDATE SET opened_by = excluded.opened_by, opened_at = excluded.opened_at, closed_by = NULL, closed_at = NULL, reopened_until = excluded.reopened_until, updated_at = excluded.updated_at`,
    )
    .bind(period.id, input.actorId, now, null, null, status === "reopened" ? input.reopenedUntil ?? null : null, now)
    .run();
  await db
    .prepare(
      `INSERT INTO survey_audit_logs (id, mall_id, actor_type, actor_id, action, target_type, target_id, detail_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(makeId("survey_audit"), input.mallId, "staff", input.actorId, status === "reopened" ? "period.reopen" : "period.open", "period", period.id, JSON.stringify(period), now)
    .run();
  return (await getPeriod(db, input.mallId, input.periodMonth))!;
}

async function getPeriod(db: SurveyD1DatabaseLike, mallId: string, periodMonth: string): Promise<SurveyMonthlyPeriod | null> {
  const row = await db
    .prepare(
      `SELECT p.*, d.opened_by, d.opened_at, d.closed_by, d.closed_at, d.reopened_until
       FROM survey_monthly_periods p LEFT JOIN survey_period_details d ON d.period_id = p.id
       WHERE p.mall_id = ? AND p.period_month = ?`,
    )
    .bind(mallId, periodMonth)
    .first<Record<string, unknown>>();
  return row ? mapPeriod(row) : null;
}

async function upsertFollowUp(db: SurveyD1DatabaseLike, input: UpsertSurveyFollowUpInput & { id?: string }): Promise<SurveyFollowUp> {
  const now = new Date().toISOString();
  const id = input.id ?? makeId("survey_follow");
  const existing = input.id ? await db.prepare("SELECT * FROM survey_follow_up_records WHERE id = ?").bind(input.id).first<Record<string, unknown>>() : null;
  await db
    .prepare(
      `INSERT INTO survey_follow_up_records
       (id, mall_id, store_id, period_month, follow_up_date, follow_up_method, follow_up_subject, store_feedback, next_action, next_follow_up_date, status, owner_account_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET store_id = excluded.store_id, period_month = excluded.period_month, follow_up_date = excluded.follow_up_date, follow_up_method = excluded.follow_up_method, follow_up_subject = excluded.follow_up_subject, store_feedback = excluded.store_feedback, next_action = excluded.next_action, next_follow_up_date = excluded.next_follow_up_date, status = excluded.status, owner_account_id = excluded.owner_account_id, updated_at = excluded.updated_at`,
    )
    .bind(id, input.mallId, input.storeId, input.periodMonth, input.followUpDate, input.followUpMethod, input.followUpItem, input.merchantFeedback, input.nextAction, input.nextFollowUpDate ?? null, input.status, input.actorId, now, now)
    .run();
  await db
    .prepare(
      `INSERT INTO survey_follow_up_details (follow_up_id, warning_id, owner_name, deleted, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(follow_up_id) DO UPDATE SET warning_id = excluded.warning_id, owner_name = excluded.owner_name, deleted = 0, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
    )
    .bind(id, input.warningId ?? "", input.ownerName, 0, input.actorId, now)
    .run();
  await db
    .prepare(
      `INSERT INTO survey_audit_logs (id, mall_id, actor_type, actor_id, action, target_type, target_id, detail_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(makeId("survey_audit"), input.mallId, "staff", input.actorId, existing ? "follow_up.update" : "follow_up.create", "follow_up", id, JSON.stringify(input), now)
    .run();
  const row = await db
    .prepare(
      `SELECT f.*, d.warning_id, d.owner_name
       FROM survey_follow_up_records f LEFT JOIN survey_follow_up_details d ON d.follow_up_id = f.id
       WHERE f.id = ?`,
    )
    .bind(id)
    .first<Record<string, unknown>>();
  if (!row) throw new Error("跟进记录保存失败。");
  return mapFollowUp(row);
}

function mapStaff(row: Record<string, unknown>): SurveyStaffAccount {
  return {
    createdAt: String(row.created_at || ""),
    displayName: String(row.display_name || ""),
    enabled: Number(row.enabled || 0) === 1,
    expiresAt: String(row.expires_at || ""),
    id: String(row.id || ""),
    loginName: String(row.login_name || ""),
    mallId: String(row.mall_id || ""),
    passwordHash: String(row.password_hash || ""),
    phone: String(row.phone || ""),
    role: String(row.role || "operator") as SurveyStaffAccount["role"],
    startsAt: String(row.starts_at || ""),
    updatedAt: String(row.updated_at || ""),
  };
}

function mapPosSale(row: Record<string, unknown>): SurveyPosSale {
  return {
    createdAt: String(row.created_at || ""),
    id: String(row.id || ""),
    mallId: String(row.mall_id || ""),
    periodMonth: String(row.period_month || ""),
    remark: String(row.remark || ""),
    salesWan: row.sales_wan === null || row.sales_wan === undefined ? null : Number(row.sales_wan),
    source: String(row.source || "manual_entry"),
    storeId: String(row.store_id || ""),
    targetSalesWan: row.target_sales_wan === null || row.target_sales_wan === undefined ? null : Number(row.target_sales_wan),
    updatedAt: String(row.updated_at || ""),
    updatedBy: String(row.updated_by || ""),
  };
}

function mapMonthlyMetric(row: Record<string, unknown>): SurveyMonthlyMetric {
  return {
    areaSqmSnapshot: row.area_sqm_snapshot === null || row.area_sqm_snapshot === undefined ? null : Number(row.area_sqm_snapshot),
    effectiveSalesWan: row.effective_sales_wan === null || row.effective_sales_wan === undefined ? null : Number(row.effective_sales_wan),
    fieldValues: {},
    isLate: false,
    merchantSalesWan: null,
    momRate: row.mom_rate === null || row.mom_rate === undefined ? null : Number(row.mom_rate),
    periodMonth: String(row.period_month || ""),
    posSalesWan: null,
    salesPerSqm: row.sales_per_sqm === null || row.sales_per_sqm === undefined ? null : Number(row.sales_per_sqm),
    salesPerStaff: row.sales_per_staff === null || row.sales_per_staff === undefined ? null : Number(row.sales_per_staff),
    salesSource: String(row.sales_source || "missing") as SurveyMonthlyMetric["salesSource"],
    salesTargetWan: null,
    selfPosDiffRate: row.self_pos_diff_rate === null || row.self_pos_diff_rate === undefined ? null : Number(row.self_pos_diff_rate),
    selfPosDiffWan: row.self_pos_diff_wan === null || row.self_pos_diff_wan === undefined ? null : Number(row.self_pos_diff_wan),
    staffCountSnapshot: row.staff_count_snapshot === null || row.staff_count_snapshot === undefined ? null : Number(row.staff_count_snapshot),
    storeId: String(row.store_id || ""),
    targetCompletionRate: row.target_completion_rate === null || row.target_completion_rate === undefined ? null : Number(row.target_completion_rate),
    yoyRate: row.yoy_rate === null || row.yoy_rate === undefined ? null : Number(row.yoy_rate),
  };
}

function mapWarningRecord(row: Record<string, unknown>) {
  const severity = String(row.severity || "一般");
  return {
    code: String(row.warning_code || ""),
    message: String(row.warning_name || ""),
    periodMonth: String(row.period_month || ""),
    severity: severity === "严重" || severity === "重要" ? severity : "一般",
    storeId: String(row.store_id || ""),
  };
}

function mapPeriod(row: Record<string, unknown>): SurveyMonthlyPeriod {
  return {
    closedAt: row.closed_at ? String(row.closed_at) : null,
    closedBy: row.closed_by ? String(row.closed_by) : null,
    createdAt: String(row.created_at || ""),
    id: String(row.id || ""),
    mallId: String(row.mall_id || ""),
    normalFillEndsAt: row.normal_fill_ends_at ? String(row.normal_fill_ends_at) : null,
    normalFillStartsAt: row.normal_fill_starts_at ? String(row.normal_fill_starts_at) : null,
    openedAt: row.opened_at ? String(row.opened_at) : null,
    openedBy: row.opened_by ? String(row.opened_by) : null,
    periodMonth: String(row.period_month || ""),
    reopenedBy: row.reopened_by ? String(row.reopened_by) : null,
    reopenedUntil: row.reopened_until ? String(row.reopened_until) : null,
    status: String(row.status || "closed") as SurveyMonthlyPeriod["status"],
    updatedAt: String(row.updated_at || ""),
  };
}

function mapFollowUp(row: Record<string, unknown>): SurveyFollowUp {
  return {
    createdAt: String(row.created_at || ""),
    followUpDate: String(row.follow_up_date || ""),
    followUpItem: String(row.follow_up_subject || ""),
    followUpMethod: String(row.follow_up_method || ""),
    id: String(row.id || ""),
    mallId: String(row.mall_id || ""),
    merchantFeedback: String(row.store_feedback || ""),
    nextAction: String(row.next_action || ""),
    nextFollowUpDate: row.next_follow_up_date ? String(row.next_follow_up_date) : null,
    ownerName: String(row.owner_name || ""),
    periodMonth: String(row.period_month || ""),
    status: String(row.status || "待跟进") as SurveyFollowUp["status"],
    storeId: String(row.store_id || ""),
    updatedAt: String(row.updated_at || ""),
    warningId: String(row.warning_id || ""),
  };
}

function mapMall(row: Record<string, unknown>): SurveyMall {
  return {
    createdAt: String(row.created_at || ""),
    id: String(row.id || ""),
    name: String(row.name || ""),
    status: String(row.status || "active") as SurveyMall["status"],
    updatedAt: String(row.updated_at || ""),
  };
}

function mapBrand(row: Record<string, unknown>): SurveyBrand {
  return {
    createdAt: String(row.created_at || ""),
    id: String(row.id || ""),
    mallId: String(row.mall_id || ""),
    name: String(row.name || ""),
    normalizedName: String(row.normalized_name || ""),
    updatedAt: String(row.updated_at || ""),
  };
}

function mapCategory(row: Record<string, unknown>): SurveyCategory {
  return {
    createdAt: String(row.created_at || ""),
    enabled: Number(row.enabled || 0) === 1,
    id: String(row.id || ""),
    mallId: String(row.mall_id || ""),
    name: String(row.name || ""),
    sortOrder: Number(row.sort_order || 0),
    updatedAt: String(row.updated_at || ""),
  };
}

function mapSubcategory(row: Record<string, unknown>): SurveySubcategory {
  return {
    categoryId: String(row.category_id || ""),
    createdAt: String(row.created_at || ""),
    enabled: Number(row.enabled || 0) === 1,
    id: String(row.id || ""),
    mallId: String(row.mall_id || ""),
    name: String(row.name || ""),
    sortOrder: Number(row.sort_order || 0),
    updatedAt: String(row.updated_at || ""),
  };
}

function mapStore(row: Record<string, unknown>): SurveyStore {
  return {
    areaSqm: Number(row.area_sqm || 0),
    brandId: String(row.brand_id || ""),
    brandName: String(row.brand_name || ""),
    categoryId: String(row.category_id || ""),
    categoryName: String(row.category_name || ""),
    chainStore: Number(row.chain_store || 0) === 1,
    contactPhone: String(row.contact_phone || ""),
    contractEndDate: String(row.contract_end_date || ""),
    contractStartDate: String(row.contract_start_date || ""),
    createdAt: String(row.created_at || ""),
    displayLocation: String(row.display_location || ""),
    floor: String(row.floor || ""),
    formCategoryCode: categoryNameToCode(String(row.form_category_code || row.subcategory_name || row.category_name || "")),
    id: String(row.id || ""),
    mallId: String(row.mall_id || ""),
    mallName: String(row.mall_name || ""),
    managerName: String(row.manager_name || ""),
    operationMode: String(row.operation_mode || ""),
    operatorName: String(row.operator_name || ""),
    rentMode: String(row.rent_mode || ""),
    searchText: String(row.search_text || ""),
    staffCount: Number(row.staff_count || 0),
    status: String(row.status || "active") as SurveyStore["status"],
    storeCode: String(row.store_code || ""),
    storeName: String(row.store_name || ""),
    subcategoryId: String(row.subcategory_id || ""),
    subcategoryName: String(row.subcategory_name || ""),
    unitNo: String(row.unit_no || ""),
    updatedAt: String(row.updated_at || ""),
  };
}

function mapSubmission(row: Record<string, unknown>): SurveyMerchantSubmission {
  return {
    categoryName: String(row.category_name || ""),
    createdAt: String(row.created_at || ""),
    fieldValuesJson: String(row.field_values_json || "{}"),
    firstSubmittedAt: String(row.first_submitted_at || ""),
    id: String(row.id || ""),
    isLate: Number(row.is_late || 0) === 1,
    lastModifiedAt: String(row.last_modified_at || ""),
    mallId: String(row.mall_id || ""),
    memberRechargeWan: Number(row.member_recharge_wan || 0),
    merchantEditTokenHash: String(row.merchant_edit_token_hash || ""),
    merchantEditUntil: String(row.merchant_edit_until || ""),
    noLocalPeerStores: Number(row.no_local_peer_stores || 0) === 1,
    periodMonth: String(row.period_month || ""),
    salesTargetWan: Number(row.sales_target_wan || 0),
    selfReportedSalesWan: Number(row.self_reported_sales_wan || 0),
    status: "submitted",
    storeId: String(row.store_id || ""),
    updatedAt: String(row.updated_at || ""),
  };
}

function mapChangeLog(row: Record<string, unknown>): SurveySubmissionChangeLog {
  return {
    actorId: String(row.actor_id || ""),
    actorType: String(row.actor_type || "merchant") as SurveySubmissionChangeLog["actorType"],
    changedAt: String(row.changed_at || ""),
    fieldKey: String(row.field_key || ""),
    id: String(row.id || ""),
    newValue: String(row.new_value || ""),
    oldValue: String(row.old_value || ""),
    submissionId: String(row.submission_id || ""),
  };
}

function mapAlias(row: Record<string, unknown>): SurveyStoreAlias {
  return {
    alias: String(row.alias || ""),
    createdAt: String(row.created_at || ""),
    id: String(row.id || ""),
    normalizedAlias: String(row.normalized_alias || ""),
    storeId: String(row.store_id || ""),
  };
}

function mapStoredFormField(row: Record<string, unknown>): SurveyStoredFormField {
  return {
    categoryId: row.category_id ? String(row.category_id) : null,
    createdAt: String(row.created_at || ""),
    enabled: Number(row.enabled || 0) === 1,
    fieldKey: String(row.field_key || ""),
    id: String(row.id || ""),
    label: String(row.label || ""),
    mallId: String(row.mall_id || ""),
    optionsJson: String(row.options_json || "[]"),
    precision: row.precision === null || row.precision === undefined ? null : Number(row.precision),
    required: Number(row.required || 0) === 1,
    sortOrder: Number(row.sort_order || 0),
    type: String(row.type || "text"),
    unit: String(row.unit || ""),
    updatedAt: String(row.updated_at || ""),
    visibleRuleJson: String(row.visible_rule_json || "{}"),
  };
}

function mapAuditLog(row: Record<string, unknown>): SurveyAuditLog {
  return {
    action: String(row.action || ""),
    actorId: String(row.actor_id || ""),
    actorType: String(row.actor_type || "staff") as SurveyAuditLog["actorType"],
    createdAt: String(row.created_at || ""),
    detailJson: String(row.detail_json || ""),
    id: String(row.id || ""),
    mallId: String(row.mall_id || ""),
    targetId: String(row.target_id || ""),
    targetType: String(row.target_type || ""),
  };
}

function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)}`;
}

function assertNonNegativeOneDecimal(value: number | null, label: string) {
  if (value === null) {
    return;
  }
  if (!Number.isFinite(value) || value < 0 || Math.round(value * 10) !== value * 10) {
    throw new Error(`${label}必须为非负数字，最多保留1位小数。`);
  }
}
