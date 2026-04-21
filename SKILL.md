---
name: xlsx-json-converter
description: Excel ↔ JSON 双向转换 CLI 工具。使用此 skill 进行 xlsx / csv 与 json 的双向转换、Schema 配置、字段校验。
metadata:
  author: Glitches
  version: "1.0.0"
  source: Generated from xlsx-json-converter project
---

xlsx-json-converter 是一个生产级的 Excel ↔ JSON 双向转换 CLI 工具，支持 Schema 配置驱动、字段校验、自定义序列化函数。

## Core

| 主题        | 说明                            | 参考                                         |
| ----------- | ------------------------------- | -------------------------------------------- |
| CLI 使用    | 命令行参数、输入输出配置        | [cli-usage](references/cli-usage.md)         |
| Schema 配置 | 字段映射、类型定义、全局配置    | [schema-config](references/schema-config.md) |
| 数据校验    | 必填、枚举、正则校验及策略      | [validation](references/validation.md)       |
| 转换核心    | Excel→JSON、JSON→Excel 转换逻辑 | [conversion](references/conversion.md)       |

## Features

| 主题       | 说明                         | 参考                                               |
| ---------- | ---------------------------- | -------------------------------------------------- |
| 文件格式   | xlsx、csv、json 支持         | [file-formats](references/file-formats.md)         |
| 自定义函数 | serialize/deserialize 函数   | [custom-functions](references/custom-functions.md) |
| 日志系统   | 彩色控制台日志、文件日志     | [logging](references/logging.md)                   |
| 工作表选择 | sheet-index、sheet-name 指定 | [sheet-selection](references/sheet-selection.md)   |

## CLI 参数

| 参数          | 简写 | 必填 | 说明                    |
| ------------- | ---- | ---- | ----------------------- |
| --input       | -i   | 是   | 输入文件路径            |
| --output      | -o   | 是   | 输出文件路径            |
| --config      | -c   | 是   | Schema 配置文件路径     |
| --sheet-index | -    | 否   | 工作表索引（从 0 开始） |
| --sheet-name  | -    | 否   | 工作表名称              |
| --log         | -    | 否   | 日志文件保存路径        |

## 使用示例

```bash
# 使用 npx（需先 pnpm build）
npx @glitches/xlsx-json-converter -i data.xlsx -o output.json -c config.ts

# JSON → Excel
npx @glitches/xlsx-json-converter -i data.json -o output.xlsx -c config.ts

# 指定工作表
npx @glitches/xlsx-json-converter -i data.xlsx -o output.json -c config.ts --sheet-name "Sheet2"

# 指定日志文件
npx @glitches/xlsx-json-converter -i data.xlsx -o output.json -c config.ts --log converter.log
```

## Schema 配置示例

```typescript
import type { SchemaConfigInput } from "@glitches/xlsx-json-converter";

/** @type {SchemaConfigInput} */
export default {
  global: {
    jsonFormat: "formatted",
    defaultArraySeparator: ",",
    defaultValidateStrategy: "warn",
  },
  fields: [
    {
      key: "姓名",
      type: "string",
      required: true,
    },
    {
      key: "年龄",
      type: "number",
    },
    {
      key: "状态",
      type: "string",
      enum: ["启用", "禁用"],
    },
    {
      key: "手机号",
      type: "string",
      regex: "phone",
    },
    {
      key: "标签",
      type: "array",
      arraySeparator: ";",
    },
    {
      key: "手机号列表",
      type: "array",
      regex: "phone",
    },
  ],
};
```

## 类型定义

```typescript
// 可从包中导入的类型
import type {
  SchemaConfigInput,   // 完整配置类型
  FieldConfigInput,    // 字段配置类型
  GlobalConfigInput,   // 全局配置类型
  FieldType,           // 'string' | 'number' | 'boolean' | 'array'
  ValidateStrategy,    // 'warn' | 'error'
  JsonFormat,          // 'formatted' | 'minified'
  RegexPreset,         // 'phone' | 'idCard' | 'email' | 'url'
} from "@glitches/xlsx-json-converter";
```

## 字段配置项

| 配置项           | 说明                       | 类型                                              |
| ---------------- | -------------------------- | ------------------------------------------------- |
| key              | Excel 表头 ↔ JSON key 映射 | string                                            |
| type             | 字段类型                   | `string` \| `number` \| `boolean` \| `array`      |
| required         | 必填校验                   | boolean                                           |
| arraySeparator   | 数组分隔符（默认 `,`）     | string                                            |
| enum             | 枚举值白名单               | string[]                                          |
| regex            | 正则校验                   | `phone` \| `idCard` \| `email` \| `url` \| RegExp |
| validateStrategy | 校验策略                   | `warn` \| `error`                                 |
| serialize        | 自定义序列化函数           | (value: unknown) => unknown                       |
| deserialize      | 自定义反序列化函数         | (value: unknown) => unknown                       |

## 正则预设

| 预设   | 说明       | 正则                                  |
| ------ | ---------- | ------------------------------------- |
| phone  | 中国手机号 | /^1[3-9]\d{9}$/                       |
| idCard | 身份证号   | /^[1-9]\d{5}(18\|19\|20)\d{2}.../     |
| email  | 邮箱       | /^[\w.%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i |
| url    | URL        | /^https?:\/\/...$/                    |
