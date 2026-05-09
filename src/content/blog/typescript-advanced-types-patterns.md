---
title: 'TypeScript高级类型模式'
description: '掌握TypeScript高级类型编程技巧'
date: 2026-05-10
tags: ['TypeScript', '类型系统']
categories: ['技术']
cover: '/assets/images/banner/pixel-blog.webp'
toc: true
comment: true
reward: false
---

# TypeScript高级类型模式

TypeScript的类型系统是其最强大的特性之一，掌握高级类型模式可以让代码更加健壮、可维护。本文介绍几种常用的TypeScript高级类型技巧。

## 条件类型

条件类型允许我们根据条件选择类型，类似于三元运算符：

```typescript
type IsString<T> = T extends string ? true : false;

type Test1 = IsString<'hello'>;  // true
type Test2 = IsString<123>;      // false
```

条件类型可以嵌套使用：

```typescript
type Flatten<T> = T extends (infer U)[] ? U : T;

type Flattened = Flatten<[1, 2, 3, [4, 5]]>;  // number
```

## 映射类型

映射类型可以基于现有类型创建新类型：

```typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Person = {
  name: string;
  age: number;
  email: string;
};

type ReadonlyPerson = Readonly<Person>;
```

映射类型常用于创建工具类型：

```typescript
type Partial<T> = {
  [P in keyof T]?: T[P];
};

type OptionalPerson = Partial<Person>;
```

## 字符串字面量类型

字符串字面量类型提供更精确的类型约束：

```typescript
type Direction = 'up' | 'down' | 'left' | 'right';

function move(direction: Direction) {
  // direction 只能是 'up' | 'down' | 'left' | 'right'
}

move('up');
move('right');
// move('diagonal');  // 类型错误
```

## 模板字面量类型

模板字面量类型可以组合字符串：

```typescript
type EventName = `${string}:${string}`;

type Events = {
  [K in EventName]: (payload: any) => void;
};

const events: Events = {
  'click:button': (payload) => console.log(payload),
  'submit:form': (payload) => console.log(payload),
};
```

## 模板字面量推断

使用infer可以从模板字面量中推断类型：

```typescript
type Split<S, D> = S extends `${infer T}${D}${infer U}`
  ? [T, ...Split<U, D>]
  : [S];

type Result = Split<'a.b.c.d', '.'>;  // ['a', 'b', 'c', 'd']
```

## 递归类型

递归类型可以处理嵌套结构：

```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

type NestedObject = {
  a: number;
  b: {
    c: string;
    d: {
      e: boolean;
    };
  };
};

type PartialNested = DeepPartial<NestedObject>;
```

## 函数重载类型

函数重载提供更精确的类型约束：

```typescript
function add(a: number, b: number): number;
function add(a: string, b: string): string;
function add(a: any, b: any): any {
  return a + b;
}

const result1 = add(1, 2);     // number
const result2 = add('hello', 'world');  // string
```

## 工具类型实战

### 确保必填属性

```typescript
type Required<T> = {
  [P in keyof T]-?: T[P];
};

type User = {
  name?: string;
  age?: number;
};

type RequiredUser = Required<User>;
```

### 函数参数类型推断

```typescript
type ParamTypes<T extends (...args: any) => any> = T extends (...args: infer P) => any
  ? P
  : never;

type MyFunction = (a: string, b: number) => boolean;
type Params = ParamTypes<MyFunction>;  // [string, number]
```

## 最佳实践

1. **适度使用复杂类型**：过度复杂的类型可能降低代码可读性
2. **保持类型一致**：在大型项目中统一使用相同的工具类型
3. **利用类型推断**：优先使用类型推断而非显式标注
4. **文档化复杂类型**：为复杂的工具类型添加注释说明

掌握这些高级类型模式，可以显著提升代码质量和开发效率。TypeScript的类型系统是强大的编程工具，善用它能写出更健壮的代码。

---

**阅读建议**：本文适合有一定TypeScript基础的开发者，建议结合实际项目练习使用这些类型模式。
