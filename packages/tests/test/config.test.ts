import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildFieldKeyMap,
  DEFAULT_GLOBAL_CONFIG,
  loadConfigFile,
  mergeFieldWithDefaults,
  validateConfig,
} from "@glitches/xlsx-json-converter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FieldConfig, FieldConfigInput, GlobalConfig } from "@glitches/xlsx-json-converter";

describe("validateConfig - 配置验证", () => {
  it("应正确验证有效配置", () => {
    const config = {
      fields: [
        { key: "name", type: "string" as const },
        { key: "age", type: "number" as const },
      ],
    };

    const result = validateConfig(config);
    expect(result.fields).toHaveLength(2);
    expect(result.fields[0].key).toBe("name");
    expect(result.fields[1].key).toBe("age");
  });

  it("缺少 fields 时应抛出错误", () => {
    const config = {
      fields: [],
    };

    expect(() => validateConfig(config)).toThrow();
  });

  it("缺少 key 时应抛出错误", () => {
    const config = {
      fields: [{ type: "string" as const }],
    };

    expect(() => validateConfig(config)).toThrow();
  });

  it("应正确应用全局配置默认值", () => {
    const config = {
      fields: [{ key: "name", type: "string" as const }],
    };

    const result = validateConfig(config);
    expect(result.global.jsonFormat).toBe("formatted");
    expect(result.global.defaultArraySeparator).toBe(",");
    expect(result.global.defaultValidateStrategy).toBe("warn");
  });
});

describe("DEFAULT_GLOBAL_CONFIG - 默认全局配置", () => {
  it("应包含正确的默认值", () => {
    expect(DEFAULT_GLOBAL_CONFIG.jsonFormat).toBe("formatted");
    expect(DEFAULT_GLOBAL_CONFIG.defaultArraySeparator).toBe(",");
    expect(DEFAULT_GLOBAL_CONFIG.defaultValidateStrategy).toBe("warn");
  });
});

describe("mergeFieldWithDefaults - 字段配置合并", () => {
  it("应正确合并字段配置与默认值", () => {
    const field: FieldConfigInput = {
      key: "test",
      type: "string",
    };
    const globalConfig: GlobalConfig = {
      jsonFormat: "formatted",
      defaultArraySeparator: "|",
      defaultValidateStrategy: "error",
    };

    const result = mergeFieldWithDefaults(field, globalConfig);
    expect(result.arraySeparator).toBe("|");
    expect(result.validateStrategy).toBe("error");
  });

  it("字段特定值应优先于默认值", () => {
    const field: FieldConfigInput = {
      key: "test",
      type: "array",
      arraySeparator: ";",
      validateStrategy: "warn",
    };
    const globalConfig: GlobalConfig = {
      jsonFormat: "formatted",
      defaultArraySeparator: "|",
      defaultValidateStrategy: "error",
    };

    const result = mergeFieldWithDefaults(field, globalConfig);
    expect(result.arraySeparator).toBe(";");
    expect(result.validateStrategy).toBe("warn");
  });
});

describe("buildFieldKeyMap - 字段键映射构建", () => {
  it("应正确构建字段键映射", () => {
    const fields: FieldConfig[] = [
      { key: "name", type: "string", required: true },
      { key: "age", type: "number", required: false },
      { key: "active", type: "boolean", required: false },
    ];

    const map = buildFieldKeyMap(fields);

    expect(map.size).toBe(3);
    expect(map.get("name")).toEqual(fields[0]);
    expect(map.get("age")).toEqual(fields[1]);
    expect(map.get("active")).toEqual(fields[2]);
  });

  it("空字段数组应返回空映射", () => {
    const map = buildFieldKeyMap([]);
    expect(map.size).toBe(0);
  });

  it("重复键应保留最后一个", () => {
    const fields: FieldConfig[] = [
      { key: "name", type: "string", required: false },
      { key: "name", type: "number", required: true },
    ];

    const map = buildFieldKeyMap(fields);

    expect(map.size).toBe(1);
    expect(map.get("name")?.type).toBe("number");
  });
});

describe("loadConfigFile - 配置文件加载", () => {
  const tempDir = join(tmpdir(), "config-load-tests");

  beforeEach(async () => {
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("应正确加载有效的 TypeScript 配置文件", async () => {
    const configPath = join(tempDir, "valid.config.ts");
    await writeFile(
      configPath,
      `
export default {
  fields: [
    { key: "name", type: "string" },
    { key: "age", type: "number" },
  ],
};
    `,
      "utf-8",
    );

    const config = await loadConfigFile(configPath);

    expect(config.fields).toHaveLength(2);
    expect(config.fields[0].key).toBe("name");
    expect(config.fields[1].key).toBe("age");
  });

  it("应正确加载包含全局配置的文件", async () => {
    const configPath = join(tempDir, "global.config.ts");
    await writeFile(
      configPath,
      `
export default {
  global: {
    jsonFormat: "minified",
    defaultArraySeparator: ";",
    defaultValidateStrategy: "error",
  },
  fields: [
    { key: "id", type: "string" },
  ],
};
    `,
      "utf-8",
    );

    const config = await loadConfigFile(configPath);

    expect(config.global.jsonFormat).toBe("minified");
    expect(config.global.defaultArraySeparator).toBe(";");
    expect(config.global.defaultValidateStrategy).toBe("error");
  });

  it("不存在的配置文件应抛出错误", async () => {
    const configPath = join(tempDir, "nonexistent.config.ts");

    await expect(loadConfigFile(configPath)).rejects.toThrow();
  });

  it("无效的配置结构应抛出错误", async () => {
    const configPath = join(tempDir, "invalid.config.ts");
    await writeFile(
      configPath,
      `
export default {
  fields: [],
};
    `,
      "utf-8",
    );

    await expect(loadConfigFile(configPath)).rejects.toThrow();
  });

  it("缺少 fields 的配置应抛出错误", async () => {
    const configPath = join(tempDir, "missing-fields.config.ts");
    await writeFile(
      configPath,
      `
export default {
  global: {
    jsonFormat: "formatted",
  },
};
    `,
      "utf-8",
    );

    await expect(loadConfigFile(configPath)).rejects.toThrow();
  });

  it("语法错误的配置文件应抛出错误", async () => {
    const configPath = join(tempDir, "syntax-error.config.ts");
    await writeFile(
      configPath,
      `
export default {
  fields: [
    { key: "name", type: "string" }
    // 缺少闭合括号
  ,
};
    `,
      "utf-8",
    );

    await expect(loadConfigFile(configPath)).rejects.toThrow();
  });
});
