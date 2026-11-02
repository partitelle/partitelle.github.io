import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { categorySlugs } from "./lib/news";

const novita = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/novita" }),
  schema: z.object({
    title: z.string().max(60),
    date: z.coerce.date(),
    category: z.enum(categorySlugs),
    lede: z.string().max(160),
    changes: z.array(z.string()).min(2).max(5),
    version: z.string().optional(),
    product: z.enum(["bot", "sito"]).optional(),
    visual: z.enum(["summary", "teams"]).optional(),
    visualProps: z.record(z.string(), z.unknown()).optional(),
    backfill: z.boolean().default(false),
    draft: z.boolean().default(false),
    order: z.number().optional(),
  }),
});

export const collections = { novita };
