# Survey 正式库上线烟测数据识别与处理方案

生成时间：2026-06-26  
数据来源：`health-store-agent-db` 第一阶段备份 SQLite  
执行范围：识别和方案输出，不删除、不修改、不迁移

## 1. 结论

当前正式 Survey 数据中存在一组明确的上线烟测数据，主要集中在：

- 月份：`2026-05`
- 创建时间：`2026-06-25 14:08:41Z` 到 `2026-06-25 14:11:21Z`
- 操作账号：`survey_staff_bootstrap_operator`
- 备注/主题/对标商场含“上线烟测”
- 关联门店：华为、小米、NIKE KIDS、little MO&Co.、追觅

推荐方案：方案 A，后续迁移到独立 Survey 正式 D1 时排除这组烟测业务数据。

原因：

- 这些记录可 100% 确认为上线验证产生。
- POS 备注、跟进主题、同城对标商场均直接含“上线烟测”。
- 指标、预警、报告是由这些烟测 POS 和提交派生生成。
- 保留进正式新库会污染 8 店试运行首月统计、预警、报告和导出。

本阶段不删除旧库数据。

## 2. 商户提交与同城对标

| 表 | 主键 | 门店 | 月份 | 创建时间 | 创建人 | 来源 | 是否烟测 | 关联 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `survey_merchant_submissions` | `survey_submission_4e296c47-c87c-4040-aad9-2db307456a77` | 华为 `L0149N01` | `2026-05` | `2026-06-25T14:08:41.283Z` | 商户端匿名提交 | 上线验收商户填报 | 是 | 关联 2 条同城对标 |
| `survey_city_peer_store_sales` | `survey_peer_a3eebdfc-05ea-4e9c-8dcd-82e7cdac4cc8` | 华为提交 | `2026-05` | `2026-06-25T14:08:41.319Z` | 商户端匿名提交 | `上线烟测商场A` | 是 | submission_id 指向上述提交 |
| `survey_city_peer_store_sales` | `survey_peer_184993d7-63d5-4883-a3ce-3ede35152d25` | 华为提交 | `2026-05` | `2026-06-25T14:08:41.340Z` | 商户端匿名提交 | `上线烟测商场B` | 是 | submission_id 指向上述提交 |

## 3. POS 与 POS 明细

| 表 | 主键 | 门店 | 月份 | POS/目标 | 创建时间 | 创建人 | 来源 | 是否烟测 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `survey_pos_sales` | `survey_pos_98297d5c-f34c-4a9b-b947-09e5cb644ad3` | 华为 `L0149N01` | `2026-05` | 12.0 / 15.0 | `2026-06-25T14:09:07.730Z` | `survey_staff_bootstrap_operator` | `excel_paste`，备注“上线烟测” | 是 |
| `survey_pos_sales` | `survey_pos_31ad1368-dc41-4cd0-84fd-b403ccbf9d84` | 小米 `L0126N002` | `2026-05` | 16.2 / 15.0 | `2026-06-25T14:09:08.051Z` | `survey_staff_bootstrap_operator` | `excel_paste`，备注“上线烟测” | 是 |
| `survey_pos_sales` | `survey_pos_01be799c-b0bc-44bf-b2f6-787cc23c4a3d` | NIKE KIDS `L0409N01` | `2026-05` | 8.8 / 9.0 | `2026-06-25T14:09:08.407Z` | `survey_staff_bootstrap_operator` | `excel_paste`，备注“上线烟测” | 是 |
| `survey_pos_sales` | `survey_pos_fe34ce1f-7bb8-4409-9a26-037e6fa2791b` | little MO&Co. `L0467N01` | `2026-05` | 7.4 / 8.0 | `2026-06-25T14:09:08.743Z` | `survey_staff_bootstrap_operator` | `excel_paste`，备注“上线烟测” | 是 |
| `survey_pos_sales` | `survey_pos_cce82d1c-7fca-42a0-a04b-d5cad53e6f8d` | 追觅 `L0476N02` | `2026-05` | 12.6 / 12.0 | `2026-06-25T14:09:09.149Z` | `survey_staff_bootstrap_operator` | `excel_paste`，备注“上线烟测” | 是 |

关联关系：

- `survey_pos_sale_details.pos_sale_id` 与上述 5 条 POS 主键一一对应。
- 5 条明细的 `remark` 均为“上线烟测”。
- 5 条明细的 `updated_by` 均为 `survey_staff_bootstrap_operator`。

## 4. 指标、快照和预警

| 数据类型 | 数量 | 门店 | 月份 | 来源 | 是否烟测 |
| --- | ---: | --- | --- | --- | --- |
| 指标 `survey_monthly_store_metrics` | 5 | 华为、小米、NIKE KIDS、little MO&Co.、追觅 | `2026-05` | 由上述 POS 保存后重算生成 | 是 |
| 快照 `survey_monthly_metric_snapshots` | 5 | 同上 | `2026-05` | 由上述 POS 保存后生成 | 是 |
| 预警 `survey_warning_records` | 12 | 同上 | `2026-05` | 由上述指标生成 | 是 |

预警明细：

| 主键 | 门店 | 预警代码 | 严重程度 | 创建时间 | 是否烟测 |
| --- | --- | --- | --- | --- | --- |
| `survey_warning_2e75fb28-9fe0-45b9-8427-e7b101e3a95c` | 华为 | W04 | 严重 | `2026-06-25T14:09:07.871Z` | 是 |
| `survey_warning_6acd7599-6c05-4e7b-898a-505ae14ff421` | 华为 | W06 | 一般 | `2026-06-25T14:09:07.871Z` | 是 |
| `survey_warning_51f956f4-0629-4fd5-aea2-6a3c86b990c7` | 小米 | W05 | 一般 | `2026-06-25T14:09:08.213Z` | 是 |
| `survey_warning_bfee7a2a-f3f5-4396-a0d8-393095aec0b4` | 小米 | W12 | 一般 | `2026-06-25T14:09:08.213Z` | 是 |
| `survey_warning_a0efa198-cfcc-47d1-95ab-1726ad1ba51b` | NIKE KIDS | W04 | 严重 | `2026-06-25T14:09:08.552Z` | 是 |
| `survey_warning_ffc69668-013c-41b0-a74c-e8b0871c0b3c` | NIKE KIDS | W05 | 一般 | `2026-06-25T14:09:08.552Z` | 是 |
| `survey_warning_9821f178-7a2d-4a1b-b056-fc5052dd4363` | NIKE KIDS | W12 | 一般 | `2026-06-25T14:09:08.552Z` | 是 |
| `survey_warning_de2e74b2-b3c1-4c5b-8f23-d9ae97178f55` | little MO&Co. | W04 | 严重 | `2026-06-25T14:09:08.930Z` | 是 |
| `survey_warning_072b3d1a-22d5-49ef-82ac-1c486dd7019d` | little MO&Co. | W05 | 一般 | `2026-06-25T14:09:08.930Z` | 是 |
| `survey_warning_c5fc742b-8725-4e99-a505-057b75216b73` | little MO&Co. | W12 | 一般 | `2026-06-25T14:09:08.930Z` | 是 |
| `survey_warning_29c1af04-049b-493b-bd6f-5ccc42b85128` | 追觅 | W05 | 一般 | `2026-06-25T14:09:09.362Z` | 是 |
| `survey_warning_812275db-70f8-4033-b00e-ce1757151f26` | 追觅 | W12 | 一般 | `2026-06-25T14:09:09.362Z` | 是 |

## 5. 跟进记录

| 表 | 主键 | 门店 | 月份 | 创建时间 | 创建人 | 来源 | 是否烟测 | 关联 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `survey_follow_up_records` | `survey_follow_b0d2aae0-2dbb-4b2c-94db-f0c6d6bff07b` | 华为 `L0149N01` | `2026-05` | `2026-06-25T14:09:16.458Z` | `survey_staff_bootstrap_operator` | 主题“上线烟测：确认销售目标和转化动作” | 是 | 关联明细 1 条 |
| `survey_follow_up_details` | `survey_follow_b0d2aae0-2dbb-4b2c-94db-f0c6d6bff07b` | 华为 | `2026-05` | `2026-06-25T14:09:16.458Z` | `survey_staff_bootstrap_operator` | owner_name “营运账号” | 是 | follow_up_id 同主表 |

## 6. 报告、版本、快照和 AI 任务

| 表 | 主键 | 月份 | 类型 | 状态 | 创建时间 | 创建人 | 来源 | 是否烟测 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `survey_ai_report_jobs` | `survey_ai_job_81e833e1-c7a3-4e52-9a84-314a035220ed` | `2026-05` | `leadership_brief` | `succeeded` | `2026-06-25T14:10:32.322Z` | `survey_staff_bootstrap_operator` | 上线验收生成 | 是 |
| `survey_reports` | `survey_report_c8ef78ba-38cb-40ad-9297-58932e23926e` | `2026-05` | `leadership_brief` | `confirmed` | `2026-06-25T14:10:32.372Z` | 系统生成 | 上线验收报告 | 是 |
| `survey_report_versions` | `survey_report_version_4601ce86-2c60-404c-af4f-4f3a3e43da20` | `2026-05` | `ai_original` | 已确认版本 | `2026-06-25T14:10:32.420Z` | `survey_staff_bootstrap_operator` | 上线验收报告版本 | 是 |
| `survey_report_snapshots` | 1 条 | `2026-05` | `leadership_brief` | 快照 | `2026-06-25T14:10:32Z` 左右 | `survey_staff_bootstrap_operator` | 上线验收报告输入 | 是 |

## 7. 审计日志

审计日志共 14 条，均属于上线烟测链路：

- 5 条 `pos.create`
- 1 条 `follow_up.create`
- 1 条 `logout`
- 1 条 `ai_report.succeeded`
- 1 条 `report.version.create`
- 1 条 `report.create`
- 1 条 `report.export.data_csv`
- 1 条 `report.confirm`
- 1 条 `report.export.docx`
- 1 条 `report.export.print_html`

这些日志与上述 POS、跟进、报告记录直接关联。建议不迁入新的正式 Survey D1；如需审计留痕，可在旧混合库和备份文件中保留。

## 8. 方案 A：迁移时排除烟测数据

适用条件：

- 数据可明确识别为上线烟测。
- 正式试运行希望从干净业务数据开始。
- 新库只保留基础资料、账号、字段字典、门店和映射。

迁移保留：

- `survey_malls`
- `survey_brands`
- `survey_stores`
- `survey_store_aliases`
- `survey_business_categories`
- `survey_business_subcategories`
- `survey_subcategory_form_mappings`
- `survey_form_fields`
- 正式 `survey_staff_accounts`

迁移排除：

- `survey_merchant_submissions`
- `survey_city_peer_store_sales`
- `survey_pos_sales`
- `survey_pos_sale_details`
- `survey_monthly_store_metrics`
- `survey_monthly_metric_snapshots`
- `survey_warning_records`
- `survey_follow_up_records`
- `survey_follow_up_details`
- `survey_ai_report_jobs`
- `survey_report_snapshots`
- `survey_reports`
- `survey_report_versions`
- `survey_audit_logs` 中本次烟测相关日志

优点：

- 新正式 Survey D1 干净。
- 不污染试运行统计、预警、报告、导出。
- 不需要立刻增加筛选字段和全链路过滤逻辑。

风险：

- 新库中不会保留上线验收样例。
- 需要依赖旧库备份保留审计证据。

## 9. 方案 B：保留但标记

做法：

- 给相关业务表新增 `is_smoke_test INTEGER NOT NULL DEFAULT 0`。
- 对上述烟测记录设置 `is_smoke_test=1`。
- 在统计、预警、报告、导出、后台列表中统一排除 `is_smoke_test=1`。

优点：

- 新库内可保留上线烟测证据。
- 后续可在内部审计页面查询。

风险：

- 需要修改多处代码过滤条件。
- 如果某个统计或导出漏加过滤，会继续污染正式数据。
- 对第一期 8 店试运行不是最小风险方案。

## 10. 推荐

推荐采用方案 A：迁移时排除烟测数据。

执行边界：

- 本阶段不删除旧库数据。
- 本阶段不修改任何烟测记录。
- 下一阶段创建独立 Survey D1 时，基础资料和账号重新导入，烟测业务数据不导入。
- 旧混合库和第一阶段备份继续作为烟测证据留存。

