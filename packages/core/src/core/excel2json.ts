import { readFile } from "node:fs/promises";

import * as XLSX from "xlsx";

import { DEFAULT_GLOBAL_CONFIG, mergeFieldWithDefaults } from "../config/index.js";
import { createLogger } from "../utils/logger.js";
import { isExcelFile, resolvePath } from "../utils/path.js";
import { validateRegex } from "../utils/regex.js";

import type {
  FieldConfig,
  FieldConfigInput,
  GlobalConfig,
  SchemaConfigInput,
} from "../schema/index.js";
import type { Logger } from "../utils/logger.js";

export interface Excel2JsonOptions {
  input: string;
  output: string;
  config: SchemaConfigInput;
  sheetIndex?: number;
  sheetName?: string;
  logFilePath?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: unknown;
}

function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function parseCellValue(
  value: unknown,
  field: FieldConfig & { arraySeparator: string },
  _globalConfig: GlobalConfig,
): unknown {
  if (isEmptyValue(value)) {
    return undefined;
  }

  if (field.serialize) {
    return field.serialize(value);
  }

  const separator = field.arraySeparator;

  switch (field.type) {
    case "string":
      return String(value);
    case "number": {
      const num = Number(value);
      return Number.isNaN(num) ? undefined : num;
    }
    case "boolean": {
      if (typeof value === "boolean") return value;
      const strVal = String(value).toLowerCase().trim();
      if (strVal === "true" || strVal === "1" || strVal === "yes") return true;
      if (strVal === "false" || strVal === "0" || strVal === "no") return false;
      return undefined;
    }
    case "array": {
      const strVal = String(value);
      return strVal
        .split(separator)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    default:
      return value;
  }
}

function validateValue(
  value: unknown,
  field: FieldConfig & { validateStrategy: "warn" | "error" },
  rowIndex: number,
  errors: ValidationError[],
  logger: Logger,
): boolean {
  if (isEmptyValue(value)) {
    if (field.required) {
      const error: ValidationError = {
        row: rowIndex,
        field: field.key,
        message: `必填字段 "${field.key}" 为空`,
        value,
      };
      errors.push(error);
      if (field.validateStrategy === "error") {
        throw new Error(`第 ${rowIndex} 行: 必填字段 "${field.key}" 为空`);
      }
      logger.warn(`第 ${rowIndex} 行: 必填字段 "${field.key}" 为空`);
      return false;
    }
    return true;
  }

  if (field.enum && !field.enum.includes(String(value))) {
    const error: ValidationError = {
      row: rowIndex,
      field: field.key,
      message: `字段 "${field.key}" 的值 "${value}" 不在枚举范围内: ${field.enum.join(", ")}`,
      value,
    };
    errors.push(error);
    if (field.validateStrategy === "error") {
      throw new Error(`第 ${rowIndex} 行: ${error.message}`);
    }
    logger.warn(`第 ${rowIndex} 行: ${error.message}`);
    return false;
  }

  if (field.regex && typeof value === "string") {
    if (!validateRegex(value, field.regex)) {
      const error: ValidationError = {
        row: rowIndex,
        field: field.key,
        message: `字段 "${field.key}" 的值 "${value}" 不符合正则校验`,
        value,
      };
      errors.push(error);
      if (field.validateStrategy === "error") {
        throw new Error(`第 ${rowIndex} 行: ${error.message}`);
      }
      logger.warn(`第 ${rowIndex} 行: ${error.message}`);
      return false;
    }
  }

  return true;
}

export async function excel2Json(
  options: Excel2JsonOptions,
): Promise<{ data: Record<string, unknown>[]; errors: ValidationError[] }> {
  const { input, output, config, sheetIndex = 0, sheetName, logFilePath } = options;

  const globalConfig: GlobalConfig = { ...DEFAULT_GLOBAL_CONFIG, ...config.global };
  const logger = createLogger({ logFilePath });

  const inputPath = resolvePath(input);
  const outputPath = resolvePath(output);

  logger.info(`开始读取 Excel 文件: ${inputPath}`);

  if (!isExcelFile(inputPath)) {
    throw new Error(`不支持的输入文件格式: ${inputPath}`);
  }

  let workbook: XLSX.WorkBook;
  try {
    const fileBuffer = await readFile(inputPath);
    workbook = XLSX.read(fileBuffer, { type: "buffer" });
  } catch (error) {
    logger.error("读取 Excel 文件失败", error as Error);
    throw error;
  }

  let sheet: XLSX.WorkSheet;
  if (sheetName) {
    sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new Error(`工作表 "${sheetName}" 不存在`);
    }
  } else {
    const sheetNameByIndex = workbook.SheetNames[sheetIndex];
    if (!sheetNameByIndex) {
      throw new Error(`工作表索引 ${sheetIndex} 超出范围`);
    }
    sheet = workbook.Sheets[sheetNameByIndex];
  }

  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: undefined });
  logger.info(`成功读取 ${jsonData.length} 行数据`);

  if (jsonData.length === 0) {
    logger.warn("Excel 文件为空，输出空数组");
    return { data: [], errors: [] };
  }

  const errors: ValidationError[] = [];
  const fieldConfigs = config.fields.map((f: FieldConfigInput) =>
    mergeFieldWithDefaults(f, globalConfig),
  );
  const fieldKeyMap = new Map<string, (typeof fieldConfigs)[0]>();
  for (const field of fieldConfigs) {
    fieldKeyMap.set(field.key, field);
  }

  const result: Record<string, unknown>[] = [];

  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    const rowIndex = i + 2;
    const record: Record<string, unknown> = {};

    for (const field of fieldConfigs) {
      const rawValue = row[field.key];
      const parsedValue = parseCellValue(rawValue, field, globalConfig);
      validateValue(parsedValue, field, rowIndex, errors, logger);
      record[field.key] = parsedValue;
    }

    result.push(record);
  }

  const jsonOutput =
    globalConfig.jsonFormat === "minified"
      ? JSON.stringify(result)
      : JSON.stringify(result, null, 2);

  const { writeFile } = await import("node:fs/promises");
  await writeFile(outputPath, jsonOutput, "utf-8");

  logger.success(`成功转换并写入 JSON 文件: ${outputPath}`);
  logger.info(`共处理 ${result.length} 条记录，校验错误 ${errors.length} 条`);

  return { data: result, errors };
}
