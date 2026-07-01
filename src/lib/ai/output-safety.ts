import type { SceneKey } from "../domain/scenes";
import { validateSceneSchema, type StructuredSceneOutput } from "./scene-schemas";

export type OutputSafetyErrorCode =
  | "empty_response"
  | "truncated_response"
  | "markdown_code_block"
  | "unsafe_html"
  | "code_content"
  | "stack_trace"
  | "api_error"
  | "system_prompt_leak"
  | "error_object"
  | "invalid_json"
  | "schema_invalid";

export type SafeSceneOutputResult =
  | {
      ok: true;
      cleanedContent: string;
      value: StructuredSceneOutput;
    }
  | {
      ok: false;
      errorCode: OutputSafetyErrorCode;
      errorMessage: string;
    };

type ValidateSceneOutputInput = {
  finishReason?: string;
  rawResponse: string;
  scene: SceneKey;
};

const unsafeChecks: Array<{
  code: OutputSafetyErrorCode;
  message: string;
  pattern: RegExp;
}> = [
  {
    code: "markdown_code_block",
    message: "模型返回了 Markdown 代码块。",
    pattern: /```/,
  },
  {
    code: "unsafe_html",
    message: "模型返回了 HTML 标签。",
    pattern: /<\/?[a-z][^>]*>/i,
  },
  {
    code: "stack_trace",
    message: "模型返回了错误堆栈。",
    pattern: /\b(?:TypeError|ReferenceError|SyntaxError|RangeError|Error):|\n\s*at\s+[^\n]+:\d+:\d+/i,
  },
  {
    code: "system_prompt_leak",
    message: "模型返回了系统提示词相关内容。",
    pattern: /system\s+prompt|developer\s+message|系统提示词|开发者消息|忽略(?:以上|之前).{0,12}(?:要求|指令)/i,
  },
  {
    code: "api_error",
    message: "模型返回了接口错误内容。",
    pattern: /\bAPI[_\s-]?error\b|\bHTTP\s*[45]\d{2}\b|\brate\s*limit(?:ed)?\b|\bunauthori[sz]ed\b|request\s+failed/i,
  },
  {
    code: "code_content",
    message: "模型返回了程序代码。",
    pattern:
      /(?:^|[\n\r"])[ \t]*(?:import\s+.+\s+from\s+|export\s+(?:default\s+|const\s+|function\s+|class\s+)|function\s+[A-Za-z_$][\w$]*\s*\(|(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=|class\s+[A-Za-z_$][\w$]*\s*[{])/i,
  },
];

export function validateAndCleanSceneOutput({
  finishReason,
  rawResponse,
  scene,
}: ValidateSceneOutputInput): SafeSceneOutputResult {
  const trimmed = rawResponse.trim();
  if (!trimmed) {
    return failure("empty_response", "模型没有返回有效内容。");
  }

  if (isTruncatedFinishReason(finishReason)) {
    return failure("truncated_response", "模型输出被截断。");
  }

  for (const check of unsafeChecks) {
    if (check.pattern.test(trimmed)) {
      return failure(check.code, check.message);
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    if (looksTruncated(trimmed)) {
      return failure("truncated_response", "模型输出是不完整的 JSON。");
    }
    return failure("invalid_json", "模型返回格式不是合法 JSON。");
  }

  if (looksLikeErrorObject(parsed)) {
    return failure("error_object", "模型返回了错误对象。");
  }

  const schemaResult = validateSceneSchema(scene, parsed);
  if (!schemaResult.ok) {
    return failure("schema_invalid", `模型返回字段不符合当前场景：${schemaResult.reason}`);
  }

  const nestedUnsafe = findUnsafeString(schemaResult.value);
  if (nestedUnsafe) {
    return failure(nestedUnsafe.code, nestedUnsafe.message);
  }

  return {
    ok: true,
    cleanedContent: JSON.stringify(schemaResult.value),
    value: schemaResult.value,
  };
}

function failure(errorCode: OutputSafetyErrorCode, errorMessage: string): SafeSceneOutputResult {
  return { errorCode, errorMessage, ok: false };
}

function isTruncatedFinishReason(finishReason?: string): boolean {
  return finishReason === "length" || finishReason === "max_tokens";
}

function looksTruncated(content: string): boolean {
  if (!content.startsWith("{") && !content.startsWith("[")) {
    return false;
  }
  return !hasBalancedJsonDelimiters(content) || !/[}\]]\s*$/.test(content);
}

function hasBalancedJsonDelimiters(content: string): boolean {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (const char of content) {
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{" || char === "[") {
      stack.push(char);
    } else if (char === "}" || char === "]") {
      const expected = char === "}" ? "{" : "[";
      if (stack.pop() !== expected) {
        return false;
      }
    }
  }

  return !inString && stack.length === 0;
}

function looksLikeErrorObject(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).map((key) => key.toLowerCase());
  if (keys.some((key) => ["error", "error_code", "errorcode", "stack", "trace"].includes(key))) {
    return true;
  }
  return keys.includes("message") && keys.some((key) => ["status", "statuscode", "code"].includes(key));
}

function findUnsafeString(value: StructuredSceneOutput): (typeof unsafeChecks)[number] | null {
  const strings: string[] = [];
  collectStrings(value, strings);
  for (const text of strings) {
    for (const check of unsafeChecks) {
      if (check.pattern.test(text)) {
        return check;
      }
    }
  }
  return null;
}

function collectStrings(value: StructuredSceneOutput | StructuredSceneOutput[string], output: string[]): void {
  if (typeof value === "string") {
    output.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, output);
    }
    return;
  }
  for (const item of Object.values(value)) {
    collectStrings(item, output);
  }
}
