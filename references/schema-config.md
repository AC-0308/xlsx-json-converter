# Schema 配置

## 类型导入

配置文件支持 TypeScript 类型提示，可从包中导入类型：

```typescript
import type { SchemaConfigInput, FieldConfigInput, GlobalConfigInput } from '@glitches/xlsx-json-converter'
```

## 全局配置 (global)

```typescript
/**
 * 全局配置
 * @type {GlobalConfigInput}
 */
global: {
  /** JSON 输出格式 @default 'formatted' */
  jsonFormat?: 'formatted' | 'minified',
  
  /** 数组分隔符（用于 array 类型字段） @default ',' */
  defaultArraySeparator?: string,
  
  /** 默认校验策略 @default 'warn' */
  defaultValidateStrategy?: 'warn' | 'error',
  
  /** 日志文件保存路径 */
  logFilePath?: string
}
```

## 字段配置 (fields)

```typescript
/**
 * 字段配置数组
 * @type {FieldConfigInput[]}
 */
fields: [
  {
    /** Excel 表头文本 ↔ JSON 对象键名（必填） */
    key: string,
    
    /** 字段类型（必填） */
    type: 'string' | 'number' | 'boolean' | 'array',
    
    /** 是否必填 @default false */
    required?: boolean,
    
    /** 数组分隔符（仅 type='array' 时有效，默认使用 global.defaultArraySeparator） */
    arraySeparator?: string,
    
    /** 枚举值白名单（校验值是否在列表内） */
    enum?: string[],
    
    /** 正则校验（内置预设或自定义 RegExp） */
    regex?: 'phone' | 'idCard' | 'email' | 'url' | RegExp,
    
    /** 字段级校验策略（覆盖 global.defaultValidateStrategy） */
    validateStrategy?: 'warn' | 'error',
    
    /** 自定义序列化函数：Excel 单元格 → JSON 值 */
    serialize?: (cellValue: unknown) => unknown,
    
    /** 自定义反序列化函数：JSON 值 → Excel 单元格 */
    deserialize?: (jsonValue: unknown) => unknown
  }
]
```

## 最小配置示例

```typescript
import type { SchemaConfigInput } from '@glitches/xlsx-json-converter'

/** @type {SchemaConfigInput} */
export default {
  fields: [
    { key: '姓名', type: 'string' }
  ]
}
```

## 完整配置示例

```typescript
import type { SchemaConfigInput } from '@glitches/xlsx-json-converter'

/** @type {SchemaConfigInput} */
export default {
  global: {
    jsonFormat: 'formatted',
    defaultArraySeparator: ',',
    defaultValidateStrategy: 'warn',
  },
  fields: [
    { key: '姓名', type: 'string', required: true },
    { key: '年龄', type: 'number' },
    { key: '状态', type: 'string', enum: ['启用', '禁用'] },
    { key: '手机号', type: 'string', regex: 'phone' },
    { key: '标签', type: 'array', arraySeparator: ';' },
    { key: '手机号列表', type: 'array', regex: 'phone' },
    { key: '角色', type: 'array', enum: ['管理员', '用户', '访客'] },
  ]
}
```

## 内置正则预设

| 预设 | 说明 | 正则表达式 |
|------|------|-----------|
| `phone` | 中国手机号 | `/^1[3-9]\d{9}$/` |
| `idCard` | 身份证号 | `/^[1-9]\d{5}(18|19|20)\d{2}...$/` |
| `email` | 邮箱地址 | `/^[\w.%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i` |
| `url` | URL 地址 | `/^https?:\/\/...$/` |