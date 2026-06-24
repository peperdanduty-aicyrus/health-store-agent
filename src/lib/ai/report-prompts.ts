import type { SurveyAnonymizedReportInput } from "./report-types";
import { getReportSchemaInstruction } from "./report-schema";
import type { SurveyReportType } from "../survey/types";

const systemPrompt = [
  "你是商场营运经营分析助手。你的任务是根据系统已经计算完成的数据，生成可供商场营运人员审核的经营报告初稿。",
  "必须遵守：",
  "1. 所有数字均以输入 JSON 为准，禁止重新计算、修改、补造或估算。",
  "2. null 或缺失数据必须表述为“暂无数据”，不得推测。",
  "3. 不得把商户反馈的同城对标销售额描述为正式 POS 数据，只能称为“参考数据”。",
  "4. 分析门店下降原因时，优先讨论产品、库存、人员、客单价、连带率、会员复购、转化、陈列和活动执行等店铺可改善因素。",
  "5. 不得仅使用“大环境不好、商场客流下降、位置不好、天气不好”等笼统原因。",
  "6. 每个逐店建议必须对应具体数据、商户原因、预警或跟进记录。",
  "7. 语言客观、简洁、适合内部汇报，不使用夸张营销用语。",
  "8. 输入中的 store_id 是脱敏门店标识，原样输出，不猜测品牌名称。",
  "9. 严格按指定 JSON Schema 输出，不要输出 JSON 以外的文字。",
  "10. 输出字段名必须与目标JSON结构完全一致；不得输出 core_metrics、key_stores、next_month_actions 等自定义字段。",
  "11. 数字只能作为说明文字引用输入里的值，不得新建数值字段或自行计算百分比。",
].join("\n");

const taskPrompts: Record<SurveyReportType, string> = {
  full_analysis: "请生成完整经营分析报告内容，覆盖执行摘要、整体趋势、各业态、排名效率、增长下降原因、同城对标、重点门店、儿童游乐、教培、跟进进展、下月重点、口径限制。",
  leadership_brief: "请生成 1-2 页领导简报的结构化内容。重点是一句话结论、核心指标解释、3项以内亮点、3项以内风险、最多5家重点门店、3项下月营运重点。",
  oral_briefing: "请生成一份 800-1200 字、3-5 分钟的中文口头汇报稿。结构固定为：开场、整体情况、主要亮点、主要问题、重点门店、下月动作、结束。",
  store_analysis: "只分析指定门店。输出当前问题、数据依据、商户自报原因、营运判断、优先动作和下次复查重点。最多给出3个优先动作。",
};

export function buildSurveyReportPrompt(reportType: SurveyReportType, input: SurveyAnonymizedReportInput) {
  return [
    systemPrompt,
    "",
    taskPrompts[reportType],
    "",
    "目标 JSON 结构如下。最终回答必须只返回一个合法 JSON 对象，字段名、数组和对象层级必须与此结构一致：",
    getReportSchemaInstruction(reportType),
    "",
    "输入 JSON：",
    JSON.stringify(toDeepSeekInput(input), null, 2),
  ].join("\n");
}

function toDeepSeekInput(input: SurveyAnonymizedReportInput) {
  return {
    category_metrics: input.categoryMetrics.map((item) => ({
      category: item.category,
      down_store_count: item.downStoreCount,
      mom_rate: item.momRate,
      sales_wan: item.salesWan,
      target_completion_rate: item.targetCompletionRate,
      up_store_count: item.upStoreCount,
      yoy_rate: item.yoyRate,
    })),
    data_quality: {
      active_store_count: input.dataQuality.activeStoreCount,
      pos_coverage_rate: input.dataQuality.posCoverageRate,
      pos_store_count: input.dataQuality.posStoreCount,
      submission_rate: input.dataQuality.submissionRate,
      submitted_store_count: input.dataQuality.submittedStoreCount,
      yoy_available_store_count: input.dataQuality.yoyAvailableStoreCount,
    },
    mall_id: input.mallId,
    overall_metrics: {
      critical_store_count: input.overallMetrics.criticalStoreCount,
      mom_rate: input.overallMetrics.momRate,
      sales_wan: input.overallMetrics.salesWan,
      target_completion_rate: input.overallMetrics.targetCompletionRate,
      warning_count: input.overallMetrics.warningCount,
      yoy_rate: input.overallMetrics.yoyRate,
    },
    reason_statistics: {
      decline_reasons: input.reasonStatistics.declineReasons,
      growth_reasons: input.reasonStatistics.growthReasons,
    },
    report_month: input.periodMonth,
    special_metrics: input.specialMetrics,
    stores: input.stores.map((store) => ({
      category: store.category,
      follow_up_summary: store.followUpSummary.map((item) => ({
        status: item.status,
        subject: item.subject,
      })),
      merchant_input: {
        main_promotion: store.merchantInput.mainPromotion,
        next_action_plan: store.merchantInput.nextActionPlan,
        other_reason_text: store.merchantInput.otherReasonText,
        reason_codes: store.merchantInput.reasonCodes,
        self_rating: store.merchantInput.selfRating,
      },
      metrics: {
        effective_sales_wan: store.metrics.effectiveSalesWan,
        mom_rate: store.metrics.momRate,
        peer_gap_rate: store.metrics.peerGapRate,
        sales_per_sqm: store.metrics.salesPerSqm,
        sales_per_staff: store.metrics.salesPerStaff,
        sales_source: store.metrics.salesSource,
        self_pos_diff_rate: store.metrics.selfPosDiffRate,
        target_completion_rate: store.metrics.targetCompletionRate,
        yoy_rate: store.metrics.yoyRate,
      },
      peer_reference: {
        peer_average_sales_wan: store.peerReference.peerAverageSalesWan,
        peer_count: store.peerReference.peerCount,
        peer_gap_rate: store.peerReference.peerGapRate,
      },
      store_id: store.storeId,
      warning_flags: store.warningFlags,
    })),
  };
}
