/**
 * Framework defaults for @eleventy-plugin-themer/core
 *
 * These are the core framework conventions, not theme-specific settings.
 * Themes should not override these - they define how the framework works.
 */

/**
 * Default override paths for user customization
 * These define where the framework looks for user overrides of theme resources
 */
export const DEFAULT_OVERRIDE_PATHS = {
	layouts: 'overrides/layouts',
	features: 'overrides/features',
	styles: 'overrides/styles',
	scripts: 'overrides/scripts',
	data: 'content/_data',
	public: 'public',
};

/**
 * Default cascade resolution order
 * "user-first" means user overrides take precedence over theme defaults
 */
export const DEFAULT_CASCADE_RESOLUTION = 'user-first';

/**
 * Framework capabilities
 * These are what the core framework supports, not what a specific theme provides
 */
export const FRAMEWORK_CAPABILITIES = {
	featureSystem: true,
	dataCascade: true,
	assetCascade: true,
};

/**
 * Default asset entry points
 * These are the conventional entry points for theme assets
 */
export const DEFAULT_ASSET_ENTRIES = {
	styles: 'styles/main.scss',
	scripts: 'scripts/main.js',
};

/**
 * Resolve override paths from theme metadata or user configuration
 *
 * Priority:
 * 1. User-provided overridePaths (explicit override)
 * 2. Theme's cascade.defaultOverridePaths (theme defaults)
 * 3. Framework DEFAULT_OVERRIDE_PATHS (framework defaults)
 *
 * @param {Object} themeMetadata - Theme metadata object
 * @param {Object} [overridePaths] - Optional user-provided override paths
 * @returns {Object} Resolved override paths
 */
export function resolveOverridePaths(themeMetadata, overridePaths = {}) {
	// If user provides explicit paths, use those
	if (overridePaths && Object.keys(overridePaths).length > 0) {
		return overridePaths;
	}

	// Otherwise try theme's defaults
	if (themeMetadata?.cascade?.defaultOverridePaths) {
		return themeMetadata.cascade.defaultOverridePaths;
	}

	// Fall back to framework defaults
	return DEFAULT_OVERRIDE_PATHS;
}
