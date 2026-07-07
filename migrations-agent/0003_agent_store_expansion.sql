-- Agent-only local store expansion. Apply to preview D1 first; do not run on production without approval.
ALTER TABLE profiles ADD COLUMN sourceChannel TEXT NOT NULL DEFAULT '其他';
ALTER TABLE applications ADD COLUMN sourceChannel TEXT NOT NULL DEFAULT '其他';

CREATE TABLE IF NOT EXISTS account_operation_logs (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  action TEXT NOT NULL,
  days INTEGER NOT NULL,
  note TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_account_operation_user_created
  ON account_operation_logs (userId, createdAt);
