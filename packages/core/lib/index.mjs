/**
 * @eleventy-plugin-themer/core
 *
 * Build-agnostic cascade system for Eleventy themes.
 * Works with any build system or no build system at all.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import for local use
import { configureTemplateEngine as _configureTemplateEngine } from './template-loader.mjs';
import { resolveOverridePaths as _resolveOverridePaths } from './defaults.mjs';
import { getThemeRoot } from './cascade/resolver.mjs';

// Re-export cascade utilities
export * from './cascade/index.mjs';

// Re-export template loader
export { configureTemplateEngine, ThemeAwareLoader } from './template-loader.mjs';

// Re-export validation
export { validateTheme, logValidation, validateComponent } from './validate.mjs';

// Re-export framework defaults
export { DEFAULT_OVERRIDE_PATHS, DEFAULT_ASSET_ENTRIES, resolveOverridePaths } from './defaults.mjs';

/**
 * Generate Eleventy dir configuration for theme with cascade support
 * Call this in your eleventy.config.mjs return value
 *
 * This creates a merged includes directory that supports the cascade:
 * - Theme provides default layouts
 * - User overrides take precedence (via Nunjucks search paths)
 *
 * @param {Object} themeMetadata - Theme metadata from theme.json
 * @param {Object} options - Configuration options
 * @param {string} options.projectRoot - Project root path
 * @param {string} options.input - Input directory (default: 'content')
 * @param {string} options.output - Output directory (default: '_site')
 * @param {Object} options.overridePaths - Override paths (optional)
 * @returns {Object} Eleventy configuration with dir settings
 *
 * @example
 * import { generateDirConfig } from '@eleventy-plugin-themer/core';
 * import { metadata } from '@eleventy-plugin-themer/theme-base';
 *
 * export default function(eleventyConfig) {
 *   const __dirname = fileURLToPath(new URL('.', import.meta.url));
 *   return {
 *     ...generateDirConfig(metadata, { projectRoot: __dirname }),
 *   };
 * }
 */
export function generateDirConfig(themeMetadata, options = {}) {
	const {
		projectRoot = process.cwd(),
		input = 'content',
		output = '_site',
	} = options;

	const themeName = themeMetadata.name;
	const themeLayoutsPath = path.join(getThemeRoot(projectRoot, themeName), 'layouts');

	// Point to theme layouts - ThemeAwareLoader provides cascade via Nunjucks search paths
	// User layouts are found via the loader's search paths (user-first)
	const relativeLayoutsPath = path.relative(
		path.join(projectRoot, input),
		themeLayoutsPath
	);

	return {
		dir: {
			input,
			output,
			// Theme layouts as base - cascade handled by Nunjucks loader
			includes: relativeLayoutsPath,
		},
	};
}

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

		// Resolve override paths using utility
		const resolvedOverridePaths = _resolveOverridePaths(themeMetadata, overridePaths);

		// Configure template loader
		_configureTemplateEngine(eleventyConfig, {
			projectRoot,
			themeName: themeMetadata.name,
			overridePaths: resolvedOverridePaths,
		});

		// Register layout aliases for theme layouts with cascade support
		// This allows Eleventy to find theme layouts without hardcoding paths in user config
		// User overrides take precedence over theme layouts
		if (themeMetadata.layouts && Array.isArray(themeMetadata.layouts)) {
			const themePackagePath = getThemeRoot(projectRoot, themeMetadata.name);
			const userLayoutsPath = resolvedOverridePaths.layouts;

			themeMetadata.layouts.forEach(layout => {
				const layoutFilename = path.basename(layout.path);

				// Check for user override first (cascade: user-first)
				const userOverridePath = path.join(projectRoot, userLayoutsPath, layoutFilename);
				const themeLayoutPath = path.join(themePackagePath, layout.path);

				// Use override if it exists, otherwise use theme layout
				const layoutPath = fs.existsSync(userOverridePath) ? userOverridePath : themeLayoutPath;

				// Map layout name (e.g., "home") to the resolved path
				eleventyConfig.addLayoutAlias(layout.name, layoutPath);
			});
		}

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
