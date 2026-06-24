# 商场店铺月度经营调研与分析系统第一阶段技术方案

检查日期：2026-06-23

## 结论

建议以 `/Users/lvminglei/Desktop/codexuse/health-store-agent` 作为本系统主体继续开发，不建议以 `/Users/lvminglei/Desktop/codexuse/cyrus-store-growth` 承载系统。

原因：
- `health-store-agent` 已经是 Next.js + OpenNext Cloudflare 动态应用，已有登录、后台、D1 数据层、DeepSeek 兼容 AI 接入、测试体系和 Cloudflare Workers 部署配置。
- `cyrus-store-growth` 是 Astro + Tailwind 纯静态官网，适合品牌官网和内容页，不适合直接做商户填报、营运后台、权限、报表、修改记录、AI 报告和导出。

本阶段不开发完整系统，只提交可落地技术方案。

## 1. 当前项目技术栈

### health-store-agent

- 前端/服务端：Next.js 15.5.19 App Router、React 19、TypeScript
- 样式：Tailwind CSS 3、lucide-react
- 部署：OpenNext Cloudflare、Wrangler、Cloudflare Workers
- 数据库：Cloudflare D1，绑定名 `DB`，现有库名 `health-store-agent-db`
- AI：`AI_PROVIDER=deepseek`，`AI_BASE_URL=https://api.deepseek.com`，代码中已有 DeepSeek、通义、OpenAI-compatible、mock provider
- 测试：Vitest
- 当前主要路由：`/`、`/login`、`/app`、`/cyrus`、`/lvminglei`
- 当前 GitHub 远端：`git@github.com:peperdanduty-aicyrus/health-store-agent.git`
- 当前分支：`mvp-scaffold`

### cyrus-store-growth

- 前端：Astro 5、TypeScript、Tailwind CSS
- 输出：纯静态站
- 部署目标：Cloudflare Pages
- 当前用途：Cyrus 吕门店增长专家官网

## 2. 当前项目是否适合直接增加该系统

适合在 `health-store-agent` 上增加，但不建议直接复用现有“健康门店 AI 获客助手”的业务模型。

可复用部分：
- Next.js App Router 页面结构
- Server Actions 模式
- D1 数据层抽象
- `/cyrus` 后台壳层和管理员登录思路
- DeepSeek provider 接入
- Vitest 测试框架
- Cloudflare Workers 部署链路

需要新增或重构部分：
- 新的商场、门店、业态、字段配置、月度填报、POS 正式销售、趋势计算、跟进记录、导出、备份表
- 新的三类入口权限：商户公开填报、营运营号、总后台
- 现有 `/` 是健康门店获客助手首页，和固定商户入口 `https://survey.81366776.xyz` 冲突，后续需要改为商户填报入口或做域名级分流
- 现有登录账号是 `admin/user`，不完整支持“总后台/营运账号/商户免登录填报”

## 3. 建议数据库及原因

第一版建议继续使用 Cloudflare D1。

原因：
- 当前项目已经绑定 D1，部署路径短。
- 第一版只服务一个商场、一个营运账号，D1 足够支撑结构化月度数据、后台查询和导出。
- Cloudflare Workers + D1 同平台，运维成本低。
- 后续多商场可以通过 `mallId` 做数据隔离。

边界：
- D1 不适合复杂大规模 OLAP。若以后发展到多商场、大量门店、跨年趋势、大量报表并发，可以迁移到 PostgreSQL。
- 第一版不要上复杂数据仓库，先把结构设计为可迁移。

## 4. 现有登录体系是否复用

可复用 cookie + Server Action 登录模式，不建议直接复用现有 `profiles` 表作为新系统账号表。

建议：
- 商户端不登录，不注册，不输入验证码。
- 营运端使用账号密码登录，新建 `operation_accounts` 表。
- 总后台使用账号密码登录，可新建 `admin_accounts` 或在统一 `staff_accounts` 表中用角色区分。
- 当前 `hsa_session` cookie 可保留给旧功能，新系统建议使用独立 cookie，例如 `survey_staff_session`，避免和旧 `/app` 客户账号混用。
- 密码第一版至少不要明文存储；建议用 Web Crypto PBKDF2 或 bcrypt 兼容方案存储哈希。

## 5. 建议的数据表结构

以下为第一版建议结构。字段命名可以在第二阶段落库时统一为 snake_case 或 camelCase，但同一层必须保持一致。

### 基础配置

- `malls`
  - `id`
  - `name`
  - `status`
  - `createdAt`
  - `updatedAt`

- `business_categories`
  - `id`
  - `mallId`
  - `name`
  - `sortOrder`
  - `enabled`
  - `createdAt`
  - `updatedAt`

- `stores`
  - `id`
  - `mallId`
  - `brandName`
  - `storeName`
  - `floor`
  - `unitNo`
  - `categoryId`
  - `areaSqm`
  - `contractEndDate`
  - `status`
  - `searchText`
  - `createdAt`
  - `updatedAt`

- `store_aliases`
  - `id`
  - `storeId`
  - `alias`
  - `normalizedAlias`
  - `createdAt`

- `form_fields`
  - `id`
  - `mallId`
  - `categoryId`
  - `fieldKey`
  - `label`
  - `type`
  - `required`
  - `unit`
  - `precision`
  - `optionsJson`
  - `visibleRuleJson`
  - `sortOrder`
  - `enabled`
  - `createdAt`
  - `updatedAt`

### 权限与系统使用

- `staff_accounts`
  - `id`
  - `mallId`
  - `phone`
  - `passwordHash`
  - `role`：`super_admin` 或 `operator`
  - `displayName`
  - `enabled`
  - `startsAt`
  - `expiresAt`
  - `createdAt`
  - `updatedAt`

- `staff_sessions`
  - `id`
  - `accountId`
  - `sessionTokenHash`
  - `expiresAt`
  - `createdAt`

- `audit_logs`
  - `id`
  - `mallId`
  - `actorType`
  - `actorId`
  - `action`
  - `targetType`
  - `targetId`
  - `detailJson`
  - `createdAt`

### 月度填报

- `monthly_periods`
  - `id`
  - `mallId`
  - `month`
  - `status`：`open`、`closed`、`reopened`
  - `normalFillStartsAt`
  - `normalFillEndsAt`
  - `reopenedBy`
  - `createdAt`
  - `updatedAt`

- `merchant_submissions`
  - `id`
  - `mallId`
  - `storeId`
  - `periodMonth`
  - `status`
  - `isLate`
  - `firstSubmittedAt`
  - `lastModifiedAt`
  - `merchantEditUntil`
  - `submittedByName`
  - `submittedByPhone`
  - `selfReportedSalesWan`
  - `memberRechargeWan`
  - `staffCount`
  - `newProductCount`
  - `mainPromotion`
  - `mainProductInventoryStatus`
  - `slowMovingInventoryStatus`
  - `noLocalPeerStores`
  - `createdAt`
  - `updatedAt`

- `submission_field_values`
  - `id`
  - `submissionId`
  - `fieldKey`
  - `valueText`
  - `valueNumber`
  - `valueJson`
  - `createdAt`
  - `updatedAt`

- `city_peer_store_sales`
  - `id`
  - `submissionId`
  - `mallName`
  - `salesWan`
  - `sortOrder`
  - `createdAt`
  - `updatedAt`

- `submission_change_logs`
  - `id`
  - `submissionId`
  - `actorType`
  - `actorId`
  - `fieldKey`
  - `oldValue`
  - `newValue`
  - `changedAt`

### POS 与计算

- `pos_sales`
  - `id`
  - `mallId`
  - `storeId`
  - `periodMonth`
  - `salesWan`
  - `targetSalesWan`
  - `sourceFileName`
  - `uploadedBy`
  - `createdAt`
  - `updatedAt`

- `monthly_store_metrics`
  - `id`
  - `mallId`
  - `storeId`
  - `periodMonth`
  - `effectiveSalesWan`
  - `salesSource`
  - `momRate`
  - `yoyRate`
  - `mallRank`
  - `categoryRank`
  - `salesPerSqm`
  - `salesPerStaff`
  - `targetCompletionRate`
  - `selfPosDiffWan`
  - `selfPosDiffRate`
  - `warningFlagsJson`
  - `computedAt`

- `follow_up_records`
  - `id`
  - `mallId`
  - `storeId`
  - `periodMonth`
  - `warningType`
  - `content`
  - `ownerAccountId`
  - `nextActionDate`
  - `status`
  - `createdAt`
  - `updatedAt`

### AI、导出和备份

- `ai_report_jobs`
  - `id`
  - `mallId`
  - `periodMonth`
  - `reportType`
  - `inputSnapshotJson`
  - `desensitizedInputJson`
  - `outputText`
  - `modelProvider`
  - `modelName`
  - `status`
  - `errorMessage`
  - `createdBy`
  - `createdAt`

- `export_files`
  - `id`
  - `mallId`
  - `periodMonth`
  - `fileType`
  - `fileName`
  - `storageKey`
  - `createdBy`
  - `createdAt`

- `backup_jobs`
  - `id`
  - `mallId`
  - `backupType`
  - `storageKey`
  - `status`
  - `createdBy`
  - `createdAt`

## 6. 三个入口的路由和权限设计

固定入口要求：
- 商户统一填报端：`https://survey.81366776.xyz`
- 营运后台：`https://survey.81366776.xyz/yingyun`
- 总后台：`https://survey.81366776.xyz/cyrus`

建议路由：
- `/`：商户端。公开访问，门店模糊搜索，选择门店，填写系统自动判断的上一个自然月数据。
- `/yingyun`：营运端。账号密码登录，查看门店填报、POS、趋势、预警、跟进、报告和导出。
- `/cyrus`：总后台。账号密码登录，管理营运账号、期限、门店、业态、字段、AI、备份和日志。

权限：
- 商户端无账号，不允许自由新增店铺，只能选系统已有门店。
- 营运账号绑定 `mallId`，第一版只有一个商场，后续可扩展多商场。
- 总后台可以管理商场级配置和营运账号期限。
- 权限到期后保留历史数据，但禁止开启新月份填报和生成新报告。

当前差距：
- 现有项目没有 `/yingyun`。
- 现有 `/` 是健康门店获客助手首页，不是商户填报端。
- 现有 `/cyrus` 是旧系统后台，需要新增本系统模块或迁移后台首页。

## 7. 门店模糊搜索与别名实现方案

搜索必须走数据库已有门店，不允许商户自由新建。

建议实现：
- 门店保存 `brandName`、`storeName`、`floor`、`unitNo`、`categoryId`。
- 别名独立保存在 `store_aliases`。
- 保存或更新门店时生成 `searchText`：
  - 小写化
  - Unicode 规范化
  - 去掉常见空格、半角/全角符号、`&`、`/`、`.`、`-`
  - 合并品牌名、店铺名、英文名、中文名、别名
- 查询时对输入做同样 normalize，再用 `LIKE` 或分词 token 匹配。
- 结果显示品牌名称、楼层铺位、业态。
- 同品牌多店必须显示楼层铺位区分。

示例：
- `mo` 匹配 `Little MO&Co.`
- `江博士` 匹配 `Dr.Kong／江博士`
- `honor` 匹配 `荣耀honor`
- `kids` 匹配包含 `kids` 的品牌、店铺名或别名

## 8. 月度填报、修改记录和历史数据存储方案

月份规则：
- 系统按当前日期自动判断上一个自然月，商户不选择月份。
- 每月 1 日至 8 日正常填写。
- 9 日至月底允许补填，但 `isLate=true`。
- 进入下个月后，补填更早月份需要营运端重新开放 `monthly_periods.status=reopened`。
- 首次提交后 24 小时内商户可修改。
- 超过 24 小时后商户不可修改，营运可在后台修改。

存储：
- 主记录在 `merchant_submissions`。
- 动态字段在 `submission_field_values`。
- 同城同质门店销售额在 `city_peer_store_sales`，独立多行保存。
- 每次修改写入 `submission_change_logs`，保存修改字段、修改前、修改后、修改人和时间。

## 9. POS 批量录入方案

营运端或总后台上传 Excel/CSV：
- 必填列：品牌名或店铺名、楼层铺位或门店 ID、月份、POS 正式销售额、目标销售额。
- 上传后先进入预览匹配，不直接写入。
- 系统按门店 ID 优先，其次按规范化门店名 + 铺位匹配。
- 匹配失败、重复匹配、金额格式错误必须在预览中提示。
- 确认后写入 `pos_sales`。
- 重新上传同一门店同一月份时更新原记录，同时写 `audit_logs`。

## 10. 同比、环比和趋势计算方案

以下全部由程序计算，不交给 AI：
- 环比：本月有效销售额 / 上月有效销售额 - 1
- 同比：本月有效销售额 / 去年同月有效销售额 - 1
- 销售排名：按有效销售额在商场内排序
- 业态排名：按有效销售额在同业态内排序
- 坪效：有效销售额 / 面积
- 人效：有效销售额 / 员工人数
- 目标完成率：有效销售额 / 目标销售额
- 自报与 POS 差异：商户自报 - POS
- 差异比例：差异 / POS

有效销售额规则：
- 优先使用 POS 正式销售额。
- POS 未录入时暂用商户自报销售额。
- 指标中保存 `salesSource`，避免误把临时数据当正式数据。

趋势：
- 单店趋势、业态趋势、整体趋势按 `monthly_store_metrics` 聚合。
- 重点关注名单由统一规则生成 `warningFlagsJson`。
- AI 只读取计算后的摘要，不参与原始指标计算。

## 11. DeepSeek 接入位置

当前项目已有 `src/lib/ai/provider.ts` 和 `src/lib/ai/providers/deepseek.ts`。

建议新增：
- `src/lib/analysis/deterministic-metrics.ts`：计算指标和预警。
- `src/lib/analysis/report-context.ts`：生成脱敏后的 AI 输入。
- `src/lib/ai/survey-report.ts`：调用 DeepSeek 生成领导简报、完整报告、口头汇报稿。

脱敏规则：
- 品牌名称替换为内部 `storeId` 或序号。
- 不传店长姓名。
- 不传联系电话。
- 不传合同信息。
- 不传租金方式。

失败降级：
- AI 失败不影响看板、计算和 Excel 导出。
- AI job 写入 `status=failed` 和 `errorMessage`。
- 前端提示“AI 报告生成失败，可稍后重试”，但保留数据看板。

## 12. Word、PDF、Excel 导出方案

第一版建议：
- Excel：用 `xlsx` 或服务端 CSV 生成，优先输出结构化明细、汇总、预警、跟进四类表。
- Word：使用 `docx` 生成领导简报和完整报告。
- PDF：第一版可由 HTML 报告页打印为 PDF，或后续接入 Playwright/HTML-to-PDF；在 Cloudflare Workers 上直接跑完整浏览器 PDF 生成成本较高。

文件存储：
- 小文件可以直接响应下载。
- 需要留档时保存到 R2，并在 `export_files` 记录 `storageKey`。

## 13. 数据备份和恢复方案

建议：
- 使用 Cloudflare D1 官方备份/导出作为底层备份。
- 应用层提供“导出全量 CSV/JSON”功能。
- 关键配置表、门店表、POS 表、提交表、修改日志表单独可导出。
- 备份记录写入 `backup_jobs`。
- 恢复第一版先采用人工恢复：下载备份、校验、导入 D1，不做后台一键覆盖恢复。

## 14. 分阶段开发计划

只作为总体计划，不在第一阶段执行后续开发。

第二阶段：
- 新增数据库结构。
- 新增总后台和营运账号登录权限。
- 新增门店、业态、字段配置管理。

第三阶段：
- 新增商户统一二维码填报端。
- 完成门店模糊搜索、自动月份、提交、24 小时修改、同城同质多行表。

第四阶段：
- 新增 POS 批量录入。
- 新增确定性指标计算、趋势、预警和跟进记录。

第五阶段：
- 新增 DeepSeek 报告生成。
- 新增 Excel、Word、PDF 导出。

第六阶段：
- 部署到固定域名。
- 配置安全、备份、试运行数据和最终验收。

## 15. 主要风险

- 固定域名 `https://survey.81366776.xyz` 当前 HTTPS 请求失败，本地 curl 显示 SSL 握手失败或空响应，需要先确认 DNS、证书和 Cloudflare 路由。
- `/` 当前不是商户填报端，需要明确旧首页是否迁移或隐藏。
- 当前 `/cyrus` 后台是旧健康门店获客助手后台，需要确定是并入新系统，还是保留旧功能并新增菜单。
- 当前密码在旧表中为明文，新增系统不能沿用明文密码。
- D1 没有复杂分析能力，必须把计算逻辑写在应用层并用测试覆盖。
- PDF 生成在 Cloudflare Workers 上可能受运行环境限制，第一版建议先 HTML 打印或 R2 存档方案。
- 同城同质门店数据必须结构化保存，不能偷懒存一段文本。
- 商户免登录但可 24 小时修改，需要用提交记录、店铺选择、浏览器状态或安全编辑令牌平衡易用性和误改风险。

## 16. 需要用户提供的资料、账号和环境变量

需要确认或提供：
- 第一版商场名称。
- 初始营运账号手机号、姓名、初始密码。
- 总后台管理员账号。
- 门店清单：品牌名、店铺名、楼层、铺位、业态、面积、合同到期日、别名。
- 第一版表单字段：各业态显示字段、必填字段、选项。
- 历史 POS 销售数据：至少上月、上年同月；如果要做连续两个月趋势，至少需要最近 3 个月。
- 月销售目标数据。
- DeepSeek `AI_API_KEY`。
- Cloudflare 账号权限、D1、Workers、域名 `survey.81366776.xyz` 绑定情况。
- 是否保留现有 `health-store-agent` 首页和 `/app` 旧客户功能。

## 本阶段验证记录

- `health-store-agent` Vitest：7 个测试文件、58 个测试通过。
- `health-store-agent` Next.js production build：通过。
- `cyrus-store-growth` Astro check/build：通过。
- `survey.81366776.xyz` HTTPS 检查：失败，表现为 SSL 握手失败；HTTP 检查为空响应。

