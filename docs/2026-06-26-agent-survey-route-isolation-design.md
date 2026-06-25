# Agent 与 Survey 路由隔离设计

生成时间：2026-06-26  
执行阶段：第二阶段，只读梳理，不实施切换

## 1. 当前问题

当前同一套 Next.js 应用同时承载 Agent 和 Survey：

- 生产 Worker：`health-store-agent`
- 正式 D1：`health-store-agent-db`
- 当前没有 `APP_MODE=agent` 或 `APP_MODE=survey`
- `next.config.ts` 只对 `Host: survey.81366776.xyz` 的 `/` 做 rewrite 到 `/survey`
- 其他路径没有按域名阻断
- `src/app/layout.tsx` 全站 metadata 仍是 Agent 标题
- `/cyrus` 被 Survey 总后台占用，导致 `agent.81366776.xyz/cyrus` 暴露商场总后台

## 2. Agent 路由清单

| 路由 | 文件位置 | 所属系统 | 当前冲突 | 共享 layout/metadata | 共享 API | 共享 D1 binding | 独立 Worker 后处理 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | Agent | Survey 根路径用 Host rewrite 到 `/survey` | 是 | 否 | 是 | Agent Worker 保留；Survey Worker 根路径直接指向 `/survey` 或拒绝 Agent 首页 |
| `/login` | `src/app/login/page.tsx` | Agent | Survey 域名可访问 | 是 | `src/app/actions.ts` | 是 | Agent Worker 保留；Survey Worker 拒绝 |
| `/app` | `src/app/app/page.tsx` | Agent | Survey 域名可访问 | 是 | `src/app/actions.ts` | 是 | Agent Worker 保留；Survey Worker 拒绝 |
| `/app/generate/[scene]` | `src/app/app/generate/[scene]/page.tsx` | Agent | Survey 域名可访问 | 是 | `src/app/actions.ts` | 是 | Agent Worker 保留；Survey Worker 拒绝 |
| `/app/history` | `src/app/app/history/page.tsx` | Agent | Survey 域名可访问 | 是 | `src/app/actions.ts` | 是 | Agent Worker 保留；Survey Worker 拒绝 |
| `/app/account` | `src/app/app/account/page.tsx` | Agent | Survey 域名可访问 | 是 | `src/app/actions.ts` | 是 | Agent Worker 保留；Survey Worker 拒绝 |
| `/app/store-profile` | `src/app/app/store-profile/page.tsx` | Agent | Survey 域名可访问 | 是 | `src/app/actions.ts` | 是 | Agent Worker 保留；Survey Worker 拒绝 |
| `/cyrus` | `src/app/cyrus/page.tsx` | Agent 原后台，当前被 Survey 占用 | 严重冲突 | 是 | Agent 和 Survey 都引用 | 是 | 必须拆分路径或拆分构建 |
| `/cyrus/users` | `src/app/cyrus/users/page.tsx` | Agent 后台 | 根入口冲突，Survey 域名可访问 | 是 | `src/app/actions.ts` | 是 | Agent Worker 保留或迁至 `/agent-admin/users` |
| `/cyrus/users/[id]` | `src/app/cyrus/users/[id]/page.tsx` | Agent 后台 | 根入口冲突 | 是 | `src/app/actions.ts` | 是 | Agent Worker 保留或迁移 |
| `/cyrus/users/new` | `src/app/cyrus/users/new/page.tsx` | Agent 后台 | 根入口冲突 | 是 | `src/app/actions.ts` | 是 | Agent Worker 保留或迁移 |
| `/cyrus/applications` | `src/app/cyrus/applications/page.tsx` | Agent 后台 | 根入口冲突 | 是 | `src/app/actions.ts` | 是 | Agent Worker 保留或迁移 |
| `/cyrus/generations` | `src/app/cyrus/generations/page.tsx` | Agent 后台 | 根入口冲突 | 是 | `src/app/actions.ts` | 是 | Agent Worker 保留或迁移 |
| `/cyrus/generations/[id]` | `src/app/cyrus/generations/[id]/page.tsx` | Agent 后台 | 根入口冲突 | 是 | `src/app/actions.ts` | 是 | Agent Worker 保留或迁移 |
| `/cyrus/store-profiles` | `src/app/cyrus/store-profiles/page.tsx` | Agent 后台 | 根入口冲突 | 是 | `src/app/actions.ts` | 是 | Agent Worker 保留或迁移 |
| `/cyrus/store-profiles/[userId]` | `src/app/cyrus/store-profiles/[userId]/page.tsx` | Agent 后台 | 根入口冲突 | 是 | `src/app/actions.ts` | 是 | Agent Worker 保留或迁移 |
| `/cyrus/settings` | `src/app/cyrus/settings/page.tsx` | Agent 后台 | 根入口冲突 | 是 | `src/app/actions.ts` | 是 | Agent Worker 保留或迁移 |
| `/lvminglei` | `src/app/lvminglei/page.tsx` | Agent 私有工作台 | Survey 域名可访问 | 局部 metadata | `src/app/lvminglei/actions.ts` | 是 | Agent Worker 保留；Survey Worker 拒绝 |
| `/lvminglei/history` | `src/app/lvminglei/history/page.tsx` | Agent 私有工作台 | Survey 域名可访问 | 局部 metadata | `src/app/lvminglei/actions.ts` | 是 | Agent Worker 保留；Survey Worker 拒绝 |
| `/lvminglei/accounts` | `src/app/lvminglei/accounts/page.tsx` | Agent 私有工作台 | Survey 域名可访问 | 是 | `src/app/lvminglei/actions.ts` | 是 | Agent Worker 保留；Survey Worker 拒绝 |
| `/lvminglei/tools/[type]` | `src/app/lvminglei/tools/[type]/page.tsx` | Agent 私有工作台 | Survey 域名可访问 | 是 | `src/app/lvminglei/actions.ts` | 是 | Agent Worker 保留；Survey Worker 拒绝 |
| `/lvminglei-test` | `src/app/lvminglei-test/page.tsx` | Agent 公开测试页 | Survey 域名可访问但默认隐藏 | 是 | `src/app/lvminglei-test/actions.ts` | 是 | Agent Worker 继续开关隐藏；Survey Worker 拒绝 |
| `/tutorial` | `src/app/tutorial/page.tsx` | Agent | Survey 域名可访问 | 是 | 否 | 是 | Agent Worker 保留；Survey Worker 拒绝 |
| `/demo` | 当前不存在 | Agent 历史入口 | 当前 404 | 无 | 无 | 无 | 默认不恢复 |

## 3. Survey 路由清单

| 路由 | 文件位置 | 所属系统 | 当前冲突 | 共享 layout/metadata | 共享 API | 共享 D1 binding | 独立 Worker 后处理 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/survey` | `src/app/survey/page.tsx` | Survey 商户端 | Agent 域名可访问 | 局部 metadata 已有，但仍共享 layout | `src/app/survey/submit/route.ts` | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/survey/submit` | `src/app/survey/submit/route.ts` | Survey 商户提交 | Agent 域名可提交 | 是 | Route handler | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/api/survey/store-template` | `src/app/api/survey/store-template/route.ts` | Survey 总后台导入模板 | Agent 域名可访问 | 不涉及页面 metadata | Route handler | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/yingyun` | `src/app/yingyun/page.tsx` | Survey 营运后台 | Agent 域名可访问 | 是，标题仍是 Agent | `src/app/survey-actions.ts` | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/yingyun/pos` | `src/app/yingyun/pos/page.tsx` | Survey 营运后台 | Agent 域名可访问 | 是 | Survey actions/route | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/yingyun/pos/submit` | `src/app/yingyun/pos/submit/route.ts` | Survey POS 写入 | Agent 域名可访问 | 不涉及页面 metadata | Route handler | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/yingyun/warnings` | `src/app/yingyun/warnings/page.tsx` | Survey 预警 | Agent 域名可访问 | 是 | Survey repository | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/yingyun/follow-ups` | `src/app/yingyun/follow-ups/page.tsx` | Survey 跟进 | Agent 域名可访问 | 是 | Survey actions/route | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/yingyun/follow-ups/submit` | `src/app/yingyun/follow-ups/submit/route.ts` | Survey 跟进写入 | Agent 域名可访问 | 不涉及页面 metadata | Route handler | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/yingyun/exports` | `src/app/yingyun/exports/page.tsx` | Survey 导出 | Agent 域名可访问 | 是 | Survey repository | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/yingyun/exports/[kind]` | `src/app/yingyun/exports/[kind]/route.ts` | Survey CSV 导出 | Agent 域名可访问 | 不涉及页面 metadata | Route handler | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/yingyun/reports` | `src/app/yingyun/reports/page.tsx` | Survey AI 报告 | Agent 域名可访问 | 是 | `src/app/yingyun/reports/actions.ts` | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/yingyun/reports/[id]` | `src/app/yingyun/reports/[id]/page.tsx` | Survey 报告详情 | Agent 域名可访问 | 是 | Survey repository | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/yingyun/reports/[id]/docx` | `src/app/yingyun/reports/[id]/docx/route.ts` | Survey DOCX 导出 | Agent 域名可访问 | 不涉及页面 metadata | Route handler | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/yingyun/reports/[id]/print` | `src/app/yingyun/reports/[id]/print/route.ts` | Survey 打印 HTML | Agent 域名可访问 | 不涉及页面 metadata | Route handler | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/yingyun/reports/[id]/data.csv` | `src/app/yingyun/reports/[id]/data.csv/route.ts` | Survey 报告数据 CSV | Agent 域名可访问 | 不涉及页面 metadata | Route handler | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/yingyun/reports/[id]/txt` | `src/app/yingyun/reports/[id]/txt/route.ts` | Survey TXT 导出 | Agent 域名可访问 | 不涉及页面 metadata | Route handler | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/yingyun/stores` | `src/app/yingyun/stores/page.tsx` | Survey 门店 | Agent 域名可访问 | 是 | Survey repository | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/yingyun/stores/[id]` | `src/app/yingyun/stores/[id]/page.tsx` | Survey 门店详情 | Agent 域名可访问 | 是 | Survey repository | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/yingyun/submissions` | `src/app/yingyun/submissions/page.tsx` | Survey 填报明细 | Agent 域名可访问 | 是 | Survey repository | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/yingyun/trends` | `src/app/yingyun/trends/page.tsx` | Survey 趋势 | Agent 域名可访问 | 是 | Survey repository | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/yingyun/periods` | `src/app/yingyun/periods/page.tsx` | Survey 月份 | Agent 域名可访问 | 是 | Survey actions/route | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/yingyun/periods/submit` | `src/app/yingyun/periods/submit/route.ts` | Survey 月份写入 | Agent 域名可访问 | 不涉及页面 metadata | Route handler | 是 | Survey Worker 保留；Agent Worker 拒绝 |
| `/cyrus` | `src/app/cyrus/page.tsx` | 当前 Survey 总后台 | 与 Agent 管理后台直接冲突 | 是，标题仍是 Agent | `src/app/survey-actions.ts` | 是 | 必须拆分路径或拆分构建 |

## 4. API 与服务端动作冲突

| 文件 | 当前用途 | 冲突点 | 处理建议 |
| --- | --- | --- | --- |
| `src/app/actions.ts` | Agent 登录、生成、账号、资料管理 | 仍大量 revalidate `/cyrus` | Agent 路由迁移时必须同步路径 |
| `src/app/survey-actions.ts` | Survey 后台登录、门店、POS、月份、跟进、报告 | Survey 登录后 super admin redirect 到 `/cyrus` | Survey 总后台路径确定后同步改 redirect |
| `src/app/yingyun/reports/actions.ts` | Survey 报告生成与版本 | Agent 域名现在也能命中 | 加 APP_MODE 路由保护 |
| `src/lib/data/repository.ts` | Agent 数据仓库 | 使用同一个 `DB` binding | Agent Worker 绑定独立 Agent D1 |
| `src/lib/survey/repository.ts` | Survey 数据仓库 | 使用同一个 `DB` binding | Survey Worker 绑定独立 Survey D1 |
| `src/lib/auth/session.ts` | Agent session | admin redirect 到 `/cyrus` | 若迁移 Agent 管理后台，需同步 |
| `src/lib/survey/session.ts` | Survey session | survey staff session 独立 cookie | D1 拆分后继续独立 |

## 5. 推荐隔离架构

推荐保留同一仓库，但建立四套部署配置和应用模式：

```text
agent-prod        -> agent.81366776.xyz        -> agent 独立正式 D1
agent-preview     -> agent 预览地址             -> agent 独立预览 D1
survey-prod       -> survey.81366776.xyz       -> survey 独立正式 D1
survey-preview    -> survey 预览地址            -> survey 独立预览 D1
```

新增环境变量：

```text
APP_MODE=agent
APP_MODE=survey
```

要求：

- Agent Worker 中拒绝 Survey 路由：`/survey`、`/yingyun`、Survey API、Survey 导出。
- Survey Worker 中拒绝 Agent 路由：`/login`、`/app`、Agent `/cyrus`、`/lvminglei`、`/tutorial`。
- Agent 与 Survey 各自使用独立 metadata。
- Agent 和 Survey 分别绑定独立 D1，不共享 `health-store-agent-db`。
- Secrets 分开设置，Cloudflare Token、DeepSeek Key、密码不得写入代码、Git、数据库、日志或验收文件。

## 6. `/cyrus` 最小处理方案

当前同一 `src/app/cyrus/page.tsx` 无法同时服务两个系统。

可选方案：

| 方案 | 做法 | 优点 | 风险 |
| --- | --- | --- | --- |
| A. 双 app 或独立构建 | Agent 构建产物中的 `/cyrus` 是 Agent 后台，Survey 构建产物中的 `/cyrus` 是 Survey 后台 | 两个系统都保留原路径 | 工程改造较大 |
| B. Agent 后台迁至 `/agent-admin` | Survey 继续使用 `/cyrus`，Agent 后台迁移路径 | 同仓库冲突最小，语义清晰 | Agent 旧后台链接需要更新 |
| C. Survey 后台迁至 `/survey-admin` | Agent 恢复 `/cyrus`，Survey 总后台改路径 | 保留 Agent 历史路径 | Survey 已验收路径需要回归 |

推荐方案 B：

- Agent 管理后台迁至 `/agent-admin`。
- Agent Worker 可选保留 `/cyrus -> /agent-admin` 的内部跳转，但仅在 Agent Worker 中可用。
- Survey Worker 保留 `/cyrus` 到本阶段已验收的总后台。

该方案对已经试运行的 Survey 后台路径影响最小，同时避免 Agent 与 Survey 在同一 app 目录继续争用同一个文件。

## 7. 替代方案

如果 Next.js 静态路由和 OpenNext 构建无法靠环境变量彻底移除不相关路由，建议升级为以下之一：

1. 独立 route group：
   - `src/app/(agent)/...`
   - `src/app/(survey)/...`
2. 独立 app 目录：
   - `apps/agent`
   - `apps/survey`
3. monorepo 子应用：
   - 共享 `packages/core`
   - Agent 与 Survey 独立 Next 应用
4. 独立构建脚本：
   - 构建前复制或选择对应 app 入口
   - 输出两个互不包含无关路由的 Worker

本阶段只形成方案，不实施拆分。

