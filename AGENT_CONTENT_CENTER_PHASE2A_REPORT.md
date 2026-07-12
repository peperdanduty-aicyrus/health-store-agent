# Agent 代运营系统第二阶段 A：内容生产中心报告

日期：2026-07-12

## 范围与隔离

- 工作分支：`feature/agent-content-center-phase2a`
- 预览 Worker：`health-agent-preview`
- 预览 D1：`health-agent-preview-db`（`efe75183-7001-4da7-8e3a-30528a3ef5eb`）
- 未部署生产 Worker，未执行生产迁移，未读写生产数据，也未修改生产域名、DNS 或 Secret。
- 未修改 Survey、Yingyun 或商场营运系统代码。

## 已交付

### 数据与权限

- 新增纯增量迁移 `migrations-agent/0005_agent_content_center_phase2a.sql`：
  `ops_content_tasks`、`ops_content_drafts`、`ops_content_versions`、`ops_content_generation_runs`、`ops_style_samples`、`ops_keywords`。
- 内容任务支持机构、内容类型、选题、关键词、计划生成/发布日期、负责人、状态与生成次数；可在月历中显示。
- 草稿支持标题、摘要、正文、FAQ、SEO、建议关键词、内部备注、状态、版本保存与恢复。
- 运营人员的所有内容任务和草稿读写都在服务端再次验证被分配机构；页面和 action 均不读取营收、合同或续费字段。

### 生成与内容安全

- 固定使用服务端配置的模型；页面不提供模型切换。
- 为公众号、小红书、朋友圈、短视频、AI 搜索文章分别定义输出要求。
- 生成采用“事实整理 → 自然润色”两阶段。事实包仅来自当前机构资料、任务、已启用风格样本和关键词；明确禁止编造资质、疗效、案例、价格、时间、地址、联系方式和排名。
- 润色后执行禁用表达与新增数字事实检查；失败不保存半成品，不向运营人员暴露原始模型响应，只记录安全错误信息。
- 批量任务逐条独立执行，失败不回滚已成功任务；`生成中` 状态阻止重复触发。
- 支持纯净复制和公众号格式复制，均去除“标题：”“正文：”等字段标签。

### 页面与视觉

- 管理员入口：`/lvminglei/content`，包含筛选、新建内容任务、批量生成、任务表和草稿入口。
- 草稿入口：`/lvminglei/content/drafts`，包含编辑、版本记录、恢复和复制预览。
- 运营人员 `/app` 仅显示其被分配机构、五类内容、最近生成、草稿和历史说明；不含经营、财务、合同或其他客户数据。
- 桌面及移动布局使用既定低饱和色系；设计对照素材：
  - `docs/design/agent-content-center-phase2a-desktop-concept.png`
  - `docs/design/agent-content-center-phase2a-mobile-concept.png`

## 构建与产物检查

| 项目 | 结果 |
| --- | --- |
| `pnpm install --frozen-lockfile` | 通过 |
| `pnpm test` | 35 个测试文件、166 个测试通过 |
| `pnpm lint` | 通过 |
| `pnpm build` | 通过 |
| `pnpm exec opennextjs-cloudflare build --config wrangler.agent.preview.jsonc` | 通过 |
| OpenNext 实际版本 | `1.19.11` |
| Next.js 实际版本 | `15.5.19` |
| 产物特定动态引用 | 未发现 `Dynamic require of "/.next/server/middleware-manifest.json"` |

OpenNext 的通用 CommonJS 兼容包装仍会包含字符串 `Dynamic require of "…" is not supported`，但最终产物不包含此前导致 500 的 `/.next/server/middleware-manifest.json` 动态引用。

## 预览部署与路由验收

- 已对预览 D1 执行 0005：11 条增量 schema 查询成功，新增表与索引已建立。
- 新预览 Worker 版本：`56f41db6-2aff-4115-8728-2e425f08d9f1`。
- 预览地址：`https://health-agent-preview.peperdanduty.workers.dev`。

| 路径 | 结果 |
| --- | --- |
| `/` | 200，浏览器 DOM 正常，无 console error/warn |
| `/login` | 200，登录表单正常渲染 |
| `/app`（未登录） | 安全跳转至 `/login` |
| `/lvminglei` | 200，超级管理员登录页正常渲染 |
| `/lvminglei/content`（未登录） | 安全跳转至 `/lvminglei` |
| `/cyrus` | 安全跳转至 `/lvminglei` |
| `/survey` | 404 |
| `/yingyun` | 404 |

## 剩余上线阻塞项

管理员和运营人员的已登录浏览器交互验收尚未完成：预览环境的实际管理员凭据与仓库内本地默认测试凭据不一致，登录被正确拒绝。为避免猜测、展示或改写密码，本次未绕过认证，也没有新建伪造账号或数据。

最小下一步：使用已有预览超级管理员和运营人员测试账号，完成 `/lvminglei/content` 创建/生成/草稿复制/版本恢复，以及 `/app` 机构隔离与复制的桌面、390px 浏览器验收；随后补充实际浏览器截图。本阶段代码、迁移和公开/未登录路由验收已完成，但上述已登录验收完成前不建议进入下一阶段或上线生产。

## 登录态验收增补（2026-07-12）

- 已在预览 D1 使用随机临时 QA 超级管理员账号完成 `/lvminglei` 真实登录，并通过浏览器创建了 QA 客户、QA 机构和机构内容资料；该账号密码未写入本报告或仓库。
- 验收发现管理员端缺少风格样本与关键词库的录入界面。已作最小修复：`/lvminglei/content?organizationId=…` 现可添加机构风格样本和手工关键词，服务端仍以 owner 权限与机构存在性校验保护。
- 修复后 `pnpm test`（166 项）、`pnpm lint`、`pnpm build`、本地固定 OpenNext 1.19.11 构建均通过；预览新 Worker 版本为 `da3ffe6a-09e2-4517-a514-e1b98b491929`。
- QA 清理 SQL 已对预览 D1 执行；临时本地凭据文件已删除。由于清理命令返回 0 行写入，无法以该回执单独证明此前浏览器创建的数据已被删除，需在下一次登录态验收开始前先以预览 D1 的不含密码计数查询复核。
- 尚未完成五类内容生成、运营人员机构隔离、390px 截图与最终内容质量抽查，因此第二阶段 A 仍不建议进入第二阶段 B 或生产上线。
