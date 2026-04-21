---
name: logging
description: 彩色控制台日志、文件日志
---

# 日志系统

## 控制台日志

- ℹ info: 蓝色信息
- ✓ success: 绿色成功
- ⚠ warn: 黄色警告
- ✗ error: 红色错误

## 日志文件

通过 CLI 参数或配置文件指定：

```bash
xlsx-json-converter -i input.xlsx -o output.json -c config.ts --log ./converter.log
```

或 Schema 配置：

```typescript
export default {
  global: {
    logFilePath: './converter.log'
  },
  fields: [...]
}
```

## 日志格式

```
[2024-01-01T12:00:00.000Z] [INFO] 消息内容
[2024-01-01T12:00:00.000Z] [SUCCESS] 消息内容
[2024-01-01T12:00:00.000Z] [WARN] 消息内容
[2024-01-01T12:00:00.000Z] [ERROR] 错误信息: 详情
```

## 包含内容

- 时间戳（ISO 格式）
- 日志级别
- 消息内容
- 错误详情（error 级别）