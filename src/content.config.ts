import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    cover: z.string().optional(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    pin: z.boolean().default(false),
    toc: z.boolean().default(true),
    comment: z.boolean().default(true),
    reward: z.boolean().default(true),
    livePhoto: z.boolean().default(false),
  }),
});

export const collections = { blog };
