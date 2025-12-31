/**
 * Default site configuration
 *
 * IMPORTANT: You SHOULD override this in content/_data/site.js
 * These are placeholder values for the theme.
 *
 * This theme default can be overridden by creating content/_data/site.js
 * in your content repo. Your file will completely replace this one.
 *
 * Configuration options:
 * - title: Site name
 * - description: Site tagline/description
 * - url: Full site URL (used for RSS, OpenGraph, etc.)
 * - language: Site language code (en, es, fr, etc.)
 * - author: Author information (name, email, url)
 *
 * @example Override in content/_data/site.js:
 * export default {
 *   title: 'My Awesome Blog',
 *   description: 'Thoughts on web development and design',
 *   url: 'https://mysite.com',
 *   language: 'en',
 *   author: {
 *     name: 'Jane Developer',
 *     email: 'jane@example.com',
 *     url: 'https://mysite.com/about',
 *   },
 * };
 */
export default {
	title: 'My Blog',
	description: 'A blog built with Eleventy',
	url: 'https://example.com',
	language: 'en',
	author: {
		name: 'Your Name',
		email: 'you@example.com',
		url: 'https://example.com/about',
	},
};
