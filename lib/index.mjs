import filters from './filters.mjs';
import transforms from './transforms.mjs';
import shortcodes from './shortcodes.mjs';

/**
 * Initialize Eleventy Base Blog Theme with cascade/override support
 *
 * @param {Object} eleventyConfig - Eleventy configuration object
 * @param {Object} options - Override options
 * @param {Object} options.filters - Custom/override filters (merged with theme filters, user wins)
 * @param {Object} options.shortcodes - Custom/override shortcodes (merged with theme shortcodes, user wins)
 * @param {Object} options.transforms - Custom/override transforms (merged with theme transforms, user wins)
 * @returns {Object} eleventyConfig - Returns the config object for chaining
 *
 * @example
 * // Basic usage (use all theme filters/shortcodes)
 * import { initTheme } from 'eleventy-base-blog-template';
 * export default function(eleventyConfig) {
 *   initTheme(eleventyConfig);
 *   // ... rest of your config
 * }
 *
 * @example
 * // With custom filters and shortcodes
 * import { initTheme } from 'eleventy-base-blog-template';
 * import userFilters from './overrides/lib/filters.mjs';
 * import userShortcodes from './overrides/lib/shortcodes.mjs';
 *
 * export default function(eleventyConfig) {
 *   initTheme(eleventyConfig, {
 *     filters: userFilters,
 *     shortcodes: userShortcodes,
 *   });
 *   // ... rest of your config
 * }
 */
export function initTheme(eleventyConfig, options = {}) {
	// Merge theme with user overrides (user wins in case of conflicts)
	const allFilters = { ...filters, ...options.filters };
	const allShortcodes = { ...shortcodes, ...options.shortcodes };
	const allTransforms = { ...transforms, ...options.transforms };

	// Register filters
	Object.keys(allFilters).forEach((name) =>
		eleventyConfig.addFilter(name, allFilters[name]),
	);

	// Register shortcodes
	Object.keys(allShortcodes).forEach((name) =>
		eleventyConfig.addShortcode(name, allShortcodes[name]),
	);

	// Register transforms
	Object.keys(allTransforms).forEach((name) =>
		eleventyConfig.addTransform(name, allTransforms[name]),
	);

	return eleventyConfig;
}

// Named exports for granular access
export { filters, transforms, shortcodes };

// Default export
export default { initTheme, filters, transforms, shortcodes };
