import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import compress from '@playform/compress';
import remarkMath from 'remark-math';
import remarkDirective from 'remark-directive';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import { siteConfig } from './src/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  site: siteConfig.site,
  integrations: [
    mdx(),
    sitemap(),
    compress(),
  ],
  markdown: {
    remarkPlugins: [remarkMath, remarkDirective],
    rehypePlugins: [rehypeKatex, rehypeSlug],
    shikiConfig: {
      theme: 'github-dark',
    },
  },
  vite: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  },
  base: '/pixel-astro-blog',
  build: {
    assets: 'vh_static',
  },
});
