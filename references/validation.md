---
name: validation
description: 必填、枚举、正则校验及策略
---

# 数据校验

## 校验类型

| 类型 | 说明 | 示例 |
|------|------|------|
| required | 必填字段校验 | `{ required: true }` |
| enum | 枚举值白名单 | `{ enum: ['A', 'B', 'C'] }` |
| regex | 正则格式校验 | `{ regex: 'phone' }` |

## 校验策略

| 策略 | 说明 |
|------|------|
| warn | 警告打印日志，继续生成转换文件（默认） |
| error | 抛出异常，终止转换流程 |

## 数组类型校验

当字段类型为 `array` 时，校验会对数组中的**每个元素**进行检查：

```typescript
// 数组配合枚举：每个元素都必须在枚举范围内
{
  key: '状态',
  type: 'array',
  enum: ['启用', '禁用', '待审']
}

// Excel 单元格: "启用,禁用" → 分割后 ['启用', '禁用'] → 校验通过
// Excel 单元格: "启用,未知" → 分割后 ['启用', '未知'] → '未知' 不在枚举范围内，报错

// 数组配合正则：每个元素都必须符合正则
{
  key: '手机号列表',
  type: 'array',
  regex: 'phone'
}

// Excel 单元格: "13800138000,13900139000" → 分割后逐个校验 → 通过
// Excel 单元格: "13800138000,123" → '123' 不符合手机号正则，报错
```

## 使用示例

```typescript
export default {
  global: {
    defaultValidateStrategy: 'warn'  // 全局默认
  },
  fields: [
    // 必填字段
    { key: '姓名', type: 'string', required: true },
    
    // 枚举值校验（单值）
    { key: '状态', type: 'string', enum: ['启用', '禁用'] },
    
    // 枚举值校验（数组）
    { key: '标签', type: 'array', enum: ['重要', '紧急', '一般'] },
    
    // 正则校验（内置预设）
    { key: '手机号', type: 'string', regex: 'phone' },
    { key: '邮箱', type: 'string', regex: 'email' },
    { key: '身份证', type: 'string', regex: 'idCard' },
    { key: '网址', type: 'string', regex: 'url' },
    
    // 正则校验（数组）
    { key: '手机号列表', type: 'array', regex: 'phone' },
    
    // 自定义正则
    { key: '编码', type: 'string', regex: /^[A-Z]{4}$/ },
    
    // 字段级别校验策略覆盖
    { key: '关键字段', type: 'string', required: true, validateStrategy: 'error' }
  ]
}
```

## 错误处理

- 校验失败时，错误信息包含：行号、字段名、错误原因、当前值
- warn 策略：输出警告日志，继续生成文件
- error 策略：抛出异常，中断转换