import process from "node:process";

import { Command } from "commander";

import { loadConfigFile } from "./config/index.js";
import { excel2Json, json2Excel } from "./core/index.js";
import { createLogger } from "./utils/logger.js";
import { getExtension, isExcelFile, isJsonFile, resolvePath } from "./utils/path.js";
const program = new Command();

program
  .name("xlsx-json-converter")
  .description("Excel ↔ JSON 双向转换 CLI 工具")
  .version("1.0.0")
  .requiredOption("-i, --input <path>", "输入文件路径")
  .requiredOption("-o, --output <path>", "输出文件路径")
  .requiredOption("-c, --config <path>", "Schema 配置文件路径")
  .option("--sheet-index <index>", "工作表索引（从 0 开始）", Number.parseInt)
  .option("--sheet-name <name>", "工作表名称")
  .option("--log <path>", "日志文件保存路径")
  .action(async (options) => {
    const logger = createLogger({ logFilePath: options.log });

    try {
      logger.info("加载配置文件...");
      const config = await loadConfigFile(options.config, logger);

      const inputPath = resolvePath(options.input);
      const outputPath = resolvePath(options.output);

      const isInputJson = isJsonFile(inputPath);
      const isInputExcel = isExcelFile(inputPath);
      const outputExt = getExtension(outputPath);

      if (isInputJson) {
        if (outputExt !== "xlsx" && outputExt !== "csv") {
          throw new Error("JSON 输入只支持输出为 xlsx 或 csv 格式");
        }
        logger.info("执行 JSON → Excel 转换");
        await json2Excel({
          input: inputPath,
          output: outputPath,
          config,
          sheetName: options.sheetName,
          logFilePath: options.log,
        });
      } else if (isInputExcel) {
        if (outputExt !== "json") {
          throw new Error("Excel 输入只支持输出为 json 格式");
        }
        logger.info("执行 Excel → JSON 转换");
        await excel2Json({
          input: inputPath,
          output: outputPath,
          config,
          sheetIndex: options.sheetIndex,
          sheetName: options.sheetName,
          logFilePath: options.log,
        });
      } else {
        throw new Error(`不支持的输入文件格式: ${inputPath}`);
      }

      logger.success("转换完成!");
    } catch (error) {
      const err = error as Error;
      logger.error("转换失败", err);
      process.exit(1);
    }
  });

export function run(): void {
  program.parse();
}
