import { z } from "zod";

export type FieldType = "string" | "number" | "boolean" | "array";

export type ValidateStrategy = "warn" | "error";

export type JsonFormat = "formatted" | "minified";

export type RegexPreset = "phone" | "idCard" | "email" | "url";

export const FieldSchema = z.object({
  key: z.string().min(1, "字段 key 不能为空"),
  type: z.enum(["string", "number", "boolean", "array"]),
  required: z.boolean().default(false),
  arraySeparator: z.string().optional(),
  enum: z.array(z.string()).optional(),
  regex: z.union([z.enum(["phone", "idCard", "email", "url"]), z.instanceof(RegExp)]).optional(),
  validateStrategy: z.enum(["warn", "error"]).optional(),
  serialize: z.custom<(value: unknown) => unknown>().optional(),
  deserialize: z.custom<(value: unknown) => unknown>().optional(),
});

export const GlobalConfigSchema = z.object({
  jsonFormat: z.enum(["formatted", "minified"]).default("formatted"),
  defaultArraySeparator: z.string().default(","),
  defaultValidateStrategy: z.enum(["warn", "error"]).default("warn"),
  logFilePath: z.string().optional(),
});

export const SchemaConfigSchema = z.object({
  global: GlobalConfigSchema.default({
    jsonFormat: "formatted",
    defaultArraySeparator: ",",
    defaultValidateStrategy: "warn",
  }),
  fields: z.array(FieldSchema).min(1, "fields 数组至少需要包含一个字段配置"),
});

export type FieldConfig = z.infer<typeof FieldSchema>;
export type FieldConfigInput = z.input<typeof FieldSchema>;

export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;
export type GlobalConfigInput = z.input<typeof GlobalConfigSchema>;

export type SchemaConfig = z.infer<typeof SchemaConfigSchema>;
export type SchemaConfigInput = z.input<typeof SchemaConfigSchema>;
