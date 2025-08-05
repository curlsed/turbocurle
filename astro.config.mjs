// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import goatDiagrams from "./src/remarkPlugins/goat_diagram.js";

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.gemwire.uk',
	server:{
		allowedHosts: ['localhost'],
	},
	integrations: [mdx(), sitemap()],
	markdown: {
		remarkPlugins: [ goatDiagrams ]
	}
});
