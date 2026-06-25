# D1 逐表归属复核

生成时间：2026-06-26  
正式 D1：`health-store-agent-db`  
D1 ID：`eead25a5-88b9-48a8-af6e-8b94c612f9a0`  
复核来源：第一阶段备份 SQLite `backups/multi-site-isolation-20260625-224242/d1/health-store-agent-db.sqlite`

## 1. 总结论

当前正式 D1 同时包含 Agent 和 Survey 数据：

- Agent 业务表：6 张
- Survey 业务表：31 张
- 系统表：`d1_migrations`、`sqlite_sequence`、Cloudflare 内部 `_cf_KV`

复核结果：

- 未发现 Survey 代码引用 Agent 业务表。
- 未发现 Agent 代码引用 `survey_*` 业务表。
- 未发现跨系统外键。
- SQLite schema 中没有显式触发器。
- 显式业务索引均在 Survey 自己的 `survey_*` 表内。
- Agent 表使用 `src/lib/data/store-d1.ts` 的运行时 `ensureSchema` 创建，不在 `migrations/0001-0007` 中。
- Survey 表使用 `migrations/0001-0007` 和 `src/lib/survey/store-d1.ts` 创建/补齐。
- 当前 `d1_migrations` 只记录 Survey 迁移历史，拆库时不能直接作为 Agent 新库迁移历史。

## 2. 逐表归属表

| 表名 | 记录数 | 所属系统 | 迁移来源 | 代码引用 | 迁移策略 |
| --- | ---: | --- | --- | --- | --- |
| `applications` | 3 | Agent | `src/lib/data/store-d1.ts` ensureSchema | `src/lib/data/store-d1.ts`、`src/app/actions.ts`、后台线索页 | 迁入 Agent 正式 D1 |
| `generations` | 30 | Agent | `src/lib/data/store-d1.ts` ensureSchema | `src/lib/data/store-d1.ts`、生成记录、后台记录页 | 迁入 Agent 正式 D1 |
| `profiles` | 6 | Agent | `src/lib/data/store-d1.ts` ensureSchema | 登录、权限、账号管理 | 迁入 Agent 正式 D1 |
| `store_profiles` | 3 | Agent | `src/lib/data/store-d1.ts` ensureSchema | 客户资料、AI 摘要、后台资料页 | 迁入 Agent 正式 D1 |
| `workbench_accounts` | 1 | Agent 私有工作台 | `src/lib/data/store-d1.ts` ensureSchema | `/lvminglei` 工作台账号 | 迁入 Agent 正式 D1 |
| `workbench_generations` | 15 | Agent 私有工作台 | `src/lib/data/store-d1.ts` ensureSchema | `/lvminglei` 生成记录 | 迁入 Agent 正式 D1 |
| `survey_malls` | 1 | Survey | `migrations/0001_survey_core.sql` | Survey 仓库、后台、报表 | 迁入 Survey 正式 D1 |
| `survey_staff_accounts` | 2 | Survey | `migrations/0001_survey_core.sql`、seed | Survey 后台登录与权限 | 迁入 Survey 正式 D1，正式账号需复核 |
| `survey_staff_sessions` | 0 | Survey | `migrations/0001_survey_core.sql` | Survey session | 不迁历史空会话 |
| `survey_brands` | 49 | Survey | `migrations/0001_survey_core.sql`、第六阶段导入 | 门店搜索与后台 | 迁入 Survey 正式 D1 |
| `survey_business_categories` | 7 | Survey | `migrations/0001_survey_core.sql`、字段字典 | 七类业态 | 迁入 Survey 正式 D1 |
| `survey_business_subcategories` | 9 | Survey | `migrations/0004/0007` 和导入脚本 | 子业态映射 | 迁入 Survey 正式 D1 |
| `survey_subcategory_form_mappings` | 9 | Survey | `migrations/0007` 和导入脚本 | 动态表单选择 | 迁入 Survey 正式 D1 |
| `survey_stores` | 49 | Survey | `migrations/0001/0004/0007` 和导入脚本 | 商户搜索、后台、POS、指标 | 迁入 Survey 正式 D1，保留 45 正式 + 4 归档 |
| `survey_store_aliases` | 65 | Survey | `migrations/0001` 和导入脚本 | 商户端搜索别名 | 迁入 Survey 正式 D1 |
| `survey_form_fields` | 73 | Survey | `migrations/0001`、字段字典、导入脚本 | 商户动态表单 | 迁入 Survey 正式 D1 |
| `survey_monthly_periods` | 0 | Survey | `migrations/0001/0005` | 月份开放/关闭 | 建新表，不迁空数据 |
| `survey_period_details` | 0 | Survey | `migrations/0005` | 月份明细 | 建新表，不迁空数据 |
| `survey_merchant_submissions` | 1 | Survey 上线烟测数据 | `migrations/0001/0003` | 商户提交、指标、报表 | 不直接迁入正式业务数据，按烟测方案处理 |
| `survey_submission_field_values` | 0 | Survey | `migrations/0001` | 备用扩展字段 | 建新表，不迁空数据 |
| `survey_submission_change_logs` | 0 | Survey | `migrations/0001/0002` | 商户修改日志 | 建新表，不迁空数据 |
| `survey_city_peer_store_sales` | 2 | Survey 上线烟测数据 | `migrations/0001/0002` | 同城对标 | 随烟测提交处理 |
| `survey_pos_sales` | 5 | Survey 上线烟测数据 | `migrations/0001/0004` | POS、指标、预警 | 随烟测数据处理 |
| `survey_pos_sale_details` | 5 | Survey 上线烟测数据 | `migrations/0004` | POS 备注和更新人 | 随 POS 烟测处理 |
| `survey_monthly_store_metrics` | 5 | Survey 上线烟测派生数据 | `migrations/0001/0004` | 趋势、预警、报告 | 迁移时建议排除并由真实 POS 重算 |
| `survey_monthly_metric_snapshots` | 5 | Survey 上线烟测派生数据 | `migrations/0004` | 坪效、人效 | 随指标烟测处理 |
| `survey_warning_records` | 12 | Survey 上线烟测派生数据 | `migrations/0001/0004` | 预警、跟进 | 迁移时建议排除并由真实数据重算 |
| `survey_follow_up_records` | 1 | Survey 上线烟测数据 | `migrations/0001/0004` | 跟进闭环 | 随烟测处理 |
| `survey_follow_up_details` | 1 | Survey 上线烟测数据 | `migrations/0004` | 跟进责任人/预警关联 | 随跟进烟测处理 |
| `survey_ai_report_jobs` | 1 | Survey 上线烟测数据 | `migrations/0001/0006` | AI 报告任务 | 随烟测报告处理 |
| `survey_report_snapshots` | 1 | Survey 上线烟测数据 | `migrations/0006` | 报告输入快照 | 随烟测报告处理 |
| `survey_reports` | 1 | Survey 上线烟测数据 | `migrations/0006` | 报告列表/确认 | 随烟测报告处理 |
| `survey_report_versions` | 1 | Survey 上线烟测数据 | `migrations/0006` | 报告版本 | 随烟测报告处理 |
| `survey_export_files` | 0 | Survey | `migrations/0001` | 导出记录预留 | 建新表，不迁空数据 |
| `survey_backup_jobs` | 0 | Survey | `migrations/0001` | 备份任务预留 | 建新表，不迁空数据 |
| `survey_audit_logs` | 14 | Survey 上线烟测日志 | `migrations/0001` | 审计日志 | 随烟测处理，建议保留在旧库或标记后归档 |
| `survey_store_stage4_profiles` | 0 | Survey | `migrations/0004` | 阶段四门店 profile 扩展 | 建新表，不迁空数据 |
| `d1_migrations` | 7 | 系统迁移表 | Wrangler D1 migrations | 迁移工具 | Agent 与 Survey 新库各自重建迁移历史 |
| `sqlite_sequence` | 1 | SQLite 系统表 | SQLite 内部 | 无业务代码引用 | 不作为业务表迁移 |
| `_cf_KV` | Cloudflare 内部 | D1 内部表 | Cloudflare | 无业务代码引用 | 不作为业务迁移对象 |

## 3. 账号、会话与日志是否共享

账号：

- Agent 使用 `profiles`。
- Agent 私有工作台使用 `workbench_accounts`。
- Survey 使用 `survey_staff_accounts`。
- 未发现两套系统共享账号表。

会话：

- Agent 使用自己的登录 cookie 和 `profiles`。
- Survey 使用 `survey_staff_sessions` 和 Survey staff cookie。
- 未发现共享 session 表。

日志：

- Agent 生成记录保存在 `generations`、`workbench_generations`。
- Survey 审计日志保存在 `survey_audit_logs`。
- 未发现共享日志表。

## 4. 迁移历史拆分

当前 `d1_migrations` 记录 7 条 Survey 迁移：

```text
0001_survey_core
0002_survey_merchant_submission_guards
0003_survey_merchant_submission_fields
0004_survey_stage4_operations
0005_survey_period_details
0006_survey_stage5_ai_reports
0007_survey_stage6_deployment_pilot
```

拆分建议：

1. Agent 新库：
   - 不直接复制当前 `d1_migrations`。
   - 新增 Agent 自己的 `0001_agent_core.sql` 或继续保留运行时 ensureSchema，但建议落迁移文件，便于正式审计。
   - 迁移 `applications`、`generations`、`profiles`、`store_profiles`、`workbench_accounts`、`workbench_generations`。

2. Survey 新库：
   - 按 `0001` 到 `0007` 顺序重新执行 Survey 迁移。
   - 导入 45 家正式门店、4 家归档撤店、73 个字段、9 个子业态映射、正式后台账号。
   - 不导入上线烟测业务数据，除非用户确认采用“保留但标记”方案。

## 5. 风险与注意事项

- 当前正式库仍是唯一混合库，不得删除或清空。
- 正式拆库必须先备份旧库，再创建新库，再校验表数和记录数，再切换 Worker 绑定。
- Survey 派生表如指标、预警、报告与 POS/提交强关联，迁移烟测数据会污染正式试运行统计。
- Agent 的 `store_profiles` 仍保留 `pdfFileName`、`pdfFilePath` 兼容字段，但目标流程是文本资料录入和 AI 摘要，不应恢复 PDF 主流程。

