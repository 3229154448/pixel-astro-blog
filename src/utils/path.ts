// 路径工具 - 确保所有内部链接带有 base 前缀
// 在组件 frontmatter 中导入使用
export function withBase(path: string): string {
  const base = '/pixel-astro-blog';
  if (path.startsWith('http') || path.startsWith('//')) return path;
  if (path.startsWith('#')) return path;
  if (path.startsWith(base)) return path; // 已有前缀
  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  return base + normalizedPath;
}
