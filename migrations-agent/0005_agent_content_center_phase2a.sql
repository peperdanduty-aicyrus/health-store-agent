-- Agent content production center phase 2A. Additive only; no legacy or production data is touched.
CREATE TABLE IF NOT EXISTS ops_content_tasks (
  id TEXT PRIMARY KEY, client_id TEXT NOT NULL, organization_id TEXT NOT NULL, content_type TEXT NOT NULL,
  title_direction TEXT NOT NULL DEFAULT '', topic TEXT NOT NULL DEFAULT '', target_audience TEXT NOT NULL DEFAULT '',
  primary_keyword TEXT NOT NULL DEFAULT '', secondary_keywords TEXT NOT NULL DEFAULT '',
  planned_generation_date TEXT NOT NULL DEFAULT '', planned_publish_date TEXT NOT NULL DEFAULT '',
  generation_count INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT '待生成', assigned_user_id TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ops_content_drafts (
  id TEXT PRIMARY KEY, content_task_id TEXT NOT NULL, client_id TEXT NOT NULL, organization_id TEXT NOT NULL,
  content_type TEXT NOT NULL, title TEXT NOT NULL DEFAULT '', summary TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '',
  faq TEXT NOT NULL DEFAULT '', seo_title TEXT NOT NULL DEFAULT '', seo_description TEXT NOT NULL DEFAULT '',
  suggested_keywords TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT '草稿', internal_notes TEXT NOT NULL DEFAULT '',
  created_by_user_id TEXT NOT NULL DEFAULT '', updated_by_user_id TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ops_content_versions (
  id TEXT PRIMARY KEY, draft_id TEXT NOT NULL, version_number INTEGER NOT NULL, title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '', change_note TEXT NOT NULL DEFAULT '', changed_by_user_id TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ops_content_generation_runs (
  id TEXT PRIMARY KEY, content_task_id TEXT NOT NULL DEFAULT '', draft_id TEXT NOT NULL DEFAULT '', request_id TEXT NOT NULL,
  scene TEXT NOT NULL, prompt_version TEXT NOT NULL, model TEXT NOT NULL DEFAULT '', status TEXT NOT NULL,
  error_code TEXT NOT NULL DEFAULT '', error_message TEXT NOT NULL DEFAULT '', elapsed_ms INTEGER, token_usage TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ops_style_samples (
  id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, title TEXT NOT NULL DEFAULT '', content TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ops_keywords (
  id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, keyword TEXT NOT NULL, keyword_type TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual', active INTEGER NOT NULL DEFAULT 1, usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  UNIQUE(organization_id, keyword)
);
CREATE INDEX IF NOT EXISTS idx_ops_content_tasks_org_date ON ops_content_tasks (organization_id, planned_generation_date, status);
CREATE INDEX IF NOT EXISTS idx_ops_content_tasks_assignee ON ops_content_tasks (assigned_user_id, status);
CREATE INDEX IF NOT EXISTS idx_ops_content_drafts_task ON ops_content_drafts (content_task_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_ops_content_runs_task ON ops_content_generation_runs (content_task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ops_keywords_org ON ops_keywords (organization_id, active);
