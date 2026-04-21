---
name: cli-usage
description: CLI 命令行参数、输入输出配置
---

# CLI 使用

## 命令参数

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
# 先构建项目
pnpm build

# Excel → JSON
npx @glitches/xlsx-json-converter -i input.xlsx -o output.json -c config.ts

# JSON → Excel
npx @glitches/xlsx-json-converter -i input.json -o output.xlsx -c config.ts

# JSON → CSV
npx @glitches/xlsx-json-converter -i input.json -o output.csv -c config.ts

# 使用 sheet 索引
npx @glitches/xlsx-json-converter -i input.xlsx -o output.json -c config.ts --sheet-index 1

# 使用 sheet 名称
npx @glitches/xlsx-json-converter -i input.xlsx -o output.json -c config.ts --sheet-name "DataSheet"

# 指定日志文件
npx @glitches/xlsx-json-converter -i input.xlsx -o output.json -c config.ts --log ./converter.log
```

## 注意事项

- 需要先执行 `pnpm build` 构建项目
- 使用 `npx @glitches/xlsx-json-converter` 调用 CLI
- 输入文件必须是 .xlsx、.csv 或 .json
- 输出文件扩展名决定转换方向
- xlsx/csv 输入只能转 json
- json 输入只能转 xlsx/csv
- sheet-index 和 sheet-name 不能同时指定
