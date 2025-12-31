/**
 * Unified cascade configuration
 *
 * Single entry point for all cascade systems (data, assets, templates)
 */

import { configureDataCascade } from './data.mjs';
import { configurePassthroughCopy } from './assets.mjs';

/**
 * Configure all cascade systems
 *
 * This is a convenience function that sets up:
 * - Data cascade (site.js, navigation.js)
 * - Asset cascade (public files)
 *
 * Template cascade (layouts) is configured separately via configureNunjucks.
 * Feature cascade is implicit (handled by Vite entry points).
 *
 * @param {Object} eleventyConfig - Eleventy configuration object
 * @param {string} projectRoot - Content repo root
 * @param {Object} overridePaths - Override paths configuration
 *
 * @example
 * // Single call to configure all cascades
 * import { configureCascade } from 'eleventy-base-blog-template';
 * configureCascade(eleventyConfig, __dirname, overridePaths);
 */
export function configureCascade(
	eleventyConfig,
	projectRoot,
	overridePaths = {},
) {
	// Data cascade (site.js, navigation.js, etc.)
	configureDataCascade(eleventyConfig, projectRoot, overridePaths);

	// Asset cascade (public files)
	configurePassthroughCopy(eleventyConfig, projectRoot, overridePaths);

	// Note: Template cascade (layouts) is configured via configureNunjucks
	// Note: Feature cascade is implicit (Vite handles resolution)
}

// Re-export all cascade utilities for granular access
export * from './data.mjs';
export * from './features.mjs';
export * from './assets.mjs';
export * from './resolver.mjs';
