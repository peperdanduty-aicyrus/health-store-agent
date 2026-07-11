import type { OpsReportType, OpsTask, OpsTaskLog } from "./types";

export function buildOpsReportDraft(
  reportType: OpsReportType,
  tasks: OpsTask[],
  logs: OpsTaskLog[],
): string {
  const completed = tasks.filter((task) => ["已完成", "已交付", "已发布"].includes(task.status));
  const delivered = tasks.filter((task) => task.status === "已交付");
  const published = tasks.filter((task) => task.status === "已发布");
  const unfinished = tasks.filter((task) => ["待生成", "待处理"].includes(task.status));
  const feedback = logs.filter((log) => log.logType === "客户反馈");
  const temporary = logs.filter((log) => log.logType === "临时任务");
  const nextActions = logs.map((log) => log.nextAction).filter(Boolean);

  if (reportType === "weekly") {
    return [
      section("本周完成事项", completed.map(taskLine)),
      section("已交付内容", delivered.map(taskLine)),
      section("已发布内容", published.map(taskLine)),
      section("临时处理事项", temporary.map(logLine)),
      section("客户反馈", feedback.map(logLine)),
      section("未完成事项", unfinished.map(taskLine)),
      section("下周计划", nextActions),
    ].join("\n\n");
  }

  const platforms = countBy(tasks.map((task) => task.relatedPlatform || "未指定平台"));
  return [
    `## 本月约定任务\n- 共 ${tasks.length} 项`,
    `## 实际完成数量\n- 共 ${completed.length} 项`,
    section("各平台完成情况", Object.entries(platforms).map(([platform, count]) => `${platform}：${count} 项`)),
    section("主要工作内容", tasks.map(taskLine)),
    section("已交付内容", delivered.map(taskLine)),
    section("已发布内容", published.map(taskLine)),
    section("客户反馈", feedback.map(logLine)),
    section("未完成事项", unfinished.map(taskLine)),
    section("下月工作重点", nextActions),
  ].join("\n\n");
}

function section(title: string, lines: string[]) {
  return `## ${title}\n${lines.length ? lines.map((line) => `- ${line}`).join("\n") : "- 暂无记录"}`;
}

function taskLine(task: OpsTask) {
  return `${task.title}${task.relatedPlatform ? `（${task.relatedPlatform}）` : ""}`;
}

function logLine(log: OpsTaskLog) {
  return log.content;
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((result, value) => {
    result[value] = (result[value] ?? 0) + 1;
    return result;
  }, {});
}
