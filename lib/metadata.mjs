/**
 * Theme metadata - single source of truth for theme structure
 *
 * This defines the theme's public API. Keep minimal - only what the build
 * system needs for resolution. Documentation (CSS custom properties, feature
 * descriptions) belongs in README.
 */
export const metadata = {
	// Package identity
	name: 'eleventy-base-blog-template',
	version: '2.0.0',

	// Theme's internal directory structure (for path resolution)
	paths: {
		layouts: 'layouts',
		partials: 'layouts/partials',
		styles: 'styles',
		scripts: 'scripts',
		features: 'features',
		data: 'data',
		public: 'public',
	},

	// Default override paths in content repo (can be customized via init options)
	defaultOverridePaths: {
		layouts: 'overrides/layouts',
		features: 'overrides/features',
		styles: 'overrides/styles',
		scripts: 'overrides/scripts',
		data: 'content/_data',
		public: 'public',
	},

	// Available public layouts (what users should use/extend)
	layouts: ['base', 'home', 'post'],

	// Available theme features
	features: ['code-highlighting'],

	// Entry points (for auto-import)
	assets: {
		styles: 'styles/main.scss',
		scripts: 'scripts/main.js',
	},
};
