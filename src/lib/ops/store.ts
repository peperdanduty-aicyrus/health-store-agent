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

export type OpsTaskFilter = {
  clientId?: string;
  organizationId?: string;
  assignedUserId?: string;
  periodStart?: string;
  periodEnd?: string;
};

export type OpsStore = {
  listClients(): Promise<OpsClient[]>;
  getClient(id: string): Promise<OpsClient | null>;
  saveClient(input: OpsClientInput): Promise<OpsClient>;
  setClientActive(id: string, active: boolean): Promise<OpsClient | null>;
  listOrganizations(clientId?: string): Promise<OpsOrganization[]>;
  getOrganization(id: string): Promise<OpsOrganization | null>;
  saveOrganization(input: OpsOrganizationInput): Promise<OpsOrganization>;
  setOrganizationActive(id: string, active: boolean): Promise<OpsOrganization | null>;
  listAgreements(clientId?: string): Promise<OpsServiceAgreement[]>;
  saveAgreement(input: OpsServiceAgreementInput): Promise<OpsServiceAgreement>;
  listTasks(filter?: OpsTaskFilter): Promise<OpsTask[]>;
  getTask(id: string): Promise<OpsTask | null>;
  saveTask(input: OpsTaskInput): Promise<OpsTask>;
  deleteTask(id: string): Promise<boolean>;
  listTaskLogs(clientId?: string, organizationId?: string): Promise<OpsTaskLog[]>;
  saveTaskLog(input: OpsTaskLogInput): Promise<OpsTaskLog>;
  listPayments(clientId?: string): Promise<OpsPayment[]>;
  savePayment(input: OpsPaymentInput): Promise<OpsPayment>;
  listSubscriptions(): Promise<OpsSubscription[]>;
  saveSubscription(input: OpsSubscriptionInput): Promise<OpsSubscription>;
  renewSubscription(id: string, expiryDate: string): Promise<OpsSubscription | null>;
  listAssignments(assignedUserId?: string): Promise<OpsOperatorAssignment[]>;
  saveAssignment(input: OpsOperatorAssignmentInput): Promise<OpsOperatorAssignment>;
  deleteAssignment(id: string): Promise<boolean>;
  getContentProfile(organizationId: string): Promise<OpsContentProfile | null>;
  saveContentProfile(input: OpsContentProfileInput): Promise<OpsContentProfile>;
  listReports(clientId?: string): Promise<OpsReport[]>;
  getReport(id: string): Promise<OpsReport | null>;
  saveReport(input: OpsReportInput): Promise<OpsReport>;
};

type OpsState = {
  clients: OpsClient[];
  organizations: OpsOrganization[];
  agreements: OpsServiceAgreement[];
  tasks: OpsTask[];
  taskLogs: OpsTaskLog[];
  payments: OpsPayment[];
  subscriptions: OpsSubscription[];
  assignments: OpsOperatorAssignment[];
  contentProfiles: OpsContentProfile[];
  reports: OpsReport[];
};

export function createMemoryOpsStore(initial: Partial<OpsState> = {}): OpsStore {
  const state: OpsState = {
    clients: clone(initial.clients ?? []),
    organizations: clone(initial.organizations ?? []),
    agreements: clone(initial.agreements ?? []),
    tasks: clone(initial.tasks ?? []),
    taskLogs: clone(initial.taskLogs ?? []),
    payments: clone(initial.payments ?? []),
    subscriptions: clone(initial.subscriptions ?? []),
    assignments: clone(initial.assignments ?? []),
    contentProfiles: clone(initial.contentProfiles ?? []),
    reports: clone(initial.reports ?? []),
  };

  return {
    async listClients() { return [...state.clients].sort(byUpdated); },
    async getClient(id) { return state.clients.find((item) => item.id === id) ?? null; },
    async saveClient(input) { return upsert(state.clients, input, "ops_client"); },
    async setClientActive(id, active) { return updateActive(state.clients, id, active); },
    async listOrganizations(clientId) {
      return state.organizations.filter((item) => !clientId || item.clientId === clientId).sort(byUpdated);
    },
    async getOrganization(id) { return state.organizations.find((item) => item.id === id) ?? null; },
    async saveOrganization(input) { return upsert(state.organizations, input, "ops_org"); },
    async setOrganizationActive(id, active) { return updateActive(state.organizations, id, active); },
    async listAgreements(clientId) {
      return state.agreements.filter((item) => !clientId || item.clientId === clientId).sort(byUpdated);
    },
    async saveAgreement(input) { return upsertUnique(state.agreements, input, "clientId", "ops_agreement"); },
    async listTasks(filter = {}) {
      return state.tasks.filter((item) => matchesTask(item, filter)).sort(bySchedule);
    },
    async getTask(id) { return state.tasks.find((item) => item.id === id) ?? null; },
    async saveTask(input) { return upsert(state.tasks, input, "ops_task"); },
    async deleteTask(id) { return remove(state.tasks, id); },
    async listTaskLogs(clientId, organizationId) {
      return state.taskLogs
        .filter((item) => (!clientId || item.clientId === clientId) && (!organizationId || item.organizationId === organizationId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async saveTaskLog(input) {
      const record: OpsTaskLog = { ...input, id: input.id || makeId("ops_log"), createdAt: new Date().toISOString() };
      state.taskLogs.unshift(record);
      return record;
    },
    async listPayments(clientId) {
      return state.payments.filter((item) => !clientId || item.clientId === clientId).sort(byUpdated);
    },
    async savePayment(input) { return upsert(state.payments, input, "ops_payment"); },
    async listSubscriptions() { return [...state.subscriptions].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)); },
    async saveSubscription(input) { return upsert(state.subscriptions, input, "ops_subscription"); },
    async renewSubscription(id, expiryDate) {
      const record = state.subscriptions.find((item) => item.id === id);
      if (!record) return null;
      record.expiryDate = expiryDate;
      record.status = "使用中";
      record.updatedAt = new Date().toISOString();
      return record;
    },
    async listAssignments(assignedUserId) {
      return state.assignments.filter((item) => !assignedUserId || item.assignedUserId === assignedUserId).sort(byUpdated);
    },
    async saveAssignment(input) {
      return upsertUnique(state.assignments, input, "organizationId", "ops_assignment", (item) => item.assignedUserId === input.assignedUserId);
    },
    async deleteAssignment(id) { return remove(state.assignments, id); },
    async getContentProfile(organizationId) {
      return state.contentProfiles.find((item) => item.organizationId === organizationId) ?? null;
    },
    async saveContentProfile(input) { return upsertUnique(state.contentProfiles, input, "organizationId", "ops_content_profile"); },
    async listReports(clientId) {
      return state.reports.filter((item) => !clientId || item.clientId === clientId).sort(byUpdated);
    },
    async getReport(id) { return state.reports.find((item) => item.id === id) ?? null; },
    async saveReport(input) { return upsert(state.reports, input, "ops_report"); },
  };
}

function upsert<T extends { id: string; createdAt: string; updatedAt: string }>(
  list: T[],
  input: Omit<T, "id" | "createdAt" | "updatedAt"> & { id?: string },
  prefix: string,
): T {
  const now = new Date().toISOString();
  const existing = input.id ? list.find((item) => item.id === input.id) : undefined;
  if (existing) {
    Object.assign(existing, input, { updatedAt: now });
    return existing;
  }
  const record = { ...input, id: input.id || makeId(prefix), createdAt: now, updatedAt: now } as T;
  list.unshift(record);
  return record;
}

function upsertUnique<T extends { id: string; createdAt: string; updatedAt: string }, K extends keyof T>(
  list: T[],
  input: Omit<T, "id" | "createdAt" | "updatedAt"> & { id?: string },
  key: K,
  prefix: string,
  extraMatch: (item: T) => boolean = () => true,
): T {
  const inputValue = (input as T)[key];
  const existing = list.find((item) => (input.id ? item.id === input.id : item[key] === inputValue) && extraMatch(item));
  return upsert(list, { ...input, id: existing?.id }, prefix);
}

function updateActive<T extends { id: string; active: boolean; updatedAt: string }>(list: T[], id: string, active: boolean) {
  const record = list.find((item) => item.id === id);
  if (!record) return null;
  record.active = active;
  record.updatedAt = new Date().toISOString();
  return record;
}

function remove<T extends { id: string }>(list: T[], id: string) {
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return false;
  list.splice(index, 1);
  return true;
}

function matchesTask(task: OpsTask, filter: OpsTaskFilter) {
  if (filter.clientId && task.clientId !== filter.clientId) return false;
  if (filter.organizationId && task.organizationId !== filter.organizationId) return false;
  if (filter.assignedUserId && task.assignedUserId !== filter.assignedUserId) return false;
  const date = task.scheduledDate || task.dueDate;
  if (filter.periodStart && date && date < filter.periodStart) return false;
  if (filter.periodEnd && date && date > filter.periodEnd) return false;
  return true;
}

function byUpdated(a: { updatedAt: string }, b: { updatedAt: string }) { return b.updatedAt.localeCompare(a.updatedAt); }
function bySchedule(a: OpsTask, b: OpsTask) { return (a.scheduledDate || a.dueDate).localeCompare(b.scheduledDate || b.dueDate); }
function makeId(prefix: string) { return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`; }
function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }

const globalOpsStore = globalThis as typeof globalThis & { __healthAgentOpsMemoryStore?: OpsStore };
globalOpsStore.__healthAgentOpsMemoryStore ??= createMemoryOpsStore();
export const memoryOpsStore = globalOpsStore.__healthAgentOpsMemoryStore;
