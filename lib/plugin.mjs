/**
 * Simplified Eleventy plugin wrapper for theme
 *
 * This makes theme setup simple while preserving user's ability to configure Eleventy.
 * Instead of taking over the entire config, this is just a plugin.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import EleventyVitePlugin from '@11ty/eleventy-plugin-vite';
import { init } from './index.mjs';
import { getThemeViteConfig } from './build/vite.mjs';
import { getPageBundleEntries } from './build/bundle-entries.mjs';

/**
 * Get __dirname equivalent in ES modules
 */
function getDirname(importMetaUrl) {
	const __filename = fileURLToPath(importMetaUrl);
	return path.dirname(__filename);
}

/**
 * Simplified theme plugin
 *
 * This is an Eleventy plugin that sets up the theme in one call.
 * Users can still add their own collections, plugins, etc.
 *
 * @param {Object} eleventyConfig - Eleventy configuration object
 * @param {Object} options - Plugin options
 * @param {string} options.importMetaUrl - Pass import.meta.url to auto-detect project root
 * @param {string} options.projectRoot - Or manually specify project root
 * @param {Object} options.overridePaths - Custom override paths
 * @param {Object} options.filters - Custom filters to merge with theme
 * @param {Object} options.shortcodes - Custom shortcodes to merge with theme
 * @param {Object} options.transforms - Custom transforms to merge with theme
 * @param {Object} options.vite - Additional Vite options to merge with theme config
 *
 * @example
 * // Simple setup - just pass import.meta.url
 * import themePlugin from 'eleventy-base-blog-template/plugin';
 *
 * export default function(eleventyConfig) {
 *   eleventyConfig.addPlugin(themePlugin, {
 *     importMetaUrl: import.meta.url
 *   });
 *
 *   // Your own config
 *   eleventyConfig.addCollection('posts', ...);
 *
 *   return { dir: { input: 'content', output: '_site' } };
 * }
 *
 * @example
 * // With custom options
 * eleventyConfig.addPlugin(themePlugin, {
 *   importMetaUrl: import.meta.url,
 *   filters: { myFilter: (str) => str.toUpperCase() },
 *   vite: { server: { port: 3000 } }
 * });
 */
export default function themePlugin(eleventyConfig, options = {}) {
	const {
		importMetaUrl,
		projectRoot: userProjectRoot,
		overridePaths,
		filters,
		shortcodes,
		transforms,
		vite: userViteOptions = {},
	} = options;

	// Auto-detect project root from import.meta.url or use provided
	const projectRoot =
		userProjectRoot ||
		(importMetaUrl ? getDirname(importMetaUrl) : process.cwd());

	// Initialize theme (Nunjucks, cascade, filters, etc.)
	init(eleventyConfig, {
		projectRoot,
		overridePaths,
		filters,
		shortcodes,
		transforms,
	});

	// Add Vite plugin with theme configuration
	eleventyConfig.addPlugin(EleventyVitePlugin, {
		viteOptions: getThemeViteConfig(projectRoot, {
			...userViteOptions,
			build: {
				...(userViteOptions.build || {}),
				rollupOptions: {
					...(userViteOptions.build?.rollupOptions || {}),
					input: getPageBundleEntries(projectRoot),
				},
			},
		}),
	});
}
