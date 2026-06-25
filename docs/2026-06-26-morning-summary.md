# 第三阶段晨间摘要

生成时间：2026-06-25 23:24 CST

## 昨晚完成了什么

- 创建隔离分支：`feature/agent-survey-isolation`
- 保留第六阶段冻结点：`db350e6`
- 确认并提交第二阶段 5 份结论文件
- 新增 `APP_MODE=agent|survey` 和 `APP_ENV=production|preview`
- 新增 middleware 路由保护
- 新增 repository/session 第二层模式保护
- 将 Agent 后台迁移到 `/agent-admin`
- Agent 模式下 `/cyrus`、`/cyrus/*` 会跳转到 `/agent-admin`
- Survey 模式下 `/cyrus` 保留总后台，`/cyrus/users` 等 Agent 子路由被拒绝
- 新增 Agent 独立 D1 迁移
- 新增 Agent 数据导出 SQL
- 新增 Survey 基础资料导出 SQL，排除烟测业务数据
- 新增四套 Wrangler 配置
- 本地模拟创建四个候选 D1 并完成数据验证

## 哪些测试通过

- 单元测试：18 个测试文件、108 项全部通过
- TypeScript：通过
- ESLint：通过
- Next.js production build：通过
- OpenNext Cloudflare build：通过
- 旧正式域名只读回归：通过

## 哪些没有完成

因为 Wrangler 当前未认证，以下远程步骤没有执行：

- 创建 `health-agent-db`
- 创建 `health-agent-preview-db`
- 创建 `mall-survey-db`
- 创建 `mall-survey-preview-db`
- 部署 `health-agent-prod`
- 部署 `health-agent-preview`
- 部署 `mall-survey-prod`
- 部署 `mall-survey-preview`
- 配置 Worker Secret
- workers.dev 页面烟测

## 现在四个 Worker/D1 的状态

远程 Worker：未创建。  
远程 D1：未创建。

本地候选 D1 已验证：

- `health-agent-db`：6 张表，Agent 数据完整
- `health-agent-preview-db`：6 张表，仅结构
- `mall-survey-db`：31 张表，Survey 基础资料完整，烟测业务数据为 0
- `mall-survey-preview-db`：31 张表，Survey 基础资料完整

## 旧网站是否仍正常

只读检查正常：

- `https://81366776.xyz`：200，个人主页标题正常
- `https://agent.81366776.xyz`：200，Agent 标题正常
- `https://survey.81366776.xyz`：200，商户填报标题正常

## 今天第一步该确认什么

先在终端设置新的短期 Cloudflare 专用 Token：

```bash
export CLOUDFLARE_API_TOKEN='由你本人粘贴'
```

然后让我继续远程创建 D1、回填 Wrangler D1 ID、执行迁移导入、部署 workers.dev 并做线上预览验收。

## 是否可以切 Agent 正式域名

不可以。

原因：`health-agent-prod` 还没有远程部署，workers.dev 尚未验收。

## 是否可以切 Survey 正式域名

不可以。

原因：`mall-survey-prod` 还没有远程部署，workers.dev 尚未验收，`DEEPSEEK_API_KEY` 也尚未写入新 Worker Secret。

## 明早建议执行顺序

1. 设置短期 Cloudflare Token。
2. 创建四个远程 D1。
3. 回填四套 Wrangler 配置中的真实 D1 ID。
4. 执行 Agent 和 Survey 迁移。
5. 导入 Agent 正式数据和 Survey 基础资料。
6. 部署四个 workers.dev Worker。
7. 给需要 AI 的 Worker 设置 `DEEPSEEK_API_KEY`。
8. 完成 workers.dev 页面和数据烟测。
9. 验收通过后，再单独确认是否切 `agent.81366776.xyz`。
10. Agent 切换稳定后，再单独确认是否切 `survey.81366776.xyz`。

