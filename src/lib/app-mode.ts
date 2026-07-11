export type AppMode = "agent" | "mixed" | "survey";
export type AppEnv = "preview" | "production" | "test";

const agentPrefixes = ["/", "/login", "/demo", "/app", "/agent-admin", "/lvminglei", "/lvminglei-test", "/tutorial", "/cyrus"];
const surveyPrefixes = ["/", "/survey", "/yingyun", "/api/survey"];

export function getAppMode(value = process.env.APP_MODE): AppMode {
  if (value === "agent" || value === "survey") return value;
  return "mixed";
}

export function getAppEnv(value = process.env.APP_ENV): AppEnv {
  if (value === "production" || value === "preview") return value;
  return "test";
}

export function getAppMetadata(mode = getAppMode()) {
  if (mode === "survey") {
    return {
      description: "商场经营调研、营运跟进、预警和月度经营报告系统。",
      title: "商场经营调研系统",
    };
  }
  return {
    description: "门店线上运营、内容管理与 AI 搜索优化服务。",
    title: "门店线上运营与AI搜索优化",
  };
}

export function assertAgentMode() {
  if (getAppMode() === "survey") {
    throw new Error("agent_mode_required");
  }
}

export function assertSurveyMode() {
  if (getAppMode() === "agent") {
    throw new Error("survey_mode_required");
  }
}

export function canAccessPath(pathname: string, mode = getAppMode()) {
  const normalized = normalizePath(pathname);
  if (mode === "mixed") return true;
  if (mode === "agent") {
    if (isSurveyPath(normalized)) return false;
    if (normalized.startsWith("/cyrus/")) return false;
    return isAllowedByPrefixes(normalized, agentPrefixes);
  }
  if (isAgentPath(normalized)) return false;
  if (normalized === "/cyrus") return true;
  return isAllowedByPrefixes(normalized, surveyPrefixes);
}

export function getAgentRedirectPath(pathname: string, mode = getAppMode()) {
  return mode === "agent" && normalizePath(pathname) === "/cyrus" ? "/lvminglei" : null;
}

function isSurveyPath(pathname: string) {
  return pathname === "/survey" || pathname.startsWith("/survey/") ||
    pathname === "/yingyun" || pathname.startsWith("/yingyun/") ||
    pathname === "/api/survey" || pathname.startsWith("/api/survey/");
}

function isAgentPath(pathname: string) {
  return pathname === "/login" || pathname.startsWith("/login/") ||
    pathname === "/demo" || pathname.startsWith("/demo/") ||
    pathname === "/app" || pathname.startsWith("/app/") ||
    pathname === "/agent-admin" || pathname.startsWith("/agent-admin/") ||
    pathname.startsWith("/cyrus/") ||
    pathname === "/lvminglei" || pathname.startsWith("/lvminglei/") ||
    pathname === "/lvminglei-test" || pathname.startsWith("/lvminglei-test/") ||
    pathname === "/tutorial" || pathname.startsWith("/tutorial/");
}

function isAllowedByPrefixes(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || (prefix !== "/" && pathname.startsWith(`${prefix}/`)));
}

function normalizePath(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
}
