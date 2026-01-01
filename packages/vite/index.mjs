/**
 * @eleventy-themes/vite
 *
 * Opinionated Vite integration with production optimizations.
 * Build what works for me, adaptable for your needs.
 */

// Generic Vite config with optimization plugins
export { createThemeViteConfig as createViteConfig } from './config.mjs';

// Theme-aware configuration (with auto-import + optimizations)
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
