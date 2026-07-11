-- Agent operations control center phase 1.
-- Additive only: all legacy Agent tables and data remain untouched.

CREATE TABLE IF NOT EXISTS ops_clients (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  brand_name TEXT NOT NULL DEFAULT '',
  industry TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  service_area TEXT NOT NULL DEFAULT '',
  contact_name TEXT NOT NULL DEFAULT '',
  contact_method TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  company_intro TEXT NOT NULL DEFAULT '',
  main_business TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT '',
  business_hours TEXT NOT NULL DEFAULT '',
  customer_source TEXT NOT NULL DEFAULT '',
  cooperation_status TEXT NOT NULL DEFAULT '合作中',
  notes TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_organizations (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  organization_type TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_service_agreements (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE,
  service_start_date TEXT NOT NULL DEFAULT '',
  service_end_date TEXT NOT NULL DEFAULT '',
  monthly_fee REAL NOT NULL DEFAULT 0,
  settlement_day INTEGER NOT NULL DEFAULT 1,
  expected_amount REAL NOT NULL DEFAULT 0,
  paid_amount REAL NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT '待收款',
  delivery_method TEXT NOT NULL DEFAULT '',
  service_scope TEXT NOT NULL DEFAULT '',
  monthly_tasks TEXT NOT NULL DEFAULT '',
  weekly_tasks TEXT NOT NULL DEFAULT '',
  important_agreements TEXT NOT NULL DEFAULT '',
  renewal_probability TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_tasks (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  title TEXT NOT NULL,
  task_type TEXT NOT NULL DEFAULT '临时待办',
  description TEXT NOT NULL DEFAULT '',
  scheduled_date TEXT NOT NULL DEFAULT '',
  due_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '待处理',
  priority TEXT NOT NULL DEFAULT '普通',
  assigned_user_id TEXT NOT NULL DEFAULT '',
  related_platform TEXT NOT NULL DEFAULT '',
  keyword TEXT NOT NULL DEFAULT '',
  completed_at TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_task_logs (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL DEFAULT '',
  client_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '',
  log_type TEXT NOT NULL DEFAULT '工作记录',
  content TEXT NOT NULL,
  next_action TEXT NOT NULL DEFAULT '',
  created_by_user_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_payments (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  billing_month TEXT NOT NULL,
  expected_amount REAL NOT NULL DEFAULT 0,
  received_amount REAL NOT NULL DEFAULT 0,
  due_date TEXT NOT NULL DEFAULT '',
  received_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '待收款',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_subscriptions (
  id TEXT PRIMARY KEY,
  service_name TEXT NOT NULL,
  account_note TEXT NOT NULL DEFAULT '',
  purchase_date TEXT NOT NULL DEFAULT '',
  expiry_date TEXT NOT NULL DEFAULT '',
  price REAL NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT '',
  auto_renew INTEGER NOT NULL DEFAULT 0,
  usage_note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '使用中',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_operator_assignments (
  id TEXT PRIMARY KEY,
  assigned_user_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  generation_limit INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (assigned_user_id, organization_id)
);

CREATE TABLE IF NOT EXISTS ops_content_profiles (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL UNIQUE,
  detailed_intro TEXT NOT NULL DEFAULT '',
  services TEXT NOT NULL DEFAULT '',
  real_advantages TEXT NOT NULL DEFAULT '',
  team_info TEXT NOT NULL DEFAULT '',
  qualifications TEXT NOT NULL DEFAULT '',
  faq TEXT NOT NULL DEFAULT '',
  audience_concerns TEXT NOT NULL DEFAULT '',
  writing_style TEXT NOT NULL DEFAULT '',
  prohibited_claims TEXT NOT NULL DEFAULT '',
  banned_words TEXT NOT NULL DEFAULT '',
  reference_accounts TEXT NOT NULL DEFAULT '',
  keywords TEXT NOT NULL DEFAULT '',
  used_keywords TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_reports (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  organization_id TEXT NOT NULL DEFAULT '',
  report_type TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '草稿',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ops_organizations_client ON ops_organizations (client_id, active);
CREATE INDEX IF NOT EXISTS idx_ops_tasks_schedule ON ops_tasks (scheduled_date, due_date, status);
CREATE INDEX IF NOT EXISTS idx_ops_tasks_org ON ops_tasks (organization_id, assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_ops_task_logs_client ON ops_task_logs (client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ops_payments_month ON ops_payments (billing_month, status);
CREATE INDEX IF NOT EXISTS idx_ops_subscriptions_expiry ON ops_subscriptions (expiry_date, status);
CREATE INDEX IF NOT EXISTS idx_ops_assignments_user ON ops_operator_assignments (assigned_user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_ops_reports_client_period ON ops_reports (client_id, report_type, period_start);
