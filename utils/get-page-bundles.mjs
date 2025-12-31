import path from 'path';
import { getAvailableBundles } from './resolve-bundle.mjs';
import { metadata } from '../lib/metadata.mjs';

/**
 * Get Vite entry points for all bundles
 *
 * Returns entry points for:
 * - main.js (global bundle - always included)
 * - All available bundles (theme + user, with user overrides taking precedence)
 *
 * @param {string} projectRoot - Project root path
 * @param {Object} overridePaths - Override paths configuration
 * @returns {Object} Entry points object for Vite build.rollupOptions.input
 *
 * @example
 * // In eleventy.config.mjs
 * import { getPageBundleEntries } from 'eleventy-base-blog-template';
 *
 * eleventyConfig.addPlugin(EleventyVitePlugin, {
 *   viteOptions: getThemeViteConfig(__dirname, {
 *     build: {
 *       rollupOptions: {
 *         input: getPageBundleEntries(__dirname),
 *       },
 *     },
 *   }),
 * });
 *
 * @example
 * // With custom override paths
 * getPageBundleEntries(__dirname, {
 *   bundles: 'src/bundles',
 *   scripts: 'src/scripts',
 * })
 */
export function getPageBundleEntries(projectRoot = process.cwd(), overridePaths = {}) {
	const scriptsPath = overridePaths.scripts || metadata.defaultOverridePaths.scripts;

	const entries = {
		// Main entry point (always included)
		main: path.join(projectRoot, scriptsPath, 'main.js'),
	};

	// Add all available bundles (theme + user)
	const bundles = getAvailableBundles(projectRoot, overridePaths);

	bundles.forEach((bundle, name) => {
		entries[name] = bundle.path;
	});

	// Log discovered bundles (helpful for debugging)
	const bundleNames = Object.keys(entries).filter((k) => k !== 'main');
	if (bundleNames.length > 0) {
		const bundleList = Array.from(bundles.entries())
			.map(([name, info]) => `${name} (${info.source})`)
			.join(', ');
		console.log(`📦 Discovered bundles: ${bundleList}`);
	}

	return entries;
}
