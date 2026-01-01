/**
 * Vite plugin that auto-imports theme assets into user entry points
 *
 * This eliminates the need for users to manually import theme styles/scripts.
 * The plugin prepends theme imports to the user's main entry file.
 *
 * @param {Object} options - Plugin options
 * @param {string} options.themeName - Theme package name
 * @param {string} options.stylesEntry - Theme styles entry path (e.g., 'styles/main.scss')
 * @param {string} options.scriptsEntry - Theme scripts entry path (e.g., 'scripts/main.js')
 * @param {string} options.userScriptsPath - User scripts path (default: 'overrides/scripts')
 * @returns {Object} Vite plugin
 *
 * @example
 * import { themeAutoImportPlugin } from '@eleventy-plugin-themer/build-vite/plugins/auto-import';
 *
 * export default {
 *   plugins: [
 *     themeAutoImportPlugin({
 *       themeName: '@eleventy-plugin-themer/theme-base',
 *       stylesEntry: 'styles/main.scss',
 *       scriptsEntry: 'scripts/main.js',
 *     }),
 *   ],
 * };
 */
export function themeAutoImportPlugin(options = {}) {
	const {
		themeName,
		stylesEntry = 'styles/main.scss',
		scriptsEntry = 'scripts/main.js',
		userScriptsPath = 'overrides/scripts',
	} = options;

	if (!themeName) {
		throw new Error('themeAutoImportPlugin: themeName is required');
	}

	return {
		name: 'theme-auto-import',

		transform(code, id) {
			// Only transform user's main entry point
			const isMainEntry =
				id.includes(`/${userScriptsPath}/main.js`) ||
				id.includes(`/${userScriptsPath}/main.ts`);

			if (!isMainEntry) return null;

			// Prepend theme imports
			const themeImports = `// Auto-imported by theme (${themeName})
import '${themeName}/${stylesEntry}';
import '${themeName}/${scriptsEntry}';

`;
			return {
				code: themeImports + code,
				map: null,
			};
		},
	};
}
