import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Get the path to theme layouts directory relative to content input directory
 *
 * @param {string} projectRoot - Absolute path to project root (usually __dirname)
 * @param {string} contentDir - Content directory name (default: 'content')
 * @returns {string} Relative path from content directory to theme layouts
 *
 * @example
 * import { getThemeLayoutsPath } from 'eleventy-base-blog-template/config/eleventy.mjs';
 *
 * const __dirname = path.dirname(fileURLToPath(import.meta.url));
 * const layoutsPath = getThemeLayoutsPath(__dirname);
 *
 * return {
 *   dir: {
 *     input: 'content',
 *     includes: layoutsPath,
 *     layouts: layoutsPath,
 *   }
 * };
 */
export function getThemeLayoutsPath(projectRoot, contentDir = 'content') {
	const themeRoot = path.dirname(
		fileURLToPath(import.meta.url.replace('/config', '')),
	);
	return path.relative(
		path.join(projectRoot, contentDir),
		path.join(themeRoot, 'layouts'),
	);
}

export default { getThemeLayoutsPath };
