/**
 * @eleventy-themes/core
 *
 * Build-agnostic cascade system for Eleventy themes.
 * Works with any build system or no build system at all.
 */

// Re-export cascade utilities
export * from './cascade/index.mjs';

// Re-export template loader
export { configureNunjucks, ThemeAwareLoader } from './template-loader.mjs';

// Re-export validation
export { validateTheme, logValidation, validateComponent } from './validate.mjs';

// Re-export metadata helper
export { metadata } from './metadata.mjs';

/**
 * Create theme plugin using core cascade system
 *
 * @param {Object} themeMetadata - Theme metadata from theme.json
 * @param {Object} options - Plugin options
 * @returns {Function} Eleventy plugin function
 */
export function createThemePlugin(themeMetadata, options = {}) {
	const {
		helpers = {},
	} = options;

	return function themePlugin(eleventyConfig, userOptions = {}) {
		const {
			projectRoot = process.cwd(),
			overridePaths,
		} = userOptions;

		// Configure template loader
		configureNunjucks(eleventyConfig, {
			projectRoot,
			themeName: themeMetadata.name,
			overridePaths: overridePaths || themeMetadata.cascade?.defaultOverridePaths,
		});

		// Configure cascade systems (passthrough copy, etc.)
		// Note: The actual cascade resolution happens at runtime via the loader

		// Register theme helpers (filters, shortcodes, transforms)
		if (helpers.filters) {
			Object.keys(helpers.filters).forEach(name => {
				eleventyConfig.addFilter(name, helpers.filters[name]);
			});
		}

		if (helpers.shortcodes) {
			Object.keys(helpers.shortcodes).forEach(name => {
				eleventyConfig.addShortcode(name, helpers.shortcodes[name]);
			});
		}

		if (helpers.transforms) {
			Object.keys(helpers.transforms).forEach(name => {
				eleventyConfig.addTransform(name, helpers.transforms[name]);
			});
		}
	};
}
