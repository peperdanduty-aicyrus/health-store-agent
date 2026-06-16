export function isWorkbenchPublicTestEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.WORKBENCH_PUBLIC_TEST_ENABLED === "true";
}
