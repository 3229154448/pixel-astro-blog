#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 文章模板
const topics = [
  'AI编程助手的发展趋势',
  'WebAssembly在浏览器中的应用',
  'CSS新特性探索',
  'JavaScript性能优化技巧',
  '前端工程化实践',
  '无障碍访问(A11y)指南',
  'Web组件化开发',
  'TypeScript高级类型',
  'Tailwind CSS最佳实践',
  'Web性能监控'
];

function getRandomTopic() {
  return topics[Math.floor(Math.random() * topics.length)];
}

function createPost(title, content) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const slug = title.replace(/[^\w\u4e00-\u9fff]+/g, '-').toLowerCase();

  const dir = path.join(__dirname, '..', 'src', 'content', 'blog');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const frontmatter = `---
title: '${title}'
description: '${title}的描述'
date: ${dateStr}
tags: []
categories: ['技术文章']
toc: true
comment: true
reward: false
---

${content}
`;

  fs.writeFileSync(path.join(dir, `${slug}.md`), frontmatter);
  return slug;
}

function main() {
  const topic = getRandomTopic();
  console.log('📌 今日主题:', topic);
  console.log('\n📝 请使用以下命令生成文章内容：');
  console.log('\nopenclaw sessions_spawn --task "为博客写一篇关于' + topic + '"的技术文章，包含技术要点和实践建议，字数800-1000字，使用中文，使用markdown格式" --runtime subagent\n');
  console.log('生成完成后，将内容保存为以下文件：');
  console.log(`src/content/blog/${topic.replace(/[^\w\u4e00-\u9fff]+/g, '-').toLowerCase()}.md\n`);
  console.log('完成后运行以下命令提交到GitHub：');
  console.log('git add . && git commit -m "feat: 自动生成文章" && git push\n');
}

main();
