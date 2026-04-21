import { FieldSchema, GlobalConfigSchema, SchemaConfigSchema } from "@glitches/xlsx-json-converter";
import { describe, expect, it } from "vitest";

describe("Schema 验证", () => {
  describe("FieldSchema - 字段配置验证", () => {
    it("应接受有效的完整字段配置", () => {
      const result = FieldSchema.safeParse({
        key: "username",
        type: "string",
        required: true,
        arraySeparator: ",",
        enum: ["admin", "user", "guest"],
        regex: "email",
        validateStrategy: "warn",
      });

      expect(result.success).toBe(true);
    });

    it("应接受最小字段配置（仅必填项）", () => {
      const result = FieldSchema.safeParse({
        key: "name",
        type: "string",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.key).toBe("name");
        expect(result.data.type).toBe("string");
        expect(result.data.required).toBe(false);
      }
    });

    it("应支持所有字段类型", () => {
      const types = ["string", "number", "boolean", "array"];

      for (const type of types) {
        const result = FieldSchema.safeParse({
          key: "field",
          type,
        });
        expect(result.success).toBe(true);
      }
    });

    it("无效类型应验证失败", () => {
      const result = FieldSchema.safeParse({
        key: "field",
        type: "invalid",
      });

      expect(result.success).toBe(false);
    });

    it("缺少 key 应验证失败", () => {
      const result = FieldSchema.safeParse({
        type: "string",
      });

      expect(result.success).toBe(false);
    });

    it("空 key 应验证失败", () => {
      const result = FieldSchema.safeParse({
        key: "",
        type: "string",
      });

      expect(result.success).toBe(false);
    });

    it("缺少 type 应验证失败", () => {
      const result = FieldSchema.safeParse({
        key: "field",
      });

      expect(result.success).toBe(false);
    });

    it("应接受正则预设值", () => {
      const presets = ["phone", "idCard", "email", "url"];

      for (const preset of presets) {
        const result = FieldSchema.safeParse({
          key: "field",
          type: "string",
          regex: preset,
        });
        expect(result.success).toBe(true);
      }
    });

    it("应接受自定义正则表达式", () => {
      const result = FieldSchema.safeParse({
        key: "field",
        type: "string",
        regex: /^[A-Z]{3}\d{3}$/,
      });

      expect(result.success).toBe(true);
    });

    it("应接受 serialize 和 deserialize 函数", () => {
      const result = FieldSchema.safeParse({
        key: "date",
        type: "string",
        serialize: (v: unknown) => String(v).toUpperCase(),
        deserialize: (v: unknown) => String(v).toLowerCase(),
      });

      expect(result.success).toBe(true);
    });

    it("validateStrategy 应只接受 warn 或 error", () => {
      const warnResult = FieldSchema.safeParse({
        key: "field",
        type: "string",
        validateStrategy: "warn",
      });
      expect(warnResult.success).toBe(true);

      const errorResult = FieldSchema.safeParse({
        key: "field",
        type: "string",
        validateStrategy: "error",
      });
      expect(errorResult.success).toBe(true);

      const invalidResult = FieldSchema.safeParse({
        key: "field",
        type: "string",
        validateStrategy: "invalid",
      });
      expect(invalidResult.success).toBe(false);
    });

    it("enum 应接受字符串数组", () => {
      const result = FieldSchema.safeParse({
        key: "status",
        type: "string",
        enum: ["active", "inactive", "pending"],
      });

      expect(result.success).toBe(true);
    });
  });

  describe("GlobalConfigSchema - 全局配置验证", () => {
    it("应接受有效的全局配置", () => {
      const result = GlobalConfigSchema.safeParse({
        jsonFormat: "formatted",
        defaultArraySeparator: ",",
        defaultValidateStrategy: "warn",
        logFilePath: "/var/log/converter.log",
      });

      expect(result.success).toBe(true);
    });

    it("应应用默认值", () => {
      const result = GlobalConfigSchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.jsonFormat).toBe("formatted");
        expect(result.data.defaultArraySeparator).toBe(",");
        expect(result.data.defaultValidateStrategy).toBe("warn");
      }
    });

    it("jsonFormat 应只接受 formatted 或 minified", () => {
      const formattedResult = GlobalConfigSchema.safeParse({
        jsonFormat: "formatted",
      });
      expect(formattedResult.success).toBe(true);

      const minifiedResult = GlobalConfigSchema.safeParse({
        jsonFormat: "minified",
      });
      expect(minifiedResult.success).toBe(true);

      const invalidResult = GlobalConfigSchema.safeParse({
        jsonFormat: "invalid",
      });
      expect(invalidResult.success).toBe(false);
    });

    it("defaultValidateStrategy 应只接受 warn 或 error", () => {
      const warnResult = GlobalConfigSchema.safeParse({
        defaultValidateStrategy: "warn",
      });
      expect(warnResult.success).toBe(true);

      const errorResult = GlobalConfigSchema.safeParse({
        defaultValidateStrategy: "error",
      });
      expect(errorResult.success).toBe(true);

      const invalidResult = GlobalConfigSchema.safeParse({
        defaultValidateStrategy: "invalid",
      });
      expect(invalidResult.success).toBe(false);
    });

    it("logFilePath 应为可选", () => {
      const result = GlobalConfigSchema.safeParse({
        jsonFormat: "formatted",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logFilePath).toBeUndefined();
      }
    });
  });

  describe("SchemaConfigSchema - 完整配置验证", () => {
    it("应接受有效的完整配置", () => {
      const result = SchemaConfigSchema.safeParse({
        global: {
          jsonFormat: "minified",
          defaultArraySeparator: ";",
          defaultValidateStrategy: "error",
        },
        fields: [
          { key: "name", type: "string", required: true },
          { key: "age", type: "number" },
          { key: "active", type: "boolean" },
          { key: "tags", type: "array", arraySeparator: "," },
        ],
      });

      expect(result.success).toBe(true);
    });

    it("应使用默认全局配置", () => {
      const result = SchemaConfigSchema.safeParse({
        fields: [{ key: "name", type: "string" }],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.global.jsonFormat).toBe("formatted");
        expect(result.data.global.defaultArraySeparator).toBe(",");
        expect(result.data.global.defaultValidateStrategy).toBe("warn");
      }
    });

    it("fields 为空数组应验证失败", () => {
      const result = SchemaConfigSchema.safeParse({
        fields: [],
      });

      expect(result.success).toBe(false);
    });

    it("缺少 fields 应验证失败", () => {
      const result = SchemaConfigSchema.safeParse({
        global: {
          jsonFormat: "formatted",
        },
      });

      expect(result.success).toBe(false);
    });

    it("空对象应验证失败", () => {
      const result = SchemaConfigSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it("fields 应至少包含一个字段", () => {
      const result = SchemaConfigSchema.safeParse({
        fields: [],
      });

      expect(result.success).toBe(false);
    });
  });
});
