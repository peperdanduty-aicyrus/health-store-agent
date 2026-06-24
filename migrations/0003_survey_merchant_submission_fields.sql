-- Phase 3 submission payload fields.

ALTER TABLE survey_merchant_submissions ADD COLUMN category_name TEXT;
ALTER TABLE survey_merchant_submissions ADD COLUMN field_values_json TEXT;
