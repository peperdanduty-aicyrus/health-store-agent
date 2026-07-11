import { chinaDate, currentChinaMonth } from "./date";
import type { OpsClient, OpsDashboardMetrics, OpsPayment, OpsTask } from "./types";

export function calculateOpsDashboardMetrics(
  clients: OpsClient[],
  payments: OpsPayment[],
  tasks: OpsTask[],
  now = new Date(),
): OpsDashboardMetrics {
  const today = chinaDate(now);
  const month = currentChinaMonth(now);
  const monthPayments = payments.filter((payment) => payment.billingMonth === month);
  const monthTasks = tasks.filter((task) => (task.scheduledDate || task.dueDate).startsWith(month));
  return {
    activeClients: clients.filter((client) => client.active && client.cooperationStatus === "合作中").length,
    expectedThisMonth: sum(monthPayments.map((payment) => payment.expectedAmount)),
    receivedThisMonth: sum(monthPayments.map((payment) => payment.receivedAmount)),
    overdueAmount: sum(
      payments
        .filter((payment) => payment.dueDate && payment.dueDate < today && payment.receivedAmount < payment.expectedAmount)
        .map((payment) => payment.expectedAmount - payment.receivedAmount),
    ),
    tasksThisMonth: monthTasks.length,
    completedTasks: monthTasks.filter((task) => ["已完成", "已交付", "已发布"].includes(task.status)).length,
    pendingTasks: monthTasks.filter((task) => ["待生成", "待处理"].includes(task.status)).length,
  };
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}
