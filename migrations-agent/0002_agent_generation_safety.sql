-- Additive agent generations diagnostics. Apply only after a production D1 backup.
ALTER TABLE generations ADD COLUMN status TEXT;
ALTER TABLE generations ADD COLUMN raw_response TEXT;
ALTER TABLE generations ADD COLUMN cleaned_content TEXT;
ALTER TABLE generations ADD COLUMN error_code TEXT;
ALTER TABLE generations ADD COLUMN error_message TEXT;
ALTER TABLE generations ADD COLUMN request_id TEXT;
ALTER TABLE generations ADD COLUMN finish_reason TEXT;
ALTER TABLE generations ADD COLUMN token_usage TEXT;
ALTER TABLE generations ADD COLUMN elapsed_ms INTEGER;
ALTER TABLE generations ADD COLUMN prompt_version TEXT;
