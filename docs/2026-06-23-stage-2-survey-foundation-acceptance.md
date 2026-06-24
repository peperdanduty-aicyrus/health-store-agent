# 第二阶段修订版验收说明

日期：2026-06-23

## 本阶段范围

已按《第二阶段（修订版）：数据库、登录、权限和门店管理》执行。

本阶段只完成：
- survey 独立数据库基础结构
- 总后台和营运后台独立登录
- 独立 `survey_staff_session` 会话 Cookie
- 总管理员和营运账号
- 账号 3 个月、6 个月、12 个月权限设置
- 商场、品牌、门店、业态、子业态、搜索别名基础管理
- 门店基础资料 Excel 可打开模板、Excel 复制粘贴导入预检查、错误行提示和导入结果下载
- 操作日志

本阶段没有开发：
- 商户月度填报表单
- POS 录入看板
- 趋势图
- AI 报告
- Word/PDF/Excel 文件导出
- 正式域名 SSL、DNS 和 Cloudflare 路由修复

## 新增入口

- 总后台：`/cyrus`
- 营运后台：`/yingyun`
- 门店导入模板：`/api/survey/store-template`

## 测试账号

总管理员：
- 登录名：`cyrus_admin`
- 密码：`SurveyAdmin@2026`

营运账号：
- 登录名：`yingyun01`
- 密码：`SurveyOps@2026`

说明：
- 这两组账号用于本地和预览验收。
- 密码通过 PBKDF2-SHA256 哈希保存，不保存明文。
- 登录使用独立 Cookie：`survey_staff_session`。
- 不使用旧系统 Cookie：`hsa_session`。

## 新增数据库迁移文件

- `migrations/0001_survey_core.sql`

迁移特点：
- 只新增 `survey_` 前缀表。
- 不删除、不覆盖、不修改旧业务表。
- 使用 `CREATE TABLE IF NOT EXISTS` 和 `CREATE INDEX IF NOT EXISTS`，可重复执行。
- 如需恢复，先备份 D1，再按 `survey_` 前缀表清理本阶段新增表。

## 新增表结构

基础与权限：
- `survey_malls`
- `survey_staff_accounts`
- `survey_staff_sessions`
- `survey_audit_logs`

品牌、门店和配置：
- `survey_brands`
- `survey_business_categories`
- `survey_business_subcategories`
- `survey_stores`
- `survey_store_aliases`
- `survey_form_fields`

第三、四、五、六阶段预留：
- `survey_monthly_periods`
- `survey_merchant_submissions`
- `survey_submission_field_values`
- `survey_city_peer_store_sales`
- `survey_submission_change_logs`
- `survey_pos_sales`
- `survey_monthly_store_metrics`
- `survey_follow_up_records`
- `survey_ai_report_jobs`
- `survey_export_files`
- `survey_backup_jobs`

重点修订版要求：
- `merchant_submissions` 中 `submitted_by_name` 和 `submitted_by_phone` 可空。
- 已预留 `merchant_edit_token_hash`、`merchant_edit_until`、`first_submitted_at`、`last_modified_at`。
- `city_peer_store_sales` 是独立多行表，不用普通文本保存。
- `follow_up_records` 已预留跟进方式、主题、反馈、下一步和下次跟进日期。
- `pos_sales` 只建表，不开发 POS 上传或录入页面。

## 已实现功能

总后台 `/cyrus`：
- 总管理员登录页
- 营运账号创建
- 营运账号禁用和启用
- 营运账号 3/6/12 个月权限续期
- 权限到期状态显示
- 业态新增
- 子业态新增
- 门店新增
- 门店启用、停用、归档
- 搜索别名编辑
- 门店基础资料导入预检查
- 导入结果下载
- 操作日志展示

营运后台 `/yingyun`：
- 营运账号登录页
- 权限有效/到期状态展示
- 到期后仍可查看门店基础资料
- 到期后显示不能开启新月份和不能生成新报告的提示

门店关系：
- 表结构和本地数据层支持“商场 -> 品牌 -> 具体门店”。
- 一个品牌可以对应多个具体门店。
- 每家门店独立保存楼层、铺位、面积、员工、合同、店长、电话、租金方式、营运人员和状态。

商户端隐私边界：
- 公开搜索方法只返回品牌名称、楼层铺位、所属业态等必要信息。
- 不返回合同、面积、员工人数、店长、联系电话、租金方式。

## Excel 导入说明

本阶段提供 Excel 可打开的 CSV 模板：
- 下载地址：`/api/survey/store-template`

导入方式：
- 从 Excel 复制含表头的数据，粘贴到总后台导入框。
- 也可以粘贴 CSV 内容。

已支持：
- 批量新增
- 按品牌名称 + 楼层 + 铺位辅助判断重复
- 导入前预检查
- 错误行和错误原因提示
- 单行错误不影响其他正确行
- 搜索别名保存
- 导入操作写入操作日志
- 导入结果 CSV 下载

限制：
- 当前未引入 `.xlsx` 二进制解析库，直接上传 `.xlsx` 文件不在本阶段实现范围内。
- 本阶段以 Excel 复制粘贴和 Excel 可打开 CSV 模板完成验收。

## 本地测试方法

运行核心测试：

```bash
/Users/lvminglei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/vitest/vitest.mjs run src/lib/survey/security.test.ts src/lib/survey/catalog.test.ts src/lib/survey/import.test.ts
```

运行全量测试：

```bash
/Users/lvminglei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/vitest/vitest.mjs run
```

生产构建：

```bash
/Users/lvminglei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/next/dist/bin/next build
```

本地预览：

```bash
/Users/lvminglei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/next/dist/bin/next dev
```

默认访问：
- `http://localhost:3000/cyrus`
- `http://localhost:3000/yingyun`

## 旧系统保护验证

未修改：
- `/login`
- `/app`
- `/app/account`
- `/app/history`
- `/app/store-profile`
- 旧 `hsa_session` 登录逻辑
- 旧 `profiles`、`applications`、`generations`、`store_profiles`、`workbench_accounts`、`workbench_generations` 表结构

构建中仍可见旧系统路由：
- `/login`
- `/app`
- `/app/generate/[scene]`
- `/app/history`
- `/app/store-profile`

## 已知问题

- 已补 D1 适配层；有 Cloudflare D1 绑定时读写 `survey_` 表，本地无法取得 D1 时使用内存数据便于预览。
- 直接上传 `.xlsx` 二进制文件暂未实现，当前采用 Excel 可打开 CSV 模板和 Excel 复制粘贴导入。
- `/cyrus` 已作为新系统总后台入口，旧 `/cyrus` 首页被替换；旧 `/cyrus/users`、`/cyrus/generations` 等旧后台子页文件仍保留。
- 正式域名、SSL、DNS 和 Cloudflare 路由问题按修订版要求留到第六阶段。

## 下一阶段开始前需要确认

- 第三阶段商户端是否直接替换根路径 `/`。
- 第一版真实商场名称。
- 真实门店基础资料 Excel。
- 真实营运账号名称和初始权限周期。
- 商户首次提交后的匿名编辑令牌是否只保存在当前浏览器 Cookie，还是同时提供“复制修改链接”能力。
