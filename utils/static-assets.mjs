import fs from 'fs';
import path from 'path';
import { metadata } from '../lib/metadata.mjs';

/**
 * Configure passthrough copy with cascade (user overrides theme)
 *
 * Theme can provide default static assets (images, fonts, favicons, etc.)
 * that users can override by placing files with the same name in their
 * public/ directory.
 *
 * Resolution order:
 * 1. User's public/ (highest priority) - always copied
 * 2. Theme's public/ (fallback) - copied only if user hasn't overridden
 *
 * @param {Object} eleventyConfig - Eleventy configuration object
 * @param {string} projectRoot - Project root path
 * @param {Object} overridePaths - Override paths configuration
 * @returns {void}
 *
 * @example
 * // In eleventy.config.mjs
 * import theme, { configurePassthroughCopy } from 'eleventy-base-blog-template';
 *
 * export default function(eleventyConfig) {
 *   theme.init(eleventyConfig, { projectRoot: __dirname });
 *   configurePassthroughCopy(eleventyConfig, __dirname);
 * }
 */
export function configurePassthroughCopy(eleventyConfig, projectRoot, overridePaths = {}) {
	const publicPath = overridePaths.public || metadata.defaultOverridePaths.public;

	const themePublicPath = path.join(
		projectRoot,
		'node_modules',
		metadata.name,
		metadata.paths.public,
	);

	const userPublicPath = path.join(projectRoot, publicPath);

	// Get all theme public files
	const themeFiles = getFilesRecursive(themePublicPath);

	// Get all user public files
	const userFiles = getFilesRecursive(userPublicPath);
	const userFileSet = new Set(userFiles.map((f) => f.relative));

	// Copy theme files that user hasn't overridden
	let themeAssetCount = 0;
	themeFiles.forEach((file) => {
		if (!userFileSet.has(file.relative)) {
			// Theme file, no user override - copy from theme
			eleventyConfig.addPassthroughCopy({
				[file.absolute]: file.relative,
			});
			themeAssetCount++;
		}
	});

	// Always copy all user files (they win)
	if (fs.existsSync(userPublicPath)) {
		eleventyConfig.addPassthroughCopy(publicPath);
	}

	// Log helpful info
	if (themeAssetCount > 0) {
		console.log(`📁 Using ${themeAssetCount} theme assets (override by adding to ${publicPath}/)`);
	}
	if (userFiles.length > 0) {
		const overrideCount = userFiles.filter((f) =>
			themeFiles.some((t) => t.relative === f.relative)
		).length;
		if (overrideCount > 0) {
			console.log(`✨ User overrode ${overrideCount} theme asset(s)`);
		}
	}
}

/**
 * Get all files recursively with relative paths
 *
 * @private
 * @param {string} dir - Directory to scan
 * @param {string} baseDir - Base directory for relative paths
 * @returns {Array<Object>} Array of { absolute, relative } file objects
 */
function getFilesRecursive(dir, baseDir = dir) {
	if (!fs.existsSync(dir)) return [];

	const files = [];
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		const relativePath = path.relative(baseDir, fullPath);

		if (entry.isDirectory()) {
			files.push(...getFilesRecursive(fullPath, baseDir));
		} else {
			files.push({
				absolute: fullPath,
				relative: relativePath,
			});
		}
	}

	return files;
}

/**
 * Check if a static asset exists (user or theme)
 *
 * Useful for validating asset references in templates or front matter.
 *
 * @param {string} relativePath - Asset path relative to public/ (e.g., 'favicon.ico')
 * @param {string} projectRoot - Project root path
 * @param {Object} overridePaths - Override paths configuration
 * @returns {Object|null} { path, source } or null if not found
 *   - path: Absolute path to asset
 *   - source: 'user' or 'theme'
 *
 * @example
 * const favicon = resolveStaticAsset('favicon.ico', __dirname, overridePaths);
 * if (favicon) {
 *   console.log(`Using ${favicon.source} favicon: ${favicon.path}`);
 * }
 */
export function resolveStaticAsset(relativePath, projectRoot, overridePaths = {}) {
	const publicPath = overridePaths.public || metadata.defaultOverridePaths.public;

	// Check user first (highest priority)
	const userPath = path.join(projectRoot, publicPath, relativePath);
	if (fs.existsSync(userPath)) {
		return { path: userPath, source: 'user' };
	}

	// Fall back to theme
	const themePath = path.join(
		projectRoot,
		'node_modules',
		metadata.name,
		metadata.paths.public,
		relativePath,
	);
	if (fs.existsSync(themePath)) {
		return { path: themePath, source: 'theme' };
	}

	return null;
}

/**
 * Get all available static assets (theme + user)
 *
 * Returns information about all static assets with source tracking.
 *
 * @param {string} projectRoot - Project root path
 * @param {Object} overridePaths - Override paths configuration
 * @returns {Map<string, Object>} Map of relative path to asset info
 *   Each asset info contains: { relativePath, source, path }
 *   Source is: 'theme', 'user', or 'override'
 */
export function getAvailableAssets(projectRoot, overridePaths = {}) {
	const publicPath = overridePaths.public || metadata.defaultOverridePaths.public;
	const assets = new Map();

	// Add theme assets
	const themePublicPath = path.join(
		projectRoot,
		'node_modules',
		metadata.name,
		metadata.paths.public,
	);

	const themeFiles = getFilesRecursive(themePublicPath);
	themeFiles.forEach((file) => {
		assets.set(file.relative, {
			relativePath: file.relative,
			source: 'theme',
			path: file.absolute,
		});
	});

	// Add/override with user assets
	const userPublicPath = path.join(projectRoot, publicPath);
	const userFiles = getFilesRecursive(userPublicPath);

	userFiles.forEach((file) => {
		const isOverride = assets.has(file.relative);
		assets.set(file.relative, {
			relativePath: file.relative,
			source: isOverride ? 'override' : 'user',
			path: file.absolute,
		});
	});

	return assets;
}
