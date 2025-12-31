/**
 * Data file cascade
 *
 * Manages data files (site.js, navigation.js) with user override support.
 * Theme provides defaults via addGlobalData(), user files in _data/ automatically
 * override via Eleventy's native data cascade.
 */

import path from 'path';
import fs from 'fs';
import { metadata } from '../metadata.mjs';
import {
	resolveResource,
	scanWithCascade,
	resourceExists,
	getOverridePath,
	getThemeRoot,
} from './resolver.mjs';

/**
 * Configure data cascade with automatic theme defaults
 *
 * Registers theme data files using addGlobalData(). User files in the
 * data directory will automatically override these via Eleventy's native
 * data cascade (directory files > addGlobalData).
 *
 * @param {Object} eleventyConfig - Eleventy configuration object
 * @param {string} projectRoot - Path to content repo root
 * @param {Object} overridePaths - Override paths configuration
 *
 * @example
 * // In theme's init() function
 * configureDataCascade(eleventyConfig, __dirname, overridePaths);
 *
 * // User overrides by creating content/_data/navigation.js
 * // (automatically takes precedence via Eleventy's data cascade)
 */
export function configureDataCascade(
	eleventyConfig,
	projectRoot,
	overridePaths = {},
) {
	const availableData = getAvailableDataFiles(projectRoot, overridePaths);

	availableData.forEach((fileInfo, filename) => {
		// Only register theme data files (not user files or overrides)
		// User files will be picked up by Eleventy's native data directory
		if (fileInfo.source === 'theme') {
			const dataName = path.basename(filename, path.extname(filename));

			eleventyConfig.addGlobalData(dataName, async () => {
				// Import theme data file
				const mod = await import(fileInfo.path);
				return mod.default || mod;
			});
		}
	});
}

/**
 * Merge theme data with user data (user wins)
 *
 * DEPRECATED: Use configureDataCascade() instead for automatic cascade.
 * This function is kept for backwards compatibility.
 *
 * Copies theme data files to user's data directory if they don't exist.
 * This allows theme to provide sensible defaults while user maintains
 * full control via simple file override.
 *
 * @param {string} projectRoot - Path to content repo root
 * @param {Object} overridePaths - Override paths configuration
 * @returns {Object} Paths { themeDataPath, userDataPath }
 */
export function mergeDataFiles(projectRoot, overridePaths = {}) {
	const dataDir = getOverridePath(overridePaths, 'data');
	const themeRoot = getThemeRoot(projectRoot);

	const themeDataPath = path.join(themeRoot, metadata.paths.data);
	const userDataPath = path.join(projectRoot, dataDir);

	// Check if theme data directory exists
	if (!fs.existsSync(themeDataPath)) {
		return { themeDataPath, userDataPath };
	}

	// Get list of theme data files
	const themeDataFiles = fs.readdirSync(themeDataPath);

	// Copy theme data files that don't exist in user's data dir
	themeDataFiles.forEach((file) => {
		const userFile = path.join(userDataPath, file);
		const themeFile = path.join(themeDataPath, file);

		if (!fs.existsSync(userFile)) {
			// Ensure user data directory exists
			fs.mkdirSync(path.dirname(userFile), { recursive: true });

			// Copy theme default
			fs.copyFileSync(themeFile, userFile);

			console.log(`📄 Copied theme data: ${file} → ${dataDir}/${file}`);
			console.log(`   (Customize by editing ${dataDir}/${file})`);
		}
	});

	return { themeDataPath, userDataPath };
}

/**
 * Get data file with cascade resolution
 *
 * Useful for programmatic access to merged data.
 * Checks user directory first, falls back to theme.
 *
 * @param {string} filename - Data file name (e.g., 'site.js', 'navigation.js')
 * @param {string} projectRoot - Path to content repo root
 * @param {Object} overridePaths - Override paths configuration
 * @returns {string|null} Resolved file path or null if not found
 *
 * @example
 * // Find navigation data file
 * const navPath = resolveDataFile('navigation.js', __dirname, overridePaths);
 * if (navPath) {
 *   const nav = await import(navPath);
 *   console.log(nav.default);
 * }
 */
export function resolveDataFile(filename, projectRoot, overridePaths = {}) {
	const result = resolveResource({
		projectRoot,
		overridePaths,
		resourceType: 'data',
		filename,
		throwOnMissing: false,
	});

	return result?.path || null;
}

/**
 * Check if a data file exists (in user or theme)
 *
 * @param {string} filename - Data file name
 * @param {string} projectRoot - Path to content repo root
 * @param {Object} overridePaths - Override paths configuration
 * @returns {boolean} True if file exists
 */
export function dataFileExists(filename, projectRoot, overridePaths = {}) {
	return resourceExists(projectRoot, overridePaths, 'data', filename);
}

/**
 * Get all available data files (theme + user)
 *
 * Returns information about all data files with source tracking.
 *
 * @param {string} projectRoot - Path to content repo root
 * @param {Object} overridePaths - Override paths configuration
 * @returns {Map<string, Object>} Map of filename to file info
 *   Each file info contains: { name, source, path }
 *   Source is: 'theme', 'user', or 'override'
 */
export function getAvailableDataFiles(projectRoot, overridePaths = {}) {
	return scanWithCascade({
		projectRoot,
		overridePaths,
		resourceType: 'data',
		filter: (file) => file.endsWith('.js') || file.endsWith('.json'),
	});
}
