import { globSync } from 'glob';
import path from 'path';

/**
 * Auto-discover optional feature bundles from overrides/bundles/ directory
 *
 * Returns Vite entry points for:
 * - main.js (global bundle - always included)
 * - feature bundles (discovered from bundles/*.js files)
 *
 * Usage in eleventy.config.mjs:
 *   import { getPageBundleEntries } from './utils/get-page-bundles.mjs';
 *
 *   build: {
 *     rollupOptions: {
 *       input: getPageBundleEntries(),
 *     }
 *   }
 */
export function getPageBundleEntries() {
	const entries = {
		// Main bundle - always included (user's entry point in overrides/)
		main: path.resolve(process.cwd(), 'overrides/scripts/main.js'),
	};

	// Discover optional bundles from overrides/bundles/*.js
	const bundles = globSync('overrides/bundles/*.js');

	bundles.forEach((file) => {
		const name = path.basename(file, '.js');
		entries[name] = path.resolve(process.cwd(), file);
	});

	if (Object.keys(entries).length > 1) {
		console.log('📦 Discovered bundles:', Object.keys(entries).filter(k => k !== 'main').join(', '));
	}

	return entries;
}
