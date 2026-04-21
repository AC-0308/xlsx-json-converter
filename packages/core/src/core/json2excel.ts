import { readFile, writeFile } from "node:fs/promises";

import * as XLSX from "xlsx";

import { DEFAULT_GLOBAL_CONFIG, mergeFieldWithDefaults } from "../config/index.js";
import { createLogger } from "../utils/logger.js";
import { getExtension, isJsonFile, resolvePath } from "../utils/path.js";

import type {
  FieldConfig,
  FieldConfigInput,
  GlobalConfig,
  SchemaConfigInput,
} from "../schema/index.js";

export interface Json2ExcelOptions {
  input: string;
  output: string;
  config: SchemaConfigInput;
  sheetName?: string;
  logFilePath?: string;
}

function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function serializeValue(value: unknown, field: FieldConfig & { arraySeparator: string }): unknown {
  if (isEmptyValue(value)) {
    return "";
  }

  if (field.deserialize) {
    return field.deserialize(value);
  }

  const separator = field.arraySeparator;

  switch (field.type) {
    case "string":
      return String(value);
    case "number":
      return value;
    case "boolean":
      return value ? "是" : "否";
    case "array": {
      if (Array.isArray(value)) {
        return value.join(separator);
      }
      return String(value);
    }
    default:
      return value;
  }
}

export async function json2Excel(
  options: Json2ExcelOptions,
): Promise<{ success: boolean; rowCount: number }> {
  const { input, output, config, sheetName = "Sheet1", logFilePath } = options;

  const globalConfig: GlobalConfig = { ...DEFAULT_GLOBAL_CONFIG, ...config.global };
  const logger = createLogger({ logFilePath });

  const inputPath = resolvePath(input);
  const outputPath = resolvePath(output);

  logger.info(`开始读取 JSON 文件: ${inputPath}`);

  if (!isJsonFile(inputPath)) {
    throw new Error(`不支持的输入文件格式: ${inputPath}`);
  }

  let jsonData: Record<string, unknown>[];
  try {
    const fileContent = await readFile(inputPath, "utf-8");
    const parsed = JSON.parse(fileContent);
    jsonData = Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    logger.error("解析 JSON 文件失败", error as Error);
    throw error;
  }

  logger.info(`成功读取 ${jsonData.length} 条 JSON 数据`);

  if (jsonData.length === 0) {
    logger.warn("JSON 数据为空，输出空 Excel 文件");
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([config.fields.map((f: FieldConfigInput) => f.key)]);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    await writeFile(outputPath, buffer);
    return { success: true, rowCount: 0 };
  }

  const fieldConfigs = config.fields.map((f: FieldConfigInput) =>
    mergeFieldWithDefaults(f, globalConfig),
  );
  const headers = fieldConfigs.map((f: (typeof fieldConfigs)[0]) => f.key);

  const rows: unknown[][] = [headers];

  for (const item of jsonData) {
    const row: unknown[] = [];

    for (const field of fieldConfigs) {
      const rawValue = item[field.key];
      const serializedValue = serializeValue(rawValue, field);
      row.push(serializedValue);
    }

    rows.push(row);
  }

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const ext = getExtension(outputPath);
  const bookType = ext === "csv" ? "csv" : "xlsx";
  const buffer = XLSX.write(workbook, { type: "buffer", bookType });

  await writeFile(outputPath, buffer);

  logger.success(`成功转换并写入 Excel 文件: ${outputPath}`);
  logger.info(`共处理 ${jsonData.length} 条记录`);

  return { success: true, rowCount: jsonData.length };
}
