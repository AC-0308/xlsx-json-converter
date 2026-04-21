# Excel ↔ JSON 双向转换 CLI 工具

**产品需求文档 PRD V1.0**

> 技术规范：ESM + TypeScript、全中文注释、中文日志、Schema 配置驱动
> 底层依赖：xlsx、commander、chalk、zod、jiti

---

## 1. 项目概述

### 1.1 产品定位

- 生产级、配置化、跨格式命令行数据转换工具，实现 Excel(.xlsx) / CSV ↔ JSON 双向无损转换。
- Schema 配置驱动，不硬编码业务字段
- 支持单元格自定义序列化、反序列化处理函数
- 完整字段类型、枚举、正则、必填校验体系
- 兼容相对路径、绝对路径，支持指定工作表
- 彩色控制台日志 + 可选文件日志持久化
- 严格遵循 ESM + TypeScript 前端工程最佳实践

### 1.2 适用场景

- 业务结构化配置 JSON 与 Excel 表格互转
- 运营人员编辑 Excel 后一键标准化导出 JSON
- 导入表格数据自动格式校验、清洗、规范化

---

## 2. 核心功能需求

### 2.1 文件格式支持

- **可读格式**：.xlsx、.csv
- **可导出格式**：.xlsx、.csv、.json
- 不兼容旧版 .xls 格式

### 2.2 工作表 Sheet 选择规则

- 支持通过 CLI 参数或配置文件指定 sheet
- 支持两种寻址方式：数字索引（从 0 开始计数）、工作表名称
- 默认读取：第 0 个工作表

### 2.3 空值统一处理规则

| 转换方向 | 处理规则             |
|---|------------------|
| Excel → JSON | 空单元格 → `undefined` |
| JSON → Excel | 空值 → 空白单元格       |

### 2.4 Schema 配置系统

- **配置文件格式**：支持 .ts、.js
- **配置加载引擎**：jiti 跨格式无缝加载 TS/JS/JSON 配置
- **配置合法性校验**：Zod 强类型 Schema 校验

#### 单字段可配置项

| 配置项            | 说明                                                     |
|----------------|--------------------------------------------------------|
| key            | Excel 表头名称 ↔ JSON key 映射 |
| type           | 字段类型：string / number / boolean / array                 |
| arraySeparator | 数组分隔符（默认英文逗号）                                          |
| enum           | 枚举值白名单校验                                               |
| regex          | 正则校验（内置手机号、邮箱、身份证、URL 等常用预设）                           |
| required       | 必填项校验                                                  |
| serialize      | 自定义序列化函数：Excel 单元格 → JSON                              |
| deserialize    | 自定义反序列化函数：JSON → Excel 单元格                             |

### 2.5 数据校验策略

- **支持校验类型**：类型校验、必填校验、枚举校验、正则格式校验
- **异常处理策略可配置**：

| 策略 | 说明 |
|---|---|
| warn | 警告打印日志，继续生成转换文件（默认） |
| error | 抛出异常，终止转换流程 |

### 2.6 日志系统

- **控制台输出**：彩色日志（成功绿色、警告黄色、错误红色）
- **支持日志文件导出**：可通过 CLI 参数 / 配置文件指定日志保存路径
- **日志内容包含**：时间戳、日志级别、异常详情

### 2.7 JSON 输出格式

- 支持配置项切换：格式化排版、紧凑压缩
- **默认**：格式化美观输出

### 2.8 CLI 命令参数

```bash
node cli.mjs \
  --input 输入文件路径 \
  --output 输出文件路径 \
  --config schema配置文件 \
  --sheet-index 工作表索引 \
  --sheet-name 工作表名称 \
  --log 日志保存路径
```

---

## 3. Schema 配置 TS 类型规范

```typescript
import { z } from 'zod'

export default {
  // 全局配置
  global: {
    jsonFormat: 'formatted' | 'minified',
    defaultArraySeparator: ',',
    defaultValidateStrategy: 'warn' | 'error',
    logFilePath?: string
  },

  // 字段映射规则数组
  fields: [
    {
      key: string,                  // Excel 表头文本 ↔ JSON 对象键名
      type: 'string' | 'number' | 'boolean' | 'array',
      required?: boolean,
      arraySeparator?: string,
      enum?: string[],
      regex?: 'phone' | 'idCard' | 'email' | 'url' | RegExp,
      validateStrategy?: 'warn' | 'error',

      // 自定义双向转换函数
      serialize?: (cellValue: unknown) => unknown,    // Excel → JSON
      deserialize?: (jsonValue: unknown) => unknown // JSON → Excel
    }
  ]
}
```

---

## 4. 技术架构与选型

### 4.1 技术栈

| 技术 | 用途                                                                          |
|---|-----------------------------------------------------------------------------|
| pnpm | 包管理工具                                                                        |
| TypeScript ESM | 编程语言                                                                        |
| ESLint | 代码检查，采用 antfu/eslint-config TypeScript 配置                              |
| xlsx（SheetJS） | Excel/CSV 解析，需从官方源安装：`pnpm install xlsx --registry https://sheetjs.com/npm` |
| commander | CLI 参数解析                                                                    |
| chalk | 彩色终端日志                                                                      |
| jiti | TS 配置动态加载                                                                   |
| zod | 配置结构化校验                                                                     |
| node fs/promises、path | 文件系统                                                                        |

### 4.2 推荐目录结构

```
├── bin/                  # CLI 入口文件
│   └── cli.mjs           # 软链至 package.json bin 字段
├── src/
│   ├── config/           # 默认配置、配置合并逻辑
│   ├── core/             # 双向转换核心业务逻辑
│   │   ├── excel2json.ts
│   │   └── json2excel.ts
│   ├── schema/           # Zod 配置结构定义
│   ├── utils/            # 日志、路径、正则预设、通用工具
│   ├── cli.ts            # CLI 命令入口
│   └── index.ts          # 库对外主入口
├── package.json        # 发布配置（bin 字段指向 bin/cli.mjs）
├── pnpm-workspace.yaml # pnpm 工作区配置
└── tsconfig.json       # TypeScript 配置
```

### 4.3 发布配置

- **调用方式**：`npx <package-name>`
- **bin 字段**：软链 `bin/cli.mjs`
- **入口文件**：使用 `.mjs` 扩展名直接执行，无需额外构建步骤

---

## 5. 非功能需求

- 全部代码、注释、终端提示、异常信息使用中文
- TypeScript 类型全覆盖，无 any 滥用
- 完善异常捕获：文件不存在、格式损坏、权限异常、JSON 解析失败
- **性能**：千行以内表格秒级完成转换
- **运行环境**：Node.js ≥ 24
- 配置与业务逻辑完全解耦，易扩展、易维护

---

## 6. 验收标准

- [x] xlsx、csv 均可正常双向互转，数据不丢失、不乱序
- [x] 指定 sheet 索引 / 名称均可正常读取
- [x] colors 枚举非法值默认警告，不阻断文件生成
- [x] 相对路径、绝对路径均可正常解析
- [x] 自定义处理函数正常生效，格式转换符合预期
- [x] 配置文件异常时 Zod 精准报错
- [x] 日志彩色正常显示，指定路径可写入日志文件

---

## 7. 后续迭代规划

| 版本 | 规划内容 |
|---|---|
| V2.0 | 扩展更多正则预设、字段长度校验、自定义格式化规则 |
| V3.0 | 支持批量文件夹批量转换 |
| V4.0 | 支持多工作表批量映射转换 |