/**
 * @eleventy-themes/base-blog
 *
 * A convention-based blog theme using @eleventy-themes/core
 */

import { createThemePlugin } from '@eleventy-themes/core';
import themeMetadata from '../theme.json' assert { type: 'json' };
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
