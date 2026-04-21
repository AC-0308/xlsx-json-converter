import { isAbsolute, resolve } from "node:path";
import { cwd } from "node:process";

import { getExtension, isExcelFile, isJsonFile, resolvePath } from "@glitches/xlsx-json-converter";
import { describe, expect, it } from "vitest";

describe("路径工具函数", () => {
  describe("resolvePath - 路径解析", () => {
    it("绝对路径应原样返回", () => {
      const absolutePath = "C:\\Users\\test\\file.json";
      const result = resolvePath(absolutePath);
      expect(result).toBe(absolutePath);
    });

    it("相对路径应解析为绝对路径", () => {
      const relativePath = "./data/test.json";
      const result = resolvePath(relativePath);
      expect(isAbsolute(result)).toBe(true);
      expect(result).toBe(resolve(cwd(), relativePath));
    });

    it("空相对路径应解析为当前工作目录", () => {
      const result = resolvePath(".");
      expect(isAbsolute(result)).toBe(true);
    });
  });

  describe("getExtension - 获取文件扩展名", () => {
    it("应正确获取常见扩展名", () => {
      expect(getExtension("file.json")).toBe("json");
      expect(getExtension("file.xlsx")).toBe("xlsx");
      expect(getExtension("file.csv")).toBe("csv");
      expect(getExtension("document.pdf")).toBe("pdf");
    });

    it("应返回小写扩展名", () => {
      expect(getExtension("file.JSON")).toBe("json");
      expect(getExtension("file.XLSX")).toBe("xlsx");
      expect(getExtension("file.CSV")).toBe("csv");
    });

    it("无扩展名时应返回空字符串", () => {
      expect(getExtension("filename")).toBe("");
      expect(getExtension("path/to/file")).toBe("");
    });

    it("以点开头的隐藏文件应返回空字符串", () => {
      expect(getExtension(".gitignore")).toBe("");
      expect(getExtension(".env")).toBe("");
    });

    it("多点文件名应取最后一个扩展名", () => {
      expect(getExtension("file.test.json")).toBe("json");
      expect(getExtension("archive.tar.gz")).toBe("gz");
      expect(getExtension("config.local.json")).toBe("json");
    });
  });

  describe("isExcelFile - 判断 Excel 文件", () => {
    it("xlsx 文件应返回 true", () => {
      expect(isExcelFile("data.xlsx")).toBe(true);
      expect(isExcelFile("DATA.XLSX")).toBe(true);
      expect(isExcelFile("path/to/file.xlsx")).toBe(true);
    });

    it("xls 文件应返回 true", () => {
      expect(isExcelFile("data.xls")).toBe(true);
      expect(isExcelFile("DATA.XLS")).toBe(true);
    });

    it("csv 文件应返回 true", () => {
      expect(isExcelFile("data.csv")).toBe(true);
      expect(isExcelFile("DATA.CSV")).toBe(true);
    });

    it("非 Excel 文件应返回 false", () => {
      expect(isExcelFile("data.json")).toBe(false);
      expect(isExcelFile("data.txt")).toBe(false);
      expect(isExcelFile("data.pdf")).toBe(false);
      expect(isExcelFile("data")).toBe(false);
    });
  });

  describe("isJsonFile - 判断 JSON 文件", () => {
    it("json 文件应返回 true", () => {
      expect(isJsonFile("data.json")).toBe(true);
      expect(isJsonFile("DATA.JSON")).toBe(true);
      expect(isJsonFile("path/to/file.json")).toBe(true);
    });

    it("非 JSON 文件应返回 false", () => {
      expect(isJsonFile("data.xlsx")).toBe(false);
      expect(isJsonFile("data.txt")).toBe(false);
      expect(isJsonFile("data.csv")).toBe(false);
      expect(isJsonFile("data")).toBe(false);
    });
  });
});
