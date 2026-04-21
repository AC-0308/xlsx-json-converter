import { isAbsolute, resolve } from "node:path";
import { cwd } from "node:process";

export function resolvePath(inputPath: string): string {
  if (isAbsolute(inputPath)) {
    return inputPath;
  }
  return resolve(cwd(), inputPath);
}

export function getExtension(filePath: string): string {
  const lastDot = filePath.lastIndexOf(".");
  if (lastDot === -1 || lastDot === 0) return "";
  return filePath.slice(lastDot + 1).toLowerCase();
}

export function isExcelFile(filePath: string): boolean {
  const ext = getExtension(filePath);
  return ext === "xlsx" || ext === "xls" || ext === "csv";
}

export function isJsonFile(filePath: string): boolean {
  return getExtension(filePath) === "json";
}
