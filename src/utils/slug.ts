// 去掉 .md 后缀的 slug 工具
export function slugify(postId: string): string {
  return postId.replace(/\.md$/, '');
}

// 标签 slug 工具：将空格替换为连字符，避免 URL 编码问题
export function tagSlugify(tag: string): string {
  return tag
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
    .toLowerCase();
}
