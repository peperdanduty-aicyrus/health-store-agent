-- Phase 3 merchant submission guards.

CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_merchant_submissions_store_month
  ON survey_merchant_submissions (store_id, period_month);

CREATE INDEX IF NOT EXISTS idx_survey_city_peer_submission
  ON survey_city_peer_store_sales (submission_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_survey_submission_change_logs_submission
  ON survey_submission_change_logs (submission_id, changed_at);
