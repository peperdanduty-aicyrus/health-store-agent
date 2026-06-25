# 第三阶段夜间自动执行验收报告

生成时间：2026-06-25 23:24 CST  
分支：`feature/agent-survey-isolation`  
执行范围：所有可逆操作。未切正式域名、未改 DNS、未删除旧 Worker/D1、未清空旧正式数据、未开放 45 家门店。

## 1. 执行时间

- 开始时间：2026-06-25 约 23:05 CST
- 结束时间：2026-06-25 23:24 CST

## 2. Git 分支和提交列表

当前分支：

```text
feature/agent-survey-isolation
```

提交列表：

```text
0ba283c fix: render survey root with empty search params
436e8eb fix: generate stage 3 import sql correctly
6dde1bd feat: add independent D1 migrations and deployment configs
da5a39a feat: add app mode and route isolation
f9acb6d docs: add stage 2 isolation findings
db350e6 chore: freeze stage 6 production pilot
```

当前工作区：干净。

## 3. Agent 目标版本恢复结果

恢复基线：

```text
15357dd Switch store profiles to text input
```

已恢复/保留：

- 7 个内容场景，包括抖音/快手短视频文案
- 免费试用、登录、每日次数限制、套餐与到期逻辑
- 生成记录、单条删除、一键删除、复制状态
- 用户后台 `/app`
- 客户资料文本录入和 AI 摘要流程
- 私有工作台 `/lvminglei`
- 敏感词替换

未恢复：

- `/demo`，按第二阶段结论保持 404。

## 4. Agent 后台迁移结果

已新增 Agent 后台：

```text
/agent-admin
/agent-admin/users
/agent-admin/users/new
/agent-admin/users/[id]
/agent-admin/applications
/agent-admin/generations
/agent-admin/generations/[id]
/agent-admin/store-profiles
/agent-admin/store-profiles/[userId]
/agent-admin/settings
```

已同步：

- Agent 管理员登录后跳转到 `/agent-admin`
- Agent session 中管理员 redirect 到 `/agent-admin`
- Agent 后台菜单改为 `/agent-admin/*`
- Agent server actions 的 `revalidatePath` 改为 `/agent-admin/*`
- Agent 模式下 `/cyrus` 和 `/cyrus/*` 重定向到 `/agent-admin` 或对应子路径

Survey 侧：

- Survey `/cyrus` 根页继续保留为商场总后台。
- Survey 模式下 `/cyrus/users` 等 Agent 子路由被拒绝。

## 5. APP_MODE 隔离结果

新增：

```text
src/lib/app-mode.ts
middleware.ts
src/lib/app-mode.test.ts
```

新增环境：

```text
APP_MODE=agent|survey
APP_ENV=production|preview
```

默认本地开发未设置 `APP_MODE` 时为 `mixed`，避免破坏当前本地调试；四套新 Wrangler 配置均显式设置为 `agent` 或 `survey`。

第二层保护：

- Agent repository `getDataStore()` 在 Survey 模式下拒绝访问。
- Survey repository `getSurveyStore()` 在 Agent 模式下拒绝访问。
- Agent session 和 Survey session 入口增加模式校验。
- Survey CSV 模板 route 增加 Survey 模式校验。

## 6. 路由阻断矩阵

单元测试已覆盖并通过：

| 场景 | 结果 |
| --- | --- |
| Agent 模式访问 `/survey` | 拒绝 |
| Agent 模式访问 `/survey/submit` | 拒绝 |
| Agent 模式访问 `/yingyun/pos` | 拒绝 |
| Agent 模式访问 `/api/survey/store-template` | 拒绝 |
| Agent 模式访问 `/agent-admin/users` | 允许 |
| Agent 模式访问 `/cyrus` | 重定向 `/agent-admin` |
| Agent 模式访问 `/cyrus/users` | 重定向 `/agent-admin/users` |
| Survey 模式访问 `/login` | 拒绝 |
| Survey 模式访问 `/app/history` | 拒绝 |
| Survey 模式访问 `/agent-admin` | 拒绝 |
| Survey 模式访问 `/lvminglei` | 拒绝 |
| Survey 模式访问 `/survey` | 允许 |
| Survey 模式访问 `/cyrus` | 允许 |
| Survey 模式访问 `/cyrus/users` | 拒绝 |

## 7. 四个 Worker 状态

Wrangler 当前未认证：

```text
wrangler whoami -> You are not authenticated. Please run `wrangler login`.
wrangler d1 list -> requires CLOUDFLARE_API_TOKEN in non-interactive environment
```

因此本次没有创建或部署远程 Worker。

| Worker | 目标地址 | 状态 | 版本 ID |
| --- | --- | --- | --- |
| `health-agent-prod` | `https://health-agent-prod.peperdanduty.workers.dev` | 未创建，Cloudflare 认证阻塞 | 无 |
| `health-agent-preview` | `https://health-agent-preview.peperdanduty.workers.dev` | 未创建，Cloudflare 认证阻塞 | 无 |
| `mall-survey-prod` | `https://mall-survey-prod.peperdanduty.workers.dev` | 未创建，Cloudflare 认证阻塞 | 无 |
| `mall-survey-preview` | `https://mall-survey-preview.peperdanduty.workers.dev` | 未创建，Cloudflare 认证阻塞 | 无 |

已创建四套 Wrangler 配置：

```text
wrangler.agent.prod.jsonc
wrangler.agent.preview.jsonc
wrangler.survey.prod.jsonc
wrangler.survey.preview.jsonc
```

D1 ID 仍为 `PENDING_CREATE`，待明早创建远程 D1 后回填。

## 8. 四个 D1 状态

远程 D1 未创建，原因同上：Wrangler 未认证。

本地候选 D1 已验证：

| D1 | 本地验证文件 | 表数 | 状态 |
| --- | --- | ---: | --- |
| `health-agent-db` | `artifacts/stage3/local-d1/health-agent-db.sqlite` | 6 | 已建表并导入 Agent 正式数据 |
| `health-agent-preview-db` | `artifacts/stage3/local-d1/health-agent-preview-db.sqlite` | 6 | 已建表，未导入真实生成数据 |
| `mall-survey-db` | `artifacts/stage3/local-d1/mall-survey-db.sqlite` | 31 | 已建表并导入 Survey 基础资料 |
| `mall-survey-preview-db` | `artifacts/stage3/local-d1/mall-survey-preview-db.sqlite` | 31 | 已建表并导入 Survey 基础资料 |

## 9. Agent 数据复制对照

从旧混合库备份导出：

```text
backups/multi-site-isolation-20260625-224242/d1/health-store-agent-db.sqlite
```

生成导入文件：

```text
artifacts/stage3/agent-data.sql
```

本地验证结果：

| 表 | 目标数量 | 本地导入数量 |
| --- | ---: | ---: |
| `profiles` | 6 | 6 |
| `applications` | 3 | 3 |
| `generations` | 30 | 30 |
| `store_profiles` | 3 | 3 |
| `workbench_accounts` | 1 | 1 |
| `workbench_generations` | 15 | 15 |

## 10. Survey 基础数据复制对照

生成导入文件：

```text
artifacts/stage3/survey-foundation.sql
```

本地验证结果：

| 表 | 目标数量 | 本地导入数量 |
| --- | ---: | ---: |
| `survey_malls` | 1 | 1 |
| `survey_staff_accounts` | 2 | 2 |
| `survey_brands` | 49 | 49 |
| `survey_business_categories` | 7 | 7 |
| `survey_business_subcategories` | 9 | 9 |
| `survey_subcategory_form_mappings` | 9 | 9 |
| `survey_stores` | 49 | 49 |
| `survey_store_aliases` | 65 | 65 |
| `survey_form_fields` | 73 | 73 |

## 11. 烟测数据排除结果

本地 Survey 正式候选库验证：

| 烟测业务表 | 数量 |
| --- | ---: |
| `survey_merchant_submissions` | 0 |
| `survey_city_peer_store_sales` | 0 |
| `survey_pos_sales` | 0 |
| `survey_pos_sale_details` | 0 |
| `survey_monthly_store_metrics` | 0 |
| `survey_monthly_metric_snapshots` | 0 |
| `survey_warning_records` | 0 |
| `survey_follow_up_records` | 0 |
| `survey_follow_up_details` | 0 |
| `survey_ai_report_jobs` | 0 |
| `survey_report_snapshots` | 0 |
| `survey_reports` | 0 |
| `survey_report_versions` | 0 |
| `survey_audit_logs` | 0 |

结论：本地迁移脚本已成功排除已确认上线烟测业务数据。

## 12. Agent 预览验收

未能执行 workers.dev 页面验收，原因：远程 Worker 未创建。

已完成本地可验证项：

- Agent route guard 单元测试通过。
- Agent metadata 单元测试通过。
- `/agent-admin` 路由进入生产构建路由表。
- `/demo` 未新增，继续 404。
- Agent D1 迁移和数据导入脚本本地验证通过。

## 13. Survey 预览验收

未能执行 workers.dev 页面验收，原因：远程 Worker 未创建。

已完成本地可验证项：

- Survey route guard 单元测试通过。
- Survey metadata 单元测试通过。
- Survey 根路径在 `APP_MODE=survey` 时复用商户填报页。
- Survey 基础资料导入本地验证通过。
- Survey 正式候选库业务数据为 0。

## 14. Agent 正式 Worker workers.dev 验收

未执行，原因：Cloudflare 认证阻塞，未部署 `health-agent-prod`。

## 15. Survey 正式 Worker workers.dev 验收

未执行，原因：Cloudflare 认证阻塞，未部署 `mall-survey-prod`。

## 16. 测试、构建、OpenNext 结果

| 项目 | 结果 |
| --- | --- |
| 单元测试 | 18 个测试文件、108 项测试全部通过 |
| 隔离测试 | `src/lib/app-mode.test.ts` 5 项通过 |
| TypeScript | `tsc --noEmit` 通过 |
| ESLint | 通过 |
| Next.js production build | 通过 |
| OpenNext Cloudflare build | 通过 |

OpenNext 首次失败原因：

```text
/bin/sh: npm: command not found
```

处理方式：

- 使用 `artifacts/stage3/bin/npm` 临时 shim，仅支持 `npm run build`。
- 重新执行 OpenNext build，通过。
- shim 文件在 `artifacts/`，不进入 Git。

## 17. AI Secret 和报告测试结果

未配置远程 Worker Secret，原因：

- Wrangler 未认证。
- 不读取、不复制、不输出旧 Worker Secret 明文。

结果：

- 本次未执行真实 DeepSeek workers.dev 调用。
- AI 相关代码构建通过。
- 明早远程部署后需要给 Survey Workers 配置 `DEEPSEEK_API_KEY` Secret，再做四类报告线上预览验收。

## 18. 当前正式域名是否保持不变

保持不变。本次未修改 DNS、未绑定正式域名、未部署旧生产 Worker。

只读回归：

| 域名 | 状态 | 标题 |
| --- | ---: | --- |
| `https://81366776.xyz` | 200 | 本地门店线上运营诊断与增长方案｜Cyrus吕 |
| `https://agent.81366776.xyz` | 200 | 本地健康门店 AI 获客文案助手 |
| `https://survey.81366776.xyz` | 200 | 月度经营数据填报 |

## 19. 旧 Worker、旧 D1 是否保持不变

保持不变。

本次未执行：

- 未部署 `health-store-agent`
- 未删除旧 Worker
- 未删除旧 D1 `health-store-agent-db`
- 未修改旧 D1 数据
- 未修改正式 DNS

## 20. 阻塞项

P0/P1 阻塞：

1. 当前 Wrangler 未认证，无法创建远程 D1。
2. 当前 Wrangler 未认证，无法部署四个 workers.dev Worker。
3. 无法读取或复制旧 Worker Secret 明文，需用户明早自行补录 `DEEPSEEK_API_KEY`。
4. 四套 Wrangler 配置中的 `database_id` 仍为 `PENDING_CREATE`，需创建远程 D1 后回填。

未阻塞：

- 代码隔离已完成。
- 本地 D1 迁移和数据导入验证已完成。
- 测试、类型检查、lint、Next 构建、OpenNext 构建已完成。

## 21. 用户早上只需要做的动作

1. 在终端设置新的短期 Cloudflare 专用 Token，不要发到聊天：

```bash
export CLOUDFLARE_API_TOKEN='由你本人粘贴'
```

2. 回到项目目录：

```bash
cd /Users/lvminglei/Desktop/codexuse/health-store-agent
```

3. 让我继续执行远程创建、迁移、部署和 workers.dev 验收。

所需最小权限：

```text
Account -> D1 -> Edit
Account -> Workers Scripts -> Edit
Account -> Workers Routes -> Read
Zone -> DNS -> Read
```

正式域名切换前如需绑定域名，再临时增加：

```text
Zone -> DNS -> Edit
Zone -> Workers Routes -> Edit
```

## 22. 正式切换前风险

- 远程 D1 和 Worker 尚未创建，不能切正式域名。
- `agent.81366776.xyz` 和 `survey.81366776.xyz` 目前仍指向旧混合 Worker。
- 新 Wrangler 配置需要回填真实 D1 ID。
- Survey Worker 需要配置 `DEEPSEEK_API_KEY` 后才能完成真实 AI 报告验收。
- 远程 workers.dev 未验收前，不应绑定正式域名。

## 23. Agent 正式域名切换命令草案

以下只是草案，今晚未执行。

先部署正式候选 Worker：

```bash
/Users/lvminglei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/wrangler/bin/wrangler.js deploy --config wrangler.agent.prod.jsonc --message "stage3 agent isolated production candidate"
```

预览验收通过后，再绑定正式域名。具体命令需根据 Cloudflare 当前 domain/route 状态确认，不能盲目执行。

## 24. Survey 正式域名切换命令草案

以下只是草案，今晚未执行。

先部署正式候选 Worker：

```bash
/Users/lvminglei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/wrangler/bin/wrangler.js deploy --config wrangler.survey.prod.jsonc --message "stage3 survey isolated production candidate"
```

预览验收通过后，再绑定 `survey.81366776.xyz`。不得开放 45 家门店，继续 `SURVEY_PUBLIC_ACCESS_MODE=pilot`。

## 25. 回滚命令草案

由于今晚没有切正式域名，当前无需回滚。

正式切换后建议回滚策略：

Agent：

```text
将 agent.81366776.xyz 的 Worker route/custom domain 恢复到旧 Worker health-store-agent 对应版本。
```

Survey：

```text
将 survey.81366776.xyz 的 Worker route/custom domain 恢复到旧 Worker health-store-agent 对应版本。
```

D1：

```text
不删除新 D1；正式域名回滚只切 Worker/route。旧 health-store-agent-db 保持不动，作为回滚数据源。
```

## 26. 结论

第三阶段本地和代码层面的可逆工作已完成并验证通过。

未完成的部分全部由 Cloudflare 认证缺失导致：

- 远程 D1 创建
- 远程 D1 迁移与导入
- 四个 workers.dev Worker 部署
- workers.dev 页面烟测
- Worker Secret 配置
- 远程版本 ID 记录

当前不可以切 Agent 正式域名。  
当前不可以切 Survey 正式域名。

明早补充 Cloudflare Token 后，可从远程 D1 创建和 workers.dev 部署继续。

