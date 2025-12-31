/**
 * Convenience configuration helper for Vite + Eleventy
 *
 * Opinionated setup with production optimizations.
 * All optimizations are opt-in/opt-out.
 */

import {
	purgeCSSFiles,
	generateCriticalCSS,
	minifyHTML,
	validateLinks,
	preserveNonHtmlFiles,
} from './plugins/index.mjs';

/**
 * Create Vite configuration with theme optimizations
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.optimizations - Which optimizations to enable
 * @param {boolean|Function} options.optimizations.purgeCSS - PurgeCSS optimization
 * @param {boolean|Function} options.optimizations.criticalCSS - Critical CSS inlining
 * @param {boolean|Function} options.optimizations.minifyHTML - HTML minification
 * @param {boolean|Function} options.optimizations.validateLinks - Link validation
 * @param {boolean|Function} options.optimizations.preserveNonHtml - Preserve XML/TXT/XSL files
 * @param {Object} options.dirs - Directory configuration
 * @param {string} options.dirs.temp - Vite temp directory (default: '.11ty-vite')
 * @param {string} options.dirs.output - Build output directory (default: '_site')
 * @param {Array} options.plugins - Additional Vite plugins to include
 * @param {Object} options Additional Vite config to merge
 * @returns {Object} Vite configuration object
 *
 * @example
 * // Simple usage - all optimizations enabled
 * import { createThemeViteConfig } from '@eleventy-themes/vite';
 *
 * export default {
 *   viteOptions: createThemeViteConfig()
 * };
 *
 * @example
 * // Selective optimizations
 * createThemeViteConfig({
 *   optimizations: {
 *     purgeCSS: true,
 *     criticalCSS: false,  // Skip this one
 *     minifyHTML: true,
 *   }
 * });
 *
 * @example
 * // Custom function for one optimization
 * createThemeViteConfig({
 *   optimizations: {
 *     purgeCSS: async () => {
 *       // Your custom CSS optimization
 *       await myLightningCSS();
 *     },
 *     minifyHTML: true,  // Keep built-in for others
 *   }
 * });
 */
export function createThemeViteConfig(options = {}) {
	const {
		optimizations = {
			purgeCSS: true,
			criticalCSS: true,
			minifyHTML: true,
			validateLinks: true,
			preserveNonHtml: true,
		},
		dirs = {
			temp: '.11ty-vite',
			output: '_site',
		},
		plugins = [],
		...userConfig
	} = options;

	const buildPlugins = [];

	// Add user's custom plugins first
	buildPlugins.push(...plugins);

	// Add optimization plugin
	buildPlugins.push({
		name: 'eleventy-themes-optimization',
		apply: 'build',
		async closeBundle() {
			try {
				// preserveNonHtml
				if (optimizations.preserveNonHtml === true) {
					await preserveNonHtmlFiles(dirs.temp, dirs.output);
				} else if (typeof optimizations.preserveNonHtml === 'function') {
					await optimizations.preserveNonHtml();
				}

				// purgeCSS
				if (optimizations.purgeCSS === true) {
					await purgeCSSFiles(dirs.output);
				} else if (typeof optimizations.purgeCSS === 'function') {
					await optimizations.purgeCSS();
				}

				// criticalCSS
				if (optimizations.criticalCSS === true) {
					await generateCriticalCSS(dirs.output);
				} else if (typeof optimizations.criticalCSS === 'function') {
					await optimizations.criticalCSS();
				}

				// minifyHTML
				if (optimizations.minifyHTML === true) {
					await minifyHTML(dirs.output);
				} else if (typeof optimizations.minifyHTML === 'function') {
					await optimizations.minifyHTML();
				}

				// validateLinks
				if (optimizations.validateLinks === true) {
					await validateLinks(dirs.output);
				} else if (typeof optimizations.validateLinks === 'function') {
					await optimizations.validateLinks();
				}

				console.log('✅ Build optimization complete!\n');
			} catch (error) {
				console.error('\n❌ Build optimization failed!');
				console.error(`   ${error.message}\n`);
				throw error;
			}
		},
	});

	return {
		plugins: buildPlugins,
		...userConfig,
	};
}
