# 第六阶段部署与8店试运行验收说明

验收日期：2026-06-25  
项目路径：`/Users/lvminglei/Desktop/codexuse/health-store-agent`  
最高执行指令：`/Users/lvminglei/Desktop/11/22/CODEX第六阶段正式开工命令_部署与8店试运行.md`

## 一、最终结论

第六阶段已完成到“Cloudflare 预览环境全量验证”检查点，预览部署通过。

已完成：

- 冻结并备份第五阶段最终版本。
- 只读检查 Cloudflare 账户、Wrangler、Workers、D1 资源。
- 创建独立预览 D1：`health-store-agent-preview-db`。
- 执行远程 D1 迁移 `0001` 至 `0007`。
- 向远程预览 D1 导入 45 家正式门店、4 家撤店、73 个字段、9 条子业态映射。
- 配置预览环境为 8 店试运行模式。
- 部署 Cloudflare 预览 Worker。
- 完成预览页面、D1 写入、导出、真实 DeepSeek 报告和旧系统回归验证。
- 重新运行全部测试和生产构建。

未执行：

- 未绑定 `survey.81366776.xyz`。
- 未修改正式 DNS。
- 未迁移或覆盖生产 D1。
- 未开放 45 家门店。
- 未向全部门店发送二维码。

当前结论：预览环境验收通过，可以进入“是否绑定正式域名并启动 8 店试运行”的人工确认点；不能直接开放 45 家门店。

## 二、第五阶段冻结与备份

- 第五阶段冻结提交：`4d437dc5a790039b594fe15129b528b46d04fb4b`
- 冻结标签：`stage5-final-freeze-20260624`
- 本次第六阶段备份目录：`/Users/lvminglei/Desktop/codexuse/health-store-agent/backups/stage6-deploy-20260625-165633`
- 备份内容：Git HEAD、Git 状态、源码 tar 包、`wrangler.jsonc`、`.env.example`、本地 D1 副本。
- 备份未复制 `.env.local`、Cloudflare Token、DeepSeek API Key 或任何明文密码。

## 三、Cloudflare 与 Wrangler 只读检查

- Wrangler 版本：`4.99.0`
- Cloudflare 账户识别：通过。
- 账户：`Peperdanduty@gmail.com's Account`
- 现有生产 D1：`health-store-agent-db`
- 现有生产 D1 ID：`eead25a5-88b9-48a8-af6e-8b94c612f9a0`
- 现有 Worker：`health-store-agent`
- 已查看部署历史，未对生产 Worker 或生产 D1 做写入。

说明：

- 本机 `node`、`npm`、`npx` 不在全局 PATH 中，本次统一使用项目依赖和 Codex 内置 Node 运行 Wrangler。
- Cloudflare API Token 仅临时放在本机钥匙串中调用 Wrangler，未输出、未写入代码、未写入 Git、未写入 D1、未写入验收文件。

## 四、预览环境配置

新增独立预览配置：

- 配置文件：`/Users/lvminglei/Desktop/codexuse/health-store-agent/wrangler.stage6-preview.jsonc`
- Worker 名称：`health-store-agent-stage6-preview`
- 预览 D1：`health-store-agent-preview-db`
- 预览 D1 ID：`ee499538-1af5-4605-9a45-5d17b22f2ac8`
- D1 绑定：`DB`
- 预览地址：`https://health-store-agent-stage6-preview.peperdanduty.workers.dev`
- 当前预览版本 ID：`080a7e54-904f-471c-b3e9-7d47b0e8747a`

预览变量：

- `NEXT_PUBLIC_SURVEY_ENTRY_ENABLED=true`
- `SURVEY_PUBLIC_ACCESS_MODE=pilot`
- `SURVEY_PILOT_STORE_CODES=L0149N01,L0126N002,L0409N01,L0467N01,L0476N02,B0176N01,L0323N03,L0315N01`
- `SURVEY_SEED_TEST_ACCOUNTS=false`
- `SURVEY_REPORT_MOCK_PROVIDER_ENABLED=0`
- `WORKBENCH_PUBLIC_TEST_ENABLED=false`
- `AI_PROVIDER=deepseek`
- `AI_MODEL=deepseek-v4-flash`

DeepSeek API Key 已通过 Cloudflare Secret 写入预览 Worker，未记录明文。

## 五、远程 D1 迁移与导入

远程预览 D1 已执行全部迁移：

- `0001_survey_core.sql`
- `0002_survey_merchant_submission_guards.sql`
- `0003_survey_merchant_submission_fields.sql`
- `0004_survey_stage4_operations.sql`
- `0005_survey_stage4_d1_completion.sql`
- `0006_survey_stage5_ai_reports.sql`
- `0007_survey_stage6_deployment_pilot.sql`

远程预览 D1 导入结果：

| 项目 | 数量 |
| --- | ---: |
| 数据表 | 34 |
| 启用门店 | 45 |
| 归档撤店 | 4 |
| 启用表单字段 | 73 |
| 子业态 | 9 |
| 子业态映射 | 9 |
| 门店搜索别名 | 65 |
| 后台账号 | 2 |
| 重复启用门店编码 | 0 |
| 缺少面积的启用门店 | 0 |
| 缺少员工数的启用门店 | 0 |

后台账号：

- `cyrus_admin`：总后台账号，已启用，有效期至 2027-06-24。
- `yingyun01`：营运账号，已启用，有效期至 2027-06-24。

账号密码仅由用户在本机隐藏输入框输入后生成哈希，未保存明文。

## 六、45家门店、73字段和子业态映射

远程预览 D1 已导入附件中的 45 家正式门店，4 家撤店仅保留归档状态，不对商户端开放。

七类表单字段数量：

| 业态 | 专项字段 | 公共字段 | 实际加载字段 |
| --- | ---: | ---: | ---: |
| 3C数码 | 5 | 13 | 18 |
| 儿童鞋服 | 9 | 13 | 22 |
| 儿童用品 | 9 | 13 | 22 |
| 家电及家用 | 6 | 13 | 19 |
| 个护美妆 | 10 | 13 | 23 |
| 儿童游乐 | 10 | 13 | 23 |
| 教培 | 11 | 13 | 24 |

子业态映射：

- 3C数码 -> `DIGITAL_3C`
- 儿童鞋服 -> `KIDS_FASHION`
- 儿童用品 -> `KIDS_PRODUCTS`
- 家电、家用精品、日用杂货 -> `HOME_APPLIANCE`
- 美妆护肤 -> `BEAUTY_HEALTH`
- 儿童游乐 -> `KIDS_ENTERTAINMENT`
- 教培 -> `EDUCATION`

## 七、8店试运行限制

预览环境已启用 8 店限制：

| 门店编码 | 品牌 | 子业态 | 表单类型 |
| --- | --- | --- | --- |
| `L0149N01` | 华为 | 3C数码 | `DIGITAL_3C` |
| `L0126N002` | 小米 | 3C数码 | `DIGITAL_3C` |
| `L0409N01` | NIKE KIDS | 儿童鞋服 | `KIDS_FASHION` |
| `L0467N01` | little MO&Co. | 儿童鞋服 | `KIDS_FASHION` |
| `L0476N02` | 追觅 | 家电 | `HOME_APPLIANCE` |
| `B0176N01` | THE COLORIST | 美妆护肤 | `BEAUTY_HEALTH` |
| `L0323N03` | 米果象 | 儿童游乐 | `KIDS_ENTERTAINMENT` |
| `L0315N01` | 九拍 | 教培 | `EDUCATION` |

页面验证：

- `/survey?q=华为`：可搜索到试运行门店。
- `/survey?q=大疆`：非试运行门店不展示。
- 45 家正式数据已在远程 D1 中，但商户端入口当前只开放上述 8 家。

## 八、预览页面回归

预览地址：`https://health-store-agent-stage6-preview.peperdanduty.workers.dev`

页面检查结果：

| 页面 | 结果 |
| --- | --- |
| `/` | 200，旧主站首页正常 |
| `/login` | 200，登录页正常 |
| `/app` | 未登录时显示登录态保护 |
| `/survey` | 200，商户端正常 |
| `/yingyun` | 未登录时显示登录页；营运会话可进入 |
| `/yingyun/pos` | 营运会话可进入 |
| `/yingyun/exports` | 营运会话可进入 |
| `/yingyun/reports` | 营运会话可进入 |
| `/cyrus` | 未登录时显示登录页；总后台会话可进入 |

旧健康门店系统未发现被破坏。

## 九、营运闭环验证

POS：

- 通过预览 `/yingyun/pos/submit` 写入 2026-05 五家门店 POS 和目标。
- 远程 D1 `survey_pos_sales` 记录数：5。
- 远程 D1 `survey_monthly_store_metrics` 2026-05 记录数：5。
- 审计日志：`pos.create` 5 条。

月份重开：

- 通过预览 `/yingyun/periods/submit` 重新开放 2026-04。
- 刷新后状态落库。
- 随后提前关闭 2026-04。
- 审计日志：`period.reopen` 1 条，`period.close` 1 条。

跟进：

- 针对华为创建一条跟进记录。
- 状态依次流转：待联系 -> 已联系 -> 整改中 -> 待复查。
- 刷新后记录仍存在。
- 审计日志：`follow_up.create` 1 条，`follow_up.update` 3 条。

CSV 导出：

| 导出项 | 结果 |
| --- | --- |
| 月度填报明细 | 200，UTF-8 BOM，文件名含月份和日期 |
| POS数据 | 200，UTF-8 BOM，文件名含月份和日期 |
| 指标结果 | 200，UTF-8 BOM，文件名含月份和日期 |
| 预警数据 | 200，UTF-8 BOM，文件名含月份和日期 |
| 跟进记录 | 200，UTF-8 BOM，文件名含月份和日期 |

未登录访问五类导出均返回 401。审计日志：`export.csv` 5 条。

## 十、真实DeepSeek报告预览验证

预览环境 Mock 入口已隐藏，使用真实 DeepSeek 生成四类报告。

| 报告类型 | Provider | Model | 状态 | 耗时 | Token |
| --- | --- | --- | --- | ---: | ---: |
| 领导简报 | deepseek | deepseek-v4-flash | succeeded | 22276 ms | 13211 |
| 完整经营分析报告 | deepseek | deepseek-v4-flash | succeeded | 23995 ms | 13842 |
| 3-5分钟口头汇报稿 | deepseek | deepseek-v4-flash | succeeded | 15529 ms | 12197 |
| 单店重点问题分析卡 | deepseek | deepseek-v4-flash | succeeded | 6489 ms | 11373 |

版本与确认：

- 四类报告均通过预览页面生成 AI 原始版本。
- 四类报告均通过预览页面标记为确认版本。
- 远程 D1 `survey_reports`：4 条。
- 远程 D1 已确认报告：4 条。
- 远程 D1 `survey_report_versions`：4 条。
- 审计日志：`report.confirm` 4 条。

本次预览曾发现并修复一个 Workers 运行时问题：

- 问题：`/yingyun/reports` 在 Cloudflare Worker 中返回 500。
- 原因：AI 报告 Schema 校验依赖 AJV 运行时代码生成，Workers 禁止动态代码生成。
- 修复：移除 Worker 运行时 AJV 编译，改为轻量结构校验。
- 修复后重新测试、构建并重新部署预览版本。

## 十一、报告导出文件

已从预览地址真实下载四类 DOCX、打印 HTML、数据 CSV 和 TXT。

DOCX：

- `/Users/lvminglei/Desktop/codexuse/health-store-agent/artifacts/stage6-preview/2026-05-leadership_brief-preview.docx`
- `/Users/lvminglei/Desktop/codexuse/health-store-agent/artifacts/stage6-preview/2026-05-full_analysis-preview.docx`
- `/Users/lvminglei/Desktop/codexuse/health-store-agent/artifacts/stage6-preview/2026-05-oral_briefing-preview.docx`
- `/Users/lvminglei/Desktop/codexuse/health-store-agent/artifacts/stage6-preview/2026-05-store_analysis-preview.docx`

PDF 样例：

- `/Users/lvminglei/Desktop/codexuse/health-store-agent/artifacts/stage6-preview/2026-05-leadership_brief-preview.pdf`
- `/Users/lvminglei/Desktop/codexuse/health-store-agent/artifacts/stage6-preview/2026-05-full_analysis-preview.pdf`

导出校验：

- DOCX 文件头为 Word zip 结构。
- CSV 使用 UTF-8 BOM。
- 打印 HTML 可打开。
- PDF 由本机 Chrome 从预览打印 HTML 生成。
- 未登录下载 DOCX 返回 401。
- 审计日志：`report.export.docx` 4 条，`report.export.print_html` 4 条，`report.export.data_csv` 4 条。

## 十二、远程D1最终记录数量

| 项目 | 数量 |
| --- | ---: |
| 启用门店 | 45 |
| 归档撤店 | 4 |
| 启用字段 | 73 |
| 后台账号 | 2 |
| 2026-05 POS | 5 |
| 2026-05 指标 | 5 |
| 报告 | 4 |
| 已确认报告 | 4 |
| 报告版本 | 4 |
| 成功 AI 任务 | 4 |
| 跟进记录 | 1 |

关键审计日志：

| 动作 | 数量 |
| --- | ---: |
| `pos.create` | 5 |
| `period.reopen` | 1 |
| `period.close` | 1 |
| `follow_up.create` | 1 |
| `follow_up.update` | 3 |
| `export.csv` | 5 |
| `report.confirm` | 4 |
| `report.export.docx` | 4 |
| `report.export.print_html` | 4 |
| `report.export.data_csv` | 4 |

## 十三、测试与构建

重新运行结果：

- 全部测试：17 个测试文件、103 项测试全部通过。
- 生产构建：`next build` 通过，生成 36 个页面。
- OpenNext Cloudflare 构建：已在部署前通过。
- Cloudflare 预览部署：通过。

## 十四、当前代码变更范围

第六阶段新增或修改：

- `.env.example`
- `.gitignore`
- `wrangler.jsonc`
- `wrangler.stage6-preview.jsonc`
- `migrations/0007_survey_stage6_deployment_pilot.sql`
- `scripts/stage6/`
- `src/app/survey/page.tsx`
- `src/lib/survey/pilot.ts`
- `src/lib/survey/pilot.test.ts`
- `src/lib/survey/store-d1.ts`
- `src/lib/ai/report-schema.ts`
- `docs/2026-06-24-stage-6-deployment-pilot-acceptance.md`

## 十五、下一步确认点

现在必须停止，等待人工确认。

如需继续，需要用户明确确认以下动作：

1. 是否将预览验证通过的 Worker 绑定到 `survey.81366776.xyz`。
2. 是否保持正式域名只开放当前 8 家试运行门店。
3. 是否开始安排 8 家门店真实试运行。

在获得确认前，不执行：

- 正式域名绑定。
- DNS 修改。
- 生产 D1 迁移或覆盖。
- 45 家门店开放。
- 全部门店二维码发送。

## 十六、安全收尾

- Cloudflare Token 未进入代码、Git、D1、日志或验收文件。
- DeepSeek API Key 仅作为 Cloudflare Secret 存在，未写入仓库。
- 生成部署后，应立即撤销本次 Cloudflare 专用 Token。

最终结论：第六阶段预览部署验收通过；正式域名绑定和 8 店试运行启动需用户再次确认；当前不可以开放 45 家门店。

## 十七、正式域名8店试运行部署

执行日期：2026-06-25

用户已确认绑定正式域名 `survey.81366776.xyz`，并要求继续只开放 8 家试点门店，不开放其余 37 家。

生产部署前状态：

- 生产 Worker：`health-store-agent`
- 生产 D1：`health-store-agent-db`
- 生产 D1 ID：`eead25a5-88b9-48a8-af6e-8b94c612f9a0`
- 生产 D1 备份目录：`/Users/lvminglei/Desktop/codexuse/health-store-agent/backups/stage6-production-20260625-215359`
- 备份内容：源码、Git 状态、Wrangler 配置、生产 Worker 部署列表、生产 D1 SQL 导出。

生产 D1 初始化：

- 已执行远程迁移 `0001` 至 `0007`。
- 已导入 45 家正式门店、4 家归档撤店、73 个动态字段、9 个子业态映射。
- 已创建正式后台账号 `cyrus_admin` 和 `yingyun01`，只写入哈希，不保存明文密码。
- 导入前没有复制预览环境的测试提交、测试 POS、测试跟进、测试报告和测试日志。
- 生产 D1 初始核对：商户提交 0、POS 0、跟进 0、报告 0、审计日志 0。

部署命令：

```bash
node ./node_modules/wrangler/bin/wrangler.js deploy \
  --config wrangler.jsonc \
  --message "stage6 production 8-store pilot" \
  --domain survey.81366776.xyz
```

部署结果：

- 状态：成功。
- 域名：`survey.81366776.xyz` custom domain。
- 新 Worker 版本 ID：`fe6b0201-ec57-4b84-8c98-90eb37a53ec5`
- 部署创建时间：`2026-06-25T14:05:52.330Z`
- Worker 版本创建时间：`2026-06-25T14:05:50.671Z`
- 生产绑定：`DB -> health-store-agent-db`
- 生产变量：`SURVEY_PUBLIC_ACCESS_MODE=pilot`
- 试点门店编码仍为：`L0149N01,L0126N002,L0409N01,L0476N02,L0467N01,B0176N01,L0323N03,L0315N01`

## 十八、正式域名验证结果

正式入口：

| 地址 | 结果 |
| --- | --- |
| `https://survey.81366776.xyz/` | 200，显示月度经营数据填报 |
| `/survey` | 200，商户端正常 |
| `/yingyun` | 200，未登录显示登录；营运会话可进入 |
| `/yingyun/reports` | 200，营运会话可进入 AI 经营报告中心 |
| `/cyrus` | 200，总后台会话可进入 |

8 家试点门店搜索：

| 门店 | 结果 |
| --- | --- |
| 华为 | 可搜索 |
| 小米 | 可搜索 |
| NIKE KIDS | 可搜索 |
| little MO&Co. | 可搜索，页面中显示为 HTML 实体转义 |
| 追觅 | 可搜索 |
| THE COLORIST | 可搜索 |
| 米果象 | 可搜索 |
| 九拍 | 可搜索 |

非试点门店验证：

- 大疆：显示“暂未找到您的店铺”。
- 优衣库：显示“暂未找到您的店铺”。
- 巴拉巴拉：显示“暂未找到您的店铺”。

旧系统回归：

- `https://81366776.xyz/`：200，旧主站正常。
- `https://agent.81366776.xyz/`：当前 HTTPS 返回 `SSL_ERROR_SYSCALL`，HTTP 返回 `Empty reply from server`。本次部署只绑定 `survey.81366776.xyz`，未修改 `agent.81366776.xyz`；该子域名需单独复核其原有 DNS/服务状态。

业务闭环烟测：

- 商户填报：通过正式域名提交 1 条上线烟测记录，回执页显示“本次数据已提交”。
- POS：通过正式域名写入 2026-05 五家门店 POS 和目标。
- 预警：`/yingyun/warnings` 正常打开。
- 跟进：创建 1 条上线烟测跟进记录，状态为“待复查”。
- DeepSeek 报告：真实生成 1 份领导简报。
- 报告确认：已标记为确认版本。
- DOCX：已从正式域名下载，文件有效。
- PDF：已由正式域名打印 HTML 生成。

正式导出样例：

- `/Users/lvminglei/Desktop/codexuse/health-store-agent/artifacts/stage6-production/2026-05-leadership_brief-production.docx`
- `/Users/lvminglei/Desktop/codexuse/health-store-agent/artifacts/stage6-production/2026-05-leadership_brief-production.html`
- `/Users/lvminglei/Desktop/codexuse/health-store-agent/artifacts/stage6-production/2026-05-leadership_brief-production.pdf`
- `/Users/lvminglei/Desktop/codexuse/health-store-agent/artifacts/stage6-production/2026-05-leadership_brief-production.csv`

正式 D1 烟测后记录数：

| 项目 | 数量 |
| --- | ---: |
| 商户提交 | 1 |
| POS | 5 |
| 指标 | 5 |
| 跟进 | 1 |
| 报告 | 1 |

关键审计日志：

- `pos.create`：5
- `follow_up.create`：1
- `ai_report.succeeded`：1
- `report.create`：1
- `report.version.create`：1
- `report.confirm`：1
- `report.export.docx`：1
- `report.export.print_html`：1
- `report.export.data_csv`：1

回滚方式：

```bash
node ./node_modules/wrangler/bin/wrangler.js rollback 7217e511-6046-4aa8-a13b-3566c6eb5c83 --config wrangler.jsonc
```

说明：`7217e511-6046-4aa8-a13b-3566c6eb5c83` 是本次正式部署前的上一版本。生产 D1 已提前导出至备份目录，如需回滚数据库，应先人工确认是否保留上线烟测数据，再执行恢复。

正式域名当前结论：`survey.81366776.xyz` 已绑定成功并完成 8 店试运行烟测；仍不开放 45 家门店，仍不发送全部门店二维码。
