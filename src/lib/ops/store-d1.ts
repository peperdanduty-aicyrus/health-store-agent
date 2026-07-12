import type { D1DatabaseLike } from "@/lib/data/store-d1";
import type {
  OpsClient,
  OpsClientInput,
  OpsContentProfile,
  OpsContentProfileInput,
  OpsContentDraft,
  OpsContentDraftInput,
  OpsContentGenerationRun,
  OpsContentGenerationRunInput,
  OpsContentTask,
  OpsContentTaskInput,
  OpsContentVersion,
  OpsContentVersionInput,
  OpsKeyword,
  OpsKeywordInput,
  OpsOperatorAssignment,
  OpsOperatorAssignmentInput,
  OpsOrganization,
  OpsOrganizationInput,
  OpsPayment,
  OpsPaymentInput,
  OpsReport,
  OpsReportInput,
  OpsServiceAgreement,
  OpsServiceAgreementInput,
  OpsSubscription,
  OpsSubscriptionInput,
  OpsTask,
  OpsTaskInput,
  OpsTaskLog,
  OpsTaskLogInput,
  OpsStyleSample,
  OpsStyleSampleInput,
} from "./types";
import type { OpsContentTaskFilter, OpsStore, OpsTaskFilter } from "./store";

type BooleanRow<T> = Omit<T, "active"> & { active: number };
type SubscriptionRow = Omit<OpsSubscription, "autoRenew"> & { autoRenew: number };

const clientSelect = `SELECT id, client_name clientName, brand_name brandName, industry, city,
  service_area serviceArea, contact_name contactName, contact_method contactMethod, address,
  company_intro companyIntro, main_business mainBusiness, target_audience targetAudience,
  business_hours businessHours, customer_source customerSource, cooperation_status cooperationStatus,
  notes, active, created_at createdAt, updated_at updatedAt FROM ops_clients`;
const organizationSelect = `SELECT id, client_id clientId, organization_name organizationName,
  organization_type organizationType, description, active, created_at createdAt, updated_at updatedAt
  FROM ops_organizations`;
const agreementSelect = `SELECT id, client_id clientId, service_start_date serviceStartDate,
  service_end_date serviceEndDate, monthly_fee monthlyFee, settlement_day settlementDay,
  expected_amount expectedAmount, paid_amount paidAmount, payment_status paymentStatus,
  delivery_method deliveryMethod, service_scope serviceScope, monthly_tasks monthlyTasks,
  weekly_tasks weeklyTasks, important_agreements importantAgreements,
  renewal_probability renewalProbability, created_at createdAt, updated_at updatedAt
  FROM ops_service_agreements`;
const taskSelect = `SELECT id, client_id clientId, organization_id organizationId, title,
  task_type taskType, description, scheduled_date scheduledDate, due_date dueDate, status,
  priority, assigned_user_id assignedUserId, related_platform relatedPlatform, keyword,
  completed_at completedAt, created_at createdAt, updated_at updatedAt FROM ops_tasks`;
const taskLogSelect = `SELECT id, task_id taskId, client_id clientId, organization_id organizationId,
  log_type logType, content, next_action nextAction, created_by_user_id createdByUserId,
  created_at createdAt FROM ops_task_logs`;
const paymentSelect = `SELECT id, client_id clientId, billing_month billingMonth,
  expected_amount expectedAmount, received_amount receivedAmount, due_date dueDate,
  received_date receivedDate, status, notes, created_at createdAt, updated_at updatedAt FROM ops_payments`;
const subscriptionSelect = `SELECT id, service_name serviceName, account_note accountNote,
  purchase_date purchaseDate, expiry_date expiryDate, price, billing_cycle billingCycle,
  auto_renew autoRenew, usage_note usageNote, status, notes, created_at createdAt,
  updated_at updatedAt FROM ops_subscriptions`;
const assignmentSelect = `SELECT id, assigned_user_id assignedUserId, client_id clientId,
  organization_id organizationId, generation_limit generationLimit, created_at createdAt,
  updated_at updatedAt FROM ops_operator_assignments`;
const contentProfileSelect = `SELECT id, organization_id organizationId, detailed_intro detailedIntro,
  services, real_advantages realAdvantages, team_info teamInfo, qualifications, faq,
  audience_concerns audienceConcerns, writing_style writingStyle, prohibited_claims prohibitedClaims,
  banned_words bannedWords, reference_accounts referenceAccounts, keywords, used_keywords usedKeywords,
  created_at createdAt, updated_at updatedAt FROM ops_content_profiles`;
const reportSelect = `SELECT id, client_id clientId, organization_id organizationId,
  report_type reportType, period_start periodStart, period_end periodEnd, content, status,
  created_at createdAt, updated_at updatedAt FROM ops_reports`;
const contentTaskSelect = `SELECT id, client_id clientId, organization_id organizationId, content_type contentType,
  title_direction titleDirection, topic, target_audience targetAudience, primary_keyword primaryKeyword,
  secondary_keywords secondaryKeywords, planned_generation_date plannedGenerationDate,
  planned_publish_date plannedPublishDate, generation_count generationCount, status,
  assigned_user_id assignedUserId, notes, created_at createdAt, updated_at updatedAt FROM ops_content_tasks`;
const contentDraftSelect = `SELECT id, content_task_id contentTaskId, client_id clientId, organization_id organizationId,
  content_type contentType, title, summary, body, faq, seo_title seoTitle, seo_description seoDescription,
  suggested_keywords suggestedKeywords, status, internal_notes internalNotes, created_by_user_id createdByUserId,
  updated_by_user_id updatedByUserId, created_at createdAt, updated_at updatedAt FROM ops_content_drafts`;
const contentVersionSelect = `SELECT id, draft_id draftId, version_number versionNumber, title, body,
  change_note changeNote, changed_by_user_id changedByUserId, created_at createdAt FROM ops_content_versions`;
const styleSampleSelect = `SELECT id, organization_id organizationId, title, content, content_type contentType,
  active, created_at createdAt, updated_at updatedAt FROM ops_style_samples`;
const keywordSelect = `SELECT id, organization_id organizationId, keyword, keyword_type keywordType, source,
  active, usage_count usageCount, last_used_at lastUsedAt, notes, created_at createdAt, updated_at updatedAt FROM ops_keywords`;

export function createD1OpsStore(db: D1DatabaseLike): OpsStore {
  return {
    async listClients() {
      const { results = [] } = await db.prepare(`${clientSelect} ORDER BY updated_at DESC`).all<BooleanRow<OpsClient>>();
      return results.map(mapActive);
    },
    async getClient(id) {
      const row = await db.prepare(`${clientSelect} WHERE id = ?`).bind(id).first<BooleanRow<OpsClient>>();
      return row ? mapActive(row) : null;
    },
    async saveClient(input) {
      const now = new Date().toISOString();
      const record = withTimestamps<OpsClient>(input, "ops_client", now);
      await db.prepare(`INSERT INTO ops_clients (
        id, client_name, brand_name, industry, city, service_area, contact_name, contact_method,
        address, company_intro, main_business, target_audience, business_hours, customer_source,
        cooperation_status, notes, active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET client_name=excluded.client_name, brand_name=excluded.brand_name,
        industry=excluded.industry, city=excluded.city, service_area=excluded.service_area,
        contact_name=excluded.contact_name, contact_method=excluded.contact_method, address=excluded.address,
        company_intro=excluded.company_intro, main_business=excluded.main_business,
        target_audience=excluded.target_audience, business_hours=excluded.business_hours,
        customer_source=excluded.customer_source, cooperation_status=excluded.cooperation_status,
        notes=excluded.notes, active=excluded.active, updated_at=excluded.updated_at`)
        .bind(record.id, record.clientName, record.brandName, record.industry, record.city, record.serviceArea,
          record.contactName, record.contactMethod, record.address, record.companyIntro, record.mainBusiness,
          record.targetAudience, record.businessHours, record.customerSource, record.cooperationStatus,
          record.notes, record.active ? 1 : 0, record.createdAt, record.updatedAt).run();
      return record;
    },
    async setClientActive(id, active) {
      await db.prepare("UPDATE ops_clients SET active = ?, updated_at = ? WHERE id = ?")
        .bind(active ? 1 : 0, new Date().toISOString(), id).run();
      return this.getClient(id);
    },
    async listOrganizations(clientId) {
      const statement = clientId
        ? db.prepare(`${organizationSelect} WHERE client_id = ? ORDER BY updated_at DESC`).bind(clientId)
        : db.prepare(`${organizationSelect} ORDER BY updated_at DESC`);
      const { results = [] } = await statement.all<BooleanRow<OpsOrganization>>();
      return results.map(mapActive);
    },
    async getOrganization(id) {
      const row = await db.prepare(`${organizationSelect} WHERE id = ?`).bind(id).first<BooleanRow<OpsOrganization>>();
      return row ? mapActive(row) : null;
    },
    async saveOrganization(input) {
      const now = new Date().toISOString();
      const record = withTimestamps<OpsOrganization>(input, "ops_org", now);
      await db.prepare(`INSERT INTO ops_organizations (
        id, client_id, organization_name, organization_type, description, active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET client_id=excluded.client_id, organization_name=excluded.organization_name,
        organization_type=excluded.organization_type, description=excluded.description,
        active=excluded.active, updated_at=excluded.updated_at`)
        .bind(record.id, record.clientId, record.organizationName, record.organizationType,
          record.description, record.active ? 1 : 0, record.createdAt, record.updatedAt).run();
      return record;
    },
    async setOrganizationActive(id, active) {
      await db.prepare("UPDATE ops_organizations SET active = ?, updated_at = ? WHERE id = ?")
        .bind(active ? 1 : 0, new Date().toISOString(), id).run();
      return this.getOrganization(id);
    },
    async listAgreements(clientId) {
      const statement = clientId
        ? db.prepare(`${agreementSelect} WHERE client_id = ? ORDER BY updated_at DESC`).bind(clientId)
        : db.prepare(`${agreementSelect} ORDER BY updated_at DESC`);
      const { results = [] } = await statement.all<OpsServiceAgreement>();
      return results;
    },
    async saveAgreement(input) {
      const now = new Date().toISOString();
      const existing = !input.id
        ? await db.prepare("SELECT id, created_at createdAt FROM ops_service_agreements WHERE client_id = ?").bind(input.clientId).first<{id:string;createdAt:string}>()
        : null;
      const record = withTimestamps<OpsServiceAgreement>({ ...input, id: input.id || existing?.id }, "ops_agreement", now, existing?.createdAt);
      await db.prepare(`INSERT INTO ops_service_agreements (
        id, client_id, service_start_date, service_end_date, monthly_fee, settlement_day,
        expected_amount, paid_amount, payment_status, delivery_method, service_scope,
        monthly_tasks, weekly_tasks, important_agreements, renewal_probability, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET client_id=excluded.client_id, service_start_date=excluded.service_start_date,
        service_end_date=excluded.service_end_date, monthly_fee=excluded.monthly_fee,
        settlement_day=excluded.settlement_day, expected_amount=excluded.expected_amount,
        paid_amount=excluded.paid_amount, payment_status=excluded.payment_status,
        delivery_method=excluded.delivery_method, service_scope=excluded.service_scope,
        monthly_tasks=excluded.monthly_tasks, weekly_tasks=excluded.weekly_tasks,
        important_agreements=excluded.important_agreements, renewal_probability=excluded.renewal_probability,
        updated_at=excluded.updated_at`)
        .bind(record.id, record.clientId, record.serviceStartDate, record.serviceEndDate, record.monthlyFee,
          record.settlementDay, record.expectedAmount, record.paidAmount, record.paymentStatus,
          record.deliveryMethod, record.serviceScope, record.monthlyTasks, record.weeklyTasks,
          record.importantAgreements, record.renewalProbability, record.createdAt, record.updatedAt).run();
      return record;
    },
    async listTasks(filter: OpsTaskFilter = {}) {
      const conditions: string[] = [];
      const values: string[] = [];
      if (filter.clientId) { conditions.push("client_id = ?"); values.push(filter.clientId); }
      if (filter.organizationId) { conditions.push("organization_id = ?"); values.push(filter.organizationId); }
      if (filter.assignedUserId) { conditions.push("assigned_user_id = ?"); values.push(filter.assignedUserId); }
      if (filter.periodStart) { conditions.push("COALESCE(NULLIF(scheduled_date, ''), due_date) >= ?"); values.push(filter.periodStart); }
      if (filter.periodEnd) { conditions.push("COALESCE(NULLIF(scheduled_date, ''), due_date) <= ?"); values.push(filter.periodEnd); }
      const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
      const { results = [] } = await db.prepare(`${taskSelect}${where} ORDER BY scheduled_date, due_date, created_at DESC`)
        .bind(...values).all<OpsTask>();
      return results;
    },
    async getTask(id) { return db.prepare(`${taskSelect} WHERE id = ?`).bind(id).first<OpsTask>(); },
    async saveTask(input) {
      const now = new Date().toISOString();
      const record = withTimestamps<OpsTask>(input, "ops_task", now);
      await db.prepare(`INSERT INTO ops_tasks (
        id, client_id, organization_id, title, task_type, description, scheduled_date, due_date,
        status, priority, assigned_user_id, related_platform, keyword, completed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET client_id=excluded.client_id, organization_id=excluded.organization_id,
        title=excluded.title, task_type=excluded.task_type, description=excluded.description,
        scheduled_date=excluded.scheduled_date, due_date=excluded.due_date, status=excluded.status,
        priority=excluded.priority, assigned_user_id=excluded.assigned_user_id,
        related_platform=excluded.related_platform, keyword=excluded.keyword,
        completed_at=excluded.completed_at, updated_at=excluded.updated_at`)
        .bind(record.id, record.clientId, record.organizationId, record.title, record.taskType,
          record.description, record.scheduledDate, record.dueDate, record.status, record.priority,
          record.assignedUserId, record.relatedPlatform, record.keyword, record.completedAt,
          record.createdAt, record.updatedAt).run();
      return record;
    },
    async deleteTask(id) {
      const existing = await this.getTask(id);
      if (!existing) return false;
      await db.prepare("DELETE FROM ops_tasks WHERE id = ?").bind(id).run();
      return true;
    },
    async listTaskLogs(clientId, organizationId) {
      const conditions: string[] = [];
      const values: string[] = [];
      if (clientId) { conditions.push("client_id = ?"); values.push(clientId); }
      if (organizationId) { conditions.push("organization_id = ?"); values.push(organizationId); }
      const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
      const { results = [] } = await db.prepare(`${taskLogSelect}${where} ORDER BY created_at DESC`)
        .bind(...values).all<OpsTaskLog>();
      return results;
    },
    async saveTaskLog(input) {
      const record: OpsTaskLog = { ...input, id: input.id || makeId("ops_log"), createdAt: new Date().toISOString() };
      await db.prepare(`INSERT INTO ops_task_logs (
        id, task_id, client_id, organization_id, log_type, content, next_action, created_by_user_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(record.id, record.taskId, record.clientId, record.organizationId, record.logType,
          record.content, record.nextAction, record.createdByUserId, record.createdAt).run();
      return record;
    },
    async listPayments(clientId) {
      const statement = clientId
        ? db.prepare(`${paymentSelect} WHERE client_id = ? ORDER BY billing_month DESC`).bind(clientId)
        : db.prepare(`${paymentSelect} ORDER BY billing_month DESC`);
      const { results = [] } = await statement.all<OpsPayment>();
      return results;
    },
    async savePayment(input) {
      const now = new Date().toISOString();
      const record = withTimestamps<OpsPayment>(input, "ops_payment", now);
      await db.prepare(`INSERT INTO ops_payments (
        id, client_id, billing_month, expected_amount, received_amount, due_date, received_date,
        status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET client_id=excluded.client_id, billing_month=excluded.billing_month,
        expected_amount=excluded.expected_amount, received_amount=excluded.received_amount,
        due_date=excluded.due_date, received_date=excluded.received_date, status=excluded.status,
        notes=excluded.notes, updated_at=excluded.updated_at`)
        .bind(record.id, record.clientId, record.billingMonth, record.expectedAmount, record.receivedAmount,
          record.dueDate, record.receivedDate, record.status, record.notes, record.createdAt, record.updatedAt).run();
      return record;
    },
    async listSubscriptions() {
      const { results = [] } = await db.prepare(`${subscriptionSelect} ORDER BY expiry_date`).all<SubscriptionRow>();
      return results.map((row) => ({ ...row, autoRenew: Boolean(row.autoRenew) }));
    },
    async saveSubscription(input) {
      const now = new Date().toISOString();
      const record = withTimestamps<OpsSubscription>(input, "ops_subscription", now);
      await db.prepare(`INSERT INTO ops_subscriptions (
        id, service_name, account_note, purchase_date, expiry_date, price, billing_cycle,
        auto_renew, usage_note, status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET service_name=excluded.service_name, account_note=excluded.account_note,
        purchase_date=excluded.purchase_date, expiry_date=excluded.expiry_date, price=excluded.price,
        billing_cycle=excluded.billing_cycle, auto_renew=excluded.auto_renew, usage_note=excluded.usage_note,
        status=excluded.status, notes=excluded.notes, updated_at=excluded.updated_at`)
        .bind(record.id, record.serviceName, record.accountNote, record.purchaseDate, record.expiryDate,
          record.price, record.billingCycle, record.autoRenew ? 1 : 0, record.usageNote, record.status,
          record.notes, record.createdAt, record.updatedAt).run();
      return record;
    },
    async renewSubscription(id, expiryDate) {
      await db.prepare("UPDATE ops_subscriptions SET expiry_date = ?, status = '使用中', updated_at = ? WHERE id = ?")
        .bind(expiryDate, new Date().toISOString(), id).run();
      const row = await db.prepare(`${subscriptionSelect} WHERE id = ?`).bind(id).first<SubscriptionRow>();
      return row ? { ...row, autoRenew: Boolean(row.autoRenew) } : null;
    },
    async listAssignments(assignedUserId) {
      const statement = assignedUserId
        ? db.prepare(`${assignmentSelect} WHERE assigned_user_id = ? ORDER BY updated_at DESC`).bind(assignedUserId)
        : db.prepare(`${assignmentSelect} ORDER BY updated_at DESC`);
      const { results = [] } = await statement.all<OpsOperatorAssignment>();
      return results;
    },
    async saveAssignment(input) {
      const now = new Date().toISOString();
      const existing = !input.id
        ? await db.prepare("SELECT id, created_at createdAt FROM ops_operator_assignments WHERE assigned_user_id = ? AND organization_id = ?")
          .bind(input.assignedUserId, input.organizationId).first<{id:string;createdAt:string}>()
        : null;
      const record = withTimestamps<OpsOperatorAssignment>({ ...input, id: input.id || existing?.id }, "ops_assignment", now, existing?.createdAt);
      await db.prepare(`INSERT INTO ops_operator_assignments (
        id, assigned_user_id, client_id, organization_id, generation_limit, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET assigned_user_id=excluded.assigned_user_id, client_id=excluded.client_id,
        organization_id=excluded.organization_id, generation_limit=excluded.generation_limit,
        updated_at=excluded.updated_at`)
        .bind(record.id, record.assignedUserId, record.clientId, record.organizationId,
          record.generationLimit, record.createdAt, record.updatedAt).run();
      return record;
    },
    async deleteAssignment(id) {
      const existing = await db.prepare("SELECT id FROM ops_operator_assignments WHERE id = ?").bind(id).first();
      if (!existing) return false;
      await db.prepare("DELETE FROM ops_operator_assignments WHERE id = ?").bind(id).run();
      return true;
    },
    async getContentProfile(organizationId) {
      return db.prepare(`${contentProfileSelect} WHERE organization_id = ?`).bind(organizationId).first<OpsContentProfile>();
    },
    async saveContentProfile(input) {
      const now = new Date().toISOString();
      const existing = !input.id
        ? await db.prepare("SELECT id, created_at createdAt FROM ops_content_profiles WHERE organization_id = ?")
          .bind(input.organizationId).first<{id:string;createdAt:string}>()
        : null;
      const record = withTimestamps<OpsContentProfile>({ ...input, id: input.id || existing?.id }, "ops_content_profile", now, existing?.createdAt);
      await db.prepare(`INSERT INTO ops_content_profiles (
        id, organization_id, detailed_intro, services, real_advantages, team_info, qualifications,
        faq, audience_concerns, writing_style, prohibited_claims, banned_words, reference_accounts,
        keywords, used_keywords, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET organization_id=excluded.organization_id,
        detailed_intro=excluded.detailed_intro, services=excluded.services,
        real_advantages=excluded.real_advantages, team_info=excluded.team_info,
        qualifications=excluded.qualifications, faq=excluded.faq,
        audience_concerns=excluded.audience_concerns, writing_style=excluded.writing_style,
        prohibited_claims=excluded.prohibited_claims, banned_words=excluded.banned_words,
        reference_accounts=excluded.reference_accounts, keywords=excluded.keywords,
        used_keywords=excluded.used_keywords, updated_at=excluded.updated_at`)
        .bind(record.id, record.organizationId, record.detailedIntro, record.services, record.realAdvantages,
          record.teamInfo, record.qualifications, record.faq, record.audienceConcerns, record.writingStyle,
          record.prohibitedClaims, record.bannedWords, record.referenceAccounts, record.keywords,
          record.usedKeywords, record.createdAt, record.updatedAt).run();
      return record;
    },
    async listReports(clientId) {
      const statement = clientId
        ? db.prepare(`${reportSelect} WHERE client_id = ? ORDER BY period_end DESC, updated_at DESC`).bind(clientId)
        : db.prepare(`${reportSelect} ORDER BY period_end DESC, updated_at DESC`);
      const { results = [] } = await statement.all<OpsReport>();
      return results;
    },
    async getReport(id) { return db.prepare(`${reportSelect} WHERE id = ?`).bind(id).first<OpsReport>(); },
    async saveReport(input) {
      const now = new Date().toISOString();
      const record = withTimestamps<OpsReport>(input, "ops_report", now);
      await db.prepare(`INSERT INTO ops_reports (
        id, client_id, organization_id, report_type, period_start, period_end, content, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET client_id=excluded.client_id, organization_id=excluded.organization_id,
        report_type=excluded.report_type, period_start=excluded.period_start, period_end=excluded.period_end,
        content=excluded.content, status=excluded.status, updated_at=excluded.updated_at`)
        .bind(record.id, record.clientId, record.organizationId, record.reportType, record.periodStart,
          record.periodEnd, record.content, record.status, record.createdAt, record.updatedAt).run();
      return record;
    },
    async listContentTasks(filter: OpsContentTaskFilter = {}) {
      const conditions: string[] = [];
      const values: string[] = [];
      if (filter.clientId) { conditions.push("client_id = ?"); values.push(filter.clientId); }
      if (filter.organizationId) { conditions.push("organization_id = ?"); values.push(filter.organizationId); }
      if (filter.assignedUserId) { conditions.push("assigned_user_id = ?"); values.push(filter.assignedUserId); }
      if (filter.contentType) { conditions.push("content_type = ?"); values.push(filter.contentType); }
      if (filter.status) { conditions.push("status = ?"); values.push(filter.status); }
      if (filter.keyword) { conditions.push("(primary_keyword LIKE ? OR secondary_keywords LIKE ?)"); values.push(`%${filter.keyword}%`, `%${filter.keyword}%`); }
      if (filter.periodStart) { conditions.push("planned_generation_date >= ?"); values.push(filter.periodStart); }
      if (filter.periodEnd) { conditions.push("planned_generation_date <= ?"); values.push(filter.periodEnd); }
      const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
      const { results = [] } = await db.prepare(`${contentTaskSelect}${where} ORDER BY planned_generation_date, planned_publish_date, created_at DESC`).bind(...values).all<OpsContentTask>();
      return results;
    },
    async getContentTask(id) { return db.prepare(`${contentTaskSelect} WHERE id = ?`).bind(id).first<OpsContentTask>(); },
    async saveContentTask(input) {
      const now = new Date().toISOString();
      const existing = input.id ? await this.getContentTask(input.id) : null;
      const record = withTimestamps<OpsContentTask>({ ...input, generationCount: input.generationCount ?? existing?.generationCount ?? 0 }, "ops_content_task", now, existing?.createdAt);
      await db.prepare(`INSERT INTO ops_content_tasks (id, client_id, organization_id, content_type, title_direction, topic, target_audience, primary_keyword, secondary_keywords, planned_generation_date, planned_publish_date, generation_count, status, assigned_user_id, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET client_id=excluded.client_id, organization_id=excluded.organization_id, content_type=excluded.content_type, title_direction=excluded.title_direction, topic=excluded.topic, target_audience=excluded.target_audience, primary_keyword=excluded.primary_keyword, secondary_keywords=excluded.secondary_keywords, planned_generation_date=excluded.planned_generation_date, planned_publish_date=excluded.planned_publish_date, generation_count=excluded.generation_count, status=excluded.status, assigned_user_id=excluded.assigned_user_id, notes=excluded.notes, updated_at=excluded.updated_at`)
        .bind(record.id, record.clientId, record.organizationId, record.contentType, record.titleDirection, record.topic, record.targetAudience, record.primaryKeyword, record.secondaryKeywords, record.plannedGenerationDate, record.plannedPublishDate, record.generationCount, record.status, record.assignedUserId, record.notes, record.createdAt, record.updatedAt).run();
      return record;
    },
    async listContentDrafts(organizationId, contentTaskId) {
      const conditions: string[] = []; const values: string[] = [];
      if (organizationId) { conditions.push("organization_id = ?"); values.push(organizationId); }
      if (contentTaskId) { conditions.push("content_task_id = ?"); values.push(contentTaskId); }
      const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
      const { results = [] } = await db.prepare(`${contentDraftSelect}${where} ORDER BY updated_at DESC`).bind(...values).all<OpsContentDraft>(); return results;
    },
    async getContentDraft(id) { return db.prepare(`${contentDraftSelect} WHERE id = ?`).bind(id).first<OpsContentDraft>(); },
    async saveContentDraft(input) {
      const now = new Date().toISOString(); const existing = input.id ? await this.getContentDraft(input.id) : null;
      const record = withTimestamps<OpsContentDraft>(input, "ops_content_draft", now, existing?.createdAt);
      await db.prepare(`INSERT INTO ops_content_drafts (id, content_task_id, client_id, organization_id, content_type, title, summary, body, faq, seo_title, seo_description, suggested_keywords, status, internal_notes, created_by_user_id, updated_by_user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET content_task_id=excluded.content_task_id, client_id=excluded.client_id, organization_id=excluded.organization_id, content_type=excluded.content_type, title=excluded.title, summary=excluded.summary, body=excluded.body, faq=excluded.faq, seo_title=excluded.seo_title, seo_description=excluded.seo_description, suggested_keywords=excluded.suggested_keywords, status=excluded.status, internal_notes=excluded.internal_notes, updated_by_user_id=excluded.updated_by_user_id, updated_at=excluded.updated_at`)
       .bind(record.id, record.contentTaskId, record.clientId, record.organizationId, record.contentType, record.title, record.summary, record.body, record.faq, record.seoTitle, record.seoDescription, record.suggestedKeywords, record.status, record.internalNotes, record.createdByUserId, record.updatedByUserId, record.createdAt, record.updatedAt).run(); return record;
    },
    async listContentVersions(draftId) { const { results = [] } = await db.prepare(`${contentVersionSelect} WHERE draft_id = ? ORDER BY version_number DESC`).bind(draftId).all<OpsContentVersion>(); return results; },
    async saveContentVersion(input) { const record: OpsContentVersion = { ...input, id: input.id || makeId("ops_content_version"), createdAt: new Date().toISOString() }; await db.prepare("INSERT INTO ops_content_versions (id, draft_id, version_number, title, body, change_note, changed_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(record.id, record.draftId, record.versionNumber, record.title, record.body, record.changeNote, record.changedByUserId, record.createdAt).run(); return record; },
    async saveContentGenerationRun(input) { const record: OpsContentGenerationRun = { ...input, id: input.id || makeId("ops_content_run"), createdAt: new Date().toISOString() }; await db.prepare("INSERT INTO ops_content_generation_runs (id, content_task_id, draft_id, request_id, scene, prompt_version, model, status, error_code, error_message, elapsed_ms, token_usage, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(record.id, record.contentTaskId, record.draftId, record.requestId, record.scene, record.promptVersion, record.model, record.status, record.errorCode, record.errorMessage, record.elapsedMs, record.tokenUsage, record.createdAt).run(); return record; },
    async listStyleSamples(organizationId) { const { results = [] } = await db.prepare(`${styleSampleSelect} WHERE organization_id = ? ORDER BY updated_at DESC`).bind(organizationId).all<BooleanRow<OpsStyleSample>>(); return results.map(mapActive); },
    async saveStyleSample(input) { const now = new Date().toISOString(); const record = withTimestamps<OpsStyleSample>(input, "ops_style_sample", now); await db.prepare("INSERT INTO ops_style_samples (id, organization_id, title, content, content_type, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET organization_id=excluded.organization_id, title=excluded.title, content=excluded.content, content_type=excluded.content_type, active=excluded.active, updated_at=excluded.updated_at").bind(record.id, record.organizationId, record.title, record.content, record.contentType, record.active ? 1 : 0, record.createdAt, record.updatedAt).run(); return record; },
    async listKeywords(organizationId) { const { results = [] } = await db.prepare(`${keywordSelect} WHERE organization_id = ? ORDER BY updated_at DESC`).bind(organizationId).all<BooleanRow<OpsKeyword>>(); return results.map(mapActive); },
    async saveKeyword(input) { const now = new Date().toISOString(); const existing = input.id ? null : await db.prepare("SELECT id, created_at createdAt FROM ops_keywords WHERE organization_id = ? AND keyword = ?").bind(input.organizationId, input.keyword).first<{id:string;createdAt:string}>(); const record = withTimestamps<OpsKeyword>({ ...input, id: input.id || existing?.id }, "ops_keyword", now, existing?.createdAt); await db.prepare("INSERT INTO ops_keywords (id, organization_id, keyword, keyword_type, source, active, usage_count, last_used_at, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET keyword=excluded.keyword, keyword_type=excluded.keyword_type, source=excluded.source, active=excluded.active, usage_count=excluded.usage_count, last_used_at=excluded.last_used_at, notes=excluded.notes, updated_at=excluded.updated_at").bind(record.id, record.organizationId, record.keyword, record.keywordType, record.source, record.active ? 1 : 0, record.usageCount, record.lastUsedAt, record.notes, record.createdAt, record.updatedAt).run(); return record; },
    async markKeywordUsed(id) { await db.prepare("UPDATE ops_keywords SET usage_count = usage_count + 1, last_used_at = ?, updated_at = ? WHERE id = ?").bind(new Date().toISOString(), new Date().toISOString(), id).run(); const row = await db.prepare(`${keywordSelect} WHERE id = ?`).bind(id).first<BooleanRow<OpsKeyword>>(); return row ? mapActive(row) : null; },
  };
}

function withTimestamps<T extends { id: string; createdAt: string; updatedAt: string }>(
  input: Omit<T, "id" | "createdAt" | "updatedAt"> & { id?: string },
  prefix: string,
  now: string,
  createdAt?: string,
): T {
  return { ...input, id: input.id || makeId(prefix), createdAt: createdAt || now, updatedAt: now } as T;
}

function mapActive<T extends { active: number }>(row: T) {
  return { ...row, active: Boolean(row.active) } as Omit<T, "active"> & { active: boolean };
}

function makeId(prefix: string) { return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`; }
