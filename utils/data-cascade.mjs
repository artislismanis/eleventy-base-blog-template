import fs from 'fs';
import path from 'path';
import { metadata } from '../lib/metadata.mjs';

/**
 * Merge theme data with user data (user wins)
 *
 * Copies theme data files to user's data directory if they don't exist.
 * This allows theme to provide sensible defaults while user maintains
 * full control via simple file override.
 *
 * @param {string} projectRoot - Path to content repo root
 * @param {Object} overridePaths - Override paths configuration
 * @returns {Object} Paths { themeDataPath, userDataPath }
 *
 * @example
 * // In eleventy.config.mjs (optional - for explicit data setup)
 * import { mergeDataFiles } from 'eleventy-base-blog-template';
 *
 * mergeDataFiles(__dirname, {
 *   data: 'content/_data',
 * });
 */
export function mergeDataFiles(projectRoot, overridePaths = {}) {
	const dataDir = overridePaths.data || metadata.defaultOverridePaths.data;

	const themeDataPath = path.join(
		projectRoot,
		'node_modules',
		metadata.name,
		metadata.paths.data,
	);

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
	const dataDir = overridePaths.data || metadata.defaultOverridePaths.data;

	// Check user file first (highest priority)
	const userFile = path.join(projectRoot, dataDir, filename);
	if (fs.existsSync(userFile)) {
		return userFile;
	}

	// Fall back to theme file
	const themeFile = path.join(
		projectRoot,
		'node_modules',
		metadata.name,
		metadata.paths.data,
		filename,
	);
	if (fs.existsSync(themeFile)) {
		return themeFile;
	}

	return null;
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
	return resolveDataFile(filename, projectRoot, overridePaths) !== null;
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
	const dataDir = overridePaths.data || metadata.defaultOverridePaths.data;
	const files = new Map();

	// Add theme data files
	const themeDataPath = path.join(
		projectRoot,
		'node_modules',
		metadata.name,
		metadata.paths.data,
	);

	if (fs.existsSync(themeDataPath)) {
		fs.readdirSync(themeDataPath)
			.filter((file) => file.endsWith('.js') || file.endsWith('.json'))
			.forEach((file) => {
				files.set(file, {
					name: file,
					source: 'theme',
					path: path.join(themeDataPath, file),
				});
			});
	}

	// Add/override with user data files
	const userDataPath = path.join(projectRoot, dataDir);

	if (fs.existsSync(userDataPath)) {
		fs.readdirSync(userDataPath)
			.filter((file) => file.endsWith('.js') || file.endsWith('.json'))
			.forEach((file) => {
				const isOverride = files.has(file);
				files.set(file, {
					name: file,
					source: isOverride ? 'override' : 'user',
					path: path.join(userDataPath, file),
				});
			});
	}

	return files;
}
