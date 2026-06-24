# 第四阶段验收说明：营运数据后台、POS、趋势预警与跟进

日期：2026-06-23

## 1. 完成内容

- 已按资料包最高指令读取并使用 `商场门店基础资料表_营运确认精简版_45家.xlsx` 作为最终门店数据源。
- 已将商户端、营运后台、D1本地库从旧测试门店切换到45家真实启用门店。
- 已归档撤店：`SKECHERS Kids`、`荣泰`、`燕之屋`、`小主生活`。
- 已实现子业态展示和七类内部表单类型映射：页面显示“所属子业态”，表单/分析使用内部七类。
- 已补强第三阶段遗留：整张商户表单草稿恢复、按 `store_id + period_month` 隔离、提交成功清理草稿。
- 已新增确定性指标模块：有效销售额、环比、同比、目标完成率、坪效、人效、自报POS差异、儿童游乐和教培专项指标。
- 已新增11项启用预警逻辑，W09合同临期禁用。
- 已开发营运后台路由：`/yingyun`、`/yingyun/submissions`、`/yingyun/pos`、`/yingyun/trends`、`/yingyun/warnings`、`/yingyun/stores`、`/yingyun/stores/[id]`、`/yingyun/follow-ups`、`/yingyun/periods`、`/yingyun/exports`。
- 未接入DeepSeek，未生成AI报告，未进入第五阶段。

## 2. 主要修改文件

- 新增：`src/lib/survey/real-store-data.ts`
- 新增：`src/lib/survey/analytics.ts`
- 新增：`src/lib/survey/operator-data.ts`
- 新增：`src/lib/survey/real-store-import.test.ts`
- 新增：`src/lib/survey/analytics.test.ts`
- 新增：`src/components/survey/ClearSurveyDraft.tsx`
- 修改：`src/components/survey/MerchantSurveyForm.tsx`
- 修改：`src/app/survey/page.tsx`
- 修改：`src/lib/survey/store.ts`
- 修改：`src/lib/survey/store-d1.ts`
- 修改：`src/lib/survey/types.ts`
- 修改：`src/lib/survey/merchant.test.ts`
- 新增营运后台页面：`src/app/yingyun/**`

## 3. 数据库迁移

- 新增：`migrations/0004_survey_stage4_operations.sql`
- 内容：阶段4门店资料补充表、月度指标快照表、预警记录表、POS/指标/门店索引。
- 为保证本机SQLite和D1兼容，未使用不可重复执行的 `ALTER TABLE ADD COLUMN`，改用幂等补充表。

## 4. 45家门店导入结果

本地持久化D1兼容库：`.wrangler/state/v3/d1/survey-dev.sqlite`

- 启用门店：45
- 启用门店搜索别名：65
- 重复店铺编号：0
- 缺失面积：0
- 员工人数为空或0：0
- 阶段4门店资料补充记录：45

各子业态数量：

- 3C数码：10
- 儿童鞋服：13
- 儿童用品：1
- 家电：4
- 家用精品：2
- 日用杂货：2
- 美妆护肤：4
- 儿童游乐：6
- 教培：3

## 5. 撤店处理

`SKECHERS Kids`、`荣泰`、`燕之屋`、`小主生活` 已按 `archived` 归档处理，不进入商户搜索、应填数量和营运分析。

## 6. 搜索别名测试

- `mo`：返回 `little MO&Co.`，铺位 `L04`，子业态 `儿童鞋服`。
- `honor`：返回 `荣耀honor`。
- `江博士`：返回 `Dr.Kong／江博士`。
- 公开搜索未返回面积、员工人数、内部状态、备注等内部字段。

## 7. POS、指标和预警

- POS复制粘贴：`parsePosPaste()` 支持Excel一列和多列粘贴，非法单元格转为空值。
- 有POS时有效销售额取POS；无POS时取商户自报；两者都无时为 `missing`。
- 分母为空或0时，环比、同比、目标完成率、坪效、人效、自报差异比例返回空值，不误显示为0。
- W09合同临期已禁用；启用预警不包含W09。

## 8. 门店详情和跟进

- 门店详情页包含基础资料、当前月POS/指标、预警、12个月趋势。
- 跟进页展示今日待跟进、逾期未跟进、待复查和负责人。
- 月份页展示当前自动月份、正常截止、重新开放/提前关闭/全量重算入口。

## 9. 测试和构建

- 全量自动化测试：14个测试文件、86项测试通过。
- 生产构建：`next build` 通过。
- 新增核心测试覆盖：45店导入、撤店归档、子业态映射、公开搜索隐私、POS优先级、缺失值、环比同比、坪效人效、差异比例、11项预警、儿童游乐指标、教培指标、跟进提醒。

## 10. 旧系统回归

- `http://localhost:3000/` 仍是旧“本地健康门店”首页。
- `Host: survey.81366776.xyz` 的 `/` 进入商户填报端。
- `/survey?q=mo` 返回真实45店中的 `little MO&Co.`。
- `/yingyun`、`/yingyun/pos`、`/yingyun/warnings`、`/yingyun/stores` 返回200。

## 11. 本地和正式访问方式

- 本地商户端：`http://localhost:3000/survey`
- 本地营运后台：`http://localhost:3000/yingyun`
- 本地总后台：`http://localhost:3000/cyrus`
- 正式商户端目标：`https://survey.81366776.xyz`
- 正式营运后台目标：`https://survey.81366776.xyz/yingyun`
- 正式总后台目标：`https://survey.81366776.xyz/cyrus`

## 12. 可复制命令

启动：

```bash
cd /Users/lvminglei/Desktop/codexuse/health-store-agent
/Users/lvminglei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/next/dist/bin/next dev -p 3000
```

测试：

```bash
cd /Users/lvminglei/Desktop/codexuse/health-store-agent
/Users/lvminglei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/vitest/vitest.mjs run
```

构建：

```bash
cd /Users/lvminglei/Desktop/codexuse/health-store-agent
/Users/lvminglei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/next/dist/bin/next build
```

本地D1兼容库迁移：

```bash
cd /Users/lvminglei/Desktop/codexuse/health-store-agent
sqlite3 .wrangler/state/v3/d1/survey-dev.sqlite < migrations/0004_survey_stage4_operations.sql
```

远程D1预览迁移：

```bash
CLOUDFLARE_API_TOKEN=你的token npx wrangler d1 execute health-store-agent-db --remote --file=migrations/0001_survey_core.sql
CLOUDFLARE_API_TOKEN=你的token npx wrangler d1 execute health-store-agent-db --remote --file=migrations/0002_survey_merchant_submission_guards.sql
CLOUDFLARE_API_TOKEN=你的token npx wrangler d1 execute health-store-agent-db --remote --file=migrations/0003_survey_merchant_submission_fields.sql
CLOUDFLARE_API_TOKEN=你的token npx wrangler d1 execute health-store-agent-db --remote --file=migrations/0004_survey_stage4_operations.sql
```

生产D1迁移需先确认生产库名后执行同样 `wrangler d1 execute <生产库名> --remote --file=...`。

## 13. 已知问题

- 当前环境没有 `CLOUDFLARE_API_TOKEN`，远程/生产D1未执行迁移。
- POS保存、月份重新开放、跟进新增和导出下载已完成页面与确定性逻辑骨架；第一版仍以本地确定性数据集演示，后续可继续接入D1持久化写操作。
- 字段字典中完整73字段已读取；当前商户字段仍沿用第三阶段集中字段定义并保留 `survey_form_fields` 配置读取，未把73字段全部替换进表单。

## 14. 第五阶段前待确认

- 确认远程D1库名、生产D1库名和Cloudflare Token。
- 确认POS、跟进、月份重开是否必须在第四阶段验收前全部写入远程D1，还是本地试运行后再接入。
- 确认导出第一版是否接受CSV，还是必须在Cloudflare环境生成XLSX。
- 确认是否将字段字典73字段全部替换当前商户端字段。
