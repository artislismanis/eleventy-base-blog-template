import filters from './filters.mjs';
import transforms from './transforms.mjs';
import shortcodes from './shortcodes.mjs';
import { metadata } from './metadata.mjs';
import { configureNunjucks } from '../config/nunjucks.mjs';
import { validateTheme, logValidation } from '../utils/validate.mjs';

// Re-export metadata
export { metadata };

/**
 * Initialize Eleventy Base Blog Theme with cascade/override support
 *
 * @param {Object} eleventyConfig - Eleventy configuration object
 * @param {Object} options - Customization options
 * @param {string} options.projectRoot - Path to content repo root (defaults to process.cwd())
 * @param {Object} options.overridePaths - Custom paths for content repo files (defaults to metadata.defaultOverridePaths)
 * @param {string} options.overridePaths.layouts - Path to user's layout overrides
 * @param {string} options.overridePaths.bundles - Path to user's bundle overrides
 * @param {string} options.overridePaths.styles - Path to user's style overrides
 * @param {string} options.overridePaths.scripts - Path to user's script overrides
 * @param {string} options.overridePaths.data - Path to user's data directory
 * @param {string} options.overridePaths.public - Path to user's static assets
 * @param {string[]} options.additionalLayoutPaths - Extra paths for layout resolution
 * @param {Object} options.filters - Custom/override filters (merged with theme filters, user wins)
 * @param {Object} options.shortcodes - Custom/override shortcodes (merged with theme shortcodes, user wins)
 * @param {Object} options.transforms - Custom/override transforms (merged with theme transforms, user wins)
 * @returns {Object} eleventyConfig - Returns the config object for chaining
 *
 * @example
 * // Basic usage (use all theme defaults)
 * import theme from 'eleventy-base-blog-template';
 * export default function(eleventyConfig) {
 *   theme.init(eleventyConfig);
 *   // ... rest of your config
 * }
 *
 * @example
 * // With custom filters and shortcodes
 * import theme from 'eleventy-base-blog-template';
 * import userFilters from './src/lib/filters.mjs';
 * import userShortcodes from './src/lib/shortcodes.mjs';
 *
 * export default function(eleventyConfig) {
 *   theme.init(eleventyConfig, {
 *     projectRoot: __dirname,
 *     filters: userFilters,
 *     shortcodes: userShortcodes,
 *   });
 *   // ... rest of your config
 * }
 *
 * @example
 * // With custom override paths (content repo controls its own structure)
 * import theme from 'eleventy-base-blog-template';
 *
 * export default function(eleventyConfig) {
 *   theme.init(eleventyConfig, {
 *     projectRoot: __dirname,
 *     overridePaths: {
 *       layouts: 'src/layouts',
 *       bundles: 'src/bundles',
 *       styles: 'src/styles',
 *       scripts: 'src/scripts',
 *       data: 'content/_data',
 *       public: 'public',
 *     },
 *   });
 *   // ... rest of your config
 * }
 */
export function init(eleventyConfig, options = {}) {
	const {
		projectRoot = process.cwd(),
		overridePaths = metadata.defaultOverridePaths,
		additionalLayoutPaths = [],
		filters: userFilters = {},
		shortcodes: userShortcodes = {},
		transforms: userTransforms = {},
	} = options;

	// Validate theme installation and configuration
	const validation = validateTheme(projectRoot, overridePaths);
	logValidation(validation, { exitOnError: true });

	// Configure Nunjucks with @theme alias support and cascade resolution
	configureNunjucks(eleventyConfig, {
		projectRoot,
		themeName: metadata.name,
		overridePaths,
		additionalPaths: additionalLayoutPaths,
	});

	// Merge theme with user overrides (user wins in case of conflicts)
	const allFilters = { ...filters, ...userFilters };
	const allShortcodes = { ...shortcodes, ...userShortcodes };
	const allTransforms = { ...transforms, ...userTransforms };

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

// Re-export utilities for convenience (single import point)
export {
	getThemeViteConfig,
	themeAutoImportPlugin,
} from '../config/vite.mjs';

export { configureNunjucks, ThemeAwareLoader } from '../config/nunjucks.mjs';

export { getPageBundleEntries } from '../utils/get-page-bundles.mjs';

export {
	resolveBundlePath,
	getAvailableBundles,
	bundleExists,
} from '../utils/resolve-bundle.mjs';

export {
	mergeDataFiles,
	resolveDataFile,
	dataFileExists,
	getAvailableDataFiles,
} from '../utils/data-cascade.mjs';

export {
	configurePassthroughCopy,
	resolveStaticAsset,
	getAvailableAssets,
} from '../utils/static-assets.mjs';

export {
	validateTheme,
	logValidation,
	validateComponent,
} from '../utils/validate.mjs';

// Named exports for granular access
export { filters, transforms, shortcodes };

// Default export
export default { metadata, init, filters, transforms, shortcodes };
