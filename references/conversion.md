# 转换核心

## Excel → JSON

### 处理流程

1. 读取 Excel 文件（.xlsx / .csv）
2. 解析指定工作表
3. 遍历每行数据
4. 对每个字段执行：
   - 类型转换（string/number/boolean/array）
   - 自定义 serialize 函数
   - 数据校验
5. 输出 JSON 文件

### 空值处理

- 空单元格 → `undefined`

### 类型转换

```typescript
// string: String(value)
// number: Number(value) 或 undefined
// boolean: true/false/undefined
// array: split(separator)
```

## JSON → Excel

### 处理流程

1. 读取 JSON 文件
2. 解析 JSON 数组或对象
3. 遍历每条记录
4. 对每个字段执行：
   - 类型转换
   - 自定义 deserialize 函数
5. 输出 Excel 文件

### 空值处理

- `undefined` / `null` → 空白单元格

### 类型转换

```typescript
// string: String(value)
// number: value
// boolean: '是' / '否'
// array: join(separator)
```

## 输出格式

- JSON: `formatted`（美化）或 `minified`（压缩）
- Excel: `.xlsx` 或 `.csv`