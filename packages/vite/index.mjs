/**
 * @eleventy-themes/vite
 *
 * Opinionated Vite integration with production optimizations.
 * Build what works for me, adaptable for your needs.
 */

// Main convenience function
export { createThemeViteConfig } from './config.mjs';

// Individual plugins (for cherry-picking)
export {
	purgeCSSFiles,
	generateCriticalCSS,
	minifyHTML,
	validateLinks,
	validateLinksOrThrow,
	preserveNonHtmlFiles,
} from './plugins/index.mjs';
