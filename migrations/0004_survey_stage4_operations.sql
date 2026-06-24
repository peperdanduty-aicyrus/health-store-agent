-- Phase 4 operations backend compatibility.

CREATE INDEX IF NOT EXISTS idx_survey_stores_store_code ON survey_stores (store_code);
CREATE INDEX IF NOT EXISTS idx_survey_stores_subcategory ON survey_stores (subcategory_name);
CREATE INDEX IF NOT EXISTS idx_survey_pos_sales_period ON survey_pos_sales (mall_id, period_month);
CREATE INDEX IF NOT EXISTS idx_survey_metrics_period ON survey_monthly_store_metrics (mall_id, period_month);

CREATE TABLE IF NOT EXISTS survey_store_stage4_profiles (
  store_id TEXT PRIMARY KEY,
  subcategory_name TEXT NOT NULL,
  form_category_code TEXT NOT NULL,
  area_sqm REAL,
  staff_count INTEGER,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS survey_monthly_metric_snapshots (
  id TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  period_month TEXT NOT NULL,
  area_sqm_snapshot REAL,
  staff_count_snapshot INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (store_id, period_month)
);

CREATE TABLE IF NOT EXISTS survey_warning_records (
  id TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  period_month TEXT NOT NULL,
  warning_code TEXT NOT NULL,
  warning_name TEXT NOT NULL,
  severity TEXT NOT NULL,
  detail_json TEXT NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (store_id, period_month, warning_code)
);
