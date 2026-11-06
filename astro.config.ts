import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://partitelle.com",
  output: "static",
  integrations: [sitemap()],
  // Post bodies show exactly the characters typed: straight apostrophes.
  markdown: {
    processor: satteri({ features: { smartPunctuation: false } }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
