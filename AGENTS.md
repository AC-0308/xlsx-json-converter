# xlsx-json-converter

Excel ↔ JSON 双向转换 CLI 工具项目

## Tech Stack

- **语言**: TypeScript (ESM)
- **包管理**: pnpm (workspace)
- **构建工具**: tsdown
- **代码检查**: oxlint
- **测试**: vitest
- **主要依赖**: xlsx, commander, chalk, zod, jiti

## Project Structure

```
xlsx-json-converter/
├── packages/
│   ├── core/                    # 核心转换工具包
│   │   ├── src/
│   │   │   ├── cli.ts          # CLI 入口
│   │   │   ├── config/         # 配置加载与合并
│   │   │   ├── core/           # 双向转换核心
│   │   │   │   ├── excel2json.ts
│   │   │   │   └── json2excel.ts
│   │   │   ├── schema/         # Zod Schema 定义
│   │   │   └── utils/          # 工具函数
│   │   │       ├── logger.ts   # 日志
│   │   │       ├── path.ts     # 路径处理
│   │   │       └── regex.ts    # 正则预设
│   │   ├── bin/cli.mjs        # CLI 执行入口
│   │   └── package.json
│   └── tests/                  # 测试包
├── prd.md                      # 产品需求文档
└── package.json                # 工作区根配置
```

## Setup Commands

```bash
# 安装依赖
pnpm install

# 构建 core 包
pnpm build

# 运行测试
pnpm test

# 运行测试（带覆盖率）
pnpm test:coverage

# 代码检查
pnpm lint

# 代码检查并修复
pnpm lint:fix

# 格式化代码
pnpm format

# 格式化检查
pnpm format:check

# 类型检查
pnpm typecheck
```

## Running Single Test

```bash
# 运行单个测试文件
pnpm vitest run packages/tests/test/converter.test.ts

# 运行单个测试用例
pnpm vitest run packages/tests/test/converter.test.ts -t "test name"
```

## Code Style

### 命名规范

- 文件命名: kebab-case (如 `excel2json.ts`)
- 类/类型命名: PascalCase
- 函数/变量命名: camelCase

### 导入规范

- 使用 ESM 导入语法
- 导入顺序: 外部库 → 内部模块 → 类型
- 相对路径导入使用 `.js` 扩展名

```typescript
import process from "node:process";
import { Command } from "commander";
import { loadConfigFile } from "./config/index.js";
import type { FieldConfig } from "../schema/index.js";
```

### 注释规范

- 全部使用中文注释
- 避免不必要的注释，代码自解释

### 错误处理

- 使用 try-catch 捕获异常
- 抛出具有明确信息的 Error 对象
- 日志使用中文描述

### 类型规范

- 禁止滥用 `any`
- 使用 TypeScript 类型推断
- 必要时使用类型断言

## Testing

- 使用 vitest 测试框架
- 测试文件放在 `packages/tests/test/` 目录
- 命名规范: `*.test.ts`

## CLI 使用

### 命令参数

| 参数          | 简写 | 必填 | 说明                    |
| ------------- | ---- | ---- | ----------------------- |
| --input       | -i   | 是   | 输入文件路径            |
| --output      | -o   | 是   | 输出文件路径            |
| --config      | -c   | 是   | Schema 配置文件路径     |
| --sheet-index | -    | 否   | 工作表索引（从 0 开始） |
| --sheet-name  | -    | 否   | 工作表名称              |
| --log         | -    | 否   | 日志文件保存路径        |

### 使用示例

```bash
# 先构建项目
pnpm build

# Excel → JSON
npx @glitches/xlsx-json-converter -i data.xlsx -o output.json -c config.ts

# JSON → Excel
npx @glitches/xlsx-json-converter -i data.json -o output.xlsx -c config.ts

# 指定工作表
npx @glitches/xlsx-json-converter -i data.xlsx -o output.json -c config.ts --sheet-name "Sheet2"
```

## Schema 配置

配置文件使用 TypeScript (.ts) 或 JavaScript (.js)，通过 jiti 动态加载。

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
  ],
};
```

## Key Conventions

- 全部代码、注释、终端提示、异常信息使用中文
- 使用 pnpm workspace 管理多包
- 使用 oxlint 进行代码检查
- 使用 tsdown 构建 ESM 模块
- 配置文件使用 Zod 进行校验

## Skill 发布

本项目的 skill 文件放在根目录：

```
xlsx-json-converter/
├── SKILL.md              # skill 主文件（必须在根目录）
├── references/           # 参考文档目录
│   ├── cli-usage.md
│   ├── schema-config.md
│   └── ...
```

**设计原因**：skill 依托于本仓库发布，其他人通过 `npx @glitches/skills add` 安装时，会从仓库根目录获取 `SKILL.md` 和 `references/`。因此 skill 文件必须放在根目录，而非 `.agents/skills/` 内部。
