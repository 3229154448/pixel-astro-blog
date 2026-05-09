---
title: '无障碍访问(A11y)实践指南'
description: '构建人人可用的Web应用'
date: 2026-05-10
tags: ['A11y', '无障碍']
categories: ['技术']
cover: '/assets/images/banner/pixel-blog.webp'
toc: true
comment: true
reward: false
---

无障碍访问（Accessibility，简称 A11y）不仅是技术规范，更是一种设计理念——让每个人都能顺畅使用你的 Web 应用。据世界卫生组织统计，全球超过 10 亿人存在某种形式的残疾，忽视无障碍意味着将大量用户拒之门外。

## 为什么 A11y 值得投入

- **法律合规**：许多国家和地区（如美国 ADA、欧盟 EN 301 549）已将 Web 无障碍纳入法规
- **商业价值**：无障碍优化提升 SEO、扩大用户覆盖面、增强品牌形象
- **技术质量**：语义化 HTML 和合理的交互设计让代码更健壮、更易维护

## 核心实践要点

### 1. 语义化 HTML 是基石

用正确的标签表达内容含义，而非依赖样式"看起来对"：

```html
<!-- ❌ 全是 div -->
<div class="nav"><div class="item">首页</div></div>

<!-- ✅ 语义化标签 -->
<nav>
  <ul>
    <li><a href="/">首页</a></li>
  </ul>
</nav>
```

语义化标签天然具备键盘聚焦、屏幕阅读器识别等能力，是无障碍最廉价也最有效的手段。

### 2. 图片必须有替代文本

```html
<!-- ❌ 缺少 alt -->
<img src="chart.png">

<!-- ✅ 描述性 alt -->
<img src="chart.png" alt="2025年月度营收趋势图，整体呈上升趋势">

<!-- 装饰性图片用空 alt -->
<img src="divider.png" alt="">
```

替代文本让视障用户通过屏幕阅读器理解图片内容。装饰性图片留空 `alt=""`，避免屏幕阅读器读出无意义的文件名。

### 3. 表单标签与错误提示

```html
<label for="email">邮箱地址</label>
<input type="email" id="email" aria-describedby="email-error" required>
<span id="email-error" role="alert">请输入有效的邮箱地址</span>
```

关键点：`<label>` 与 `<input>` 通过 `for/id` 关联；`aria-describedby` 指向错误提示元素；`role="alert"` 确保错误信息即时播报。

### 4. 键盘导航与焦点管理

所有交互元素必须可通过键盘操作。常见问题及修复：

```css
/* ❌ 千万不要这样做 */
*:focus { outline: none; }

/* ✅ 提供可见焦点样式 */
:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 2px;
}
```

对于自定义组件（模态框、下拉菜单等），使用 `tabindex` 控制焦点顺序，并在打开时将焦点移入、关闭时恢复到触发元素。

### 5. ARIA 角色与属性的正确使用

```html
<!-- 自定义开关组件 -->
<button
  role="switch"
  aria-checked="false"
  aria-label="深色模式"
  onclick="toggleDarkMode(this)"
>
  <span class="track"></span>
</button>
```

**黄金法则**：能用原生 HTML 解决的，就不要加 ARIA。ARIA 是"补丁"，不是"替代品"。一个 `role="button"` 的 `<div>` 永远不如直接用 `<button>`。

### 6. 色彩对比度

WCAG 2.1 要求普通文本对比度至少 **4.5:1**，大文本（18px+或14px粗体）至少 **3:1**。使用工具如 [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) 验证：

```css
/* ❌ 对比度不足 */
.text { color: #a0a0a0; background: #ffffff; } /* 约 2.9:1 */

/* ✅ 满足 AA 标准 */
.text { color: #595959; background: #ffffff; } /* 约 5.9:1 */
```

## 检测与测试工具

| 工具 | 用途 |
|------|------|
| Lighthouse | 自动化审计，生成 A11y 评分 |
| axe DevTools | 浏览器插件，逐页检测违规项 |
| NVDA / VoiceOver | 屏幕阅读器实测，验证真实体验 |
| keyboard-only 测试 | 不用鼠标完成所有核心流程 |

## 实施建议

1. **开发阶段**：ESLint 启用 `jsx-a11y` 规则集，CI 集成 `@axe-core/cli`
2. **设计阶段**：设计稿标注对比度、焦点样式、焦点顺序
3. **测试阶段**：每轮迭代至少完成一次键盘全流程测试和屏幕阅读器抽检
4. **持续改进**：将 A11y 问题与 Bug 同等优先级对待

无障碍不是"锦上添花"，而是"基础设施"。从今天开始，在你的下一个 PR 里加一条 alt 文本、修一个焦点样式——每一点改善，都在让 Web 对所有人更友好。
