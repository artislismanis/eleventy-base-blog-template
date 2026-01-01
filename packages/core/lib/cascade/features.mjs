/**
 * Feature cascade
 *
 * Manages JavaScript features with user override support.
 * Page-specific features can be loaded via front matter:
 *   pageFeature: 'code-highlighting'
 *   pageFeatures: ['code-highlighting', 'gallery']
 */

import path from 'path';
import fs from 'fs';
import { resolveOverridePaths } from '../defaults.mjs';
import { resolveResource, resourceExists, getThemeRoot } from './resolver.mjs';

/**
 * Resolve feature path with cascade support
 *
 * Checks user override directory first, then falls back to theme features.
 * Throws helpful error if feature not found.
 *
 * @param {string} featureName - Feature name (without .js extension)
 * @param {string} projectRoot - Content repo root
 * @param {Object} themeMetadata - Theme metadata object
 * @param {Object} overridePaths - Override paths configuration (optional)
 * @returns {string} Absolute path to feature
 * @throws {Error} If feature not found
 *
 * @example
 * // Resolve feature (checks user override first, then theme)
 * const featurePath = resolveFeaturePath('code-highlighting', __dirname, themeMetadata);
 */
export function resolveFeaturePath(
	featureName,
	projectRoot,
	themeMetadata,
	overridePaths = {},
) {
	const resolved = resolveOverridePaths(themeMetadata, overridePaths);
	const result = resolveResource({
		projectRoot,
		themeName: themeMetadata.name,
		resolvedOverridePaths: resolved,
		resourceType: 'features',
		filename: `${featureName}.js`,
		throwOnMissing: true,
		errorMessage: createFeatureErrorMessage(
			featureName,
			themeMetadata,
			resolved,
		),
	});

	return result.path;
}

/**
 * Check if a feature exists (in user or theme)
 *
 * @param {string} featureName - Feature name (without .js extension)
 * @param {string} projectRoot - Content repo root
 * @param {Object} themeMetadata - Theme metadata object
 * @param {Object} overridePaths - Override paths configuration (optional)
 * @returns {boolean} True if feature exists
 *
 * @example
 * if (featureExists('gallery', __dirname, themeMetadata)) {
 *   console.log('Gallery feature is available');
 * }
 */
export function featureExists(
	featureName,
	projectRoot,
	themeMetadata,
	overridePaths = {},
) {
	const resolved = resolveOverridePaths(themeMetadata, overridePaths);
	return resourceExists(
		projectRoot,
		themeMetadata.name,
		resolved,
		'features',
		`${featureName}.js`,
	);
}

/**
 * Get all available features (theme + user)
 *
 * Features are stored in subdirectories with index.js entry points:
 * - Theme: features/code-highlighting/index.js (from themeFeatures metadata)
 * - User: overrides/features/code-highlighting/index.js (filesystem scan)
 *
 * @param {string} projectRoot - Content repo root
 * @param {Object} themeMetadata - Theme metadata from theme.json
 * @param {Object} overridePaths - Override paths configuration (optional)
 * @returns {Map<string, Object>} Map of feature name to feature info
 *   Each feature info contains: { name, source, path }
 *   Source is: 'theme', 'user', or 'override'
 *
 * @example
 * import { metadata } from '@eleventy-themes/base-blog';
 * const features = getAvailableFeatures(__dirname, metadata);
 * features.forEach((info, name) => {
 *   console.log(`${name}: ${info.source} (${info.path})`);
 * });
 */
export function getAvailableFeatures(
	projectRoot,
	themeMetadata,
	overridePaths = {},
) {
	const resolved = resolveOverridePaths(themeMetadata, overridePaths);
	const featuresPath = resolved.features;
	const features = new Map();

	// Add theme features from themeMetadata (explicit definition)
	if (
		themeMetadata.themeFeatures &&
		Array.isArray(themeMetadata.themeFeatures)
	) {
		const themeRoot = getThemeRoot(projectRoot, themeMetadata.name);

		themeMetadata.themeFeatures.forEach((feature) => {
			const featurePath = path.join(themeRoot, feature.entry);
			if (fs.existsSync(featurePath)) {
				features.set(feature.name, {
					name: feature.name,
					source: 'theme',
					path: featurePath,
				});
			}
		});
	}

	// Check for user feature overrides/additions (subdirectories with index.js)
	const userFeaturesDir = path.join(projectRoot, featuresPath);
	if (fs.existsSync(userFeaturesDir)) {
		// Scan for subdirectories
		fs.readdirSync(userFeaturesDir, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.forEach((dirent) => {
				const featureName = dirent.name;
				const indexPath = path.join(userFeaturesDir, featureName, 'index.js');

				if (fs.existsSync(indexPath)) {
					const isOverride = features.has(featureName);
					features.set(featureName, {
						name: featureName,
						source: isOverride ? 'override' : 'user',
						path: indexPath,
					});
				}
			});
	}

	return features;
}

/**
 * Helper: Create helpful error message for missing features
 *
 * @param {string} featureName - Missing feature name
 * @param {Object} themeMetadata - Theme metadata object
 * @param {Object} resolvedPaths - Resolved override paths
 * @returns {string} Formatted error message
 * @private
 */
function createFeatureErrorMessage(featureName, themeMetadata, resolvedPaths) {
	// Get available theme features from metadata
	const themeFeatures = themeMetadata.themeFeatures || [];
	const availableFeatures =
		themeFeatures.length > 0
			? themeFeatures.map((f) => f.name).join(', ')
			: 'none';

	const userFeatureDir = resolvedPaths.features;

	return (
		`Feature "${featureName}" not found.\n\n` +
		`Available theme features: ${availableFeatures}\n\n` +
		`To create a custom feature:\n` +
		`  1. Create directory: ${userFeatureDir}/${featureName}/\n` +
		`  2. Add file: ${userFeatureDir}/${featureName}/index.js\n\n` +
		`To extend a theme feature:\n` +
		`  import { init } from '@theme/features/${featureName}/index.js';\n` +
		`  init({ /* custom config */ });\n`
	);
}
