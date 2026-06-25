-- Agent isolated D1 schema.
-- Source: src/lib/data/store-d1.ts ensureSchema at stage 6 freeze.

CREATE TABLE IF NOT EXISTS profiles (
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
);

CREATE TABLE IF NOT EXISTS applications (
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
);

CREATE TABLE IF NOT EXISTS generations (
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
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS store_profiles (
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
);

CREATE TABLE IF NOT EXISTS workbench_accounts (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  displayName TEXT NOT NULL,
  note TEXT NOT NULL,
  disabled INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workbench_generations (
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
);

CREATE INDEX IF NOT EXISTS idx_agent_generations_user_created ON generations (userId, createdAt);
CREATE INDEX IF NOT EXISTS idx_agent_applications_created ON applications (createdAt);
CREATE INDEX IF NOT EXISTS idx_agent_store_profiles_updated ON store_profiles (updatedAt);
CREATE INDEX IF NOT EXISTS idx_agent_workbench_generations_account_created ON workbench_generations (accountId, createdAt);

