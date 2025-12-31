import path from 'path';
import { fileURLToPath } from 'url';
import { metadata } from '../lib/metadata.mjs';

/**
 * Vite plugin that auto-imports theme assets into user entry points
 *
 * This eliminates the need for users to manually import theme styles/scripts.
 * The plugin prepends theme imports to the user's main entry file.
 *
 * @param {Object} options - Plugin options
 * @param {string} options.themeName - Theme package name
 * @param {Object} options.overridePaths - Override paths configuration
 * @returns {Object} Vite plugin
 */
export function themeAutoImportPlugin(options = {}) {
	const { themeName, overridePaths = {} } = options;

	const scriptsPath = overridePaths.scripts || 'overrides/scripts';

	return {
		name: 'theme-auto-import',

		transform(code, id) {
			// Only transform user's main entry point
			const isMainEntry =
				id.includes(`/${scriptsPath}/main.js`) ||
				id.includes(`/${scriptsPath}/main.ts`);

			if (!isMainEntry) return null;

			// Prepend theme imports
			const themeImports = `// Auto-imported by theme convention
import '${themeName}/${metadata.assets.styles}';
import '${themeName}/${metadata.assets.scripts}';

`;
			return {
				code: themeImports + code,
				map: null,
			};
		},
	};
}

/**
 * Get Vite configuration for theme integration
 *
 * Provides a complete Vite config with theme support including:
 * - @theme alias for imports
 * - SCSS preprocessor configuration
 * - Auto-import plugin for theme assets
 * - Merge with user options
 *
 * @param {string} projectRoot - Absolute path to project root (usually __dirname)
 * @param {Object} userOptions - User's Vite config to merge with theme defaults
 * @param {Object} userOptions.overridePaths - Override paths from init() options
 * @returns {Object} Vite configuration object
 *
 * @example
 * // Basic usage
 * import theme from 'eleventy-base-blog-template';
 * import { getThemeViteConfig } from 'eleventy-base-blog-template';
 *
 * const __dirname = path.dirname(fileURLToPath(import.meta.url));
 *
 * eleventyConfig.addPlugin(EleventyVitePlugin, {
 *   viteOptions: getThemeViteConfig(__dirname, {
 *     build: {
 *       rollupOptions: {
 *         input: getPageBundleEntries(__dirname),
 *       },
 *     },
 *   }),
 * });
 *
 * @example
 * // With custom override paths
 * getThemeViteConfig(__dirname, {
 *   overridePaths: {
 *     styles: 'src/styles',
 *     scripts: 'src/scripts',
 *   },
 *   build: { ... },
 * })
 */
export function getThemeViteConfig(projectRoot, userOptions = {}) {
	const themeName = metadata.name;
	const themeRoot = path.dirname(
		fileURLToPath(import.meta.url.replace('/config', '')),
	);

	// Extract override paths from user options
	const overridePaths = userOptions.overridePaths || metadata.defaultOverridePaths;

	// Build configuration
	const themeConfig = {
		resolve: {
			alias: {
				// @theme alias for JS/TS imports
				'@theme': themeRoot,

				// Keep backward compatibility alias
				'eleventy-base-blog-template': themeRoot,

				// User overrides alias (use configured path)
				'/overrides': path.resolve(projectRoot, overridePaths.styles || 'overrides'),
			},
		},

		css: {
			preprocessorOptions: {
				scss: {
					api: 'modern-compiler',

					// Allow @use '@theme/styles/variables' in SCSS
					includePaths: [
						path.resolve(projectRoot, 'node_modules'),
						path.resolve(projectRoot, overridePaths.styles || 'overrides/styles'),
						path.join(themeRoot, 'styles'),
					],

					// Provide theme name as SCSS variable
					additionalData: `$theme-name: '${themeName}';\n`,
				},
			},
		},

		plugins: [
			// Auto-import theme assets into user's main entry
			themeAutoImportPlugin({ themeName, overridePaths }),

			// Merge user plugins
			...(userOptions.plugins || []),
		],
	};

	// Deep merge user options (user options take precedence)
	// For plugins, we already merged above
	const { plugins: userPlugins, overridePaths: _, ...restUserOptions } = userOptions;

	return {
		...themeConfig,
		...restUserOptions,
		resolve: {
			...themeConfig.resolve,
			...(restUserOptions.resolve || {}),
			alias: {
				...themeConfig.resolve.alias,
				...((restUserOptions.resolve || {}).alias || {}),
			},
		},
		css: {
			...themeConfig.css,
			...(restUserOptions.css || {}),
			preprocessorOptions: {
				...(themeConfig.css.preprocessorOptions || {}),
				...((restUserOptions.css || {}).preprocessorOptions || {}),
				scss: {
					...(themeConfig.css.preprocessorOptions.scss || {}),
					...((restUserOptions.css || {}).preprocessorOptions || {}).scss || {},
				},
			},
		},
		plugins: themeConfig.plugins, // Already merged above
	};
}

export default { getThemeViteConfig, themeAutoImportPlugin };
