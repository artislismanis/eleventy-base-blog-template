/**
 * @eleventy-plugin-themer/theme-base
 *
 * A minimal convention-based theme using @eleventy-plugin-themer/core
 */

import { createThemePlugin } from '@eleventy-plugin-themer/core';
import themeMetadata from '../theme.json' with { type: 'json' };
import filters from './filters.mjs';
import shortcodes from './shortcodes.mjs';
import transforms from './transforms.mjs';

// Create theme plugin using core
export const plugin = createThemePlugin(themeMetadata, {
	helpers: {
		filters,
		shortcodes,
		transforms,
	},
});

// Re-export metadata
export { themeMetadata as metadata };

// Default export
export default {
	plugin,
	metadata: themeMetadata,
	filters,
	shortcodes,
	transforms,
};
