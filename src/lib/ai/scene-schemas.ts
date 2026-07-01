import type { SceneKey } from "../domain/scenes";

export type StructuredValue = string | StructuredValue[] | { [key: string]: StructuredValue };
export type StructuredSceneOutput = Record<string, StructuredValue>;

type FieldSchema =
  | "string"
  | { array: "string" | { object: ObjectSchema } }
  | { object: ObjectSchema };

type ObjectSchema = Record<string, FieldSchema>;

const sceneSchemas: Record<SceneKey, ObjectSchema> = {
  xiaohongshu: {
    titles: { array: "string" },
    coverTexts: { array: "string" },
    body: "string",
    tags: { array: "string" },
    commentGuide: "string",
  },
  moments: {
    shortPosts: { array: "string" },
    longPosts: { array: "string" },
    imageIdeas: { array: "string" },
    closingGuide: "string",
  },
  official_account: {
    titles: { array: "string" },
    intro: "string",
    sections: { array: { object: { heading: "string", body: "string" } } },
    closingGuide: "string",
  },
  meituan_dianping: {
    titles: { array: "string" },
    subtitles: { array: "string" },
    targetUsers: { array: "string" },
    highlights: { array: "string" },
    purchaseNotes: { array: "string" },
    conversionScript: "string",
  },
  review_reply: {
    reviews: { array: "string" },
  },
  private_domain: {
    replies: { array: { object: { question: "string", answer: "string" } } },
    followUp: "string",
  },
  douyin_kuaishou: {
    videoTitles: { array: "string" },
    script15: {
      object: {
        opening3Seconds: "string",
        middleDisplay: "string",
        endingGuide: "string",
      },
    },
    script30: {
      object: {
        visualSuggestions: { array: "string" },
        spokenCopy: "string",
        subtitleSuggestions: { array: "string" },
      },
    },
    spokenCopy: "string",
    subtitleCopy: "string",
    commentGuides: { array: "string" },
  },
};

export type SceneSchemaValidation =
  | { ok: true; value: StructuredSceneOutput }
  | { ok: false; reason: string };

export function validateSceneSchema(scene: SceneKey, value: unknown): SceneSchemaValidation {
  const reason = validateObject(value, sceneSchemas[scene], "output");
  if (reason) {
    return { ok: false, reason };
  }
  return { ok: true, value: value as StructuredSceneOutput };
}

function validateObject(value: unknown, schema: ObjectSchema, path: string): string | null {
  if (!isPlainObject(value)) {
    return `${path} must be an object`;
  }

  const expectedKeys = Object.keys(schema);
  const actualKeys = Object.keys(value);
  const unknownKey = actualKeys.find((key) => !expectedKeys.includes(key));
  if (unknownKey) {
    return `${path}.${unknownKey} is not allowed`;
  }

  const missingKey = expectedKeys.find((key) => !(key in value));
  if (missingKey) {
    return `${path}.${missingKey} is required`;
  }

  for (const [key, fieldSchema] of Object.entries(schema)) {
    const reason = validateField(value[key], fieldSchema, `${path}.${key}`);
    if (reason) {
      return reason;
    }
  }

  return null;
}

function validateField(value: unknown, schema: FieldSchema, path: string): string | null {
  if (schema === "string") {
    return typeof value === "string" && value.trim() ? null : `${path} must be a non-empty string`;
  }

  if ("object" in schema) {
    return validateObject(value, schema.object, path);
  }

  if (!Array.isArray(value) || value.length === 0) {
    return `${path} must be a non-empty array`;
  }

  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];
    if (schema.array === "string") {
      if (typeof item !== "string" || !item.trim()) {
        return `${path}[${index}] must be a non-empty string`;
      }
    } else {
      const reason = validateObject(item, schema.array.object, `${path}[${index}]`);
      if (reason) {
        return reason;
      }
    }
  }

  return null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
