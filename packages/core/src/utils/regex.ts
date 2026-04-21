import type { RegexPreset } from "../schema/index.js";

export const REGEX_PRESETS: Record<RegexPreset, RegExp> = {
  phone: /^1[3-9]\d{9}$/,
  idCard: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9X]$/i,
  email: /^[\w.%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i,
  url: /^https?:\/\/(www\.)?[-\w@:%.+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-\w()@:%+.~#?&/=]*)$/,
};

export function getRegex(pattern: RegexPreset | RegExp): RegExp {
  if (typeof pattern === "string") {
    return REGEX_PRESETS[pattern];
  }
  return pattern;
}

export function validateRegex(value: string, pattern: RegexPreset | RegExp): boolean {
  const regex = getRegex(pattern);
  return regex.test(value);
}
