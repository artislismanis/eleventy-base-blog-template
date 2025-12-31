/**
 * Shared cascade resolution utilities
 *
 * Provides a unified API for resolving resources with user override support.
 * Used by data files, bundles, layouts, and static assets.
 */

import fs from 'fs';
import path from 'path';
import { metadata } from '../metadata.mjs';

/**
 * Get theme root directory
 *
 * @param {string} projectRoot - Content repo root
 * @returns {string} Path to theme package
 */
export function getThemeRoot(projectRoot) {
	return path.join(projectRoot, 'node_modules', metadata.name);
}

/**
 * Get override path with fallback to default
 *
 * @param {Object} overridePaths - User override paths
 * @param {string} key - Path key (data, bundles, layouts, etc.)
 * @returns {string} Override path
 */
export function getOverridePath(overridePaths, key) {
	return overridePaths?.[key] || metadata.defaultOverridePaths[key];
}

/**
 * Build full paths for user and theme resources
 *
 * @param {string} projectRoot - Content repo root
 * @param {Object} overridePaths - User override paths
 * @param {string} resourceType - Type: 'data', 'bundles', 'layouts', 'public'
 * @param {string} filename - Optional filename to append
 * @returns {Object} Paths object { user, theme, userDir, themeDir }
 */
export function buildPaths(
	projectRoot,
	overridePaths,
	resourceType,
	filename = '',
) {
	const userDir = getOverridePath(overridePaths, resourceType);
	const themeDir = metadata.paths[resourceType];
	const themeRoot = getThemeRoot(projectRoot);

	return {
		user: path.join(projectRoot, userDir, filename),
		theme: path.join(themeRoot, themeDir, filename),
		userDir: path.join(projectRoot, userDir),
		themeDir: path.join(themeRoot, themeDir),
	};
}

/**
 * Resolve a single resource with cascade priority (user > theme)
 *
 * @param {Object} options
 * @param {string} options.projectRoot - Content repo root
 * @param {Object} options.overridePaths - User override paths
 * @param {string} options.resourceType - Type: 'data', 'bundles', 'layouts', 'public'
 * @param {string} options.filename - File to resolve
 * @param {boolean} options.throwOnMissing - Throw error if not found
 * @param {string} options.errorMessage - Custom error message
 * @returns {{ path: string, source: 'user'|'theme' }|null}
 *
 * @example
 * const result = resolveResource({
 *   projectRoot: __dirname,
 *   overridePaths: {},
 *   resourceType: 'data',
 *   filename: 'site.js'
 * });
 * // Returns: { path: '/path/to/file.js', source: 'user' }
 */
export function resolveResource({
	projectRoot,
	overridePaths = {},
	resourceType,
	filename,
	throwOnMissing = false,
	errorMessage = null,
}) {
	const paths = buildPaths(projectRoot, overridePaths, resourceType, filename);

	// Check user override first (highest priority)
	if (fs.existsSync(paths.user)) {
		return { path: paths.user, source: 'user' };
	}

	// Fall back to theme
	if (fs.existsSync(paths.theme)) {
		return { path: paths.theme, source: 'theme' };
	}

	// Not found
	if (throwOnMissing) {
		throw new Error(
			errorMessage ||
				`Resource "${filename}" not found in ${resourceType}\n` +
					`Checked:\n  - ${paths.user}\n  - ${paths.theme}`,
		);
	}

	return null;
}

/**
 * Scan directory with optional filter
 *
 * @param {string} dirPath - Directory to scan
 * @param {Function} filter - Filter function for files
 * @returns {string[]} Array of filenames
 */
export function scanDirectory(dirPath, filter = () => true) {
	if (!fs.existsSync(dirPath)) {
		return [];
	}

	try {
		return fs.readdirSync(dirPath).filter(filter);
	} catch (error) {
		// Handle permission errors gracefully
		return [];
	}
}

/**
 * Scan both user and theme directories, track sources
 *
 * Returns a Map where:
 * - 'theme': File only exists in theme
 * - 'user': File only exists in user directory
 * - 'override': File exists in both (user wins)
 *
 * @param {Object} options
 * @param {string} options.projectRoot - Content repo root
 * @param {Object} options.overridePaths - User override paths
 * @param {string} options.resourceType - 'data', 'bundles', 'public'
 * @param {Function} options.filter - File filter function
 * @returns {Map<string, { name, source, path }>}
 *
 * @example
 * const items = scanWithCascade({
 *   projectRoot: __dirname,
 *   overridePaths: {},
 *   resourceType: 'data',
 *   filter: file => file.endsWith('.js')
 * });
 */
export function scanWithCascade({
	projectRoot,
	overridePaths = {},
	resourceType,
	filter = () => true,
}) {
	const items = new Map();
	const paths = buildPaths(projectRoot, overridePaths, resourceType);

	// Scan theme directory first
	scanDirectory(paths.themeDir, filter).forEach((file) => {
		items.set(file, {
			name: file,
			source: 'theme',
			path: path.join(paths.themeDir, file),
		});
	});

	// Scan user directory (overrides or additions)
	scanDirectory(paths.userDir, filter).forEach((file) => {
		const isOverride = items.has(file);
		items.set(file, {
			name: file,
			source: isOverride ? 'override' : 'user',
			path: path.join(paths.userDir, file),
		});
	});

	return items;
}

/**
 * Scan directory recursively
 *
 * Used for static assets which can be nested
 *
 * @param {string} dirPath - Directory to scan
 * @param {string} baseDir - Base directory for relative paths
 * @returns {string[]} Array of relative paths
 */
export function scanDirectoryRecursive(dirPath, baseDir = dirPath) {
	if (!fs.existsSync(dirPath)) {
		return [];
	}

	let files = [];

	try {
		const entries = fs.readdirSync(dirPath, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(dirPath, entry.name);

			if (entry.isDirectory()) {
				files = files.concat(scanDirectoryRecursive(fullPath, baseDir));
			} else {
				// Return relative path from base
				files.push(path.relative(baseDir, fullPath));
			}
		}
	} catch (error) {
		// Handle permission errors gracefully
	}

	return files;
}

/**
 * Check if resource exists (in user or theme)
 *
 * @param {string} projectRoot - Content repo root
 * @param {Object} overridePaths - User override paths
 * @param {string} resourceType - Resource type
 * @param {string} filename - File to check
 * @returns {boolean} True if exists
 */
export function resourceExists(
	projectRoot,
	overridePaths,
	resourceType,
	filename,
) {
	const result = resolveResource({
		projectRoot,
		overridePaths,
		resourceType,
		filename,
		throwOnMissing: false,
	});

	return result !== null;
}
