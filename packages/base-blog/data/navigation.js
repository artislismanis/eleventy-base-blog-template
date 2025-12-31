/**
 * Default navigation structure
 *
 * This theme default can be overridden by creating content/_data/navigation.js
 * in your content repo. Your file will completely replace this one.
 *
 * Structure:
 * - main: Primary site navigation (typically header)
 * - footer: Footer navigation links
 *
 * Each item has:
 * - label: Display text
 * - url: Link destination
 *
 * @example Override in content/_data/navigation.js:
 * export default {
 *   main: [
 *     { label: 'Home', url: '/' },
 *     { label: 'Articles', url: '/articles/' },
 *     { label: 'Projects', url: '/projects/' },
 *     { label: 'About', url: '/about/' },
 *   ],
 *   footer: [
 *     { label: 'RSS', url: '/feed.xml' },
 *     { label: 'GitHub', url: 'https://github.com/yourusername' },
 *   ],
 * };
 */
export default {
	main: [
		{ label: 'Home', url: '/' },
		{ label: 'Blog', url: '/blog/' },
		{ label: 'About', url: '/about/' },
	],
	footer: [
		{ label: 'RSS Feed', url: '/feed.xml' },
		{ label: 'Sitemap', url: '/sitemap.xml' },
	],
};
