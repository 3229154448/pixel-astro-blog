# 自动文章撰写功能

## 功能说明

本博客支持每日自动生成并部署技术文章，基于AI生成内容并自动推送到GitHub Pages。

## 工作原理

1. **定时触发**：每天北京时间 23:00（UTC 15:00）自动执行
2. **AI生成**：调用OpenClaw子代理生成技术文章内容
3. **自动发布**：创建文章文件并提交到Git仓库
4. **自动部署**：触发GitHub Pages部署流程

## 文章主题

系统会从以下主题池中随机选择一个：

- AI编程助手的发展趋势
- WebAssembly在浏览器中的应用
- CSS新特性探索
- JavaScript性能优化技巧
- 前端工程化实践
- 无障碍访问(A11y)指南
- Web组件化开发
- TypeScript高级类型
- Tailwind CSS最佳实践
- Web性能监控

## 手动触发

如果需要手动测试，可以：

1. 进入项目目录
2. 运行：`node script/auto-post.js`

## 配置文件

- **定时任务**：`.github/workflows/daily-post.yml`
- **生成脚本**：`script/auto-post.js`

## 注意事项

- 每次生成会创建一篇新文章
- 文章会自动推送到 `main` 分支
- GitHub Pages会自动部署最新内容
- 如果生成失败，需要手动检查错误日志

## 自定义

如需修改文章主题或生成逻辑，编辑 `script/auto-post.js` 文件。
