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

| 主题 | 说明 | 参考 |
|------|------|------|
| CLI 使用 | 命令行参数、输入输出配置 | [cli-usage](references/cli-usage.md) |
| Schema 配置 | 字段映射、类型定义、全局配置 | [schema-config](references/schema-config.md) |
| 数据校验 | 必填、枚举、正则校验及策略 | [validation](references/validation.md) |
| 转换核心 | Excel→JSON、JSON→Excel 转换逻辑 | [conversion](references/conversion.md) |

## Features

| 主题 | 说明 | 参考 |
|------|------|------|
| 文件格式 | xlsx、csv、json 支持 | [file-formats](references/file-formats.md) |
| 自定义函数 | serialize/deserialize 函数 | [custom-functions](references/custom-functions.md) |
| 日志系统 | 彩色控制台日志、文件日志 | [logging](references/logging.md) |
| 工作表选择 | sheet-index、sheet-name 指定 | [sheet-selection](references/sheet-selection.md) |

## Advanced

| 主题 | 说明 | 参考 |
|------|------|------|
| 编程 API | 函数式调用、错误处理 | [programming-api](references/programming-api.md) |

---

## CLI 参数

| 参数 | 简写 | 必填 | 说明 |
|------|------|------|------|
| --input | -i | 是 | 输入文件路径 |
| --output | -o | 是 | 输出文件路径 |
| --config | -c | 是 | Schema 配置文件路径 |
| --sheet-index | - | 否 | 工作表索引（从 0 开始） |
| --sheet-name | - | 否 | 工作表名称 |
| --log | - | 否 | 日志文件保存路径 |

## 快速示例

```bash
# Excel → JSON
npx @glitches/xlsx-json-converter -i data.xlsx -o output.json -c config.ts

# JSON → Excel
npx @glitches/xlsx-json-converter -i data.json -o output.xlsx -c config.ts
```