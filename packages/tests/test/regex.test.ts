import { validateRegex } from "@glitches/xlsx-json-converter";
import { describe, expect, it } from "vitest";

describe("validateRegex - 正则验证", () => {
  it("应正确验证手机号预设格式", () => {
    expect(validateRegex("13812345678", "phone")).toBe(true);
    expect(validateRegex("abc", "phone")).toBe(false);
  });

  it("应正确验证邮箱预设格式", () => {
    expect(validateRegex("test@example.com", "email")).toBe(true);
    expect(validateRegex("invalid-email", "email")).toBe(false);
  });

  it("应正确验证 URL 预设格式", () => {
    expect(validateRegex("https://example.com", "url")).toBe(true);
    expect(validateRegex("not-a-url", "url")).toBe(false);
  });

  it("应正确验证身份证预设格式", () => {
    expect(validateRegex("110101199001011234", "idCard")).toBe(true);
    expect(validateRegex("invalid", "idCard")).toBe(false);
  });

  it("应正确验证自定义正则表达式", () => {
    const customRegex = /^[A-Z]{3}\d{3}$/;
    expect(validateRegex("ABC123", customRegex)).toBe(true);
    expect(validateRegex("abc123", customRegex)).toBe(false);
  });
});
