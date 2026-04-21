---
name: programming-api
description: 函数式调用、错误处理
---

# 编程 API

除了 CLI，还可以在代码中直接调用转换函数。

## 导入

```typescript
import { excel2Json, json2Excel } from "@glitches/xlsx-json-converter";
```

## Excel → JSON

```typescript
const result = await excel2Json({
  input: "data.xlsx",
  output: "output.json",
  config: {
    global: { jsonFormat: "formatted" },
    fields: [
      { key: "姓名", type: "string" },
      { key: "年龄", type: "number" },
    ],
  },
  sheetIndex: 0,        // 可选，默认 0
  sheetName: "Sheet1",   // 可选，与 sheetIndex 二选一
  logFilePath: "log.txt" // 可选
});

console.log(result.data);      // 转换后的数据数组
console.log(result.errors);    // 校验错误数组
```

### 返回类型

```typescript
interface Excel2JsonResult {
  data: Record<string, unknown>[];
  errors: ValidationError[];
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: unknown;
}
```

## JSON → Excel

```typescript
const result = await json2Excel({
  input: "data.json",
  output: "output.xlsx",
  config: {
    global: { jsonFormat: "formatted" },
    fields: [
      { key: "姓名", type: "string" },
      { key: "年龄", type: "number" },
    ],
  },
  sheetName: "Sheet1",   // 可选，默认 Sheet1
  logFilePath: "log.txt" // 可选
});

console.log(result.success);   // 是否成功
console.log(result.rowCount);  // 处理的数据条数
```

### 返回类型

```typescript
interface Json2ExcelResult {
  success: boolean;
  rowCount: number;
}
```

## 错误处理

```typescript
import { excel2Json } from "@glitches/xlsx-json-converter";

try {
  const result = await excel2Json({
    input: "data.xlsx",
    output: "output.json",
    config: { fields: [{ key: "姓名", type: "string" }] },
  });
  
  if (result.errors.length > 0) {
    console.warn("校验错误：", result.errors);
  }
  
  console.log("转换成功，数据条数：", result.data.length);
} catch (error) {
  console.error("转换失败：", error.message);
  process.exit(1);
}
```

## 完整示例

```typescript
import { excel2Json, json2Excel } from "@glitches/xlsx-json-converter";

async function main() {
  // 1. 读取 Excel 并转换为 JSON
  const jsonResult = await excel2Json({
    input: "employees.xlsx",
    output: "employees.json",
    config: {
      global: { jsonFormat: "formatted" },
      fields: [
        { key: "姓名", type: "string", required: true },
        { key: "部门", type: "string", enum: ["研发", "产品", "运营"] },
        { key: "手机号", type: "string", regex: "phone" },
        { key: "标签", type: "array", arraySeparator: ";" },
      ],
    },
    sheetName: "员工表",
  });
  
  console.log(`转换完成，共 ${jsonResult.data.length} 条记录`);
  
  if (jsonResult.errors.length > 0) {
    console.warn(`存在 ${jsonResult.errors.length} 个校验错误`);
  }
  
  // 2. 修改数据后转回 Excel
  const data = jsonResult.data.map((item) => ({
    ...item,
    已处理: true,
  }));
  
  await json2Excel({
    input: "processed.json",
    output: "employees_updated.xlsx",
    config: {
      fields: [
        { key: "姓名", type: "string" },
        { key: "部门", type: "string" },
        { key: "手机号", type: "string" },
        { key: "标签", type: "array" },
        { key: "已处理", type: "boolean" },
      ],
    },
  });
}

main();
```