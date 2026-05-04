import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export async function GET() {
  const allPosts = await getCollection('blog', ({ data }) => !data.draft);
  allPosts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  const searchData = allPosts.map(post => ({
    title: post.data.title,
    url: `/pixel-astro-blog/article/${post.id.replace(/\.md$/, '')}`,
    content: (post.body || '').replace(/\n/g, ' ').substring(0, 500),
    date: post.data.date.toISOString().split('T')[0],
    tags: post.data.tags,
    categories: post.data.categories,
  }));
  return new Response(JSON.stringify(searchData), {
    headers: { 'Content-Type': 'application/json' },
  });
}
