import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig } from '@/config';

export async function GET(context: any) {
  const allPosts = await getCollection('blog', ({ data }) => !data.draft);
  allPosts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: context.site,
    items: allPosts.map(post => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/article/${post.id}/`,
    })),
  });
}
