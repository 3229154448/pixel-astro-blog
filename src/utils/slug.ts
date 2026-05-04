// 去掉 .md 后缀的 slug 工具
export function slugify(postId: string): string {
  return postId.replace(/\.md$/, '');
}
