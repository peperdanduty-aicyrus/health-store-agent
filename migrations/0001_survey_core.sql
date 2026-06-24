-- Survey system phase 2 core schema.
-- This migration only creates survey-owned tables and does not alter legacy health-store-agent tables.

CREATE TABLE IF NOT EXISTS survey_malls (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_staff_accounts (
  id TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  login_name TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  display_name TEXT NOT NULL,
  enabled INTEGER NOT NULL,
  starts_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_staff_sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  session_token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_brands (
  id TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (mall_id, normalized_name)
);

CREATE TABLE IF NOT EXISTS survey_business_categories (
  id TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  enabled INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (mall_id, name)
);

CREATE TABLE IF NOT EXISTS survey_business_subcategories (
  id TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  enabled INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (category_id, name)
);

CREATE TABLE IF NOT EXISTS survey_stores (
  id TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  mall_name TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  store_name TEXT NOT NULL,
  store_code TEXT NOT NULL,
  floor TEXT NOT NULL,
  unit_no TEXT NOT NULL,
  display_location TEXT NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  subcategory_id TEXT,
  subcategory_name TEXT,
  contract_start_date TEXT,
  contract_end_date TEXT,
  area_sqm REAL,
  staff_count INTEGER,
  manager_name TEXT,
  contact_phone TEXT,
  operation_mode TEXT,
  chain_store INTEGER NOT NULL,
  operator_name TEXT,
  rent_mode TEXT,
  status TEXT NOT NULL,
  search_text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_store_aliases (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL,
  alias TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_form_fields (
  id TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  category_id TEXT,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  required INTEGER NOT NULL,
  unit TEXT,
  precision INTEGER,
  options_json TEXT,
  visible_rule_json TEXT,
  sort_order INTEGER NOT NULL,
  enabled INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_monthly_periods (
  id TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  period_month TEXT NOT NULL,
  status TEXT NOT NULL,
  normal_fill_starts_at TEXT,
  normal_fill_ends_at TEXT,
  reopened_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (mall_id, period_month)
);

CREATE TABLE IF NOT EXISTS survey_merchant_submissions (
  id TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  period_month TEXT NOT NULL,
  status TEXT NOT NULL,
  is_late INTEGER NOT NULL,
  first_submitted_at TEXT,
  last_modified_at TEXT,
  merchant_edit_until TEXT,
  merchant_edit_token_hash TEXT,
  submitted_by_name TEXT,
  submitted_by_phone TEXT,
  self_reported_sales_wan REAL,
  sales_target_wan REAL,
  member_recharge_wan REAL,
  no_local_peer_stores INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_submission_field_values (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  field_key TEXT NOT NULL,
  value_text TEXT,
  value_number REAL,
  value_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_city_peer_store_sales (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  mall_name TEXT NOT NULL,
  sales_wan REAL NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_submission_change_logs (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  field_key TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_pos_sales (
  id TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  period_month TEXT NOT NULL,
  sales_wan REAL,
  target_sales_wan REAL,
  source TEXT NOT NULL DEFAULT 'manual_entry',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (mall_id, store_id, period_month)
);

CREATE TABLE IF NOT EXISTS survey_monthly_store_metrics (
  id TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  period_month TEXT NOT NULL,
  effective_sales_wan REAL,
  sales_source TEXT,
  mom_rate REAL,
  yoy_rate REAL,
  mall_rank INTEGER,
  category_rank INTEGER,
  sales_per_sqm REAL,
  sales_per_staff REAL,
  target_completion_rate REAL,
  self_pos_diff_wan REAL,
  self_pos_diff_rate REAL,
  warning_flags_json TEXT,
  computed_at TEXT
);

CREATE TABLE IF NOT EXISTS survey_follow_up_records (
  id TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  period_month TEXT,
  follow_up_date TEXT,
  follow_up_method TEXT,
  follow_up_subject TEXT,
  store_feedback TEXT,
  next_action TEXT,
  next_follow_up_date TEXT,
  status TEXT NOT NULL,
  owner_account_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_audit_logs (
  id TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  detail_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

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
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_export_files (
  id TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  period_month TEXT,
  file_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_key TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_backup_jobs (
  id TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  backup_type TEXT NOT NULL,
  storage_key TEXT,
  status TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_survey_stores_mall_status ON survey_stores (mall_id, status);
CREATE INDEX IF NOT EXISTS idx_survey_stores_search ON survey_stores (search_text);
CREATE INDEX IF NOT EXISTS idx_survey_store_aliases_store ON survey_store_aliases (store_id);
CREATE INDEX IF NOT EXISTS idx_survey_audit_logs_created ON survey_audit_logs (created_at);
