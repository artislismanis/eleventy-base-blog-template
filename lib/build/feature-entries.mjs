import path from 'path';
import { getAvailableFeatures } from '../cascade/features.mjs';
import { metadata } from '../metadata.mjs';

/**
 * Get Vite entry points for all features
 *
 * Returns entry points for:
 * - main.js (global entry - always included)
 * - All available features (theme + user, with user overrides taking precedence)
 *
 * @param {string} projectRoot - Project root path
 * @param {Object} overridePaths - Override paths configuration
 * @returns {Object} Entry points object for Vite build.rollupOptions.input
 *
 * @example
 * // In eleventy.config.mjs
 * import { getFeatureEntries } from 'eleventy-base-blog-template';
 *
 * eleventyConfig.addPlugin(EleventyVitePlugin, {
 *   viteOptions: getThemeViteConfig(__dirname, {
 *     build: {
 *       rollupOptions: {
 *         input: getFeatureEntries(__dirname),
 *       },
 *     },
 *   }),
 * });
 *
 * @example
 * // With custom override paths
 * getFeatureEntries(__dirname, {
 *   features: 'src/features',
 *   scripts: 'src/scripts',
 * })
 */
export function getFeatureEntries(projectRoot = process.cwd(), overridePaths = {}) {
	const scriptsPath = overridePaths.scripts || metadata.defaultOverridePaths.scripts;

	const entries = {
		// Main entry point (always included)
		main: path.join(projectRoot, scriptsPath, 'main.js'),
	};

	// Add all available features (theme + user)
	const features = getAvailableFeatures(projectRoot, overridePaths);

	features.forEach((feature, name) => {
		entries[name] = feature.path;
	});

	// Log discovered features (helpful for debugging)
	const featureNames = Object.keys(entries).filter((k) => k !== 'main');
	if (featureNames.length > 0) {
		const featureList = Array.from(features.entries())
			.map(([name, info]) => `${name} (${info.source})`)
			.join(', ');
		console.log(`✨ Discovered features: ${featureList}`);
	}

	return entries;
}
