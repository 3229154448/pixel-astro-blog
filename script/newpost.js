const now = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const title = process.argv[2] || '新文章';
const fs = require('fs');
const path = require('path');
const slug = title.replace(/[^\w\u4e00-\u9fff]+/g, '-').toLowerCase();
const frontmatter = `---
title: '${title}'
description: '${title}的描述'
date: ${dateStr}
tags: []
categories: []
toc: true
comment: true
reward: false
---

## ${title}

在这里开始写你的文章吧！
`;
const dir = path.join(__dirname, '..', 'src', 'content', 'blog');
fs.writeFileSync(path.join(dir, `${slug}.md`), frontmatter);
console.log(`✅ 文章已创建: ${slug}.md`);
