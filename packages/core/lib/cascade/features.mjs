/**
 * Feature cascade
 *
 * Manages JavaScript features with user override support.
 * Page-specific features can be loaded via front matter:
 *   pageFeature: 'code-highlighting'
 *   pageFeatures: ['code-highlighting', 'gallery']
 */

import path from 'path';
import { metadata } from '../metadata.mjs';
import {
	resolveResource,
	scanWithCascade,
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
 * Returns information about all features with source tracking.
 *
 * @param {string} projectRoot - Content repo root
 * @param {Object} overridePaths - Override paths configuration
 * @returns {Map<string, Object>} Map of feature name to feature info
 *   Each feature info contains: { name, source, path }
 *   Source is: 'theme', 'user', or 'override'
 *
 * @example
 * const features = getAvailableFeatures(__dirname);
 * features.forEach((info, name) => {
 *   console.log(`${name}: ${info.source}`);
 * });
 */
export function getAvailableFeatures(projectRoot, overridePaths = {}) {
	const features = scanWithCascade({
		projectRoot,
		overridePaths,
		resourceType: 'features',
		filter: (file) => file.endsWith('.js'),
	});

	// Remove .js extension from names for cleaner API
	const result = new Map();
	features.forEach((info, filename) => {
		const name = path.basename(filename, '.js');
		result.set(name, { ...info, name });
	});

	return result;
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
