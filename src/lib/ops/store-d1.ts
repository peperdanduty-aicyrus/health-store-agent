import type { D1DatabaseLike } from "@/lib/data/store-d1";
import type {
  OpsClient,
  OpsClientInput,
  OpsContentProfile,
  OpsContentProfileInput,
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
} from "./types";
import type { OpsStore, OpsTaskFilter } from "./store";

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
