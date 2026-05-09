---
title: '无障碍访问(A11y)完整实践指南'
description: '构建人人可用的Web应用的完整指南'
date: 2026-05-10
tags: ['A11y', '无障碍']
categories: ['技术']
toc: true
comment: true
reward: false
---

## 为什么无障碍访问如此重要

全球有超过10亿残障人士，他们同样需要使用Web服务。无障碍访问不仅是道德义务，在许多国家和地区也是法律要求。更重要的是，良好的A11y实践能提升所有用户的体验——键盘导航帮助高级用户提效，语义化HTML让搜索引擎更好理解你的页面。

## 语义化HTML：A11y的基石

不要用`<div>`堆砌一切，原生语义标签自带无障碍能力：

```html
<!-- ❌ 不推荐 -->
<div class="nav">
  <div class="nav-item" onclick="go('/')">首页</div>
</div>

<!-- ✅ 推荐 -->
<nav>
  <ul>
    <li><a href="/">首页</a></li>
  </ul>
</nav>
```

关键语义标签：`<header>`、`<main>`、`<footer>`、`<nav>`、`<article>`、`<section>`。使用它们，屏幕阅读器用户就能快速跳转到页面核心区域。

## ARIA：当语义不够时

ARIA属性为自定义组件补全无障碍信息，但遵循**第一法则**：能用原生HTML解决的，不要用ARIA。

```html
<!-- 自定义开关组件 -->
<div
  role="switch"
  aria-checked="true"
  aria-label="深色模式"
  tabindex="0"
  @keydown.enter="toggle"
  @keydown.space.prevent="toggle"
>
  深色模式
</div>
```

常用ARIA属性速查：

| 属性 | 用途 | 示例 |
|------|------|------|
| `aria-label` | 补充标签文本 | `aria-label="搜索"` |
| `aria-labelledby` | 关联可见标签 | `aria-labelledby="title-id"` |
| `aria-describedby` | 关联描述信息 | `aria-describedby="hint-id"` |
| `aria-live` | 动态内容通知 | `aria-live="polite"` |
| `aria-hidden` | 对辅助技术隐藏 | `aria-hidden="true"` |

## 键盘导航与焦点管理

所有交互元素必须可通过键盘操作。焦点顺序应遵循自然阅读流，焦点样式不可移除：

```css
/* ❌ 绝对禁止 */
*:focus { outline: none; }

/* ✅ 自定义焦点样式 */
:focus-visible {
  outline: 3px solid #4a90d9;
  outline-offset: 2px;
  border-radius: 4px;
}
```

管理焦点跳转——模态框打开时焦点应移入，关闭后回到触发元素：

```js
function openModal(trigger) {
  const modal = document.getElementById('modal');
  modal.showModal();
  // 焦点移入模态框首个可交互元素
  modal.querySelector('button, [href], input')?.focus();
  // 关闭时焦点回到触发元素
  modal.addEventListener('close', () => trigger.focus(), { once: true });
}
```

## 颜色与对比度

WCAG 2.1要求：正文文本对比度至少**4.5:1**，大文本（18px粗体或24px以上）至少**3:1**。不要仅靠颜色传达信息：

```html
<!-- ❌ 仅用颜色区分 -->
<p>必填字段标为<span class="red">红色</span></p>

<!-- ✅ 颜色 + 图标双重提示 -->
<label>
  用户名 <span aria-hidden="true">*</span>
  <span class="sr-only">（必填）</span>
  <input type="text" required aria-required="true" />
</label>
```

## 图片与多媒体

每张有意义的图片必须有`alt`文本，装饰性图片使用空`alt`：

```html
<!-- 信息性图片 -->
<img src="chart.png" alt="2025年营收增长30%的柱状图" />

<!-- 装饰性图片 -->
<img src="divider.png" alt="" role="presentation" />

<!-- 视频必须提供字幕 -->
<video src="tutorial.mp4">
  <track kind="captions" src="tutorial.vtt" srclang="zh" label="中文字幕" />
</video>
```

## 表单无障碍

表单是A11y问题的重灾区。每个输入必须有关联标签，错误提示必须可被感知：

```html
<form @submit.prevent="submit">
  <label for="email">邮箱</label>
  <input
    id="email"
    type="email"
    required
    aria-required="true"
    aria-describedby="email-error"
    aria-invalid="!!emailError"
  />
  <span id="email-error" role="alert" v-if="emailError">
    {{ emailError }}
  </span>
</form>
```

## 自动化检测与持续集成

将A11y检查纳入CI流水线，在问题进入生产前拦截：

```js
// 使用 axe-core 进行自动化检测
import axe from 'axe-core';

afterEach(() => {
  const results = await axe(document.body);
  expect(results.violations).toHaveLength(0);
});
```

推荐工具链：**axe-core**（单元测试）、**Lighthouse**（综合审计）、**eslint-plugin-jsx-a11y**（编码规范）。

## 总结

无障碍访问不是锦上添花，而是Web开发的基本要求。记住核心原则：

1. **语义优先**：原生标签 > ARIA补全
2. **键盘可达**：所有交互元素可键盘操作
3. **对比度达标**：4.5:1是底线
4. **信息冗余**：不只用颜色传达含义
5. **自动化保障**：CI中集成A11y检测

从今天起，在每次提交代码时问自己：**这个页面，所有人都能用吗？**
