/**
 * Utilities for resolving page-specific features for Vite builds
 *
 * Provides entry point discovery for features referenced in page front matter.
 * Works with any theme that follows the @eleventy-themes conventions.
 */

import path from 'path';
import { getAvailableFeatures } from '@eleventy-themes/core';

// Re-export for convenience
export { getAvailableFeatures } from '@eleventy-themes/core';

/**
 * Get Vite entry points for all features
 *
 * Returns entry points for:
 * - main.js (global entry - always included)
 * - All available features (theme + user, with user overrides taking precedence)
 *
 * @param {string} projectRoot - Project root path
 * @param {string} themeName - Theme package name
 * @param {Object} themeMetadata - Theme metadata object from theme.json
 * @param {Object} overridePaths - Override paths configuration (optional)
 * @returns {Object} Entry points object for Vite build.rollupOptions.input
 *
 * @example
 * // In eleventy.config.mjs
 * import { getFeatureEntries } from '@eleventy-themes/vite';
 * import { metadata } from '@eleventy-themes/base-blog';
 *
 * const viteOptions = {
 *   build: {
 *     rollupOptions: {
 *       input: getFeatureEntries(__dirname, metadata.name, metadata),
 *     },
 *   },
 * };
 */
export function getFeatureEntries(projectRoot, themeName, themeMetadata, overridePaths = {}) {
	// Resolve override paths from theme metadata if not provided
	const resolvedOverridePaths = overridePaths || themeMetadata.cascade?.defaultOverridePaths || {};
	const scriptsPath = resolvedOverridePaths.scripts || 'overrides/scripts';

	const entries = {
		// Main entry point (always included)
		main: path.join(projectRoot, scriptsPath, 'main.js'),
	};

	// Discover all available features using core's cascade system
	const features = getAvailableFeatures(projectRoot, themeMetadata, resolvedOverridePaths);

	// Add each feature as an entry point with /name.js pattern
	// This ensures Vite bundles them for production builds
	features.forEach((feature) => {
		// Entry key format: /code-highlighting.js (matches HTML <script src="...">)
		const entryKey = `/${feature.name}.js`;
		entries[entryKey] = feature.path;
	});

	if (features.size > 0) {
		const featureList = Array.from(features.entries())
			.map(([name, info]) => `${name} (${info.source})`)
			.join(', ');
		console.log(`✨ Discovered features: ${featureList}`);
		console.log(`✅ Added ${features.size} feature(s) as Vite entry points`);
	}

	return entries;
}
