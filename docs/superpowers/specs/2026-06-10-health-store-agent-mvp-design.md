# 本地健康门店获客助手 MVP 设计

## 目标

构建一个独立的 Next.js 工具站，用于面向本地健康类门店提供 AI 获客文案生成、会员权限控制、生成记录和后台人工开通能力。项目独立于现有个人官网 `cyrus-store-growth`，后续部署到 `agent.81366776.xyz`，后台入口为 `/cyrus`。

## 范围

第一版包含：

- 公开首页：产品说明、适合门店、6 个功能、套餐价格、试用申请、个人微信二维码。
- 使用教程页：`/tutorial`。
- 客户登录：手机号 + 管理员设置的密码，不开放自主注册。
- 客户工作台：6 个文案功能、套餐锁定状态、剩余次数、历史记录。
- 文案生成：统一后端 API，先使用本地 mock provider，后续通过环境变量切换 Qwen。
- 敏感词检查：模型生成后本地扫描，只提示风险词和替代表达，不自动二次改写。
- 管理后台 `/cyrus`：管理员登录、数据概览、用户管理、试用申请管理、生成记录查看。
- 二维码：复用个人官网已有微信二维码文件。

第一版不包含：

- 自动支付。
- 用户自助注册。
- 短信验证码。
- 企业微信二维码。
- 自动二次改写。
- 多管理员权限体系。

## 技术方案

项目路径：

```text
/Users/lvminglei/Desktop/codexuse/health-store-agent
```

技术栈：

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase 设计表结构，开发阶段先用本地 mock 数据跑通流程
- AI provider 适配层，开发阶段使用 mock provider，拿到 Qwen API 后接入 Qwen

环境变量预留：

```env
AI_PROVIDER=mock
AI_MODEL=mock-health-copywriter
AI_API_KEY=
AI_BASE_URL=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

后续 Qwen 切换示例：

```env
AI_PROVIDER=qwen
AI_MODEL=qwen-plus
AI_API_KEY=xxx
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
```

## 信息架构

公开页面：

- `/`：首页 + 试用申请
- `/tutorial`：使用教程
- `/login`：客户登录

客户页面：

- `/app`：功能选择页
- `/app/generate/[scene]`：生成表单和结果
- `/app/history`：历史记录
- `/app/account`：套餐、到期时间、次数信息

管理员页面：

- `/cyrus`：后台首页和管理员登录入口
- `/cyrus/users`：用户管理
- `/cyrus/applications`：试用申请
- `/cyrus/generations`：生成记录

## 核心业务规则

门店类型固定展示：

1. 中医馆 / 中医诊所
2. 推拿馆 / 理疗馆 / 艾灸馆 / SPA 馆
3. 口腔门诊
4. 医院科室 / 综合门诊
5. 健康管理中心 / 体检中心
6. 宠物医院

套餐：

- 免费试用：0 元 / 3 天，每天 5 次，全部 6 个功能。
- 基础月卡：19 元 / 月，每天 30 次，小红书、朋友圈、公众号。
- 标准月卡：39 元 / 月，每天 30 次，全部 6 个功能。
- 内测年卡：168 元 / 年，每天 30 次，全部 6 个功能。
- 陪跑用户：人工沟通，后台自定义次数，默认全部功能。

会员状态：

- 免费试用
- 付费会员
- 已过期
- 已禁用

生成前校验：

1. 用户是否登录。
2. 用户是否被禁用。
3. 用户是否已过期。
4. 今日生成次数是否超过限制。
5. 当前套餐是否有该功能权限。

已过期用户可以登录、查看历史、复制历史内容，但不能生成新内容。

## 文案生成场景

第一版固定 6 个场景：

- 小红书文案
- 朋友圈文案
- 公众号文案
- 美团 / 点评团单文案
- 点评好评话术
- 私域成交话术

客户每次只填写：

- 项目名称
- 目标客户
- 宣传目的
- 补充信息

门店名称、门店类型、城市 / 区域、主营项目、门店优势由后台预设，生成时自动进入 prompt。

合规规则：

- 小红书、美团 / 点评、点评好评不写电话、微信、详细地址。
- 公众号可写“欢迎到店咨询”，但不默认写电话。
- 朋友圈可写“想了解可以私信我”，但不默认写手机号。
- 私域话术只做微信沟通话术，不额外暴露电话。
- 不夸大疗效，不承诺效果。

## 数据模型

开发阶段用 TypeScript 类型和本地 seed 数据模拟；上线前迁移到 Supabase。

核心表：

- `profiles`：用户、角色、门店资料、套餐、状态、到期时间、每日次数。
- `trial_applications`：试用申请线索。
- `generations`：每次生成记录、敏感词检查、复制状态、备注、模型信息。

密码上线前必须加密存储。开发 mock 阶段只用于本地演示，不作为生产存储方案。

## AI 适配层

业务代码只调用：

```ts
generateContent({
  userId,
  scene,
  storeProfile,
  input,
})
```

provider 目录：

```text
src/lib/ai/provider.ts
src/lib/ai/providers/mock.ts
src/lib/ai/providers/openai-compatible.ts
src/lib/ai/providers/qwen.ts
src/lib/ai/providers/deepseek.ts
src/lib/prompts/scenes.ts
src/lib/safety/sensitive-words.ts
```

当前没有 Qwen API，因此第一阶段 `AI_PROVIDER=mock`。需要真实模型联调时再配置 Qwen API。

## 二维码策略

复用现有个人官网二维码：

```text
/Users/lvminglei/Desktop/codexuse/cyrus-store-growth/public/images/wechat-qr.png
```

复制到新项目：

```text
public/images/wechat-qr.png
```

展示位置：

- 首页开通区域
- 试用申请成功提示
- 已过期提示
- 次数用完提示
- 套餐升级提示

统一话术：

```text
添加微信，人工开通体验权限。
```

不写“扫码付款”或“自动开通”。

## 验收标准

- 普通用户不能自己注册，只能管理员创建账号。
- 管理员可以通过 `/cyrus` 登录后台。
- 管理员可以新增用户、设置套餐、到期时间、每日次数和禁用状态。
- 免费试用用户每天 5 次，可用全部 6 个功能。
- 基础月卡用户每天 30 次，只能用小红书、朋友圈、公众号。
- 标准月卡和年卡用户每天 30 次，可用全部 6 个功能。
- 已过期用户可以登录和查看历史记录，但不能生成新内容。
- 用户可以一键复制生成结果。
- 系统记录生成类型、项目名称、目标客户、宣传目的、结果、复制状态、备注、模型名称。
- 敏感词检查能提示高风险词。
- 首页显示价格、试用申请、微信二维码。
- 代码支持后续从 mock 切换到 Qwen、DeepSeek 或其他 OpenAI-compatible API。
