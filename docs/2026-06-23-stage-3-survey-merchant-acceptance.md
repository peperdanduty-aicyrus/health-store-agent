# 第三阶段验收说明：商户统一二维码填报端

日期：2026-06-23

## 1. 本阶段完成内容

- 完成商户统一填报端 `/survey`，并通过 Host 规则让 `survey.81366776.xyz/` 接管商户填报首页。
- 保留原健康门店主站根页面、旧 `/app`、`/login`、总后台 `/cyrus`、营运后台 `/yingyun`。
- 商户端不注册、不登录、不输入验证码、不填写姓名手机号、不按店铺编号搜索、不允许自建门店。
- 支持品牌/店铺名模糊搜索：中文、英文、大小写不敏感、符号空格规范化、别名、中英文混合。
- 完成门店确认、自动上月填报周期、1-8 日正常填报、9 日后逾期标记。
- 完成首次提交后 24 小时匿名编辑令牌：数据库只保存哈希，原始令牌只写当前浏览器 HttpOnly Cookie，不提供复制修改链接。
- 完成公共字段、七类业态专项字段、同城同质门店多行结构化填写、无同城门店勾选项。
- 完成同店同月唯一约束、公共搜索/提交限流、服务端状态和字段校验、修改日志。
- 表单字段优先从 `survey_form_fields` 配置记录读取；无配置时回退到集中默认字段定义，不复制七套页面。

## 2. 修改文件清单

- `next.config.ts`：survey 子域名根路径重写到 `/survey`。
- `middleware.ts`：保留 Host 级根路径隔离保护。
- `.gitignore`：忽略 `.wrangler/` 本地 D1 状态。
- `migrations/0002_survey_merchant_submission_guards.sql`
- `migrations/0003_survey_merchant_submission_fields.sql`
- `src/app/survey/page.tsx`
- `src/app/survey/merchant-actions.ts`
- `src/components/survey/MerchantSurveyForm.tsx`
- `src/lib/survey/merchant-form.ts`
- `src/lib/survey/merchant-token.ts`
- `src/lib/survey/merchant-cookie.ts`
- `src/lib/survey/rate-limit.ts`
- `src/lib/survey/host.ts`
- `src/lib/survey/store.ts`
- `src/lib/survey/store-d1.ts`
- `src/lib/survey/types.ts`
- `src/lib/survey/merchant.test.ts`
- `src/lib/survey/host.test.ts`

## 3. 新增数据库迁移

- `0002_survey_merchant_submission_guards.sql`：增加 `store_id + period_month` 唯一索引，防止同店同月重复主提交。
- `0003_survey_merchant_submission_fields.sql`：给 `survey_merchant_submissions` 增加 `category_name` 和 `field_values_json`，保存业态和动态字段值。

## 4. D1 持久化预检结果

- 已将 `0001`、`0002`、`0003` 应用到可持久化的本地 D1 兼容库：`.wrangler/state/v3/d1/survey-dev.sqlite`。
- 验证结果：`stores=1`、`aliases=1`、`staff=1`，刷新查询和重启流程后数据仍在。
- 表验证：`survey_tables=21`。
- session 隔离：只查到 `survey_staff_sessions`，未查到旧 `hsa_session` 同名/混用表。
- 唯一约束：`idx_survey_merchant_submissions_store_month` 存在。
- 当前机器限制：远程/预览 D1 需要 `CLOUDFLARE_API_TOKEN`；本机 macOS 12.6 无法运行新版 `workerd` 本地 D1，所以本阶段用持久化 SQLite D1 状态库完成预检。正式预览库迁移应在有 Cloudflare Token 的环境执行。

## 5. 商户统一入口访问方式

- 正式目标入口：`https://survey.81366776.xyz`
- 本地浏览器入口：`http://localhost:3000/survey`
- 本地 Host 验证方式：`curl -H 'Host: survey.81366776.xyz' http://localhost:3000/`
- 后台入口保持：`/yingyun` 和 `/cyrus`

## 6. 统一二维码生成方式

二维码只生成固定入口 URL：`https://survey.81366776.xyz`。

不要生成、展示或复制任何带编辑令牌的修改链接。

## 7-10. 搜索和确认页演示

- `mo`：返回 `Little MO&Co.`、`L2-201`、`儿童鞋服`。
- `江博士`：返回 `Dr.Kong／江博士`、`L3-302`、`儿童用品`。
- `honor`：返回 `荣耀honor`、`L1-101`、`3C数码`。
- 确认页显示：品牌、楼层铺位、业态、本次填写 `2026年05月`，不显示商场名称。

## 11-12. 七类业态和同城门店

测试门店覆盖：

- `survey_store_003`：3C数码，显示成交单数、主推产品库存占比等字段。
- `survey_store_001`：儿童鞋服，显示现有货品库存量、主推系列产品库存占比、库存状态。
- `survey_store_002`：儿童用品，显示现有货品库存量、库存状态。
- `survey_store_004`：家电及家用，显示成交单数、主推产品库存占比、库存状态。
- `survey_store_005`：美妆护肤，显示成交单数、现有库存量、库存状态。
- `survey_store_006`：儿童游乐，显示到店客流人数、会员充值金额。
- `survey_store_007`：教培，显示新增咨询线索数、当月在读学员数、会员充值金额。

同城同质门店保存到 `survey_city_peer_store_sales`，每行只有商场名称、对应月销售额；也支持“本地暂无其他同质门店”。

## 13-16. 提交、修改和日志

- 正常/逾期：由 `getCurrentSurveyPeriod()` 自动判断，2026-06-08 为正常，2026-06-09 起为逾期。
- 首次提交：生成高强度随机编辑令牌，DB 存 `sha256$...` 哈希，浏览器写 HttpOnly Cookie。
- 24 小时修改：当前浏览器持有效令牌时可修改。
- 无令牌/错令牌/超过 24 小时：不能覆盖，提示联系营运。
- 修改日志：写入 `survey_submission_change_logs`，包含普通字段和同城门店快照变化。

## 17. 移动端适配说明

- 页面为窄屏优先，最大宽度 3xl。
- 表单按经营基础数据、业态专项数据、同城同质门店分组。
- 数字字段使用 decimal 输入模式，单位在字段旁显示。
- 同城门店多行可新增/删除，底部提交按钮 sticky，提交中禁用按钮防重复点击。
- 同城门店草稿写入当前浏览器 `localStorage`，失败时页面保留已填内容。

## 18. 自动化测试结果

- 第三阶段相关测试：`src/lib/survey/merchant.test.ts`，9 项通过。
- 全量测试：12 个测试文件、76 项测试通过。
- 构建：`next build` 通过。

## 19. 旧系统未受影响验证

- `http://localhost:3000/` 只出现旧主站“本地健康门店”信号。
- `Host: survey.81366776.xyz` 的 `/` 只出现“月度经营数据填报”和搜索框信号。
- `/login`、`/cyrus`、`/yingyun`、`/app` 路由仍存在。

## 20. 已知问题

- 远程 Cloudflare D1 预览库未在本机执行迁移，原因是当前环境缺少 `CLOUDFLARE_API_TOKEN`。
- 正式 DNS、SSL 和 Cloudflare 路由按第三阶段说明保留到第六阶段。

## 21. 第四阶段开始前需要确认

- 确认真实商场名称、正式门店清单和别名表。
- 确认 Cloudflare D1 绑定名、预览库、生产库和迁移执行账号。
- 确认营运后台是否需要在第四阶段开放“重新开放更早月份”的 `monthly_period` 管理入口。
- 确认字段配置是否需要后台可视化维护，还是继续由技术侧维护 `survey_form_fields` 种子。
