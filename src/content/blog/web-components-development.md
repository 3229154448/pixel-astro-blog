---
title: 'Web组件化开发实战'
description: '使用Web Components构建可复用组件'
date: 2026-05-10
tags: ['Web Components', '组件化']
categories: ['技术']
cover: '/assets/images/banner/pixel-blog.webp'
toc: true
comment: true
reward: false
---

## 为什么选择Web Components？

前端框架百花齐放，但组件复用始终面临一个难题：**Vue组件不能在React项目中使用，React组件也无法直接迁移到Angular**。Web Components作为浏览器原生标准，提供了一套与框架无关的组件化方案，让你写的组件真正实现"一次开发，到处运行"。

Web Components由三个核心API组成：

- **Custom Elements** — 定义自定义HTML标签
- **Shadow DOM** — 实现样式隔离
- **HTML Templates** — 声明可复用的DOM模板

## 实战：构建一个像素风按钮组件

下面我们从一个实际的像素风按钮组件入手，逐步掌握Web Components的核心用法。

### 1. 创建自定义元素

```javascript
class PixelButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['variant', 'disabled'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  get variant() {
    return this.getAttribute('variant') || 'primary';
  }

  render() {
    const disabled = this.hasAttribute('disabled');
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        button {
          font-family: 'Press Start 2P', monospace;
          font-size: 12px;
          padding: 10px 20px;
          border: 3px solid #000;
          background: ${this.variant === 'primary' ? '#4a90d9' : '#6c757d'};
          color: #fff;
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          opacity: ${disabled ? '0.6' : '1'};
          image-rendering: pixelated;
          box-shadow: 3px 3px 0 #000;
        }
        button:active:not([disabled]) {
          box-shadow: 1px 1px 0 #000;
          transform: translate(2px, 2px);
        }
      </style>
      <button ${disabled ? 'disabled' : ''}>
        <slot></slot>
      </button>
    `;
  }
}

customElements.define('pixel-button', PixelButton);
```

### 2. 使用Shadow DOM隔离样式

Shadow DOM是Web Components的灵魂。上面的例子中，`this.attachShadow({ mode: 'open' })`创建了一个Shadow Root，内部的`<style>`不会泄漏到外部，外部样式也无法穿透进来。这解决了长期以来CSS命名冲突的痛点。

关键点：

- `mode: 'open'`允许外部通过`element.shadowRoot`访问内部DOM
- `mode: 'closed'`则拒绝外部访问，封装更严格
- `:host`选择器用于定义组件自身样式

### 3. 使用Slot实现内容分发

`<slot>`标签是Web Components的内容插槽机制，类似于Vue的`<slot>`或React的`children`：

```html
<pixel-button variant="primary">开始游戏</pixel-button>
<pixel-button variant="secondary">设置</pixel-button>
```

具名插槽则支持更灵活的结构：

```html
<card-element>
  <span slot="title">像素冒险</span>
  <p slot="body">经典8-bit风格RPG</p>
</card-element>
```

## 生命周期回调

Custom Elements提供了一套完整的生命周期钩子：

| 回调 | 触发时机 |
|------|---------|
| `connectedCallback` | 元素插入DOM |
| `disconnectedCallback` | 元素移除DOM |
| `adoptedCallback` | 元素移至新文档 |
| `attributeChangedCallback` | 观察属性变化 |

合理利用这些回调，可以在组件挂载时初始化资源，卸载时清理定时器和事件监听，避免内存泄漏。

## 与框架集成

Web Components可以无缝集成到主流框架中：

```jsx
// React中使用
function App() {
  return <pixel-button variant="primary">开始</pixel-button>;
}

// Vue中使用
<template>
  <pixel-button variant="primary">开始</pixel-button>
</template>
```

需要注意React对Custom Events的处理——React不会自动转发自定义事件，需要手动添加`addEventListener`：

```javascript
const ref = useRef();
useEffect(() => {
  ref.current?.addEventListener('pixel-click', handler);
  return () => ref.current?.removeEventListener('pixel-click', handler);
}, []);
```

## 最佳实践总结

1. **命名规范**：自定义元素必须包含连字符，如`pixel-button`，避免与原生标签冲突
2. **渐进增强**：在`connectedCallback`中渲染，确保元素在DOM中再操作
3. **属性同步**：使用`observedAttributes` + `attributeChangedCallback`保持属性与渲染一致
4. **事件通信**：通过`CustomEvent`向外部传递组件内部状态变化
5. **避免过度封装**：简单场景不必强行使用Shadow DOM，`mode: 'open'`优先

Web Components并非要替代框架，而是提供了一种标准化的组件封装方式。在需要跨框架复用、构建设计系统或开发嵌入式组件时，它是值得投入的技术选择。
