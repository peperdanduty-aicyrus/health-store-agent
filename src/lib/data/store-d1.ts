import { seedProfiles, seedWorkbenchAccounts } from "./seed";
import { normalizeGenerationDiagnostics } from "./generation-diagnostics";
import { normalizeSourceChannel, normalizeStoreType } from "../domain/store-types";
import type {
  AccountOperationLog,
  CreateGenerationInput,
  CreateOpeningApplicationInput,
  CreateUserInput,
  CreateWorkbenchAccountInput,
  CreateWorkbenchGenerationInput,
  GenerationFilter,
  GenerationRecord,
  Profile,
  OpeningApplication,
  OpeningApplicationStatus,
  StoreProfileRecord,
  UpsertStoreProfileInput,
  WorkbenchAccount,
  WorkbenchGenerationFilter,
  WorkbenchGenerationRecord,
} from "./types";

export type D1DatabaseLike = {
  prepare(sql: string): D1PreparedStatementLike;
};

type D1PreparedStatementLike = {
  all<T = unknown>(): Promise<{ results?: T[] }>;
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<unknown>;
};

type ProfileRow = Omit<Profile, "disabled" | "sourceChannel"> & { disabled: number; sourceChannel?: string | null };
type ApplicationRow = Omit<OpeningApplication, "sourceChannel"> & { sourceChannel?: string | null };
type AccountOperationLogRow = AccountOperationLog;
type GenerationRow = Omit<
  GenerationRecord,
  | "copied"
  | "usedStoreProfile"
  | "status"
  | "rawResponse"
  | "cleanedContent"
  | "errorCode"
  | "errorMessage"
  | "requestId"
  | "finishReason"
  | "tokenUsage"
  | "elapsedMs"
  | "promptVersion"
> & {
  copied: number;
  usedStoreProfile?: number;
  status?: string | null;
  raw_response?: string | null;
  cleaned_content?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  request_id?: string | null;
  finish_reason?: string | null;
  token_usage?: string | null;
  elapsed_ms?: number | null;
  prompt_version?: string | null;
};
type StoreProfileRow = StoreProfileRecord;
type WorkbenchAccountRow = Omit<WorkbenchAccount, "disabled"> & { disabled: number };
type WorkbenchGenerationRow = Omit<WorkbenchGenerationRecord, "copied"> & { copied: number };

export async function createD1Store(db: D1DatabaseLike) {
  await ensureSchema(db);
  await ensureSeedAdmin(db);
  await ensureSeedWorkbenchOwner(db);

  return {
    async createGeneration(input: CreateGenerationInput): Promise<GenerationRecord> {
      const record: GenerationRecord = {
        ...input,
        ...normalizeGenerationDiagnostics(input),
        id: makeId("generation"),
        createdAt: new Date().toISOString(),
      };

      await db
        .prepare(
          `INSERT INTO generations (
            id, userId, phone, storeName, storeType, planName, generationType, projectName,
            targetCustomer, purpose, extraInfo, prompt, result, sensitiveCheckResult, copied, usedStoreProfile,
            userNote, modelProvider, modelName, status, raw_response, cleaned_content, error_code, error_message,
            request_id, finish_reason, token_usage, elapsed_ms, prompt_version, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          record.id,
          record.userId,
          record.phone,
          record.storeName,
          record.storeType,
          record.planName,
          record.generationType,
          record.projectName,
          record.targetCustomer,
          record.purpose,
          record.extraInfo,
          record.prompt,
          record.result,
          record.sensitiveCheckResult,
          record.copied ? 1 : 0,
          record.usedStoreProfile ? 1 : 0,
          record.userNote,
          record.modelProvider,
          record.modelName,
          record.status,
          record.rawResponse,
          record.cleanedContent,
          record.errorCode,
          record.errorMessage,
          record.requestId,
          record.finishReason,
          record.tokenUsage,
          record.elapsedMs,
          record.promptVersion,
          record.createdAt,
        )
        .run();

      return record;
    },

    async createOpeningApplication(input: CreateOpeningApplicationInput): Promise<OpeningApplication> {
      const now = new Date().toISOString();
      const application: OpeningApplication = {
        ...input,
        sourceChannel: normalizeSourceChannel(input.sourceChannel),
        storeType: normalizeStoreType(input.storeType),
        id: makeId("application"),
        openedUserId: "",
        status: "new",
        createdAt: now,
        updatedAt: now,
      };

      await db
        .prepare(
          `INSERT INTO applications (
            id, storeName, storeType, cityArea, contactName, phone, wechatId,
            interestedFeatures, note, sourceChannel, openedUserId, status, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          application.id,
          application.storeName,
          application.storeType,
          application.cityArea,
          application.contactName,
          application.phone,
          application.wechatId,
          application.interestedFeatures,
          application.note,
          application.sourceChannel,
          application.openedUserId,
          application.status,
          application.createdAt,
          application.updatedAt,
        )
        .run();

      return application;
    },

    async createUser(input: CreateUserInput): Promise<Profile> {
      const now = new Date().toISOString();
      const user: Profile = {
        ...input,
        sourceChannel: normalizeSourceChannel(input.sourceChannel),
        storeType: normalizeStoreType(input.storeType),
        id: makeId("user"),
        createdAt: now,
        updatedAt: now,
      };

      await insertProfile(db, user);
      return user;
    },

    async createWorkbenchAccount(input: CreateWorkbenchAccountInput): Promise<WorkbenchAccount> {
      const now = new Date().toISOString();
      const account: WorkbenchAccount = {
        ...input,
        id: makeId("workbench_account"),
        createdAt: now,
        updatedAt: now,
      };

      await insertWorkbenchAccount(db, account);
      return account;
    },

    async createWorkbenchGeneration(input: CreateWorkbenchGenerationInput): Promise<WorkbenchGenerationRecord> {
      const record: WorkbenchGenerationRecord = {
        ...input,
        id: makeId("workbench_generation"),
        createdAt: new Date().toISOString(),
      };

      await db
        .prepare(
          `INSERT INTO workbench_generations (
            id, accountId, accountPhone, accountDisplayName, generationType, input,
            output, copied, prompt, modelProvider, modelName, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          record.id,
          record.accountId,
          record.accountPhone,
          record.accountDisplayName,
          record.generationType,
          record.input,
          record.output,
          record.copied ? 1 : 0,
          record.prompt,
          record.modelProvider,
          record.modelName,
          record.createdAt,
        )
        .run();

      return record;
    },

    async upsertStoreProfile(input: UpsertStoreProfileInput): Promise<StoreProfileRecord> {
      const now = new Date().toISOString();
      const existing = await getStoreProfileByUserId(db, input.userId);
      const record: StoreProfileRecord = existing
        ? { ...existing, ...input, updatedAt: now }
        : {
            ...input,
            id: makeId("store_profile"),
            createdAt: now,
            updatedAt: now,
          };

      if (existing) {
        await db
          .prepare(
            `UPDATE store_profiles
             SET storeName = ?, pdfFileName = ?, pdfFilePath = ?, extractedTextPreview = ?,
                 extractedText = ?, profileSummary = ?, uploadBy = ?, updatedAt = ?
             WHERE userId = ?`,
          )
          .bind(
            record.storeName,
            record.pdfFileName,
            record.pdfFilePath,
            record.extractedTextPreview,
            record.extractedText,
            record.profileSummary,
            record.uploadBy,
            record.updatedAt,
            record.userId,
          )
          .run();
      } else {
        await db
          .prepare(
            `INSERT INTO store_profiles (
              id, userId, storeName, pdfFileName, pdfFilePath, extractedTextPreview,
              extractedText, profileSummary, uploadBy, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            record.id,
            record.userId,
            record.storeName,
            record.pdfFileName,
            record.pdfFilePath,
            record.extractedTextPreview,
            record.extractedText,
            record.profileSummary,
            record.uploadBy,
            record.createdAt,
            record.updatedAt,
          )
          .run();
      }

      return record;
    },

    async deleteAllGenerations(): Promise<number> {
      const countRow = await db.prepare("SELECT COUNT(*) as count FROM generations").first<{ count: number }>();
      await db.prepare("DELETE FROM generations").run();
      return Number(countRow?.count ?? 0);
    },

    async deleteGeneration(id: string): Promise<boolean> {
      const existing = await getGenerationById(db, id);
      if (!existing) {
        return false;
      }
      await db.prepare("DELETE FROM generations WHERE id = ?").bind(id).run();
      return true;
    },

    async deleteOpeningApplication(id: string): Promise<boolean> {
      const existing = await db.prepare("SELECT id FROM applications WHERE id = ?").bind(id).first<{ id: string }>();
      if (!existing) {
        return false;
      }
      await db.prepare("DELETE FROM applications WHERE id = ?").bind(id).run();
      return true;
    },

    async deleteStoreProfile(userId: string): Promise<boolean> {
      const existing = await getStoreProfileByUserId(db, userId);
      if (!existing) {
        return false;
      }
      await db.prepare("DELETE FROM store_profiles WHERE userId = ?").bind(userId).run();
      return true;
    },

    async deleteWorkbenchGeneration(id: string): Promise<boolean> {
      const existing = await getWorkbenchGenerationById(db, id);
      if (!existing) {
        return false;
      }
      await db.prepare("DELETE FROM workbench_generations WHERE id = ?").bind(id).run();
      return true;
    },

    async getGenerationById(id: string): Promise<GenerationRecord | null> {
      return getGenerationById(db, id);
    },

    async getStoreProfileByUserId(userId: string): Promise<StoreProfileRecord | null> {
      return getStoreProfileByUserId(db, userId);
    },

    async getUserById(id: string): Promise<Profile | null> {
      const row = await db.prepare("SELECT * FROM profiles WHERE id = ?").bind(id).first<ProfileRow>();
      return row ? mapProfile(row) : null;
    },

    async getWorkbenchAccountById(id: string): Promise<WorkbenchAccount | null> {
      const row = await db.prepare("SELECT * FROM workbench_accounts WHERE id = ?").bind(id).first<WorkbenchAccountRow>();
      return row ? mapWorkbenchAccount(row) : null;
    },

    async getWorkbenchGenerationById(id: string): Promise<WorkbenchGenerationRecord | null> {
      return getWorkbenchGenerationById(db, id);
    },

    async listApplications(): Promise<OpeningApplication[]> {
      const { results = [] } = await db
        .prepare("SELECT * FROM applications ORDER BY createdAt DESC")
        .all<ApplicationRow>();
      return results.map(mapApplication);
    },

    async listAccountOperationLogs(userId?: string): Promise<AccountOperationLog[]> {
      const statement = userId
        ? db.prepare("SELECT * FROM account_operation_logs WHERE userId = ? ORDER BY createdAt DESC").bind(userId)
        : db.prepare("SELECT * FROM account_operation_logs ORDER BY createdAt DESC");
      const { results = [] } = await statement.all<AccountOperationLogRow>();
      return results;
    },

    async listGenerations(filter: GenerationFilter = {}): Promise<GenerationRecord[]> {
      const conditions: string[] = [];
      const values: string[] = [];

      if (filter.userId) {
        conditions.push("userId = ?");
        values.push(filter.userId);
      }
      if (filter.generationType) {
        conditions.push("generationType = ?");
        values.push(filter.generationType);
      }
      if (filter.planName) {
        conditions.push("planName = ?");
        values.push(filter.planName);
      }
      if (filter.storeType) {
        conditions.push("storeType = ?");
        values.push(filter.storeType);
      }

      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
      const { results = [] } = await db
        .prepare(`SELECT * FROM generations ${where} ORDER BY createdAt DESC`)
        .bind(...values)
        .all<GenerationRow>();

      return results.map(mapGeneration);
    },

    async listStoreProfiles(): Promise<StoreProfileRecord[]> {
      const { results = [] } = await db
        .prepare("SELECT * FROM store_profiles ORDER BY updatedAt DESC")
        .all<StoreProfileRow>();
      return results;
    },

    async listUsers(): Promise<Profile[]> {
      const { results = [] } = await db.prepare("SELECT * FROM profiles ORDER BY createdAt DESC").all<ProfileRow>();
      return results.map(mapProfile);
    },

    async listWorkbenchAccounts(): Promise<WorkbenchAccount[]> {
      const { results = [] } = await db
        .prepare("SELECT * FROM workbench_accounts ORDER BY role ASC, createdAt DESC")
        .all<WorkbenchAccountRow>();
      return results.map(mapWorkbenchAccount);
    },

    async listWorkbenchGenerations(filter: WorkbenchGenerationFilter = {}): Promise<WorkbenchGenerationRecord[]> {
      const conditions: string[] = [];
      const values: string[] = [];

      if (filter.accountId) {
        conditions.push("accountId = ?");
        values.push(filter.accountId);
      }
      if (filter.generationType) {
        conditions.push("generationType = ?");
        values.push(filter.generationType);
      }

      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
      const { results = [] } = await db
        .prepare(`SELECT * FROM workbench_generations ${where} ORDER BY createdAt DESC`)
        .bind(...values)
        .all<WorkbenchGenerationRow>();

      return results.map(mapWorkbenchGeneration);
    },

    async login(phone: string, password: string): Promise<Profile | null> {
      const row = await db
        .prepare("SELECT * FROM profiles WHERE phone = ? AND password = ? AND disabled = 0")
        .bind(phone, password)
        .first<ProfileRow>();
      return row ? mapProfile(row) : null;
    },

    async loginWorkbenchAccount(phone: string, password: string): Promise<WorkbenchAccount | null> {
      const row = await db
        .prepare("SELECT * FROM workbench_accounts WHERE phone = ? AND password = ? AND disabled = 0")
        .bind(phone, password)
        .first<WorkbenchAccountRow>();
      return row ? mapWorkbenchAccount(row) : null;
    },

    async markGenerationCopied(id: string): Promise<GenerationRecord | null> {
      await db.prepare("UPDATE generations SET copied = 1 WHERE id = ?").bind(id).run();
      return getGenerationById(db, id);
    },

    async markWorkbenchGenerationCopied(id: string): Promise<WorkbenchGenerationRecord | null> {
      await db.prepare("UPDATE workbench_generations SET copied = 1 WHERE id = ?").bind(id).run();
      return getWorkbenchGenerationById(db, id);
    },

    async updateGenerationNote(id: string, userNote: string): Promise<GenerationRecord | null> {
      await db.prepare("UPDATE generations SET userNote = ? WHERE id = ?").bind(userNote, id).run();
      return getGenerationById(db, id);
    },

    async updateStoreProfileSummary(userId: string, profileSummary: string): Promise<StoreProfileRecord | null> {
      await db
        .prepare("UPDATE store_profiles SET profileSummary = ?, updatedAt = ? WHERE userId = ?")
        .bind(profileSummary, new Date().toISOString(), userId)
        .run();
      return getStoreProfileByUserId(db, userId);
    },

    async updateOpeningApplicationStatus(
      id: string,
      status: OpeningApplicationStatus,
      openedUserId = "",
    ): Promise<OpeningApplication | null> {
      await db
        .prepare(
          `UPDATE applications
           SET status = ?,
               openedUserId = CASE WHEN ? = '' THEN openedUserId ELSE ? END,
               updatedAt = ?
           WHERE id = ?`,
        )
        .bind(status, openedUserId, openedUserId, new Date().toISOString(), id)
        .run();
      const row = await db.prepare("SELECT * FROM applications WHERE id = ?").bind(id).first<ApplicationRow>();
      return row ? mapApplication(row) : null;
    },

    async updateUserDisabled(id: string, disabled: boolean): Promise<Profile | null> {
      await db
        .prepare("UPDATE profiles SET disabled = ?, updatedAt = ? WHERE id = ? AND role = 'user'")
        .bind(disabled ? 1 : 0, new Date().toISOString(), id)
        .run();
      const row = await db.prepare("SELECT * FROM profiles WHERE id = ?").bind(id).first<ProfileRow>();
      return row?.role === "user" ? mapProfile(row) : null;
    },

    async updateUserPassword(id: string, password: string): Promise<Profile | null> {
      await db.prepare("UPDATE profiles SET password = ?, updatedAt = ? WHERE id = ?").bind(password, new Date().toISOString(), id).run();
      const row = await db.prepare("SELECT * FROM profiles WHERE id = ?").bind(id).first<ProfileRow>();
      return row ? mapProfile(row) : null;
    },

    async extendUserExpiryByDays(id: string, days: number, note: string): Promise<Profile | null> {
      const row = await db.prepare("SELECT * FROM profiles WHERE id = ? AND role = 'user'").bind(id).first<ProfileRow>();
      if (!row) return null;
      const expiresAt = addDays(row.expiresAt, days);
      const now = new Date().toISOString();
      await db.prepare("UPDATE profiles SET expiresAt = ?, updatedAt = ? WHERE id = ?").bind(expiresAt, now, id).run();
      await db
        .prepare(
          "INSERT INTO account_operation_logs (id, userId, action, days, note, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(makeId("account_operation"), id, "good_review_extension", days, note, now)
        .run();
      const updated = await db.prepare("SELECT * FROM profiles WHERE id = ?").bind(id).first<ProfileRow>();
      return updated ? mapProfile(updated) : null;
    },

    async updateWorkbenchAccountDisabled(id: string, disabled: boolean): Promise<WorkbenchAccount | null> {
      await db
        .prepare("UPDATE workbench_accounts SET disabled = ?, updatedAt = ? WHERE id = ? AND role = 'subaccount'")
        .bind(disabled ? 1 : 0, new Date().toISOString(), id)
        .run();
      const row = await db.prepare("SELECT * FROM workbench_accounts WHERE id = ?").bind(id).first<WorkbenchAccountRow>();
      return row ? mapWorkbenchAccount(row) : null;
    },

    async updateWorkbenchAccountPassword(id: string, password: string): Promise<WorkbenchAccount | null> {
      await db
        .prepare("UPDATE workbench_accounts SET password = ?, updatedAt = ? WHERE id = ?")
        .bind(password, new Date().toISOString(), id)
        .run();
      const row = await db.prepare("SELECT * FROM workbench_accounts WHERE id = ?").bind(id).first<WorkbenchAccountRow>();
      return row ? mapWorkbenchAccount(row) : null;
    },
  };
}

async function ensureSchema(db: D1DatabaseLike) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        phone TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        storeName TEXT NOT NULL,
        storeType TEXT NOT NULL,
        cityArea TEXT NOT NULL,
        mainProjects TEXT NOT NULL,
        storeAdvantages TEXT NOT NULL,
        sourceChannel TEXT NOT NULL DEFAULT '其他',
        planName TEXT NOT NULL,
        memberStatus TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        dailyLimit INTEGER NOT NULL,
        disabled INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`,
    )
    .run();

  await ensureColumn(db, "profiles", "sourceChannel", "TEXT NOT NULL DEFAULT '其他'");

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        storeName TEXT NOT NULL,
        storeType TEXT NOT NULL,
        cityArea TEXT NOT NULL,
        contactName TEXT NOT NULL,
        phone TEXT NOT NULL,
        wechatId TEXT NOT NULL,
        interestedFeatures TEXT NOT NULL,
        note TEXT NOT NULL,
        sourceChannel TEXT NOT NULL DEFAULT '其他',
        openedUserId TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`,
    )
    .run();

  await ensureColumn(db, "applications", "openedUserId", "TEXT NOT NULL DEFAULT ''");
  await ensureColumn(db, "applications", "sourceChannel", "TEXT NOT NULL DEFAULT '其他'");

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS account_operation_logs (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        action TEXT NOT NULL,
        days INTEGER NOT NULL,
        note TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )`,
    )
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS generations (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        phone TEXT NOT NULL,
        storeName TEXT NOT NULL,
        storeType TEXT NOT NULL,
        planName TEXT NOT NULL,
        generationType TEXT NOT NULL,
        projectName TEXT NOT NULL,
        targetCustomer TEXT NOT NULL,
        purpose TEXT NOT NULL,
        extraInfo TEXT NOT NULL,
        prompt TEXT NOT NULL,
        result TEXT NOT NULL,
        sensitiveCheckResult TEXT NOT NULL,
        copied INTEGER NOT NULL,
        usedStoreProfile INTEGER NOT NULL DEFAULT 0,
        userNote TEXT NOT NULL,
        modelProvider TEXT NOT NULL,
        modelName TEXT NOT NULL,
        status TEXT,
        raw_response TEXT,
        cleaned_content TEXT,
        error_code TEXT,
        error_message TEXT,
        request_id TEXT,
        finish_reason TEXT,
        token_usage TEXT,
        elapsed_ms INTEGER,
        prompt_version TEXT,
        createdAt TEXT NOT NULL
      )`,
	    )
	    .run();

  await ensureColumn(db, "generations", "usedStoreProfile", "INTEGER NOT NULL DEFAULT 0");

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS store_profiles (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL UNIQUE,
        storeName TEXT NOT NULL,
        pdfFileName TEXT NOT NULL,
        pdfFilePath TEXT NOT NULL,
        extractedTextPreview TEXT NOT NULL,
        extractedText TEXT NOT NULL,
        profileSummary TEXT NOT NULL,
        uploadBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`,
    )
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS workbench_accounts (
        id TEXT PRIMARY KEY,
        phone TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        displayName TEXT NOT NULL,
        note TEXT NOT NULL,
        disabled INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`,
    )
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS workbench_generations (
        id TEXT PRIMARY KEY,
        accountId TEXT NOT NULL,
        accountPhone TEXT NOT NULL,
        accountDisplayName TEXT NOT NULL,
        generationType TEXT NOT NULL,
        input TEXT NOT NULL,
        output TEXT NOT NULL,
        copied INTEGER NOT NULL,
        prompt TEXT NOT NULL,
        modelProvider TEXT NOT NULL,
        modelName TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )`,
    )
    .run();
}

async function ensureColumn(db: D1DatabaseLike, tableName: string, columnName: string, definition: string) {
  try {
    await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
  } catch {
    // Existing D1 databases already have the column after the first deploy.
  }
}

async function ensureSeedAdmin(db: D1DatabaseLike) {
  const admin = seedProfiles.find((profile) => profile.role === "admin");
  if (!admin) {
    return;
  }

  const existing = await db.prepare("SELECT id FROM profiles WHERE id = ?").bind(admin.id).first();
  if (!existing) {
    await insertProfile(db, admin);
  }
}

async function ensureSeedWorkbenchOwner(db: D1DatabaseLike) {
  const owner = seedWorkbenchAccounts.find((account) => account.role === "owner");
  if (!owner || !owner.phone || !owner.password) {
    return;
  }

  const existing = await db.prepare("SELECT id FROM workbench_accounts WHERE role = 'owner'").first();
  if (!existing) {
    await insertWorkbenchAccount(db, owner);
  }
}

async function insertProfile(db: D1DatabaseLike, user: Profile) {
  await db
    .prepare(
      `INSERT INTO profiles (
        id, phone, password, role, storeName, storeType, cityArea, mainProjects,
        storeAdvantages, sourceChannel, planName, memberStatus, expiresAt, dailyLimit, disabled,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      user.id,
      user.phone,
      user.password,
      user.role,
      user.storeName,
      user.storeType,
      user.cityArea,
      user.mainProjects,
      user.storeAdvantages,
      user.sourceChannel,
      user.planName,
      user.memberStatus,
      user.expiresAt,
      user.dailyLimit,
      user.disabled ? 1 : 0,
      user.createdAt,
      user.updatedAt,
    )
    .run();
}

async function insertWorkbenchAccount(db: D1DatabaseLike, account: WorkbenchAccount) {
  await db
    .prepare(
      `INSERT INTO workbench_accounts (
        id, phone, password, role, displayName, note, disabled, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      account.id,
      account.phone,
      account.password,
      account.role,
      account.displayName,
      account.note,
      account.disabled ? 1 : 0,
      account.createdAt,
      account.updatedAt,
    )
    .run();
}

async function getGenerationById(db: D1DatabaseLike, id: string): Promise<GenerationRecord | null> {
  const row = await db.prepare("SELECT * FROM generations WHERE id = ?").bind(id).first<GenerationRow>();
  return row ? mapGeneration(row) : null;
}

async function getStoreProfileByUserId(db: D1DatabaseLike, userId: string): Promise<StoreProfileRecord | null> {
  return db.prepare("SELECT * FROM store_profiles WHERE userId = ?").bind(userId).first<StoreProfileRow>();
}

async function getWorkbenchGenerationById(db: D1DatabaseLike, id: string): Promise<WorkbenchGenerationRecord | null> {
  const row = await db
    .prepare("SELECT * FROM workbench_generations WHERE id = ?")
    .bind(id)
    .first<WorkbenchGenerationRow>();
  return row ? mapWorkbenchGeneration(row) : null;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    ...row,
    disabled: Boolean(row.disabled),
    sourceChannel: normalizeSourceChannel(row.sourceChannel),
    storeType: normalizeStoreType(row.storeType),
  };
}

function mapApplication(row: ApplicationRow): OpeningApplication {
  return {
    ...row,
    sourceChannel: normalizeSourceChannel(row.sourceChannel),
    storeType: normalizeStoreType(row.storeType),
  };
}

function mapGeneration(row: GenerationRow): GenerationRecord {
  const status = row.status === "success" || row.status === "failed" ? row.status : "legacy";
  return {
    ...row,
    copied: Boolean(row.copied),
    usedStoreProfile: Boolean(row.usedStoreProfile),
    status,
    rawResponse: row.raw_response ?? "",
    cleanedContent: row.cleaned_content ?? "",
    errorCode: row.error_code ?? "",
    errorMessage: row.error_message ?? "",
    requestId: row.request_id ?? "",
    finishReason: row.finish_reason ?? "",
    tokenUsage: row.token_usage ?? "",
    elapsedMs: row.elapsed_ms ?? null,
    promptVersion: row.prompt_version ?? "",
  };
}

function mapWorkbenchAccount(row: WorkbenchAccountRow): WorkbenchAccount {
  return {
    ...row,
    disabled: Boolean(row.disabled),
  };
}

function mapWorkbenchGeneration(row: WorkbenchGenerationRow): WorkbenchGenerationRecord {
  return {
    ...row,
    copied: Boolean(row.copied),
  };
}

function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
