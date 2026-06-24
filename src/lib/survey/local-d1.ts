import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import type { SurveyD1DatabaseLike } from "./store-d1";

const execFileAsync = promisify(execFile);

export function createLocalSurveyD1Database(dbPath = path.join(process.cwd(), ".wrangler/state/v3/d1/survey-dev.sqlite")): SurveyD1DatabaseLike | null {
  if (!existsSync(dbPath)) {
    return null;
  }
  return {
    prepare(sql: string) {
      return new LocalD1PreparedStatement(dbPath, sql, []);
    },
  };
}

class LocalD1PreparedStatement {
  constructor(
    private readonly dbPath: string,
    private readonly sql: string,
    private readonly values: unknown[],
  ) {}

  bind(...values: unknown[]) {
    return new LocalD1PreparedStatement(this.dbPath, this.sql, values);
  }

  async all<T = unknown>(): Promise<{ results?: T[] }> {
    const { stdout } = await execFileAsync("sqlite3", ["-json", this.dbPath, this.materialize()]);
    const text = stdout.trim();
    return { results: text ? (JSON.parse(text) as T[]) : [] };
  }

  async first<T = unknown>(): Promise<T | null> {
    const rows = await this.all<T>();
    return rows.results?.[0] ?? null;
  }

  async run(): Promise<unknown> {
    await execFileAsync("sqlite3", [this.dbPath, this.materialize()]);
    return {};
  }

  private materialize() {
    let index = 0;
    return this.sql.replace(/\?/g, () => sqlLiteral(this.values[index++]));
  }
}

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }
  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}
