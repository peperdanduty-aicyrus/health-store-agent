ALTER TABLE survey_stores ADD COLUMN form_category_code TEXT;

CREATE TABLE IF NOT EXISTS survey_subcategory_form_mappings (
  id TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  subcategory_name TEXT NOT NULL,
  form_category_code TEXT NOT NULL,
  form_category_name TEXT NOT NULL,
  enabled INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (mall_id, subcategory_name)
);

INSERT OR IGNORE INTO survey_business_subcategories
  (id, mall_id, category_id, name, sort_order, enabled, created_at, updated_at)
SELECT 'survey_subcategory_001', m.id, c.id, '3C数码', 1, 1, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z'
FROM survey_malls m JOIN survey_business_categories c ON c.mall_id = m.id AND c.name = '3C数码';
INSERT OR IGNORE INTO survey_business_subcategories
  (id, mall_id, category_id, name, sort_order, enabled, created_at, updated_at)
SELECT 'survey_subcategory_002', m.id, c.id, '儿童鞋服', 2, 1, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z'
FROM survey_malls m JOIN survey_business_categories c ON c.mall_id = m.id AND c.name = '儿童鞋服';
INSERT OR IGNORE INTO survey_business_subcategories
  (id, mall_id, category_id, name, sort_order, enabled, created_at, updated_at)
SELECT 'survey_subcategory_003', m.id, c.id, '儿童用品', 3, 1, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z'
FROM survey_malls m JOIN survey_business_categories c ON c.mall_id = m.id AND c.name = '儿童用品';
INSERT OR IGNORE INTO survey_business_subcategories
  (id, mall_id, category_id, name, sort_order, enabled, created_at, updated_at)
SELECT 'survey_subcategory_004', m.id, c.id, '家电', 4, 1, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z'
FROM survey_malls m JOIN survey_business_categories c ON c.mall_id = m.id AND c.name = '家电及家用';
INSERT OR IGNORE INTO survey_business_subcategories
  (id, mall_id, category_id, name, sort_order, enabled, created_at, updated_at)
SELECT 'survey_subcategory_005', m.id, c.id, '家用精品', 5, 1, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z'
FROM survey_malls m JOIN survey_business_categories c ON c.mall_id = m.id AND c.name = '家电及家用';
INSERT OR IGNORE INTO survey_business_subcategories
  (id, mall_id, category_id, name, sort_order, enabled, created_at, updated_at)
SELECT 'survey_subcategory_006', m.id, c.id, '日用杂货', 6, 1, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z'
FROM survey_malls m JOIN survey_business_categories c ON c.mall_id = m.id AND c.name = '家电及家用';
INSERT OR IGNORE INTO survey_business_subcategories
  (id, mall_id, category_id, name, sort_order, enabled, created_at, updated_at)
SELECT 'survey_subcategory_007', m.id, c.id, '美妆护肤', 7, 1, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z'
FROM survey_malls m JOIN survey_business_categories c ON c.mall_id = m.id AND c.name = '个护、健康品及美妆护肤';
INSERT OR IGNORE INTO survey_business_subcategories
  (id, mall_id, category_id, name, sort_order, enabled, created_at, updated_at)
SELECT 'survey_subcategory_008', m.id, c.id, '儿童游乐', 8, 1, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z'
FROM survey_malls m JOIN survey_business_categories c ON c.mall_id = m.id AND c.name = '儿童游乐';
INSERT OR IGNORE INTO survey_business_subcategories
  (id, mall_id, category_id, name, sort_order, enabled, created_at, updated_at)
SELECT 'survey_subcategory_009', m.id, c.id, '教培', 9, 1, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z'
FROM survey_malls m JOIN survey_business_categories c ON c.mall_id = m.id AND c.name = '教培';

INSERT OR IGNORE INTO survey_subcategory_form_mappings
  (id, mall_id, subcategory_name, form_category_code, form_category_name, enabled, sort_order, created_at, updated_at)
SELECT 'survey_subcategory_mapping_001', id, '3C数码', 'DIGITAL_3C', '3C数码', 1, 1, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z' FROM survey_malls;
INSERT OR IGNORE INTO survey_subcategory_form_mappings
  (id, mall_id, subcategory_name, form_category_code, form_category_name, enabled, sort_order, created_at, updated_at)
SELECT 'survey_subcategory_mapping_002', id, '儿童鞋服', 'KIDS_FASHION', '儿童鞋服', 1, 2, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z' FROM survey_malls;
INSERT OR IGNORE INTO survey_subcategory_form_mappings
  (id, mall_id, subcategory_name, form_category_code, form_category_name, enabled, sort_order, created_at, updated_at)
SELECT 'survey_subcategory_mapping_003', id, '儿童用品', 'KIDS_PRODUCTS', '儿童用品', 1, 3, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z' FROM survey_malls;
INSERT OR IGNORE INTO survey_subcategory_form_mappings
  (id, mall_id, subcategory_name, form_category_code, form_category_name, enabled, sort_order, created_at, updated_at)
SELECT 'survey_subcategory_mapping_004', id, '家电', 'HOME_APPLIANCE', '家电及家用', 1, 4, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z' FROM survey_malls;
INSERT OR IGNORE INTO survey_subcategory_form_mappings
  (id, mall_id, subcategory_name, form_category_code, form_category_name, enabled, sort_order, created_at, updated_at)
SELECT 'survey_subcategory_mapping_005', id, '家用精品', 'HOME_APPLIANCE', '家电及家用', 1, 5, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z' FROM survey_malls;
INSERT OR IGNORE INTO survey_subcategory_form_mappings
  (id, mall_id, subcategory_name, form_category_code, form_category_name, enabled, sort_order, created_at, updated_at)
SELECT 'survey_subcategory_mapping_006', id, '日用杂货', 'HOME_APPLIANCE', '家电及家用', 1, 6, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z' FROM survey_malls;
INSERT OR IGNORE INTO survey_subcategory_form_mappings
  (id, mall_id, subcategory_name, form_category_code, form_category_name, enabled, sort_order, created_at, updated_at)
SELECT 'survey_subcategory_mapping_007', id, '美妆护肤', 'BEAUTY_HEALTH', '个护、健康品及美妆护肤', 1, 7, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z' FROM survey_malls;
INSERT OR IGNORE INTO survey_subcategory_form_mappings
  (id, mall_id, subcategory_name, form_category_code, form_category_name, enabled, sort_order, created_at, updated_at)
SELECT 'survey_subcategory_mapping_008', id, '儿童游乐', 'KIDS_ENTERTAINMENT', '儿童游乐', 1, 8, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z' FROM survey_malls;
INSERT OR IGNORE INTO survey_subcategory_form_mappings
  (id, mall_id, subcategory_name, form_category_code, form_category_name, enabled, sort_order, created_at, updated_at)
SELECT 'survey_subcategory_mapping_009', id, '教培', 'EDUCATION', '教培', 1, 9, '2026-06-24T00:00:00.000Z', '2026-06-24T00:00:00.000Z' FROM survey_malls;

UPDATE survey_stores SET form_category_code = 'DIGITAL_3C', subcategory_id = COALESCE(NULLIF(subcategory_id, ''), 'survey_subcategory_001') WHERE subcategory_name = '3C数码';
UPDATE survey_stores SET form_category_code = 'KIDS_FASHION', subcategory_id = COALESCE(NULLIF(subcategory_id, ''), 'survey_subcategory_002') WHERE subcategory_name = '儿童鞋服';
UPDATE survey_stores SET form_category_code = 'KIDS_PRODUCTS', subcategory_id = COALESCE(NULLIF(subcategory_id, ''), 'survey_subcategory_003') WHERE subcategory_name = '儿童用品';
UPDATE survey_stores SET form_category_code = 'HOME_APPLIANCE', subcategory_id = COALESCE(NULLIF(subcategory_id, ''), 'survey_subcategory_004') WHERE subcategory_name = '家电';
UPDATE survey_stores SET form_category_code = 'HOME_APPLIANCE', subcategory_id = COALESCE(NULLIF(subcategory_id, ''), 'survey_subcategory_005') WHERE subcategory_name = '家用精品';
UPDATE survey_stores SET form_category_code = 'HOME_APPLIANCE', subcategory_id = COALESCE(NULLIF(subcategory_id, ''), 'survey_subcategory_006') WHERE subcategory_name = '日用杂货';
UPDATE survey_stores SET form_category_code = 'BEAUTY_HEALTH', subcategory_id = COALESCE(NULLIF(subcategory_id, ''), 'survey_subcategory_007') WHERE subcategory_name = '美妆护肤';
UPDATE survey_stores SET form_category_code = 'KIDS_ENTERTAINMENT', subcategory_id = COALESCE(NULLIF(subcategory_id, ''), 'survey_subcategory_008') WHERE subcategory_name = '儿童游乐';
UPDATE survey_stores SET form_category_code = 'EDUCATION', subcategory_id = COALESCE(NULLIF(subcategory_id, ''), 'survey_subcategory_009') WHERE subcategory_name = '教培';

CREATE INDEX IF NOT EXISTS idx_survey_stores_form_category_code ON survey_stores (form_category_code);
CREATE INDEX IF NOT EXISTS idx_survey_subcategory_form_mappings_mall ON survey_subcategory_form_mappings (mall_id, enabled, sort_order);
