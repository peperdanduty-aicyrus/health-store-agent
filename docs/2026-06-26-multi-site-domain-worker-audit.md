# 多站点域名、Worker 与 D1 第一阶段盘点报告

生成时间：2026-06-25 22:48  
项目路径：`/Users/lvminglei/Desktop/codexuse/health-store-agent`  
执行范围：第一阶段，只读盘点、备份冻结、域名与 Worker 映射、D1 表归属分析、agent 版本回退初步原因排查。  
未执行：未切换域名、未创建新 Worker、未创建新 D1、未迁移数据、未覆盖部署生产 Worker、未开放 45 家门店。

## 1. 冻结与备份

备份目录：

`/Users/lvminglei/Desktop/codexuse/health-store-agent/backups/multi-site-isolation-20260625-224242`

已备份：

- 当前 Git HEAD：`4d437dc5a790039b594fe15129b528b46d04fb4b`
- 当前分支：`stage5-deepseek-reports`
- `git status`
- `git diff`
- 源码 tar 包
- `wrangler.jsonc`
- `wrangler.stage6-preview.jsonc`
- `.env.example`
- Cloudflare Worker 部署列表
- Cloudflare Worker 版本列表
- Worker Secret 名称列表
- Worker 设置与绑定信息
- 正式 D1 SQL 导出：`health-store-agent-db.sql`
- 预览 D1 SQL 导出：`health-store-agent-preview-db.sql`
- 正式 D1 schema、表清单、表记录数
- 全量测试结果
- 生产构建结果

禁止项确认：

- 未复制 `.env.local`
- 未写入 Cloudflare Token
- 未写入 DeepSeek Key
- 未写入明文密码

验证：

- 全量测试：17 个测试文件、103 项测试通过
- 生产构建：通过

## 2. 当前 Git 与配置状态

当前仓库存在第六阶段未提交改动：

- `.env.example`
- `.gitignore`
- `src/app/survey/page.tsx`
- `src/lib/ai/report-schema.ts`
- `src/lib/survey/store-d1.ts`
- `wrangler.jsonc`
- `wrangler.stage6-preview.jsonc`
- `migrations/0007_survey_stage6_deployment_pilot.sql`
- `scripts/stage6/`
- `src/lib/survey/pilot.ts`
- `src/lib/survey/pilot.test.ts`
- `docs/2026-06-24-stage-6-deployment-pilot-acceptance.md`
- `artifacts/`

当前 `wrangler.jsonc`：

- Worker：`health-store-agent`
- D1：`health-store-agent-db`
- D1 ID：`eead25a5-88b9-48a8-af6e-8b94c612f9a0`
- `SURVEY_PUBLIC_ACCESS_MODE=pilot`
- `SURVEY_PILOT_STORE_CODES=L0149N01,L0126N002,L0409N01,L0467N01,L0476N02,B0176N01,L0323N03,L0315N01`
- `WORKBENCH_PUBLIC_TEST_ENABLED=false`

当前 `wrangler.stage6-preview.jsonc`：

- Worker：`health-store-agent-stage6-preview`
- D1：`health-store-agent-preview-db`
- D1 ID：`ee499538-1af5-4605-9a45-5d17b22f2ac8`

代码隔离状态：

- 当前没有 `APP_MODE=agent` 或 `APP_MODE=survey`。
- 当前 `next.config.ts` 只将 `Host: survey.81366776.xyz` 的 `/` 重写到 `/survey`。
- 当前没有按域名隔离 `/cyrus`、`/yingyun`、`/app`、`/survey` 等入口。
- 当前 `src/app/layout.tsx` 全站 metadata 仍是“本地健康门店 AI 获客文案助手”，所以 survey 后台页面标题也显示获客助手标题。

## 3. 全站入口检查

| 入口 | 状态 | 标题 | 主要功能/现象 | 初步结论 |
| --- | ---: | --- | --- | --- |
| `https://81366776.xyz` | 200 | 本地门店线上运营诊断与增长方案｜Cyrus吕 | 个人主页正常 | 暂未发现受影响 |
| `https://agent.81366776.xyz` | 200 | 本地健康门店 AI 获客文案助手 | 获客助手首页，含免费试用、登录、短视频文案描述 | agent 首页可用 |
| `https://agent.81366776.xyz/login` | 200 | 本地健康门店 AI 获客文案助手 | 获客助手登录页 | 可用 |
| `https://agent.81366776.xyz/app` | 307 | 本地健康门店 AI 获客文案助手 | 跳转 `/login` | 未登录保护正常 |
| `https://agent.81366776.xyz/demo` | 404 | 404 | demo 路由不存在 | 与命令文件期望存在 demo 不一致，需第二阶段确认目标版本 |
| `https://agent.81366776.xyz/cyrus` | 200 | 本地健康门店 AI 获客文案助手 | 显示“商场店铺调研系统总后台”登录 | 严重耦合：agent 域名暴露 survey 总后台入口 |
| `https://survey.81366776.xyz` | 200 | 月度经营数据填报 | 商户填报入口 | survey 根路径正常 |
| `https://survey.81366776.xyz/survey` | 200 | 月度经营数据填报 | 商户填报入口 | 正常 |
| `https://survey.81366776.xyz/yingyun` | 200 | 本地健康门店 AI 获客文案助手 | 显示商场营运后台登录 | 功能正常，但标题仍是获客助手 |
| `https://survey.81366776.xyz/yingyun/reports` | 200 | 本地健康门店 AI 获客文案助手 | 营运账号可进入 AI 经营报告中心 | 功能正常，但标题仍是获客助手 |
| `https://survey.81366776.xyz/cyrus` | 200 | 本地健康门店 AI 获客文案助手 | 总后台可进入 | 功能正常，但标题仍是获客助手 |
| `https://health-store-agent-stage6-preview.peperdanduty.workers.dev` | 200 | 本地健康门店 AI 获客文案助手 | 显示获客助手首页 | 预览 Worker 根路径不是 survey 专用入口 |

关键发现：

- `agent.81366776.xyz` 现在可以访问，但 `/cyrus` 暴露的是商场系统总后台，不是获客助手后台。
- `survey.81366776.xyz` 能正常打开商场系统，但后台 HTML 标题仍是获客助手标题。
- 当前预览 Worker `health-store-agent-stage6-preview` 根路径显示获客助手首页，不是隔离后的商场预览。
- 这说明当前不是多站点隔离架构，而是同一套 Next.js 应用根据少量 Host rewrite 混合承载两个系统。

## 4. 域名、Worker、版本与 D1 映射

Cloudflare 账户：

- Account：`Peperdanduty@gmail.com's Account`
- Account ID：`4e5e9e3b91204b1e94b0a5ccb6022e34`
- Zone：`81366776.xyz`
- Zone ID：`1a0d91d83d8ca3928570fb6eec9fe484`

当前 DNS 公网解析：

| 域名 | A/CNAME 解析 | 备注 |
| --- | --- | --- |
| `81366776.xyz` | `198.19.0.74` | 个人主页可访问 |
| `agent.81366776.xyz` | `198.19.0.96` | 当前可访问获客助手首页 |
| `survey.81366776.xyz` | `198.19.0.70` | 当前绑定 Worker custom domain 可访问 |

当前 Worker 与版本：

| Worker | 用途 | 当前版本 ID | 当前部署时间 | 上一版本 ID | D1 |
| --- | --- | --- | --- | --- | --- |
| `health-store-agent` | 当前生产混合 Worker，承载 agent 与 survey | `fe6b0201-ec57-4b84-8c98-90eb37a53ec5` | `2026-06-25T14:05:52.330451Z` | `7217e511-6046-4aa8-a13b-3566c6eb5c83` | `health-store-agent-db` |
| `health-store-agent-stage6-preview` | 当前商场阶段预览 Worker，但根路径仍显示获客助手 | `080a7e54-904f-471c-b3e9-7d47b0e8747a` | `2026-06-25T09:13:33.900003Z` | `0ff5f6d5-e060-4a7b-be39-62fc62aae107` | `health-store-agent-preview-db` |

当前 D1：

| D1 | ID | 创建时间 | 文件大小 | 现状 |
| --- | --- | --- | ---: | --- |
| `health-store-agent-db` | `eead25a5-88b9-48a8-af6e-8b94c612f9a0` | `2026-06-10T11:00:07.428Z` | 999424 | 同时包含获客助手表和商场调研表 |
| `health-store-agent-preview-db` | `ee499538-1af5-4605-9a45-5d17b22f2ac8` | `2026-06-25T08:56:44.890Z` | 983040 | 商场预览 D1 |

当前生产 Worker 绑定：

- `ASSETS`
- `DB -> health-store-agent-db`
- `AI_API_KEY` Secret
- `DEEPSEEK_API_KEY` Secret
- `AI_PROVIDER=deepseek`
- `AI_MODEL=deepseek-v4-flash`
- `AI_BASE_URL=https://api.deepseek.com`
- `NEXT_PUBLIC_SURVEY_ENTRY_ENABLED=true`
- `SURVEY_PUBLIC_ACCESS_MODE=pilot`
- `SURVEY_PILOT_STORE_CODES=L0149N01,L0126N002,L0409N01,L0467N01,L0476N02,B0176N01,L0323N03,L0315N01`
- `SURVEY_SEED_TEST_ACCOUNTS=false`
- `SURVEY_REPORT_MOCK_PROVIDER_ENABLED=0`
- `WORKBENCH_PUBLIC_TEST_ENABLED=false`

权限缺口：

- 本次 Token 可读取 Worker 部署、Worker 设置、Secret 名称和 D1 列表。
- Zone DNS 记录和 Worker Route/Domain 列表 API 有接口返回 403 或空响应，说明当前 Token 的 Zone DNS/Worker Route 读取权限不足。
- 因此域名绑定状态以 Wrangler 部署输出、Cloudflare Worker 设置、公网 DNS 和页面行为交叉判断；下一阶段建议补齐 Zone DNS Read、Workers Routes Read 权限后再做正式切换。

## 5. D1 表归属分析

当前正式 D1：`health-store-agent-db`

### 5.1 获客助手表

| 表 | 记录数 | 主要字段 | 归属判断 |
| --- | ---: | --- | --- |
| `applications` | 3 | 申请、门店、联系方式、开通用户 | 获客助手试用/开通申请 |
| `generations` | 30 | userId、生成类型、prompt、result、模型 | 获客助手内容生成记录 |
| `profiles` | 6 | phone、password、role、套餐、到期、次数 | 获客助手用户/套餐 |
| `store_profiles` | 3 | 门店资料、摘要、原始资料 | 获客助手客户资料 |
| `workbench_accounts` | 1 | 私有工作台账号 | 获客助手/私有工作台 |
| `workbench_generations` | 15 | 工作台生成记录 | 获客助手/私有工作台 |

### 5.2 商场调研表

| 表 | 记录数 | 主要字段 | 归属判断 |
| --- | ---: | --- | --- |
| `survey_malls` | 1 | 商场 | 商场调研 |
| `survey_brands` | 49 | 品牌 | 商场调研 |
| `survey_stores` | 49 | 45 家正式门店 + 4 家归档撤店 | 商场调研 |
| `survey_store_aliases` | 65 | 搜索别名 | 商场调研 |
| `survey_business_categories` | 7 | 七类业态 | 商场调研 |
| `survey_business_subcategories` | 9 | 子业态 | 商场调研 |
| `survey_subcategory_form_mappings` | 9 | 子业态到表单映射 | 商场调研 |
| `survey_form_fields` | 73 | 动态字段 | 商场调研 |
| `survey_staff_accounts` | 2 | survey 后台账号 | 商场调研 |
| `survey_staff_sessions` | 0 | survey 后台会话 | 商场调研 |
| `survey_merchant_submissions` | 1 | 上线烟测商户提交 | 商场调研 |
| `survey_city_peer_store_sales` | 2 | 上线烟测同城对标 | 商场调研 |
| `survey_submission_field_values` | 0 | 商户字段值扩展表 | 商场调研 |
| `survey_submission_change_logs` | 0 | 商户修改日志 | 商场调研 |
| `survey_pos_sales` | 5 | 上线烟测 POS | 商场调研 |
| `survey_pos_sale_details` | 5 | POS 备注/更新人 | 商场调研 |
| `survey_monthly_store_metrics` | 5 | 指标结果 | 商场调研 |
| `survey_monthly_metric_snapshots` | 5 | 面积/员工快照 | 商场调研 |
| `survey_warning_records` | 12 | 预警 | 商场调研 |
| `survey_follow_up_records` | 1 | 上线烟测跟进 | 商场调研 |
| `survey_follow_up_details` | 1 | 跟进明细 | 商场调研 |
| `survey_reports` | 1 | 上线烟测报告 | 商场调研 |
| `survey_report_versions` | 1 | 报告版本 | 商场调研 |
| `survey_report_snapshots` | 1 | 报告快照 | 商场调研 |
| `survey_ai_report_jobs` | 1 | AI 报告任务 | 商场调研 |
| `survey_audit_logs` | 14 | survey 审计日志 | 商场调研 |
| `survey_monthly_periods` | 0 | 月份状态 | 商场调研 |
| `survey_period_details` | 0 | 月份开启/关闭详情 | 商场调研 |
| `survey_export_files` | 0 | 导出记录 | 商场调研 |
| `survey_backup_jobs` | 0 | 备份任务 | 商场调研 |
| `survey_store_stage4_profiles` | 0 | 阶段四门店 profile 扩展 | 商场调研 |

### 5.3 公共或系统表

| 表 | 记录数 | 主要字段 | 建议归属 |
| --- | ---: | --- | --- |
| `d1_migrations` | 7 | 已执行迁移 | 需要拆分：agent 与 survey 新库应各自维护迁移历史 |
| `sqlite_sequence` | 1 | SQLite 自增状态 | 系统表，不直接迁移业务含义 |
| `_cf_KV` | Cloudflare 内部表 | D1 内部 | 不作为业务迁移对象 |

结论：

- 当前 `health-store-agent-db` 已经同时承载获客助手和商场调研正式数据。
- 这违反“agent 和 survey 独立 D1”的最终目标。
- 后续必须先复制核验，再切换；不得清空或删除旧库。

## 6. agent 当前版本与回退原因初步排查

当前 `agent.81366776.xyz` 线上状态：

- 首页可打开，显示获客助手。
- 登录页可打开。
- `/app` 未登录跳转 `/login`。
- `/demo` 返回 404，与命令文件期望的 demo 入口不一致。
- `/cyrus` 显示商场调研总后台登录，说明 agent 域名能访问 survey 后台入口。

与当前仓库代码关系：

- 当前仓库同时包含获客助手路由：`/`、`/login`、`/app`、`/cyrus/*`、`/lvminglei/*`。
- 当前仓库也包含商场调研路由：`/survey`、`/yingyun/*`、`/cyrus` 的 survey 总后台逻辑。
- 当前 `src/app/cyrus/page.tsx` 已经被商场系统总后台占用，而不是获客助手后台首页。
- 当前 `next.config.ts` 只对 survey 根路径做 rewrite，没有阻止 agent 域名访问 survey 路由。

初步原因：

1. `agent.81366776.xyz` 和 `survey.81366776.xyz` 当前共享同一个生产 Worker：`health-store-agent`。
2. 生产 Worker 当前版本是第六阶段商场系统部署产物：`fe6b0201-ec57-4b84-8c98-90eb37a53ec5`。
3. 生产 Worker 当前绑定同一个混合 D1：`health-store-agent-db`。
4. 因为 Worker 与 D1 共用，部署 survey 时会覆盖 agent 线上运行代码，部署 agent 也会反向影响 survey。
5. agent “恢复后疑似旧版本”的根因更可能不是单纯回退，而是同一个混合 Worker 在不同阶段部署了不同代码产物；当前 agent 首页仍有免费试用、登录、短视频模块描述，但后台和 demo 入口状态与目标版本不一致。

当前还不能直接确认“获客助手最终目标版本”的唯一 commit。需要第二阶段继续比较：

- 当前 agent 线上页面
- 当前仓库代码
- `origin/main`：`15357dd Switch store profiles to text input`
- 第五阶段冻结：`4d437dc stage5-final-freeze-20260624`
- 第六阶段正式部署版本：`fe6b0201-ec57-4b84-8c98-90eb37a53ec5`
- Git 历史中包含 7 个功能入口、短视频模块、免费试用、敏感词替换、生成记录、后台上传资料的版本

## 7. 风险清单

| 风险 | 严重性 | 证据 | 建议 |
| --- | --- | --- | --- |
| agent 与 survey 共用生产 Worker | 高 | 两个域名均访问 `health-store-agent` 混合应用行为 | 必须拆成 `health-agent-prod` 与 `mall-survey-prod` |
| agent 与 survey 共用生产 D1 | 高 | `health-store-agent-db` 同时含获客助手表与 survey 表 | 必须复制到 `health-agent-db` 与 `mall-survey-db` |
| agent 域名暴露 survey 总后台 | 高 | `agent.81366776.xyz/cyrus` 显示商场总后台登录 | 切换前先做域名级 APP_MODE 隔离或独立 Worker |
| survey 后台标题仍是获客助手 | 中 | survey 后台 HTML title 为获客助手 | 独立 metadata 或 APP_MODE 后修复 |
| `/demo` 不存在 | 中 | `agent.81366776.xyz/demo` 404 | 第二阶段确认目标版本是否需要 demo |
| Cloudflare DNS/Route API 权限不足 | 中 | 部分 Zone/Route API 返回 403 | 切正式域名前补齐只读权限，确保能列出域名绑定 |
| 上线烟测数据已在生产 survey 表中 | 中 | submission 1、POS 5、followup 1、report 1 | 后续迁入 `mall-survey-db` 前需决定排除或标记 |
| 当前仓库未提交第六阶段变更 | 中 | `git status` 有多项修改和新增文件 | 正式隔离前需要提交、打 tag 或明确冻结点 |

## 8. 后续隔离建议

建议按命令文件继续，但在进入正式切换前增加两个约束：

1. 先完成 `APP_MODE` 或双配置隔离，不允许再用一个 Worker 同时承载 agent 与 survey。
2. 先完成 D1 表归属复核，不允许直接把 `health-store-agent-db` 原样复制给两个系统。

推荐顺序：

1. 第二阶段确认 agent 正确最终版本，定位目标 commit 和缺失功能。
2. 完成详细 D1 表归属文件：`docs/2026-06-26-d1-table-ownership-map.md`。
3. 设计四套 Wrangler 配置：
   - `wrangler.agent.prod.jsonc`
   - `wrangler.agent.preview.jsonc`
   - `wrangler.survey.prod.jsonc`
   - `wrangler.survey.preview.jsonc`
4. 新建或确认四个 D1：
   - `health-agent-db`
   - `health-agent-preview-db`
   - `mall-survey-db`
   - `mall-survey-preview-db`
5. 先部署两个预览 Worker，并验证互相不能访问对方路由和数据。
6. 预览通过后，先切 `agent.81366776.xyz`，再切 `survey.81366776.xyz`。
7. 每次正式切换前都准备 Worker 版本、域名绑定、D1 备份和回滚命令。

## 9. 第一阶段结论

第一阶段盘点结论：不通过隔离要求。

当前系统可用性：

- 个人主页 `81366776.xyz` 正常。
- survey 正式域名可用，并仍限制 8 家试点门店。
- agent 首页和登录可用。

当前隔离性：

- 不满足。agent 和 survey 当前共用生产 Worker。
- 不满足。agent 和 survey 当前共用生产 D1。
- 不满足。agent 域名可以访问 survey 后台入口。
- 不满足。survey 页面仍混用 agent 全站 metadata。

必须停止点：

- 本阶段已完成盘点和备份。
- 当前未执行任何域名切换、Worker 创建、D1 创建或数据迁移。
- 下一步必须由用户确认是否进入第二阶段：确认 agent 正确最终版本。
