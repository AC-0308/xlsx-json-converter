---
name: sheet-selection
description: sheet-index、sheet-name 工作表指定
---

# 工作表选择

## 指定方式

### 使用索引

从 0 开始计数

```bash
xlsx-json-converter -i input.xlsx -o output.json -c config.ts --sheet-index 0
xlsx-json-converter -i input.xlsx -o output.json -c config.ts --sheet-index 1
```

### 使用名称

```bash
xlsx-json-converter -i input.xlsx -o output.json -c config.ts --sheet-name "Sheet1"
xlsx-json-converter -i input.xlsx -o output.json -c config.ts --sheet-name "数据表"
```

## 默认行为

- 未指定时，默认读取第 0 个工作表
- sheet-index 和 sheet-name 不能同时指定

## 注意事项

- 工作表不存在时抛出异常
- 索引超出范围时抛出异常