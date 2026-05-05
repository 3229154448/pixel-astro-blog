---
title: 'TypeScript类型体操入门'
description: '从基础到进阶，掌握TypeScript高级类型编程技巧，挑战type-challenges经典题目。'
date: 2026-05-05
tags: ['TypeScript', '前端技术', '类型系统']
categories: ['教程']
cover: '/assets/images/banner/pixel-blog.webp'
toc: true
reward: true
---

## 🎮 为什么要学类型体操？

TypeScript 不只是"给 JS 加类型注释"这么简单。它的类型系统是**图灵完备**的——理论上，你可以用 TypeScript 的类型系统计算任何可计算的问题。

> "If it compiles, it works." — TypeScript 社区信条

类型体操（Type Challenges）是 TypeScript 社区最火的学习方式。通过挑战各种类型题目，你能：

1. **深入理解类型系统** — 不再只会 `interface` 和 `type`
2. **写出更安全的代码** — 让编译器帮你抓 bug
3. **提升代码提示** — IDE 自动补全更智能
4. **面试加分** — 大厂 TS 岗必考

## 📐 基础：内置工具类型

TypeScript 内置了十几个工具类型（Utility Types），掌握它们是入门第一步：

### Partial & Required

```typescript
// Partial：把所有属性变可选
interface User {
  name: string;
  age: number;
  email: string;
}

type PartialUser = Partial<User>;
// { name?: string; age?: number; email?: string; }

// Required：把所有属性变必选（与 Partial 相反）
type RequiredUser = Required<PartialUser>;
// { name: string; age: number; email: string; }
```

### Pick & Omit

```typescript
// Pick：从类型中选取部分属性
type UserName = Pick<User, 'name' | 'email'>;
// { name: string; email: string; }

// Omit：从类型中排除部分属性
type UserWithoutEmail = Omit<User, 'email'>;
// { name: string; age: number; }
```

### Record

```typescript
// Record：构造一个属性为K、值为T的类型
type PageInfo = Record<'home' | 'about' | 'blog', { title: string }>;
// {
//   home: { title: string };
//   about: { title: string };
//   blog: { title: string };
// }
```

## 🔥 进阶：手写工具类型

理解内置类型的实现原理，才能真正掌握类型编程。

### 实现 MyPartial

```typescript
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};
```

关键知识点：
- `keyof T` — 获取 T 的所有属性名的联合类型
- `[K in keyof T]` — 映射类型，遍历每个属性
- `?:` — 在映射中添加可选修饰符

### 实现 MyReadonly

```typescript
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};
```

### 实现MyPick

```typescript
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

注意 `K extends keyof T` — 这是泛型约束，确保 K 只能是 T 的属性名。

## 🏆 挑战：中等难度题目

### 1. Exclude

从联合类型中排除指定类型：

```typescript
// 目标：MyExclude<'a' | 'b' | 'c', 'a'> → 'b' | 'c'
type MyExclude<T, U> = T extends U ? never : T;
```

这用了**条件类型**（Conditional Types）— `T extends U ? X : Y`。当 T 是联合类型时，会自动分发（Distributive）。

### 2. Extract

与 Exclude 相反，提取匹配的类型：

```typescript
type MyExtract<T, U> = T extends U ? T : never;
```

### 3. ReturnType

获取函数的返回值类型：

```typescript
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// 使用
type R = MyReturnType<() => string>;  // string
type R2 = MyReturnType<() => number>; // number
```

`infer R` 是**类型推断**关键字，在条件类型中"推断"出一个类型变量。

### 4. Omit

用 Exclude 实现 Omit：

```typescript
type MyOmit<T, K> = {
  [P in MyExclude<keyof T, K>]: T[P];
};
```

组合拳！先用 Exclude 排除不需要的 key，再用映射类型构建新对象。

## 🧠 高级：递归与推断

### 深度 Readonly

```typescript
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K];
};

// 使用
type Obj = {
  a: string;
  b: { c: number; d: { e: boolean } };
  f: () => void;
};

type DeepObj = DeepReadonly<Obj>;
// { readonly a: string; readonly b: { readonly c: number; readonly d: { readonly e: boolean } }; f: () => void }
```

注意要排除 `Function`，否则函数也被 readonly 包裹就错了。

### 元组相关

```typescript
// 1. First - 获取元组第一个元素
type First<T extends any[]> = T extends [infer F, ...any[]] ? F : never;

// 2. Last - 获取元组最后一个元素
type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;

// 3. Length - 获取元组长度
type Length<T extends any[]> = T['length'];

// 4. Push - 在元组末尾添加元素
type Push<T extends any[], U> = [...T, U];

// 5. Reverse - 反转元组
type Reverse<T extends any[]> = T extends [infer F, ...infer R]
  ? [...Reverse<R>, F]
  : [];
```

## 📊 难度对照表

| 难度 | 代表题目 | 核心知识 |
|------|----------|----------|
| 🟢 Easy | Partial, Pick, Omit | 映射类型、keyof、泛型约束 |
| 🟡 Medium | ReturnType, Exclude, Omit | 条件类型、infer、分布式条件类型 |
| 🟠 Hard | DeepReadonly, Reverse | 递归类型、元组操作、模板字面量 |
| 🔴 Extreme | CamelCase, ParseInt | 模板字面量类型、字符串解析、计数器 |

## 🛠️ 实战建议

1. **从 Easy 开始** — 不要跳级，基础不牢地动山摇
2. **手写不复制** — 看懂答案 ≠ 会写，自己实现才有效
3. **善用工具** — [TypeScript Playground](https://www.typescriptlang.org/play) 在线验证
4. **理解分布式** — 条件类型对联合类型的分发是最容易踩坑的地方
5. **注意边界** — 空对象、never、any、unknown 的行为

```typescript
// 分发式条件类型的陷阱
type ToArray<T> = T extends any ? T[] : never;
type Result = ToArray<string | number>;
// string[] | number[] ✅ 不是 (string | number)[]

// 避免分发：用 [T]
type ToArrayNoDist<T> = [T] extends [any] ? T[] : never;
type Result2 = ToArrayNoDist<string | number>;
// (string | number)[] ✅
```

## 💡 类型体操的哲学

TypeScript 类型系统教会我们一件事：**用编译时的时间换运行时的安全**。

就像像素游戏中，每一像素的颜色都是精心选择的——每一个类型标注都是在告诉编译器"这里应该是什么"。当编译器通过所有检查，你的代码就像通关了——**没有 bug 能逃过类型检查的眼睛**。

🎮 类型即约束，约束即安全！
