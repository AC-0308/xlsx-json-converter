import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import chalk from "chalk";

export type LogLevel = "info" | "success" | "warn" | "error";

export interface LoggerOptions {
  logFilePath?: string;
}

export class Logger {
  private logFilePath?: string;

  constructor(options?: LoggerOptions) {
    this.logFilePath = options?.logFilePath;
  }

  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString();
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = this.getTimestamp();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  private async writeToFile(formattedMessage: string): Promise<void> {
    if (!this.logFilePath) return;

    try {
      const dir = dirname(this.logFilePath);
      await mkdir(dir, { recursive: true });
      await appendFile(this.logFilePath, `${formattedMessage}\n`, "utf-8");
    } catch (error) {
      console.error(chalk.red("写入日志文件失败:"), error);
    }
  }

  info(message: string): void {
    const formatted = this.formatMessage("info", message);
    console.log(chalk.blue("ℹ"), message);
    this.writeToFile(formatted);
  }

  success(message: string): void {
    const formatted = this.formatMessage("success", message);
    console.log(chalk.green("✓"), message);
    this.writeToFile(formatted);
  }

  warn(message: string): void {
    const formatted = this.formatMessage("warn", message);
    console.log(chalk.yellow("⚠"), message);
    this.writeToFile(formatted);
  }

  error(message: string, error?: Error): void {
    const formatted = this.formatMessage("error", error ? `${message}: ${error.message}` : message);
    console.log(chalk.red("✗"), error ? `${message}: ${error.message}` : message);
    this.writeToFile(formatted);
  }
}

export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options);
}
