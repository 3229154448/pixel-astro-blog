#!/usr/bin/env node
/**
 * 自动文章生成脚本
 * 
 * 此脚本本身不生成文章内容，而是：
 * 1. 随机选择主题
 * 2. 创建文章框架（frontmatter + 标题）
 * 3. 输出提示信息
 * 
 * 实际的AI内容生成由 OpenClaw sessions_spawn 完成
 * 详见 AUTO-POST.md
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 主题池
const topics = [
  { title: 'AI编程助手的发展趋势', tags: ['AI', '编程工具'], category: '技术' },
  { title: 'WebAssembly在浏览器中的应用', tags: ['WebAssembly', '浏览器'], category: '技术' },
  { title: 'CSS新特性探索', tags: ['CSS', '前端'], category: '技术' },
  { title: 'JavaScript性能优化技巧', tags: ['JavaScript', '性能优化'], category: '技术' },
  { title: '前端工程化实践', tags: ['工程化', '前端'], category: '技术' },
  { title: '无障碍访问实践指南', tags: ['A11y', '无障碍'], category: '教程' },
  { title: 'Web组件化开发', tags: ['Web-Components', '组件化'], category: '技术' },
  { title: 'TypeScript高级类型', tags: ['TypeScript', '类型系统'], category: '技术' },
  { title: 'Tailwind CSS实践', tags: ['Tailwind-CSS', '样式'], category: '教程' },
  { title: 'Web性能监控', tags: ['性能', '监控'], category: '技术' },
  { title: 'Node.js流式处理', tags: ['Node.js', '流处理'], category: '技术' },
  { title: 'PWA渐进式Web应用', tags: ['PWA', 'Web应用'], category: '教程' },
  { title: 'Rust与WebAssembly', tags: ['Rust', 'WebAssembly'], category: '技术' },
  { title: 'Astro框架优化', tags: ['Astro', 'SSG'], category: '技术' },
  { title: 'Docker前端开发', tags: ['Docker', 'DevOps'], category: '技术' },
  { title: '现代CSS布局', tags: ['CSS', '布局'], category: '教程' },
  { title: 'Vite构建优化', tags: ['Vite', '构建工具'], category: '技术' },
  { title: 'Web安全防护', tags: ['安全', 'XSS'], category: '技术' },
  { title: '边缘计算与前端', tags: ['边缘计算', '架构'], category: '技术' },
  { title: '微前端架构', tags: ['微前端', '架构'], category: '技术' },
];

function createPostSkeleton(topic) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const slug = topic.title.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-');

  const frontmatter = `---
title: '${topic.title}'
description: '${topic.title}的深入探讨与实践指南'
date: ${dateStr}
tags: ${JSON.stringify(topic.tags)}
categories: ['${topic.category}']
toc: true
comment: true
reward: false
---

# ${topic.title}

> 本文由AI自动生成

## 引言

（待AI填充内容）

## 核心概念

（待AI填充内容）

## 实践指南

（待AI填充内容）

## 代码示例

\`\`\`javascript
// 示例代码
\`\`\`

## 总结

（待AI填充内容）
`;

  const dir = path.join(__dirname, '..', 'src', 'content', 'blog');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, `${slug}.md`);
  
  if (fs.existsSync(filePath)) {
    console.log(`⚠️ 文章已存在: ${slug}.md，跳过`);
    return null;
  }

  fs.writeFileSync(filePath, frontmatter);
  return { slug, filePath, topic };
}

function main() {
  const topic = topics[Math.floor(Math.random() * topics.length)];
  console.log('📌 今日主题:', topic.title);

  const result = createPostSkeleton(topic);
  
  if (result) {
    console.log(`\n✅ 文章骨架已创建: ${result.slug}.md`);
    console.log(`📝 需要通过OpenClaw sessions_spawn填充内容`);
    console.log(`\n使用以下命令生成完整内容：`);
    console.log(`sessions_spawn --task "为博客填充文章内容: ${result.filePath}"`);
  }
}

main();
