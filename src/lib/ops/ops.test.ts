import { describe, expect, it } from "vitest";
import { assertFinanceAccess, assertOrganizationAccess, canAccessOpsControlCenter, OpsAccessError } from "./access";
import { calculateOpsDashboardMetrics } from "./dashboard";
import { buildOpsReportDraft } from "./report-draft";
import { createMemoryOpsStore } from "./store";
import type { OpsClient, OpsOperatorAssignment, OpsTask, OpsTaskLog } from "./types";

const now = "2026-07-11T10:00:00.000Z";
const client: OpsClient = {
  id: "client_1", clientName: "测试客户", brandName: "", industry: "", city: "", serviceArea: "",
  contactName: "", contactMethod: "", address: "", companyIntro: "", mainBusiness: "", targetAudience: "",
  businessHours: "", customerSource: "", cooperationStatus: "合作中", notes: "", active: true, createdAt: now, updatedAt: now,
};
const task: OpsTask = {
  id: "task_1", clientId: client.id, organizationId: "org_1", title: "整理本周门店内容", taskType: "文案处理",
  description: "", scheduledDate: "2026-07-10", dueDate: "2026-07-11", status: "已交付", priority: "普通",
  assignedUserId: "user_1", relatedPlatform: "公众号", keyword: "", completedAt: now, createdAt: now, updatedAt: now,
};
const log: OpsTaskLog = {
  id: "log_1", taskId: task.id, clientId: client.id, organizationId: task.organizationId, logType: "客户反馈",
  content: "客户确认标题可用", nextAction: "下周补充案例", createdByUserId: "user_1", createdAt: now,
};
const assignment: OpsOperatorAssignment = {
  id: "assignment_1", assignedUserId: "user_1", clientId: client.id, organizationId: task.organizationId,
  generationLimit: 10, createdAt: now, updatedAt: now,
};

describe("operations permissions", () => {
  it("allows only the owner to enter the operations control center and finance actions", () => {
    const owner = { id: "owner", phone: "", password: "", role: "owner" as const, displayName: "吕明磊", note: "", disabled: false, createdAt: now, updatedAt: now };
    expect(canAccessOpsControlCenter(owner)).toBe(true);
    expect(() => assertFinanceAccess(owner)).not.toThrow();
    expect(() => assertFinanceAccess({ ...owner, role: "subaccount" })).toThrow(OpsAccessError);
  });

  it("limits operators to assigned organizations", () => {
    expect(() => assertOrganizationAccess([assignment], "user_1", "org_1")).not.toThrow();
    expect(() => assertOrganizationAccess([assignment], "user_1", "org_2")).toThrowError(OpsAccessError);
    expect(() => assertOrganizationAccess([assignment], "user_2", "org_1")).toThrowError(OpsAccessError);
  });
});

describe("operations store", () => {
  it("supports client and task create, update and delete", async () => {
    const store = createMemoryOpsStore();
    const savedClient = await store.saveClient({ ...client, id: undefined });
    const createdTask = await store.saveTask({ ...task, id: undefined, clientId: savedClient.id });
    expect((await store.listTasks({ clientId: savedClient.id }))).toHaveLength(1);
    await store.saveTask({ ...createdTask, title: "修改后的任务" });
    expect((await store.getTask(createdTask.id))?.title).toBe("修改后的任务");
    expect(await store.deleteTask(createdTask.id)).toBe(true);
    expect(await store.listTasks()).toHaveLength(0);
  });

  it("creates and renews subscriptions", async () => {
    const store = createMemoryOpsStore();
    const subscription = await store.saveSubscription({
      id: undefined, serviceName: "Canva", accountNote: "", purchaseDate: "2026-01-01", expiryDate: "2026-07-31",
      price: 100, billingCycle: "年", autoRenew: false, usageNote: "", status: "使用中", notes: "",
    });
    expect((await store.renewSubscription(subscription.id, "2027-07-31"))?.expiryDate).toBe("2027-07-31");
  });
});

describe("operations reports and metrics", () => {
  it("builds weekly and monthly drafts only from real task and log records", () => {
    const weekly = buildOpsReportDraft("weekly", [task], [log]);
    expect(weekly).toContain("整理本周门店内容");
    expect(weekly).toContain("客户确认标题可用");
    expect(weekly).toContain("下周补充案例");
    const monthly = buildOpsReportDraft("monthly", [task], [log]);
    expect(monthly).toContain("公众号：1 项");
    expect(monthly).toContain("实际完成数量\n- 共 1 项");
  });

  it("calculates dashboard values from stored records", () => {
    const metrics = calculateOpsDashboardMetrics(
      [client],
      [{ id: "p1", clientId: client.id, billingMonth: "2026-07", expectedAmount: 5000, receivedAmount: 3000,
        dueDate: "2026-07-01", receivedDate: "", status: "部分收款", notes: "", createdAt: now, updatedAt: now }],
      [task],
      new Date(now),
    );
    expect(metrics).toMatchObject({ activeClients: 1, expectedThisMonth: 5000, receivedThisMonth: 3000, overdueAmount: 2000, tasksThisMonth: 1, completedTasks: 1 });
  });
});
