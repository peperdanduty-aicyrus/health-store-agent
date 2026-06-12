import { seedProfiles } from "./seed";
import type {
  CreateGenerationInput,
  CreateOpeningApplicationInput,
  CreateUserInput,
  GenerationFilter,
  GenerationRecord,
  Profile,
  OpeningApplication,
  OpeningApplicationStatus,
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

type ProfileRow = Omit<Profile, "disabled"> & { disabled: number };
type ApplicationRow = OpeningApplication;
type GenerationRow = Omit<GenerationRecord, "copied"> & { copied: number };

export async function createD1Store(db: D1DatabaseLike) {
  await ensureSchema(db);
  await ensureSeedAdmin(db);

  return {
    async createGeneration(input: CreateGenerationInput): Promise<GenerationRecord> {
      const record: GenerationRecord = {
        ...input,
        id: makeId("generation"),
        createdAt: new Date().toISOString(),
      };

      await db
        .prepare(
          `INSERT INTO generations (
            id, userId, phone, storeName, storeType, planName, generationType, projectName,
            targetCustomer, purpose, extraInfo, prompt, result, sensitiveCheckResult, copied,
            userNote, modelProvider, modelName, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          record.userNote,
          record.modelProvider,
          record.modelName,
          record.createdAt,
        )
        .run();

      return record;
    },

    async createOpeningApplication(input: CreateOpeningApplicationInput): Promise<OpeningApplication> {
      const now = new Date().toISOString();
      const application: OpeningApplication = {
        ...input,
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
            interestedFeatures, note, openedUserId, status, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        id: makeId("user"),
        createdAt: now,
        updatedAt: now,
      };

      await insertProfile(db, user);
      return user;
    },

    async getUserById(id: string): Promise<Profile | null> {
      const row = await db.prepare("SELECT * FROM profiles WHERE id = ?").bind(id).first<ProfileRow>();
      return row ? mapProfile(row) : null;
    },

    async listApplications(): Promise<OpeningApplication[]> {
      const { results = [] } = await db
        .prepare("SELECT * FROM applications ORDER BY createdAt DESC")
        .all<ApplicationRow>();
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

    async listUsers(): Promise<Profile[]> {
      const { results = [] } = await db.prepare("SELECT * FROM profiles ORDER BY createdAt DESC").all<ProfileRow>();
      return results.map(mapProfile);
    },

    async login(phone: string, password: string): Promise<Profile | null> {
      const row = await db
        .prepare("SELECT * FROM profiles WHERE phone = ? AND password = ? AND disabled = 0")
        .bind(phone, password)
        .first<ProfileRow>();
      return row ? mapProfile(row) : null;
    },

    async markGenerationCopied(id: string): Promise<GenerationRecord | null> {
      await db.prepare("UPDATE generations SET copied = 1 WHERE id = ?").bind(id).run();
      return getGenerationById(db, id);
    },

    async updateGenerationNote(id: string, userNote: string): Promise<GenerationRecord | null> {
      await db.prepare("UPDATE generations SET userNote = ? WHERE id = ?").bind(userNote, id).run();
      return getGenerationById(db, id);
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
      return db.prepare("SELECT * FROM applications WHERE id = ?").bind(id).first<ApplicationRow>();
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
        openedUserId TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`,
    )
    .run();

  await ensureColumn(db, "applications", "openedUserId", "TEXT NOT NULL DEFAULT ''");

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
        userNote TEXT NOT NULL,
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

async function insertProfile(db: D1DatabaseLike, user: Profile) {
  await db
    .prepare(
      `INSERT INTO profiles (
        id, phone, password, role, storeName, storeType, cityArea, mainProjects,
        storeAdvantages, planName, memberStatus, expiresAt, dailyLimit, disabled,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

async function getGenerationById(db: D1DatabaseLike, id: string): Promise<GenerationRecord | null> {
  const row = await db.prepare("SELECT * FROM generations WHERE id = ?").bind(id).first<GenerationRow>();
  return row ? mapGeneration(row) : null;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    ...row,
    disabled: Boolean(row.disabled),
  };
}

function mapGeneration(row: GenerationRow): GenerationRecord {
  return {
    ...row,
    copied: Boolean(row.copied),
  };
}

function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}
