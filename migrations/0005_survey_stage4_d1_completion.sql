-- Phase 4 completion: local D1 write coverage for POS, periods, follow-ups, and exports.

CREATE TABLE IF NOT EXISTS survey_pos_sale_details (
  pos_sale_id TEXT PRIMARY KEY,
  remark TEXT,
  updated_by TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_period_details (
  period_id TEXT PRIMARY KEY,
  opened_by TEXT,
  opened_at TEXT,
  closed_by TEXT,
  closed_at TEXT,
  reopened_until TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_follow_up_details (
  follow_up_id TEXT PRIMARY KEY,
  warning_id TEXT,
  owner_name TEXT,
  deleted INTEGER NOT NULL DEFAULT 0,
  updated_by TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_survey_periods_status
  ON survey_monthly_periods (mall_id, period_month, status);

CREATE INDEX IF NOT EXISTS idx_survey_followups_period_status
  ON survey_follow_up_records (mall_id, period_month, status);

CREATE INDEX IF NOT EXISTS idx_survey_audit_logs_target
  ON survey_audit_logs (target_type, target_id, created_at);
