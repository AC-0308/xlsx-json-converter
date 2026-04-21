import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { excel2Json, json2Excel } from "@glitches/xlsx-json-converter";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import type { SchemaConfigInput } from "@glitches/xlsx-json-converter";

const tempDir = join(tmpdir(), "xlsx-json-converter-tests");

async function setupTempDir() {
  await mkdir(tempDir, { recursive: true });
}

async function cleanupTempDir() {
  await rm(tempDir, { recursive: true, force: true });
}

async function createTestJson(): Promise<string> {
  const testPath = join(tempDir, "test.json");
  const data = [
    { name: "张三", age: 25, active: true, tags: "前端,Vue,TypeScript" },
    { name: "李四", age: 30, active: false, tags: "后端,Java,Go" },
    { name: "王五", age: 28, active: true, tags: "全栈,React,Node" },
  ];
  await writeFile(testPath, JSON.stringify(data), "utf-8");
  return testPath;
}

async function createTestExcel(): Promise<string> {
  const testPath = join(tempDir, "test.xlsx");
  const workbook = XLSX.utils.book_new();
  const data = [
    ["name", "age", "active", "tags", "email", "status"],
    ["张三", 25, true, "前端,Vue,TypeScript", "zhangsan@example.com", "active"],
    ["李四", 30, false, "后端,Java,Go", "lisi@example.com", "inactive"],
    ["王五", 28, true, "全栈,React,Node", "wangwu@example.com", "pending"],
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const extraSheet = XLSX.utils.aoa_to_sheet([
    ["id", "value"],
    ["1", "test1"],
    ["2", "test2"],
  ]);
  XLSX.utils.book_append_sheet(workbook, extraSheet, "ExtraSheet");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  await writeFile(testPath, buffer);
  return testPath;
}

async function createEmptyExcel(): Promise<string> {
  const testPath = join(tempDir, "empty.xlsx");
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([["name", "age"]]);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  await writeFile(testPath, buffer);
  return testPath;
}

async function createExcelWithEmptyFields(): Promise<string> {
  const testPath = join(tempDir, "empty-fields.xlsx");
  const workbook = XLSX.utils.book_new();
  const data = [
    ["name", "age", "email"],
    ["张三", "", ""],
    ["", 25, "test@example.com"],
    ["李四", 30, ""],
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  await writeFile(testPath, buffer);
  return testPath;
}

describe("json2excel - JSON 转 Excel 基础功能", () => {
  beforeEach(async () => {
    await setupTempDir();
    await createTestJson();
  });

  afterEach(async () => {
    await cleanupTempDir();
  });

  it("应正确将 JSON 转换为 Excel 文件", async () => {
    const inputPath = join(tempDir, "test.json");
    const outputPath = join(tempDir, "output.xlsx");
    const config: SchemaConfigInput = {
      fields: [
        { key: "name", type: "string" as const },
        { key: "age", type: "number" as const },
        { key: "active", type: "boolean" as const },
        { key: "tags", type: "array" as const },
      ],
    };

    const result = await json2Excel({
      input: inputPath,
      output: outputPath,
      config,
    });

    expect(result.success).toBe(true);
    expect(result.rowCount).toBe(3);
  });

  it("应正确将 JSON 转换为 CSV 文件", async () => {
    const inputPath = join(tempDir, "test.json");
    const outputPath = join(tempDir, "output.csv");
    const config: SchemaConfigInput = {
      fields: [
        { key: "name", type: "string" as const },
        { key: "age", type: "number" as const },
      ],
    };

    const result = await json2Excel({
      input: inputPath,
      output: outputPath,
      config,
    });

    expect(result.success).toBe(true);
  });

  it("应正确处理空 JSON 数组", async () => {
    const inputPath = join(tempDir, "empty.json");
    const outputPath = join(tempDir, "empty.xlsx");
    await writeFile(inputPath, "[]", "utf-8");

    const config: SchemaConfigInput = {
      fields: [{ key: "name", type: "string" as const }],
    };

    const result = await json2Excel({
      input: inputPath,
      output: outputPath,
      config,
    });

    expect(result.success).toBe(true);
    expect(result.rowCount).toBe(0);
  });
});

describe("json2excel - JSON 转 Excel 高级功能", () => {
  beforeEach(async () => {
    await setupTempDir();
    await createTestJson();
  });

  afterEach(async () => {
    await cleanupTempDir();
  });

  it("应正确处理单对象 JSON（非数组）", async () => {
    const inputPath = join(tempDir, "single-object.json");
    const outputPath = join(tempDir, "single.xlsx");
    await writeFile(inputPath, JSON.stringify({ name: "张三", age: 25, active: true }), "utf-8");

    const config: SchemaConfigInput = {
      fields: [
        { key: "name", type: "string" as const },
        { key: "age", type: "number" as const },
        { key: "active", type: "boolean" as const },
      ],
    };

    const result = await json2Excel({
      input: inputPath,
      output: outputPath,
      config,
    });

    expect(result.success).toBe(true);
    expect(result.rowCount).toBe(1);
  });

  it("应正确序列化布尔值为'是/否'", async () => {
    const inputPath = join(tempDir, "boolean.json");
    const outputPath = join(tempDir, "boolean.xlsx");
    await writeFile(
      inputPath,
      JSON.stringify([{ active: true }, { active: false }, { active: true }]),
      "utf-8",
    );

    const config: SchemaConfigInput = {
      fields: [{ key: "active", type: "boolean" as const }],
    };

    await json2Excel({
      input: inputPath,
      output: outputPath,
      config,
    });

    const workbook = XLSX.read(await readFile(outputPath), { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

    expect(data[1][0]).toBe("是");
    expect(data[2][0]).toBe("否");
    expect(data[3][0]).toBe("是");
  });

  it("应正确使用自定义 deserialize 函数", async () => {
    const inputPath = join(tempDir, "deserialize.json");
    const outputPath = join(tempDir, "deserialize.xlsx");
    await writeFile(
      inputPath,
      JSON.stringify([{ date: "2024-01-15" }, { date: "2024-06-20" }]),
      "utf-8",
    );

    const config: SchemaConfigInput = {
      fields: [
        {
          key: "date",
          type: "string" as const,
          deserialize: (value: unknown) => {
            return String(value).replace(/-/g, "/");
          },
        },
      ],
    };

    await json2Excel({
      input: inputPath,
      output: outputPath,
      config,
    });

    const workbook = XLSX.read(await readFile(outputPath), { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

    expect(data[1][0]).toBe("2024/01/15");
    expect(data[2][0]).toBe("2024/06/20");
  });

  it("应正确使用自定义工作表名称", async () => {
    const inputPath = join(tempDir, "test.json");
    const outputPath = join(tempDir, "custom-sheet.xlsx");
    const config: SchemaConfigInput = {
      fields: [{ key: "name", type: "string" as const }],
    };

    await json2Excel({
      input: inputPath,
      output: outputPath,
      config,
      sheetName: "自定义数据",
    });

    const workbook = XLSX.read(await readFile(outputPath), { type: "buffer" });
    expect(workbook.SheetNames).toContain("自定义数据");
  });

  it("非 JSON 文件应抛出错误", async () => {
    const inputPath = join(tempDir, "invalid.txt");
    const outputPath = join(tempDir, "invalid.xlsx");
    await writeFile(inputPath, "this is not json", "utf-8");

    const config: SchemaConfigInput = {
      fields: [{ key: "name", type: "string" as const }],
    };

    await expect(
      json2Excel({
        input: inputPath,
        output: outputPath,
        config,
      }),
    ).rejects.toThrow();
  });

  it("JSON 解析失败应抛出错误", async () => {
    const inputPath = join(tempDir, "malformed.json");
    const outputPath = join(tempDir, "malformed.xlsx");
    await writeFile(inputPath, "{ invalid json }", "utf-8");

    const config: SchemaConfigInput = {
      fields: [{ key: "name", type: "string" as const }],
    };

    await expect(
      json2Excel({
        input: inputPath,
        output: outputPath,
        config,
      }),
    ).rejects.toThrow();
  });

  it("应正确处理数组字段序列化", async () => {
    const inputPath = join(tempDir, "array.json");
    const outputPath = join(tempDir, "array.xlsx");
    await writeFile(
      inputPath,
      JSON.stringify([{ tags: ["前端", "Vue", "TypeScript"] }, { tags: ["后端", "Java", "Go"] }]),
      "utf-8",
    );

    const config: SchemaConfigInput = {
      fields: [{ key: "tags", type: "array" as const, arraySeparator: "|" }],
    };

    await json2Excel({
      input: inputPath,
      output: outputPath,
      config,
    });

    const workbook = XLSX.read(await readFile(outputPath), { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

    expect(data[1][0]).toBe("前端|Vue|TypeScript");
    expect(data[2][0]).toBe("后端|Java|Go");
  });
});

describe("excel2json - Excel 转 JSON 基础功能", () => {
  beforeAll(async () => {
    await setupTempDir();
    await createTestExcel();
  });

  afterAll(async () => {
    await cleanupTempDir();
  });

  it("应正确将 Excel 转换为 JSON，包含基础字段", async () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "output.json");
    const config: SchemaConfigInput = {
      fields: [
        { key: "name", type: "string" as const },
        { key: "age", type: "number" as const },
        { key: "active", type: "boolean" as const },
        { key: "tags", type: "array" as const },
      ],
    };

    const result = await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
    });

    expect(result.data).toBeDefined();
    expect(result.data.length).toBe(3);
    expect(result.data[0]).toHaveProperty("name");
    expect(result.data[0]).toHaveProperty("age");
    expect(result.data[0]).toHaveProperty("active");
    expect(result.data[0]).toHaveProperty("tags");

    const outputFile = await readFile(outputPath, "utf-8");
    const outputData = JSON.parse(outputFile);
    expect(Array.isArray(outputData)).toBe(true);
    expect(outputData[0].name).toBe("张三");
    expect(outputData[0].age).toBe(25);
    expect(outputData[0].active).toBe(true);
  });

  it("应正确处理数组类型字段，支持分隔符解析", async () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "output-array.json");
    const config: SchemaConfigInput = {
      fields: [
        { key: "name", type: "string" as const },
        { key: "tags", type: "array" as const, arraySeparator: "," },
      ],
    };

    const result = await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
    });

    expect(result.data).toBeDefined();
    expect(result.data[0].tags).toEqual(["前端", "Vue", "TypeScript"]);
  });

  it("应正确验证必填字段", async () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "output-validated.json");
    const config: SchemaConfigInput = {
      fields: [
        { key: "name", type: "string" as const, required: true },
        { key: "age", type: "number" as const, required: true },
      ],
    };

    const result = await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
    });

    expect(result.data).toBeDefined();
    expect(result.data.length).toBe(3);
  });
});

describe("excel2json - Excel 转 JSON 高级功能", () => {
  beforeEach(async () => {
    await setupTempDir();
    await createTestExcel();
    await createEmptyExcel();
    await createExcelWithEmptyFields();
  });

  afterEach(async () => {
    await cleanupTempDir();
  });

  it("应通过 sheetName 指定工作表", async () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "sheet-name.json");
    const config: SchemaConfigInput = {
      fields: [
        { key: "id", type: "string" as const },
        { key: "value", type: "string" as const },
      ],
    };

    const result = await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
      sheetName: "ExtraSheet",
    });

    expect(result.data.length).toBe(2);
    expect(result.data[0].id).toBe("1");
    expect(result.data[0].value).toBe("test1");
  });

  it("应通过 sheetIndex 指定工作表", async () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "sheet-index.json");
    const config: SchemaConfigInput = {
      fields: [
        { key: "id", type: "string" as const },
        { key: "value", type: "string" as const },
      ],
    };

    const result = await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
      sheetIndex: 1,
    });

    expect(result.data.length).toBe(2);
  });

  it("同时传递 sheetName 和 sheetIndex 时应优先使用 sheetName", async () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "both-params.json");
    const config: SchemaConfigInput = {
      fields: [
        { key: "id", type: "string" as const },
        { key: "value", type: "string" as const },
      ],
    };

    const result = await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
      sheetName: "ExtraSheet",
      sheetIndex: 0,
    });

    expect(result.data.length).toBe(2);
    expect(result.data[0].id).toBe("1");
    expect(result.data[0].value).toBe("test1");
  });

  it("不传递 sheetName 和 sheetIndex 时应默认取第一个工作表", async () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "default-sheet.json");
    const config: SchemaConfigInput = {
      fields: [
        { key: "name", type: "string" as const },
        { key: "age", type: "number" as const },
      ],
    };

    const result = await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
    });

    expect(result.data.length).toBe(3);
    expect(result.data[0].name).toBe("张三");
  });

  it("不存在的工作表名称应抛出错误", async () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "invalid-sheet.json");
    const config: SchemaConfigInput = {
      fields: [{ key: "name", type: "string" as const }],
    };

    await expect(
      excel2Json({
        input: inputPath,
        output: outputPath,
        config,
        sheetName: "NonExistentSheet",
      }),
    ).rejects.toThrow("工作表");
  });

  it("sheetIndex 越界应抛出错误", async () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "out-of-bounds.json");
    const config: SchemaConfigInput = {
      fields: [{ key: "name", type: "string" as const }],
    };

    await expect(
      excel2Json({
        input: inputPath,
        output: outputPath,
        config,
        sheetIndex: 999,
      }),
    ).rejects.toThrow("超出范围");
  });

  it("应正确校验枚举值", async () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "enum-validation.json");
    const config: SchemaConfigInput = {
      fields: [
        { key: "name", type: "string" as const },
        {
          key: "status",
          type: "string" as const,
          enum: ["active", "inactive", "pending"],
        },
      ],
    };

    const result = await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
    });

    expect(result.data.length).toBe(3);
    expect(result.errors.length).toBe(0);
  });

  it("枚举值不匹配应记录错误", async () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "enum-error.json");
    const config: SchemaConfigInput = {
      fields: [
        { key: "name", type: "string" as const },
        {
          key: "status",
          type: "string" as const,
          enum: ["active", "inactive"],
          validateStrategy: "warn",
        },
      ],
    };

    const result = await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
    });

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.field === "status")).toBe(true);
  });

  it("应正确校验正则表达式", async () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "regex-validation.json");
    const config: SchemaConfigInput = {
      fields: [
        { key: "name", type: "string" as const },
        { key: "email", type: "string" as const, regex: "email" },
      ],
    };

    const result = await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
    });

    expect(result.errors.length).toBe(0);
  });

  it("正则校验失败应记录错误", async () => {
    const inputPath = join(tempDir, "regex-test.xlsx");
    const outputPath = join(tempDir, "regex-error.json");

    const workbook = XLSX.utils.book_new();
    const data = [
      ["name", "phone"],
      ["张三", "invalid-phone"],
      ["李四", "13812345678"],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    await writeFile(inputPath, buffer);

    const config: SchemaConfigInput = {
      fields: [
        { key: "name", type: "string" as const },
        { key: "phone", type: "string" as const, regex: "phone" },
      ],
    };

    const result = await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
    });

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.field === "phone")).toBe(true);
  });

  it("validateStrategy 为 error 时应抛出异常", async () => {
    const inputPath = join(tempDir, "strict-validation.xlsx");
    const outputPath = join(tempDir, "strict-error.json");

    const workbook = XLSX.utils.book_new();
    const data = [
      ["name", "age"],
      ["张三", ""],
      ["李四", 25],
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    await writeFile(inputPath, buffer);

    const config: SchemaConfigInput = {
      global: {
        defaultValidateStrategy: "error",
      },
      fields: [
        { key: "name", type: "string" as const, required: true },
        { key: "age", type: "number" as const, required: true },
      ],
    };

    await expect(
      excel2Json({
        input: inputPath,
        output: outputPath,
        config,
      }),
    ).rejects.toThrow();
  });

  it("array + enum 应逐个元素校验", async () => {
    const inputPath = join(tempDir, "array-enum.xlsx");
    const outputPath = join(tempDir, "array-enum.json");

    const workbook = XLSX.utils.book_new();
    const data = [["tags"], ["前端,后端"], ["前端,未知"]];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    await writeFile(inputPath, buffer);

    const config: SchemaConfigInput = {
      fields: [
        {
          key: "tags",
          type: "array" as const,
          enum: ["前端", "后端", "全栈"],
          validateStrategy: "warn",
        },
      ],
    };

    const result = await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
    });

    expect(result.data[0].tags).toEqual(["前端", "后端"]);
    expect(result.data[1].tags).toEqual(["前端", "未知"]);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].message).toContain("未知");
  });

  it("array + regex 应逐个元素校验", async () => {
    const inputPath = join(tempDir, "array-regex.xlsx");
    const outputPath = join(tempDir, "array-regex.json");

    const workbook = XLSX.utils.book_new();
    const data = [["phones"], ["13812345678,13912345678"], ["13812345678,invalid"]];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    await writeFile(inputPath, buffer);

    const config: SchemaConfigInput = {
      fields: [
        {
          key: "phones",
          type: "array" as const,
          regex: "phone",
          validateStrategy: "warn",
        },
      ],
    };

    const result = await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
    });

    expect(result.data[0].phones).toEqual(["13812345678", "13912345678"]);
    expect(result.data[1].phones).toEqual(["13812345678", "invalid"]);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].message).toContain("invalid");
  });

  it("应正确使用自定义 serialize 函数", async () => {
    const inputPath = join(tempDir, "serialize-test.xlsx");
    const outputPath = join(tempDir, "serialize-output.json");

    const workbook = XLSX.utils.book_new();
    const data = [["date"], ["2024-01-15"], ["2024-06-20"]];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    await writeFile(inputPath, buffer);

    const config: SchemaConfigInput = {
      fields: [
        {
          key: "date",
          type: "string" as const,
          serialize: (value: unknown) => {
            return new Date(String(value)).toISOString();
          },
        },
      ],
    };

    const result = await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
    });

    expect(result.data[0].date).toContain("2024-01-15");
  });

  it("应输出压缩格式的 JSON (minified)", async () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "minified.json");
    const config: SchemaConfigInput = {
      global: {
        jsonFormat: "minified",
      },
      fields: [
        { key: "name", type: "string" as const },
        { key: "age", type: "number" as const },
      ],
    };

    await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
    });

    const content = await readFile(outputPath, "utf-8");
    expect(content).not.toContain("\n  ");
    expect(content.startsWith("[")).toBe(true);
    expect(content.endsWith("]")).toBe(true);
  });

  it("应输出格式化的 JSON (formatted)", async () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "formatted.json");
    const config: SchemaConfigInput = {
      global: {
        jsonFormat: "formatted",
      },
      fields: [
        { key: "name", type: "string" as const },
        { key: "age", type: "number" as const },
      ],
    };

    await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
    });

    const content = await readFile(outputPath, "utf-8");
    expect(content).toContain("\n");
    expect(content).toContain("  ");
  });

  it("空工作表应返回空数组", async () => {
    const inputPath = join(tempDir, "empty.xlsx");
    const outputPath = join(tempDir, "empty-output.json");
    const config: SchemaConfigInput = {
      fields: [
        { key: "name", type: "string" as const },
        { key: "age", type: "number" as const },
      ],
    };

    const result = await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
    });

    expect(result.data.length).toBe(0);
    expect(result.errors.length).toBe(0);
  });

  it("非 Excel 文件应抛出错误", async () => {
    const inputPath = join(tempDir, "invalid.txt");
    const outputPath = join(tempDir, "invalid-output.json");
    await writeFile(inputPath, "this is not an excel file", "utf-8");

    const config: SchemaConfigInput = {
      fields: [{ key: "name", type: "string" as const }],
    };

    await expect(
      excel2Json({
        input: inputPath,
        output: outputPath,
        config,
      }),
    ).rejects.toThrow("不支持的输入文件格式");
  });

  it("应正确处理必填字段为空的情况（warn 模式）", async () => {
    const inputPath = join(tempDir, "empty-fields.xlsx");
    const outputPath = join(tempDir, "empty-fields-output.json");

    const config: SchemaConfigInput = {
      fields: [
        { key: "name", type: "string" as const, required: true },
        { key: "age", type: "number" as const, required: true },
        { key: "email", type: "string" as const },
      ],
    };

    const result = await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
    });

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.message.includes("必填字段"))).toBe(true);
  });

  it("应正确处理布尔值的各种格式", async () => {
    const inputPath = join(tempDir, "boolean-values.xlsx");
    const outputPath = join(tempDir, "boolean-output.json");

    const workbook = XLSX.utils.book_new();
    const data = [["active"], ["true"], ["false"], ["yes"], ["no"], ["1"], ["0"], [true], [false]];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    await writeFile(inputPath, buffer);

    const config: SchemaConfigInput = {
      fields: [{ key: "active", type: "boolean" as const }],
    };

    const result = await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
    });

    expect(result.data[0].active).toBe(true);
    expect(result.data[1].active).toBe(false);
    expect(result.data[2].active).toBe(true);
    expect(result.data[3].active).toBe(false);
    expect(result.data[4].active).toBe(true);
    expect(result.data[5].active).toBe(false);
    expect(result.data[6].active).toBe(true);
    expect(result.data[7].active).toBe(false);
  });

  it("应正确处理数字转换失败的情况", async () => {
    const inputPath = join(tempDir, "invalid-number.xlsx");
    const outputPath = join(tempDir, "invalid-number-output.json");

    const workbook = XLSX.utils.book_new();
    const data = [["age"], ["25"], ["not-a-number"], ["30"]];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    await writeFile(inputPath, buffer);

    const config: SchemaConfigInput = {
      fields: [{ key: "age", type: "number" as const }],
    };

    const result = await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
    });

    expect(result.data[0].age).toBe(25);
    expect(result.data[1].age).toBeUndefined();
    expect(result.data[2].age).toBe(30);
  });

  it("应正确处理日志文件输出", async () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "log-output.json");
    const logPath = join(tempDir, "conversion.log");

    const config: SchemaConfigInput = {
      fields: [
        { key: "name", type: "string" as const },
        { key: "age", type: "number" as const },
      ],
    };

    await excel2Json({
      input: inputPath,
      output: outputPath,
      config,
      logFilePath: logPath,
    });

    const logContent = await readFile(logPath, "utf-8");
    expect(logContent).toContain("[INFO]");
    expect(logContent).toContain("[SUCCESS]");
  });
});
