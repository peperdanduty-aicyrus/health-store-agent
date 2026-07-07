# Agent 本地门店 AI 获客文案助手预览准备报告

## 1. 本次修改时间

2026-07-07

## 2. 分支和提交

- 分支：`preview/agent-ai-output-safety`
- 新提交：`cc074bf159e3874673f3f8ba1ed1d8f455a40fb6`
- 提交信息：`feat(agent): expand local store trial flow`

## 3. 修改范围

本次只修改 agent 对外售卖 AI 文案工具相关内容：

- 首页、登录页、公开演示页
- 客户端 `/app` 页面和生成表单
- agent 后台账号、线索、用户详情页面
- agent 数据层、账号字段兼容、提示词行业适配
- agent-only D1 migration 文件

未修改：

- `survey/yingyun` 商场营运业务
- `/lvminglei` 私用工作台
- 生产 Worker
- 生产 D1
- Cloudflare Secret

## 4. 主要修改内容

- 网站名称升级为“本地门店 AI 获客文案助手”。
- 首页改为“免费申请7天体验账号”，增加“好评后可联系管理员延长1个月使用时间”。
- 门店类型扩展为 9 类：中医馆 / 中医诊所、口腔门诊、推拿按摩SPA馆、美容美业、宠物医院、综合门诊、少儿推拿、餐饮门店、儿童教培。
- 套餐展示统一为：7天体验、基础月卡、标准月卡、正式年卡、代运营陪跑。
- 免费申请表单同步 9 类门店和 7 天体验说明。
- 后台账号创建增加来源渠道：闲鱼、微信、小红书、抖音、快手、其他。
- 后台账号列表显示来源渠道、每日次数、今日生成次数，并增加“好评延长1个月”操作。
- 线索管理显示来源渠道，并支持“一键开通7天体验账号”文案。
- 客户登录后显示当前套餐、到期时间、今日生成次数、门店类型。
- 生成表单根据门店类型动态显示项目名称和目标客户占位符。
- 生成 prompt 增加门店类型和行业表达限制，避免医疗、美容、餐饮、教培夸大承诺。
- 新增公开 `/demo` 页面，用于公开渠道展示工具能力。

## 5. 数据库变更

新增 migration：

- `migrations-agent/0003_agent_store_expansion.sql`

内容：

- `profiles` 新增 `sourceChannel`
- `applications` 新增 `sourceChannel`
- 新增 `account_operation_logs`
- 新增账号操作日志索引

注意：

- 只写了 migration 文件。
- 未执行生产 D1 migration。
- 未写入生产数据库。
- 预览 D1 migration 因当前 Cloudflare CLI 未授权，尚未远程执行。

## 6. 测试和构建结果

已通过：

- `pnpm test`：30 个测试文件，147 项测试通过
- `pnpm lint`：通过
- `pnpm build`：通过
- `pnpm exec opennextjs-cloudflare build`：通过，OpenNext Cloudflare 版本为 `1.19.11`
- Worker 产物检查：未发现 `middleware-manifest.json` 动态 require 风险模式

## 7. 本地预览验收

本地预览 Worker：

- 地址：`http://127.0.0.1:8788`
- 数据库：本地 D1，不写生产

HTTP 检查：

- `/`：200
- `/login`：200
- `/demo`：200
- `/app`：未登录回到 `/login`
- `/agent-admin`：页面可加载
- `/survey`：404
- `/yingyun`：404
- `/cyrus`：404

自动化公开页体检：

- 桌面首页：通过
- 手机首页：通过
- 桌面登录页：通过
- 手机登录页：通过
- 桌面 demo 页：通过
- 手机 demo 页：通过

报告路径：

- `/Users/lvminglei/local-automation-lab/playwright-agent-qa/playwright-report/index.html`

截图路径：

- `/Users/lvminglei/local-automation-lab/playwright-agent-qa/screenshots/desktop-chromium/`
- `/Users/lvminglei/local-automation-lab/playwright-agent-qa/screenshots/mobile-chromium/`

## 8. 远程预览状态

预览分支已推送：

- `preview/agent-ai-output-safety`
- `cc074bf159e3874673f3f8ba1ed1d8f455a40fb6`

当前 Cloudflare CLI 状态：

- `wrangler whoami` 显示未认证
- 未设置 `CLOUDFLARE_API_TOKEN`
- 因此未执行远程预览 D1 migration
- 因此未执行 wrangler 预览部署

已检查远程 Worker：

- `https://health-agent-preview.peperdanduty.workers.dev/`：200
- `https://health-agent-preview.peperdanduty.workers.dev/demo`：仍为 404

结论：

- 远程 Worker 尚未更新到本次新提交，或该 Worker 没有自动绑定 GitHub 分支构建。
- 需要 Cloudflare 授权后才能继续远程预览 migration、部署和后台真实验收。

## 9. 不能上线的风险

上线前仍需完成：

- 在预览 D1 执行 `0003_agent_store_expansion.sql`
- 部署预览 Worker 到 `health-agent-preview`
- 用预览后台创建测试账号
- 验证 7 个生成场景
- 验证来源渠道、7天体验、好评延长1个月
- 验证后台线索一键开通和账号操作记录
- 验证预览 D1 测试数据清理

## 10. 下一步

建议下一步使用“高”强度继续：

1. 提供当天临时 `CLOUDFLARE_API_TOKEN`，只用于预览。
2. 执行预览 D1 migration。
3. 部署 `health-agent-preview`。
4. 完成真实预览后台和客户账号验收。
5. 验收通过后，再进入生产发布准备。
