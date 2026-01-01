/**
 * Dynamic plugin orchestration utility
 * Automatically discovers plugins from plugins/index.mjs exports
 */

import * as plugins from '../plugins/index.mjs';

/**
 * Find plugin function by config key
 * Supports flexible matching: exact name, or fuzzy match by key words
 *
 * @param {string} configKey - Configuration key (e.g., "purgeCSS", "criticalCSS")
 * @param {Object} pluginExports - All exported plugins
 * @returns {Function|null} The matching plugin function
 */
function findPluginFunction(configKey, pluginExports) {
	const lowerKey = configKey.toLowerCase();

	// Try exact match first
	if (pluginExports[configKey] && typeof pluginExports[configKey] === 'function') {
		return pluginExports[configKey];
	}

	// Try fuzzy match: find function name containing the key words
	// e.g., "purgeCSS" matches "purgeCSSFiles"
	//       "criticalCSS" matches "generateCriticalCSS"
	for (const [name, fn] of Object.entries(pluginExports)) {
		if (typeof fn !== 'function') continue;

		const lowerName = name.toLowerCase();

		// Check if all significant parts of the config key are in the function name
		// Remove common words like "generate", "create", "files"
		const keyWords = lowerKey.replace(/files?|generate|create/g, '');

		if (lowerName.includes(keyWords)) {
			return fn;
		}
	}

	return null;
}

/**
 * Run optimization plugins based on configuration
 * Automatically discovers available plugins from plugins/index.mjs
 *
 * @param {Object} optimizations - Optimization configuration (key: true|false|function)
 * @param {Object} dirs - Directory configuration
 * @param {string} dirs.output - Output directory (required)
 * @param {string} [dirs.temp] - Temp directory (required for preserveNonHtml)
 */
export async function runOptimizations(optimizations, dirs) {
	if (!dirs || !dirs.output) {
		throw new Error('runOptimizations: dirs.output is required');
	}

	for (const [name, config] of Object.entries(optimizations)) {
		// Skip if optimization is disabled
		if (!config) continue;

		// Custom function provided
		if (typeof config === 'function') {
			await config();
			continue;
		}

		// Built-in plugin
		if (config === true) {
			const pluginFn = findPluginFunction(name, plugins);

			if (!pluginFn) {
				console.warn(`⚠️  No plugin found for optimization: ${name}`);
				continue;
			}

			// preserveNonHtml needs both temp and output, others just need output
			if (name === 'preserveNonHtml') {
				if (!dirs.temp) {
					throw new Error(
						'preserveNonHtml optimization requires dirs.temp to be specified',
					);
				}
				await pluginFn(dirs.temp, dirs.output);
			} else {
				await pluginFn(dirs.output);
			}
		}
	}
}
