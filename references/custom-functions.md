---
name: custom-functions
description: serialize/deserialize 自定义函数
---

# 自定义函数

## serialize 函数

Excel 单元格值 → JSON 值

```typescript
{
  key: '日期',
  type: 'string',
  serialize: (value: unknown) => {
    const date = new Date(value as string)
    return date.toISOString().split('T')[0]
  }
}
```

## deserialize 函数

JSON 值 → Excel 单元格值

```typescript
{
  key: '日期',
  type: 'string',
  deserialize: (value: unknown) => {
    const date = new Date(value as string)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
}
```

## 组合使用

```typescript
{
  key: '时间戳',
  type: 'string',
  serialize: (value: unknown) => {
    return new Date(value as string).getTime()
  },
  deserialize: (value: unknown) => {
    return new Date(value as number).toISOString()
  }
}
```

## 常见用途

- 日期格式转换
- 价格分转元 / 元转分
- 枚举值映射
- 数据清洗