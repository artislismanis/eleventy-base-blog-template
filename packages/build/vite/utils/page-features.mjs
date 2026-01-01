/**
 * Utilities for resolving page-specific features for Vite builds
 *
 * Provides entry point discovery for features referenced in page front matter.
 * Works with any theme that follows the @eleventy-plugin-themer conventions.
 */

import path from 'path';
import { getAvailableFeatures, resolveOverridePaths } from '@eleventy-plugin-themer/core';

// Re-export for convenience
export { getAvailableFeatures } from '@eleventy-plugin-themer/core';

/**
 * Get Vite entry points for all features
 *
 * Returns entry points for:
 * - main.js (global entry - always included)
 * - All available features (theme + user, with user overrides taking precedence)
 *
 * Core package handles all cascade logic internally via themeMetadata.
 *
 * @param {string} projectRoot - Project root path
 * @param {Object} themeMetadata - Theme metadata object from theme.json
 * @param {Object} [overridePaths] - Optional override paths (only for edge cases)
 * @returns {Object} Entry points object for Vite build.rollupOptions.input
 *
 * @example
 * // In eleventy.config.mjs
 * import { getFeatureEntries } from '@eleventy-plugin-themer/build-vite';
 * import { metadata } from '@eleventy-plugin-themer/theme-base';
 *
 * const viteOptions = {
 *   build: {
 *     rollupOptions: {
 *       input: getFeatureEntries(__dirname, metadata),
 *     },
 *   },
 * };
 */
export function getFeatureEntries(projectRoot, themeMetadata, overridePaths) {
	// Core handles all cascade logic - we just get the scripts path for main.js
	const resolved = resolveOverridePaths(themeMetadata, overridePaths);
	const scriptsPath = resolved.scripts;

	const entries = {
		// Main entry point (always included)
		main: path.join(projectRoot, scriptsPath, 'main.js'),
	};

	// Discover all available features - core handles override resolution
	const features = getAvailableFeatures(projectRoot, themeMetadata, overridePaths);

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
