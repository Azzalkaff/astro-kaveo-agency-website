import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const portfolioCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/portfolio" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tag: z.string(),
    isDarkTag: z.boolean().default(false),
    image: z.string(),
    link: z.string().default("#"),
  }),
});

export const collections = {
  'portfolio': portfolioCollection,
};
