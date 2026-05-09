---
title: 'Web性能监控实战'
description: '从指标采集到分析的完整监控方案'
date: 2026-05-10
tags: ['性能', '监控']
categories: ['技术']
cover: '/assets/images/banner/pixel-blog.webp'
toc: true
comment: true
reward: false
---

## 前言

在像素风项目中，性能优化往往被忽视。但一个流畅的体验才是真正的"像素艺术"。本文将介绍如何从零搭建Web性能监控系统。

## 核心性能指标

现代浏览器提供了丰富的性能指标，重点关注以下三个：

- **LCP (Largest Contentful Paint)**: 最大内容绘制时间，目标 < 2.5s
- **FID (First Input Delay)**: 首次输入延迟，目标 < 100ms
- **CLS (Cumulative Layout Shift)**: 累积布局偏移，目标 < 0.1

## Performance API 监控

```javascript
// 获取性能指标
const perfData = performance.getEntriesByType('navigation')[0];

// LCP 监控
let lcpValue = 0;
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];
  lcpValue = lastEntry.startTime;
  console.log(`LCP: ${lcpValue}ms`);
}).observe({ entryTypes: ['largest-contentful-paint'] });

// FID 监控
let fidValue = 0;
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach(entry => {
    fidValue = entry.processingStart - entry.startTime;
    console.log(`FID: ${fidValue}ms`);
  });
}).observe({ entryTypes: ['first-input'] });

// CLS 监控
let clsValue = 0;
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) {
      clsValue += entry.value;
    }
  }
  console.log(`CLS: ${clsValue.toFixed(3)}`);
}).observe({ entryTypes: ['layout-shift'] });
```

## 完整监控方案

```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.init();
  }

  init() {
    this.setupNavigationMetrics();
    this.setupCoreWebVitals();
    this.setupResourceTiming();
    this.setupLongTasks();
  }

  setupNavigationMetrics() {
    const nav = performance.getEntriesByType('navigation')[0];
    this.metrics.navigation = {
      domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
      loadComplete: nav.loadEventEnd - nav.loadEventStart,
      dnsTime: nav.domainLookupEnd - nav.domainLookupStart,
      tcpTime: nav.connectEnd - nav.connectStart,
      ttfb: nav.responseStart - nav.requestStart
    };
  }

  setupCoreWebVitals() {
    // LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // FID
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.metrics.fid = entry.processingStart - entry.startTime;
      });
    }).observe({ entryTypes: ['first-input'] });

    // CLS
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          this.metrics.cls += entry.value;
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }

  setupResourceTiming() {
    const resources = performance.getEntriesByType('resource');
    this.metrics.resources = resources.map(r => ({
      name: r.name,
      duration: r.duration,
      size: r.transferSize,
      type: r.initiatorType
    }));
  }

  setupLongTasks() {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.metrics.longTasks = this.metrics.longTasks || [];
        this.metrics.longTasks.push({
          duration: entry.duration,
          startTime: entry.startTime
        });
      }
    }).observe({ entryTypes: ['longtask'] });
  }

  getReport() {
    return {
      ...this.metrics,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    };
  }
}

// 使用示例
const monitor = new PerformanceMonitor();
// 页面加载完成后上报
window.addEventListener('load', () => {
  const report = monitor.getReport();
  console.log('性能报告:', report);
  // 发送到分析服务
});
```

## 上报到分析平台

将监控数据发送到自建分析服务：

```javascript
async function reportMetrics(data) {
  const response = await fetch('/api/performance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

// 在性能报告中添加上报逻辑
monitor.getReport = function() {
  const report = {
    ...this.metrics,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  reportMetrics(report);
  return report;
};
```

## 总结

性能监控不是一次性工作，而是持续优化的重要依据。通过Performance API和Core Web Vitals，我们可以系统地识别性能瓶颈。记住，在像素风项目中，每一个毫秒的优化都是对用户体验的致敬。

## 参考资料

- [Web Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Core Web Vitals](https://web.dev/vitals/)
