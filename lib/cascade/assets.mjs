/**
 * Static asset cascade
 *
 * Manages public files (favicon, robots.txt, images) with user override support.
 * Uses per-file override - user files completely replace theme files by name.
 */

import path from 'path';
import {
	buildPaths,
	scanDirectoryRecursive,
	resolveResource,
} from './resolver.mjs';

/**
 * Configure passthrough copy with cascade support
 *
 * Sets up Eleventy's passthrough copy to:
 * 1. Copy theme assets that user hasn't overridden
 * 2. Let user assets take precedence
 *
 * Theme assets are only copied if user doesn't have a file with the same name.
 *
 * @param {Object} eleventyConfig - Eleventy configuration object
 * @param {string} projectRoot - Content repo root
 * @param {Object} overridePaths - Override paths configuration
 *
 * @example
 * // In eleventy.config.mjs
 * import { configurePassthroughCopy } from 'eleventy-base-blog-template';
 * configurePassthroughCopy(eleventyConfig, __dirname);
 */
export function configurePassthroughCopy(
	eleventyConfig,
	projectRoot,
	overridePaths = {},
) {
	const assets = getAvailableAssets(projectRoot, overridePaths);

	let themeAssetsUsed = 0;
	let userOverrides = 0;

	assets.forEach((info) => {
		if (info.source === 'theme') {
			// Copy theme asset (user hasn't overridden it)
			eleventyConfig.addPassthroughCopy({
				[info.path]: info.name,
			});
			themeAssetsUsed++;
		} else {
			// User file - already handled by Eleventy's normal passthrough
			userOverrides++;
		}
	});

	console.log(
		`📁 Using ${themeAssetsUsed} theme assets (override by adding to public/)`,
	);
	if (userOverrides > 0) {
		console.log(`✨ User overrode ${userOverrides} theme asset(s)`);
	}
}

/**
 * Resolve static asset path with cascade
 *
 * Checks user directory first, falls back to theme.
 *
 * @param {string} filename - Asset filename (can include subdirectories)
 * @param {string} projectRoot - Content repo root
 * @param {Object} overridePaths - Override paths configuration
 * @returns {string|null} Resolved file path or null if not found
 *
 * @example
 * const favicon = resolveStaticAsset('favicon.svg', __dirname);
 * if (favicon) {
 *   console.log('Favicon found at:', favicon);
 * }
 */
export function resolveStaticAsset(
	filename,
	projectRoot,
	overridePaths = {},
) {
	const result = resolveResource({
		projectRoot,
		overridePaths,
		resourceType: 'public',
		filename,
		throwOnMissing: false,
	});

	return result?.path || null;
}

/**
 * Get all available static assets (theme + user)
 *
 * Returns information about all assets with source tracking.
 * Scans recursively to support nested directories.
 *
 * @param {string} projectRoot - Content repo root
 * @param {Object} overridePaths - Override paths configuration
 * @returns {Map<string, Object>} Map of relative path to asset info
 *   Each asset info contains: { name, source, path }
 *   Source is: 'theme', 'user', or 'override'
 *
 * @example
 * const assets = getAvailableAssets(__dirname);
 * assets.forEach((info, relativePath) => {
 *   console.log(`${relativePath}: ${info.source}`);
 * });
 */
export function getAvailableAssets(projectRoot, overridePaths = {}) {
	const assets = new Map();
	const paths = buildPaths(projectRoot, overridePaths, 'public');

	// Scan theme assets (recursive)
	const themeFiles = scanDirectoryRecursive(paths.themeDir);
	themeFiles.forEach((relativePath) => {
		assets.set(relativePath, {
			name: relativePath,
			source: 'theme',
			path: path.join(paths.themeDir, relativePath),
		});
	});

	// Scan user assets (overrides or additions)
	const userFiles = scanDirectoryRecursive(paths.userDir);
	userFiles.forEach((relativePath) => {
		const isOverride = assets.has(relativePath);
		assets.set(relativePath, {
			name: relativePath,
			source: isOverride ? 'override' : 'user',
			path: path.join(paths.userDir, relativePath),
		});
	});

	return assets;
}
