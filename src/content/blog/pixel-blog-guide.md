---
title: '像素风博客搭建指南'
description: '从零开始搭建一个像素风格的Astro博客，包括主题选择、样式配置、部署上线等完整流程。'
date: 2026-05-04
tags: ['Astro', '像素风', '博客搭建']
categories: ['教程']
cover: '/assets/images/banner/pixel-blog.webp'
pin: true
toc: true
comment: true
reward: true
---

## 🎮 为什么选择像素风？

像素风（Pixel Art）是一种经典的视觉风格，起源于早期电子游戏。它用最少的像素表达最丰富的信息，有一种独特的复古美感。

在当今扁平化、拟物化、新拟态各种设计风格轮番登场的时候，像素风反而显得与众不同——它不追求拟真，而是追求**用有限资源创造无限可能**。这和早期游戏开发者在8位、16位硬件限制下发挥创意的精神一脉相承。

选择像素风做博客主题的三个理由：

1. **辨识度高** — 在千篇一律的博客主题中脱颖而出
2. **性能极佳** — 不依赖复杂图片和动画，纯 CSS 即可实现
3. **情感共鸣** — 唤起一代人的红白机记忆

## 🛠️ 技术选型

| 技术 | 版本 | 用途 |
|------|------|------|
| **Astro** | 5.x | 现代静态站点生成器，零 JS 默认策略 |
| **TypeScript** | 5.x | 类型安全，开发体验好 |
| **Less** | 4.x | CSS 预处理器，变量嵌套 |
| **Press Start 2P** | - | 经典像素字体（标题用） |
| **ZCOOL KuaiLe** | - | 可爱中文字体（正文用） |

为什么选 Astro 而不是 Next.js 或 Hugo？

- **零 JS 默认** — 博客页面不需要客户端 JavaScript，加载极快
- **内容集合** — 内置 Markdown 内容管理，TypeScript 类型安全
- **岛屿架构** — 需要交互的组件才加载 JS（如音乐播放器）

## 📐 像素风设计要点

### 硬阴影 + 粗边框

像素风的核心是**硬阴影**（no blur）和**粗边框**：

```css
.card {
  border: 4px solid #1a1a2e;
  box-shadow: 6px 6px 0 0 #1a1a2e;  /* 无模糊！ */
  border-radius: 0;                  /* 零圆角！ */
}
```

关键规则：
- ❌ 绝不用 `border-radius`
- ❌ 绝不用 `box-shadow` 的 blur 值
- ❌ 绝不用 `filter: blur()`
- ✅ 用 `transform: translate()` 模拟按压效果

### 配色方案

我们选用了暖色浅底配色：

| 用途 | 颜色 | 说明 |
|------|------|------|
| 背景 | `#e8e0d5` | 米白暖色 |
| 深色 | `#1a1a2e` | 近黑深蓝 |
| 红色强调 | `#e74c3c` | 主色调 |
| 绿色 | `#27ae60` | 辅助色 |
| 黄色 | `#f39c12` | 警告/标签 |
| 紫色 | `#8e44ad` | 特殊标记 |

### 字体搭配

标题用 **Press Start 2P**，一款经典的像素字体，每个字符都是8x8像素网格设计的。

正文用 **ZCOOL KuaiLe**，站酷快乐体，圆润可爱的中文字体，和像素标题形成有趣的对比。

## 🚀 部署到 GitHub Pages

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v3
  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

## 💡 小技巧

1. **`image-rendering: pixelated`** — 让图片在缩放时保持像素锐利
2. **CSS 网格背景** — `repeating-linear-gradient` 实现像素网格
3. **CRT 扫描线** — 半透明条纹叠加，模拟老式显示器效果
4. **Konami Code** — 按 ↑↑↓↓←→←→BA 触发彩蛋！

🎮 像素世界，无限可能！
