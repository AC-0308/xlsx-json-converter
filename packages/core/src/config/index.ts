import { createJiti } from "jiti";

import { SchemaConfigSchema } from "../schema/index.js";
import { createLogger } from "../utils/logger.js";
import { resolvePath } from "../utils/path.js";

import type { FieldConfig, FieldConfigInput, GlobalConfig, SchemaConfig } from "../schema/index.js";
import type { Logger } from "../utils/logger.js";

const defaultLogger = createLogger();

export const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  jsonFormat: "formatted",
  defaultArraySeparator: ",",
  defaultValidateStrategy: "warn",
};

export async function loadConfigFile(
  configPath: string,
  logger: Logger = defaultLogger,
): Promise<SchemaConfig> {
  const absolutePath = resolvePath(configPath);

  try {
    const jitiLoader = createJiti(import.meta.url);
    const config = (await jitiLoader.import(absolutePath)) as SchemaConfig;

    return validateConfig(config, logger);
  } catch (error) {
    const err = error as Error;
    logger.error("加载配置文件失败", err);
    throw new Error(`无法加载配置文件: ${absolutePath}\n${err.message}`);
  }
}

export function validateConfig(config: unknown, logger: Logger = defaultLogger): SchemaConfig {
  try {
    return SchemaConfigSchema.parse(config);
  } catch (error) {
    logger.error("配置文件校验失败", error as Error);
    throw error;
  }
}

export function mergeFieldWithDefaults(
  field: FieldConfigInput,
  globalConfig: GlobalConfig = DEFAULT_GLOBAL_CONFIG,
): FieldConfig & { arraySeparator: string; validateStrategy: "warn" | "error" } {
  return {
    ...field,
    required: field.required ?? false,
    arraySeparator: field.arraySeparator ?? globalConfig.defaultArraySeparator,
    validateStrategy: field.validateStrategy ?? globalConfig.defaultValidateStrategy,
  };
}

export function buildFieldKeyMap(fields: FieldConfig[]): Map<string, FieldConfig> {
  const map = new Map<string, FieldConfig>();
  for (const field of fields) {
    map.set(field.key, field);
  }
  return map;
}
