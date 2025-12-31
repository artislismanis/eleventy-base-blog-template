import Nunjucks from 'nunjucks';
import path from 'path';

/**
 * Custom Nunjucks loader that supports @theme/ prefix
 * and implements cascade resolution for layouts, partials, and includes.
 *
 * Resolution order:
 * 1. @theme/ prefix → theme package directory (explicit)
 * 2. User overrides directory (checked first for non-prefixed)
 * 3. Theme directory (fallback for non-prefixed)
 */
export class ThemeAwareLoader extends Nunjucks.FileSystemLoader {
	constructor(searchPaths, opts, themeBasePath) {
		super(searchPaths, opts);
		this.themeBasePath = themeBasePath;
	}

	getSource(name) {
		// Handle @theme/ prefix - explicit theme reference
		if (name.startsWith('@theme/')) {
			const themePath = name.replace('@theme/', '');
			const fullPath = path.join(this.themeBasePath, themePath);
			return super.getSource(fullPath);
		}

		// Default behavior: cascade through search paths
		// (user overrides checked first, then theme)
		return super.getSource(name);
	}
}

/**
 * Configure Nunjucks environment with theme support
 *
 * Resolution order for layouts, partials, and includes:
 * 1. @theme/ prefix → theme package directory (explicit)
 * 2. User overrides directory (checked first for non-prefixed)
 * 3. Theme directory (fallback for non-prefixed)
 *
 * This cascade applies to:
 * - {% extends "base.njk" %} → finds user override or theme layout
 * - {% include "partials/header.njk" %} → finds user override or theme partial
 * - {% from "macros/buttons.njk" import btn %} → finds user override or theme macro
 *
 * @param {Object} eleventyConfig - Eleventy configuration object
 * @param {Object} options - Configuration options
 * @param {string} options.projectRoot - Path to content repo root
 * @param {string} options.themeName - Theme package name
 * @param {Object} options.overridePaths - Content repo override paths
 * @param {string[]} options.additionalPaths - Extra paths for layout resolution
 * @returns {Object} nunjucksEnv - Configured Nunjucks environment
 */
export function configureNunjucks(eleventyConfig, options = {}) {
	const {
		projectRoot = process.cwd(),
		themeName,
		overridePaths = {},
		additionalPaths = [],
	} = options;

	const themeBasePath = path.join(projectRoot, 'node_modules', themeName);

	// Build search paths in priority order (first match wins)
	// User paths come first, theme paths are fallback
	const searchPaths = [
		// User overrides (highest priority)
		path.join(projectRoot, overridePaths.layouts || 'overrides/layouts'),
		path.join(
			projectRoot,
			overridePaths.layouts || 'overrides/layouts',
			'partials',
		),
		path.join(projectRoot, 'overrides/includes'),
		path.join(projectRoot, 'overrides/macros'),

		// Additional user-specified paths
		...additionalPaths.map((p) => path.join(projectRoot, p)),

		// Theme fallbacks (lowest priority)
		path.join(themeBasePath, 'layouts'),
		path.join(themeBasePath, 'layouts/partials'),
		path.join(themeBasePath, 'includes'),
		path.join(themeBasePath, 'macros'),
	];

	const loader = new ThemeAwareLoader(
		searchPaths,
		{ noCache: process.env.NODE_ENV !== 'production' },
		themeBasePath,
	);

	const nunjucksEnv = new Nunjucks.Environment(loader);

	// Add theme-aware globals
	nunjucksEnv.addGlobal('theme', {
		name: themeName,
		// Helper to construct theme paths in templates
		path: (relativePath) => `@theme/${relativePath}`,
	});

	eleventyConfig.setLibrary('njk', nunjucksEnv);

	return nunjucksEnv;
}
