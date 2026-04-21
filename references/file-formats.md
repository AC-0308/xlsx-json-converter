# 文件格式

## 支持的格式

| 方向 | 格式 | 说明 |
|------|------|------|
| 输入 | .xlsx | Excel 2007+ 格式 |
| 输入 | .csv | CSV 逗号分隔值 |
| 输出 | .xlsx | Excel 2007+ 格式 |
| 输出 | .csv | CSV 逗号分隔值 |
| 输出 | .json | JSON 格式 |

## 转换规则

| 输入 | 输出 | 说明 |
|------|------|------|
| .xlsx | .json | Excel → JSON |
| .csv | .json | CSV → JSON |
| .json | .xlsx | JSON → Excel |
| .json | .csv | JSON → CSV |

## 注意事项

- 不支持旧版 .xls 格式
- UTF-8 编码
- CSV 默认使用逗号分隔符