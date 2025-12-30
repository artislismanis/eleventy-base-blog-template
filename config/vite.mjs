import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Get Vite configuration for theme integration
 *
 * @param {string} projectRoot - Absolute path to project root (usually __dirname)
 * @returns {Object} Vite configuration object with resolve and css settings
 *
 * @example
 * import { getThemeViteConfig } from 'eleventy-base-blog-template/config/vite.mjs';
 *
 * const __dirname = path.dirname(fileURLToPath(import.meta.url));
 * const themeViteConfig = getThemeViteConfig(__dirname);
 *
 * eleventyConfig.addPlugin(EleventyVitePlugin, {
 *   viteOptions: {
 *     resolve: themeViteConfig.resolve,
 *     css: themeViteConfig.css,
 *     // ... rest of your Vite config
 *   }
 * });
 */
export function getThemeViteConfig(projectRoot) {
	const themeRoot = path.dirname(
		fileURLToPath(import.meta.url.replace('/config', '')),
	);

	return {
		resolve: {
			alias: {
				'/overrides': path.resolve(projectRoot, 'overrides'),
				'eleventy-base-blog-template': themeRoot,
			},
		},
		css: {
			preprocessorOptions: {
				scss: {
					api: 'modern-compiler',
					includePaths: [
						path.resolve(projectRoot, 'node_modules'),
						path.resolve(projectRoot, 'overrides/styles'),
						path.join(themeRoot, 'styles'),
					],
				},
			},
		},
	};
}

export default { getThemeViteConfig };
