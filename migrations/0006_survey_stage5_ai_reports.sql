-- Phase 5: DeepSeek report generation, snapshots, report versions, and export audit support.

CREATE TABLE IF NOT EXISTS survey_ai_report_jobs (
  id TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  period_month TEXT,
  report_type TEXT NOT NULL,
  input_snapshot_json TEXT,
  desensitized_input_json TEXT,
  output_text TEXT,
  model_provider TEXT,
  model_name TEXT,
  status TEXT NOT NULL,
  error_message TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  elapsed_ms INTEGER,
  error_code TEXT,
  token_usage_json TEXT
);

CREATE TABLE IF NOT EXISTS survey_report_snapshots (
  id TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  period_month TEXT NOT NULL,
  report_type TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  desensitized_input_json TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_reports (
  id TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  period_month TEXT NOT NULL,
  report_type TEXT NOT NULL,
  snapshot_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  current_version_id TEXT,
  confirmed_version_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_report_versions (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  version_no INTEGER NOT NULL,
  version_kind TEXT NOT NULL,
  title TEXT NOT NULL,
  content_json TEXT NOT NULL,
  ai_raw_json TEXT,
  version_note TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (report_id, version_no)
);

CREATE INDEX IF NOT EXISTS idx_survey_reports_mall_month
  ON survey_reports (mall_id, period_month, report_type);
