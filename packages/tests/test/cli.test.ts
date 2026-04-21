import { execSync, spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

const tempDir = join(tmpdir(), "cli-tests");

async function setupTempDir() {
  await mkdir(tempDir, { recursive: true });
}

async function cleanupTempDir() {
  await rm(tempDir, { recursive: true, force: true });
}

async function createTestExcel(): Promise<string> {
  const testPath = join(tempDir, "test.xlsx");
  const workbook = XLSX.utils.book_new();
  const data = [
    ["name", "age", "active"],
    ["张三", 25, true],
    ["李四", 30, false],
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  await writeFile(testPath, buffer);
  return testPath;
}

async function createTestJson(): Promise<string> {
  const testPath = join(tempDir, "test.json");
  await writeFile(
    testPath,
    JSON.stringify([
      { name: "张三", age: 25, active: true },
      { name: "李四", age: 30, active: false },
    ]),
    "utf-8",
  );
  return testPath;
}

async function createTestConfig(): Promise<string> {
  const configPath = join(tempDir, "config.ts");
  await writeFile(
    configPath,
    `
export default {
  fields: [
    { key: "name", type: "string" },
    { key: "age", type: "number" },
    { key: "active", type: "boolean" },
  ],
};
    `,
    "utf-8",
  );
  return configPath;
}

function runCLI(args: string[]): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  const projectRoot = join(import.meta.dirname, "../../..");
  const cliPath = join(projectRoot, "packages/core/bin/cli.mjs");

  try {
    const stdout = execSync(`node "${cliPath}" ${args.join(" ")}`, {
      encoding: "utf-8",
      cwd: projectRoot,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 30000,
    });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as {
      stdout?: string;
      stderr?: string;
      status?: number;
    };
    return {
      stdout: execError.stdout || "",
      stderr: execError.stderr || "",
      exitCode: execError.status || 1,
    };
  }
}

describe("CLI 基础功能", () => {
  beforeEach(async () => {
    await setupTempDir();
    await createTestExcel();
    await createTestJson();
    await createTestConfig();
  });

  afterEach(async () => {
    await cleanupTempDir();
  });

  it("应正确显示帮助信息", () => {
    const result = runCLI(["--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("xlsx-json-converter");
    expect(result.stdout).toContain("-i");
    expect(result.stdout).toContain("-o");
    expect(result.stdout).toContain("-c");
  });

  it("应正确显示版本信息", () => {
    const result = runCLI(["--version"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("1.0.0");
  });
});

describe("CLI Excel 转 JSON", () => {
  beforeEach(async () => {
    await setupTempDir();
    await createTestExcel();
    await createTestConfig();
  });

  afterEach(async () => {
    await cleanupTempDir();
  });

  it("应正确执行 Excel 转 JSON", () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "output.json");
    const configPath = join(tempDir, "config.ts");

    const result = runCLI(["-i", inputPath, "-o", outputPath, "-c", configPath]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("转换完成");
  });

  it("应生成有效的 JSON 输出文件", async () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "output-valid.json");
    const configPath = join(tempDir, "config.ts");

    runCLI(["-i", inputPath, "-o", outputPath, "-c", configPath]);

    const content = await readFile(outputPath, "utf-8");
    const data = JSON.parse(content);

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
    expect(data[0].name).toBe("张三");
    expect(data[0].age).toBe(25);
  });

  it("应通过 --sheet-name 指定工作表", async () => {
    const inputPath = join(tempDir, "multi-sheet.xlsx");
    const outputPath = join(tempDir, "sheet-output.json");
    const configPath = join(tempDir, "config.ts");

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([["name"], ["Sheet1数据"]]),
      "Sheet1",
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([["name"], ["Sheet2数据"]]),
      "Sheet2",
    );
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    await writeFile(inputPath, buffer);

    runCLI(["-i", inputPath, "-o", outputPath, "-c", configPath, "--sheet-name", "Sheet2"]);

    const content = await readFile(outputPath, "utf-8");
    const data = JSON.parse(content);

    expect(data[0].name).toBe("Sheet2数据");
  });

  it("应通过 --sheet-index 指定工作表", async () => {
    const inputPath = join(tempDir, "multi-sheet.xlsx");
    const outputPath = join(tempDir, "index-output.json");
    const configPath = join(tempDir, "config.ts");

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([["name"], ["Sheet1数据"]]),
      "Sheet1",
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([["name"], ["Sheet2数据"]]),
      "Sheet2",
    );
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    await writeFile(inputPath, buffer);

    runCLI(["-i", inputPath, "-o", outputPath, "-c", configPath, "--sheet-index", "1"]);

    const content = await readFile(outputPath, "utf-8");
    const data = JSON.parse(content);

    expect(data[0].name).toBe("Sheet2数据");
  });

  it("同时传递 --sheet-name 和 --sheet-index 时应优先使用 --sheet-name", async () => {
    const inputPath = join(tempDir, "multi-sheet.xlsx");
    const outputPath = join(tempDir, "both-params.json");
    const configPath = join(tempDir, "config.ts");

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([["name"], ["Sheet1数据"]]),
      "Sheet1",
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([["name"], ["Sheet2数据"]]),
      "Sheet2",
    );
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    await writeFile(inputPath, buffer);

    runCLI([
      "-i",
      inputPath,
      "-o",
      outputPath,
      "-c",
      configPath,
      "--sheet-name",
      "Sheet2",
      "--sheet-index",
      "0",
    ]);

    const content = await readFile(outputPath, "utf-8");
    const data = JSON.parse(content);

    expect(data[0].name).toBe("Sheet2数据");
  });

  it("不传递 --sheet-name 和 --sheet-index 时应默认取第一个工作表", async () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "default-sheet.json");
    const configPath = join(tempDir, "config.ts");

    runCLI(["-i", inputPath, "-o", outputPath, "-c", configPath]);

    const content = await readFile(outputPath, "utf-8");
    const data = JSON.parse(content);

    expect(data[0].name).toBe("张三");
  });

  it("应输出日志到指定文件", async () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "log-output.json");
    const configPath = join(tempDir, "config.ts");
    const logPath = join(tempDir, "cli.log");

    runCLI(["-i", inputPath, "-o", outputPath, "-c", configPath, "--log", logPath]);

    const logContent = await readFile(logPath, "utf-8");
    expect(logContent).toContain("[INFO]");
    expect(logContent).toContain("[SUCCESS]");
  });
});

describe("CLI JSON 转 Excel", () => {
  beforeEach(async () => {
    await setupTempDir();
    await createTestJson();
    await createTestConfig();
  });

  afterEach(async () => {
    await cleanupTempDir();
  });

  it("应正确执行 JSON 转 Excel", () => {
    const inputPath = join(tempDir, "test.json");
    const outputPath = join(tempDir, "output.xlsx");
    const configPath = join(tempDir, "config.ts");

    const result = runCLI(["-i", inputPath, "-o", outputPath, "-c", configPath]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("转换完成");
  });

  it("应生成有效的 Excel 输出文件", async () => {
    const inputPath = join(tempDir, "test.json");
    const outputPath = join(tempDir, "output-valid.xlsx");
    const configPath = join(tempDir, "config.ts");

    runCLI(["-i", inputPath, "-o", outputPath, "-c", configPath]);

    const buffer = await readFile(outputPath);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<{
      name: string;
      age: number;
      active: boolean;
    }>(sheet);

    expect(data.length).toBe(2);
    expect(data[0].name).toBe("张三");
  });

  it("应正确输出 CSV 文件", async () => {
    const inputPath = join(tempDir, "test.json");
    const outputPath = join(tempDir, "output.csv");
    const configPath = join(tempDir, "config.ts");

    const result = runCLI(["-i", inputPath, "-o", outputPath, "-c", configPath]);

    expect(result.exitCode).toBe(0);

    const content = await readFile(outputPath, "utf-8");
    expect(content).toContain("name");
    expect(content).toContain("张三");
  });
});

describe("CLI 错误处理", () => {
  beforeEach(async () => {
    await setupTempDir();
    await createTestExcel();
    await createTestJson();
    await createTestConfig();
  });

  afterEach(async () => {
    await cleanupTempDir();
  });

  it("缺少必填参数 -i 应报错", () => {
    const outputPath = join(tempDir, "output.json");
    const configPath = join(tempDir, "config.ts");

    const result = runCLI(["-o", outputPath, "-c", configPath]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("required");
  });

  it("缺少必填参数 -o 应报错", () => {
    const inputPath = join(tempDir, "test.xlsx");
    const configPath = join(tempDir, "config.ts");

    const result = runCLI(["-i", inputPath, "-c", configPath]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("required");
  });

  it("缺少必填参数 -c 应报错", () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "output.json");

    const result = runCLI(["-i", inputPath, "-o", outputPath]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("required");
  });

  it("不存在的配置文件应报错", () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "output.json");
    const configPath = join(tempDir, "nonexistent.ts");

    const result = runCLI(["-i", inputPath, "-o", outputPath, "-c", configPath]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("失败");
  });

  it("不存在的输入文件应报错", () => {
    const inputPath = join(tempDir, "nonexistent.xlsx");
    const outputPath = join(tempDir, "output.json");
    const configPath = join(tempDir, "config.ts");

    const result = runCLI(["-i", inputPath, "-o", outputPath, "-c", configPath]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("失败");
  });

  it("不支持的输入格式应报错", async () => {
    const inputPath = join(tempDir, "invalid.txt");
    const outputPath = join(tempDir, "output.json");
    const configPath = join(tempDir, "config.ts");

    await writeFile(inputPath, "invalid content", "utf-8");

    const result = runCLI(["-i", inputPath, "-o", outputPath, "-c", configPath]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("不支持的输入文件格式");
  });

  it("Excel 输入但输出非 JSON 应报错", async () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "output.txt");
    const configPath = join(tempDir, "config.ts");

    const result = runCLI(["-i", inputPath, "-o", outputPath, "-c", configPath]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("只支持输出为 json 格式");
  });

  it("JSON 输入但输出非 xlsx/csv 应报错", async () => {
    const inputPath = join(tempDir, "test.json");
    const outputPath = join(tempDir, "output.txt");
    const configPath = join(tempDir, "config.ts");

    const result = runCLI(["-i", inputPath, "-o", outputPath, "-c", configPath]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("只支持输出为 xlsx 或 csv 格式");
  });

  it("无效的配置文件内容应报错", async () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "output.json");
    const configPath = join(tempDir, "invalid-config.ts");

    await writeFile(
      configPath,
      `
export default {
  fields: [],
};
    `,
      "utf-8",
    );

    const result = runCLI(["-i", inputPath, "-o", outputPath, "-c", configPath]);

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("失败");
  });
});

describe("CLI 转换方向判断", () => {
  beforeEach(async () => {
    await setupTempDir();
    await createTestExcel();
    await createTestJson();
    await createTestConfig();
  });

  afterEach(async () => {
    await cleanupTempDir();
  });

  it("输入 .xlsx 输出 .json 应执行 Excel → JSON", () => {
    const inputPath = join(tempDir, "test.xlsx");
    const outputPath = join(tempDir, "direction.json");
    const configPath = join(tempDir, "config.ts");

    const result = runCLI(["-i", inputPath, "-o", outputPath, "-c", configPath]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Excel → JSON");
  });

  it("输入 .xls 输出 .json 应执行 Excel → JSON", async () => {
    const inputPath = join(tempDir, "test.xls");
    const outputPath = join(tempDir, "xls-output.json");
    const configPath = join(tempDir, "config.ts");

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["name"], ["测试"]]), "Sheet1");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xls" });
    await writeFile(inputPath, buffer);

    const result = runCLI(["-i", inputPath, "-o", outputPath, "-c", configPath]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Excel → JSON");
  });

  it("输入 .csv 输出 .json 应执行 Excel → JSON", async () => {
    const inputPath = join(tempDir, "test.csv");
    const outputPath = join(tempDir, "csv-output.json");
    const configPath = join(tempDir, "config.ts");

    await writeFile(inputPath, "name,age\n张三,25\n李四,30", "utf-8");

    const result = runCLI(["-i", inputPath, "-o", outputPath, "-c", configPath]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Excel → JSON");
  });

  it("输入 .json 输出 .xlsx 应执行 JSON → Excel", () => {
    const inputPath = join(tempDir, "test.json");
    const outputPath = join(tempDir, "direction.xlsx");
    const configPath = join(tempDir, "config.ts");

    const result = runCLI(["-i", inputPath, "-o", outputPath, "-c", configPath]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("JSON → Excel");
  });

  it("输入 .json 输出 .csv 应执行 JSON → Excel", () => {
    const inputPath = join(tempDir, "test.json");
    const outputPath = join(tempDir, "direction.csv");
    const configPath = join(tempDir, "config.ts");

    const result = runCLI(["-i", inputPath, "-o", outputPath, "-c", configPath]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("JSON → Excel");
  });
});
