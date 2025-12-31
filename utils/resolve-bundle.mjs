import fs from 'fs';
import path from 'path';
import { metadata } from '../lib/metadata.mjs';

/**
 * Resolve bundle path with override support
 *
 * Resolution order:
 * 1. User override: {overridePaths.bundles}/{name}.js
 * 2. Theme bundle: node_modules/{theme}/bundles/{name}.js
 * 3. Error if not found
 *
 * @param {string} bundleName - Bundle name (e.g., 'code-highlighting')
 * @param {string} projectRoot - Project root path
 * @param {Object} overridePaths - Override paths configuration
 * @returns {string} Resolved bundle path
 * @throws {Error} If bundle not found
 *
 * @example
 * // Resolve bundle (checks user override first, then theme)
 * const bundlePath = resolveBundlePath('code-highlighting', __dirname, overridePaths);
 */
export function resolveBundlePath(bundleName, projectRoot, overridePaths = {}) {
	// Check user override first
	const userBundlePath = path.join(
		projectRoot,
		overridePaths.bundles || 'overrides/bundles',
		`${bundleName}.js`,
	);
	if (fs.existsSync(userBundlePath)) {
		return userBundlePath;
	}

	// Fall back to theme bundle
	const themeBundlePath = path.join(
		projectRoot,
		'node_modules',
		metadata.name,
		'bundles',
		`${bundleName}.js`,
	);
	if (fs.existsSync(themeBundlePath)) {
		return themeBundlePath;
	}

	// Helpful error message with available options
	const availableBundles = metadata.bundles.length > 0
		? metadata.bundles.join(', ')
		: 'none';

	throw new Error(
		`Bundle "${bundleName}" not found.\n\n` +
		`Available theme bundles: ${availableBundles}\n` +
		`To create a custom bundle, add: ${overridePaths.bundles || 'overrides/bundles'}/${bundleName}.js\n` +
		`To extend a theme bundle, import from '@theme/bundles/${bundleName}.js'\n\n` +
		`Checked:\n` +
		`  - ${userBundlePath}\n` +
		`  - ${themeBundlePath}`,
	);
}

/**
 * Get all available bundles (theme + user)
 *
 * Returns a Map of bundle information with source tracking.
 * Useful for validation, debugging, and build tooling.
 *
 * @param {string} projectRoot - Project root path
 * @param {Object} overridePaths - Override paths configuration
 * @returns {Map<string, Object>} Map of bundle name to bundle info
 *   Each bundle info contains: { name, source, path }
 *   Source is: 'theme', 'override', or 'user'
 *
 * @example
 * const bundles = getAvailableBundles(__dirname, overridePaths);
 * bundles.forEach((bundle, name) => {
 *   console.log(`${name}: ${bundle.source} (${bundle.path})`);
 * });
 */
export function getAvailableBundles(projectRoot, overridePaths = {}) {
	const bundles = new Map();

	// Add theme bundles
	const themeBundlesPath = path.join(
		projectRoot,
		'node_modules',
		metadata.name,
		'bundles',
	);

	if (fs.existsSync(themeBundlesPath)) {
		metadata.bundles.forEach((name) => {
			const bundlePath = path.join(themeBundlesPath, `${name}.js`);
			if (fs.existsSync(bundlePath)) {
				bundles.set(name, {
					name,
					source: 'theme',
					path: bundlePath,
				});
			}
		});
	}

	// Add/override with user bundles
	const userBundlesDir = path.join(
		projectRoot,
		overridePaths.bundles || 'overrides/bundles',
	);

	if (fs.existsSync(userBundlesDir)) {
		fs.readdirSync(userBundlesDir)
			.filter((file) => file.endsWith('.js') && !file.endsWith('.auto.js'))
			.forEach((file) => {
				const name = path.basename(file, '.js');
				const isOverride = bundles.has(name);
				bundles.set(name, {
					name,
					source: isOverride ? 'override' : 'user',
					path: path.join(userBundlesDir, file),
				});
			});
	}

	return bundles;
}

/**
 * Validate bundle name
 *
 * Checks if a bundle exists (either in theme or user overrides).
 * Useful for validating front matter before build.
 *
 * @param {string} bundleName - Bundle name to validate
 * @param {string} projectRoot - Project root path
 * @param {Object} overridePaths - Override paths configuration
 * @returns {boolean} True if bundle exists
 */
export function bundleExists(bundleName, projectRoot, overridePaths = {}) {
	try {
		resolveBundlePath(bundleName, projectRoot, overridePaths);
		return true;
	} catch {
		return false;
	}
}
