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
import { metadata } from '../metadata.mjs';
import {
	resolveResource,
	resourceExists,
	getOverridePath,
} from './resolver.mjs';

/**
 * Resolve feature path with cascade support
 *
 * Checks user override directory first, then falls back to theme features.
 * Throws helpful error if feature not found.
 *
 * @param {string} featureName - Feature name (without .js extension)
 * @param {string} projectRoot - Content repo root
 * @param {Object} overridePaths - Override paths configuration
 * @returns {string} Absolute path to feature
 * @throws {Error} If feature not found
 *
 * @example
 * // Resolve feature (checks user override first, then theme)
 * const featurePath = resolveFeaturePath('code-highlighting', __dirname, overridePaths);
 */
export function resolveFeaturePath(featureName, projectRoot, overridePaths = {}) {
	const result = resolveResource({
		projectRoot,
		overridePaths,
		resourceType: 'features',
		filename: `${featureName}.js`,
		throwOnMissing: true,
		errorMessage: createFeatureErrorMessage(featureName, overridePaths),
	});

	return result.path;
}

/**
 * Check if a feature exists (in user or theme)
 *
 * @param {string} featureName - Feature name (without .js extension)
 * @param {string} projectRoot - Content repo root
 * @param {Object} overridePaths - Override paths configuration
 * @returns {boolean} True if feature exists
 *
 * @example
 * if (featureExists('gallery', __dirname)) {
 *   console.log('Gallery feature is available');
 * }
 */
export function featureExists(featureName, projectRoot, overridePaths = {}) {
	return resourceExists(
		projectRoot,
		overridePaths,
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
export function getAvailableFeatures(projectRoot, themeMetadata, overridePaths = {}) {
	const resolvedOverridePaths = overridePaths || themeMetadata.cascade?.defaultOverridePaths || {};
	const featuresPath = resolvedOverridePaths.features || metadata.defaultOverridePaths.features;
	const features = new Map();

	// Add theme features from themeMetadata (explicit definition)
	if (themeMetadata.themeFeatures && Array.isArray(themeMetadata.themeFeatures)) {
		const themeRoot = path.join(projectRoot, 'node_modules', themeMetadata.name);

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
 * @param {Object} overridePaths - Override paths
 * @returns {string} Formatted error message
 * @private
 */
function createFeatureErrorMessage(featureName, overridePaths) {
	const availableFeatures =
		metadata.features.length > 0 ? metadata.features.join(', ') : 'none';

	const userFeatureDir =
		overridePaths.features || metadata.defaultOverridePaths.features;

	return (
		`Feature "${featureName}" not found.\n\n` +
		`Available theme features: ${availableFeatures}\n\n` +
		`To create a custom feature:\n` +
		`  1. Add file: ${userFeatureDir}/${featureName}.js\n\n` +
		`To extend a theme feature:\n` +
		`  import { init } from '@theme/features/${featureName}.js';\n` +
		`  init({ /* custom config */ });\n`
	);
}
