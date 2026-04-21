# xlsx-json-converter

Excel ↔ JSON 双向转换 CLI 工具

## 特性

- 支持 `.xlsx`、`.csv` 与 `.json` 双向转换
- Schema 配置驱动，支持字段类型、枚举、正则、必填校验
- 支持自定义序列化/反序列化函数
- 彩色控制台日志，支持日志文件持久化
- 中文日志提示

## 安装

```bash
pnpm install
pnpm build
```

## 使用

```bash
# Excel → JSON
npx @glitches/xlsx-json-converter -i input.xlsx -o output.json -c config.ts

# JSON → Excel
npx @glitches/xlsx-json-converter -i input.json -o output.xlsx -c config.ts
```

### 参数

| 参数          | 简写 | 必填 | 说明                    |
| ------------- | ---- | ---- | ----------------------- |
| --input       | -i   | 是   | 输入文件路径            |
| --output      | -o   | 是   | 输出文件路径            |
| --config      | -c   | 是   | Schema 配置文件路径     |
| --sheet-index | -    | 否   | 工作表索引（从 0 开始） |
| --sheet-name  | -    | 否   | 工作表名称              |
| --log         | -    | 否   | 日志文件保存路径        |

## Schema 配置

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
  ],
};
```

### 字段配置项

| 配置项           | 说明                                                  |
| ---------------- | ----------------------------------------------------- |
| key              | Excel 表头 ↔ JSON key 映射                            |
| type             | 字段类型：`string`、`number`、`boolean`、`array`      |
| required         | 必填校验                                              |
| arraySeparator   | 数组分隔符（默认 `,`）                                |
| enum             | 枚举值白名单                                          |
| regex            | 正则校验：`phone`、`idCard`、`email`、`url` 或 RegExp |
| validateStrategy | 校验策略：`warn`（默认）、`error`                     |
| serialize        | 自定义序列化函数（Excel → JSON）                      |
| deserialize      | 自定义反序列化函数（JSON → Excel）                    |

## 开发

```bash
# 构建
pnpm build

# 测试
pnpm test

# 代码检查
pnpm lint

# 格式化
pnpm format
```

## Skill 使用

本项目提供 AI Agent 专用 skill，帮助 AI 理解和使用此工具。

### 安装 Skill

```bash
# 在 opencode 中安装
npx @glitches/skills add Glitches/xlsx-json-converter
```

### 加载 Skill

安装后，在 opencode 中通过以下方式调用：

```bash
/skill load xlsx-json-converter
```

加载后，AI Agent 将获得完整的 CLI 使用说明、Schema 配置指南、字段校验规则等知识，能够正确帮助用户进行 Excel ↔ JSON 转换。

## 许可证

MIT
