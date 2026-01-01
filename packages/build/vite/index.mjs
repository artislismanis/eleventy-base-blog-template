/**
 * @eleventy-plugin-themer/build-vite
 *
 * Opinionated Vite integration with production optimizations.
 * Build what works for me, adaptable for your needs.
 */

// Theme-aware Vite configuration with auto-import and optimizations
export { createThemeViteConfig } from './theme-config.mjs';

// Individual plugins (for cherry-picking)
export {
	themeAutoImportPlugin,
	purgeCSSFiles,
	generateCriticalCSS,
	minifyHTML,
	validateLinks,
	validateLinksOrThrow,
	preserveNonHtmlFiles,
} from './plugins/index.mjs';

// Utilities
export { getFeatureEntries, getAvailableFeatures } from './utils/page-features.mjs';
