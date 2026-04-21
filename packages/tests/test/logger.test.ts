import { mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createLogger, Logger } from "@glitches/xlsx-json-converter";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("日志工具", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  const tempDir = join(tmpdir(), "logger-tests");

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("Logger - 日志输出", () => {
    it("info 方法应输出蓝色信息图标和消息", () => {
      const logger = new Logger();
      logger.info("这是一条信息");

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0];
      expect(call[0]).toContain("ℹ");
      expect(call[1]).toBe("这是一条信息");
    });

    it("success 方法应输出绿色成功图标和消息", () => {
      const logger = new Logger();
      logger.success("操作成功");

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0];
      expect(call[0]).toContain("✓");
      expect(call[1]).toBe("操作成功");
    });

    it("warn 方法应输出黄色警告图标和消息", () => {
      const logger = new Logger();
      logger.warn("这是一条警告");

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0];
      expect(call[0]).toContain("⚠");
      expect(call[1]).toBe("这是一条警告");
    });

    it("error 方法应输出红色错误图标和消息", () => {
      const logger = new Logger();
      logger.error("发生错误");

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0];
      expect(call[0]).toContain("✗");
      expect(call[1]).toBe("发生错误");
    });

    it("error 方法带 Error 对象时应包含错误信息", () => {
      const logger = new Logger();
      const error = new Error("详细错误信息");
      logger.error("操作失败", error);

      expect(consoleLogSpy).toHaveBeenCalled();
      const call = consoleLogSpy.mock.calls[0];
      expect(call[1]).toBe("操作失败: 详细错误信息");
    });
  });

  describe("Logger - 日志文件写入", () => {
    it("应将日志写入指定文件", async () => {
      const logPath = join(tempDir, "test.log");
      const logger = new Logger({ logFilePath: logPath });

      logger.info("测试信息");
      logger.success("测试成功");
      logger.warn("测试警告");
      logger.error("测试错误");

      await new Promise((resolve) => setTimeout(resolve, 100));

      const content = await readFile(logPath, "utf-8");
      expect(content).toContain("[INFO]");
      expect(content).toContain("[SUCCESS]");
      expect(content).toContain("[WARN]");
      expect(content).toContain("[ERROR]");
      expect(content).toContain("测试信息");
      expect(content).toContain("测试成功");
      expect(content).toContain("测试警告");
      expect(content).toContain("测试错误");
    });

    it("日志应包含 ISO 时间戳", async () => {
      const logPath = join(tempDir, "timestamp.log");
      const logger = new Logger({ logFilePath: logPath });

      logger.info("带时间戳的日志");

      await new Promise((resolve) => setTimeout(resolve, 100));

      const content = await readFile(logPath, "utf-8");
      const isoRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/;
      expect(isoRegex.test(content)).toBe(true);
    });

    it("无 logFilePath 时不创建文件", async () => {
      const logger = new Logger();

      logger.info("无文件日志");

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it("日志文件目录不存在时应自动创建", async () => {
      const logPath = join(tempDir, "nested", "deep", "test.log");
      const logger = new Logger({ logFilePath: logPath });

      logger.info("嵌套目录日志");

      await new Promise((resolve) => setTimeout(resolve, 100));

      const content = await readFile(logPath, "utf-8");
      expect(content).toContain("嵌套目录日志");
    });
  });

  describe("createLogger - 工厂函数", () => {
    it("应创建 Logger 实例", () => {
      const logger = createLogger();
      expect(logger).toBeInstanceOf(Logger);
    });

    it("应传递选项给 Logger", () => {
      const logPath = join(tempDir, "factory.log");
      const logger = createLogger({ logFilePath: logPath });

      logger.info("工厂函数创建");

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});
