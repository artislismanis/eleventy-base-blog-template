/**
 * Vite configuration helper for Eleventy themes
 *
 * Provides theme-agnostic Vite configuration with auto-import support
 */

import fs from 'fs';
import path from 'path';
import { resolveOverridePaths, DEFAULT_ASSET_ENTRIES } from '@eleventy-themes/core';
import { themeAutoImportPlugin } from './plugins/auto-import.mjs';
import { runOptimizations } from './utils/plugin-orchestrator.mjs';

/**
 * Create Vite configuration for any Eleventy theme
 *
 * This wraps @eleventy-themes/vite with theme-specific features:
 * - Auto-imports theme CSS and JS
 * - @theme alias for imports
 * - SCSS preprocessor configuration with theme paths
 *
 * Works with any theme that exports metadata following the theme.json schema.
 *
 * @param {Object} themeMetadata - Theme metadata from theme.json
 * @param {Object} options - Configuration options
 * @param {string} options.projectRoot - Project root path (required)
 * @param {Object} options.overridePaths - Override paths configuration
 * @param {Object} ...viteOptions - Additional Vite config to merge
 * @returns {Object} Vite configuration object
 *
 * @example
 * import { createThemeViteConfig } from '@eleventy-themes/core/lib/vite';
 * import { metadata } from '@eleventy-themes/base-blog';
 *
 * const __dirname = fileURLToPath(new URL('.', import.meta.url));
 *
 * eleventyConfig.addPlugin(EleventyVitePlugin, {
 *   viteOptions: createThemeViteConfig(metadata, {
 *     projectRoot: __dirname,
 *     optimizations: {
 *       purgeCSS: true,
 *       criticalCSS: true,
 *     },
 *   }),
 * });
 */
export function createThemeViteConfig(themeMetadata, options = {}) {
	const {
		projectRoot,
		overridePaths,
		plugins = [],
		optimizations,
		dirs,
		...viteOptions
	} = options;

	if (!projectRoot) {
		throw new Error('createThemeViteConfig: projectRoot is required');
	}

	if (!themeMetadata || !themeMetadata.name) {
		throw new Error('createThemeViteConfig: themeMetadata with name is required');
	}

	const themeName = themeMetadata.name;
	const resolvedOverridePaths = resolveOverridePaths(themeMetadata, overridePaths);

	const themeRoot = path.join(projectRoot, 'node_modules', themeName);
	const stylesPath = resolvedOverridePaths.styles;
	const scriptsPath = resolvedOverridePaths.scripts;

	// Get theme assets entry points from metadata (or use framework defaults)
	const stylesEntry = themeMetadata.assets?.styles?.entry || DEFAULT_ASSET_ENTRIES.styles;
	const scriptsEntry = themeMetadata.assets?.scripts?.entry || DEFAULT_ASSET_ENTRIES.scripts;

	// Build aliases for feature entry points
	const featureAliases = {};
	if (themeMetadata.themeFeatures && Array.isArray(themeMetadata.themeFeatures)) {
		themeMetadata.themeFeatures.forEach(feature => {
			// Map /feature-name.js to theme's feature auto-init entry
			// Use index.auto.js if it exists, otherwise fall back to index.js
			const autoPath = path.join(themeRoot, 'features', feature.name, 'index.auto.js');
			const regularPath = path.join(themeRoot, 'features', feature.name, 'index.js');
			const featurePath = fs.existsSync(autoPath) ? autoPath : regularPath;
			featureAliases[`/${feature.name}.js`] = featurePath;
		});
	}

	// Theme-specific plugins
	const themePlugins = [
		// Auto-import theme assets
		themeAutoImportPlugin({
			themeName,
			stylesEntry,
			scriptsEntry,
			userScriptsPath: scriptsPath,
		}),

		// User's additional plugins
		...plugins,
	];

	// Add optimization plugin if optimizations are configured
	if (optimizations && Object.keys(optimizations).length > 0) {
		themePlugins.push({
			name: 'eleventy-themes-optimization',
			apply: 'build',
			async closeBundle() {
				try {
					await runOptimizations(optimizations, dirs);
					console.log('✅ Build optimization complete!\n');
				} catch (error) {
					console.error('\n❌ Build optimization failed!');
					console.error(`   ${error.message}\n`);
					throw error;
				}
			},
		});
	}

	// Theme-specific configuration
	const themeConfig = {
		resolve: {
			alias: {
				// @theme alias for JS/TS imports
				'@theme': themeRoot,
				// User overrides alias
				'/overrides': path.resolve(projectRoot, stylesPath),
				// Feature entry point aliases (e.g., /code-highlighting.js → theme/features/code-highlighting/index.js)
				...featureAliases,
			},
		},

		css: {
			preprocessorOptions: {
				scss: {
					api: 'modern-compiler',

					// Allow @use '@theme/styles/variables' in SCSS
					includePaths: [
						path.resolve(projectRoot, 'node_modules'),
						path.resolve(projectRoot, stylesPath),
						path.join(themeRoot, 'styles'),
					],

					// Provide theme name as SCSS variable
					additionalData: `$theme-name: '${themeName}';\n`,
				},
			},
		},

		plugins: themePlugins,
	};

	// Deep merge with user's Vite options
	const mergedConfig = {
		...themeConfig,
		...viteOptions,
		resolve: {
			...themeConfig.resolve,
			...(viteOptions.resolve || {}),
			alias: {
				...themeConfig.resolve.alias,
				...((viteOptions.resolve || {}).alias || {}),
			},
		},
		css: {
			...themeConfig.css,
			...(viteOptions.css || {}),
			preprocessorOptions: {
				...themeConfig.css.preprocessorOptions,
				...((viteOptions.css || {}).preprocessorOptions || {}),
				scss: {
					...themeConfig.css.preprocessorOptions.scss,
					...((viteOptions.css || {}).preprocessorOptions || {}).scss || {},
				},
			},
		},
		plugins: [
			...themePlugins,
			...(viteOptions.plugins || []),
		],
	};

	return mergedConfig;
}
