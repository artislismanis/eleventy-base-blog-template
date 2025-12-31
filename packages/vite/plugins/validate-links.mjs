/**
 * Link Validation
 * Validates internal links and images after build
 * Catches broken links before deployment
 */

import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

import { glob } from 'glob';
import { parse } from 'node-html-parser';

/**
 * Validate links and images in built HTML
 * @param {string} outputDir - Output directory to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.throwOnError - Throw error if validation fails
 * @returns {Promise<{valid: boolean, errors: Array}>}
 */
export async function validateLinks(outputDir = '_site', options = {}) {
	console.log('\n🔗 Validating links and images...\n');

	const htmlFiles = await glob(`${outputDir}/**/*.html`);

	const errors = [];
	let totalLinks = 0;
	let totalImages = 0;

	for (const htmlFile of htmlFiles) {
		try {
			const html = await fs.readFile(htmlFile, 'utf-8');
			const root = parse(html);

			const relativePath = path.relative(outputDir, htmlFile);
			const baseDir = path.dirname(htmlFile);

			// Check internal links
			const links = root.querySelectorAll('a[href]');
			for (const link of links) {
				const href = link.getAttribute('href');

				// Skip external links, anchors, mailto, tel, etc
				if (
					!href ||
					href.startsWith('http://') ||
					href.startsWith('https://') ||
					href.startsWith('mailto:') ||
					href.startsWith('tel:') ||
					href.startsWith('#')
				) {
					continue;
				}

				totalLinks++;

				// Remove hash/query for file check
				const cleanHref = href.split('#')[0].split('?')[0];

				// Resolve to filesystem path
				let targetPath;
				if (cleanHref.startsWith('/')) {
					// Absolute path from site root
					targetPath = path.join(output, cleanHref);
				} else {
					// Relative path from current file
					targetPath = path.join(baseDir, cleanHref);
				}

				// Check if target exists (file or directory with index.html)
				const fileExists = existsSync(targetPath);
				const indexExists = existsSync(path.join(targetPath, 'index.html'));

				if (!fileExists && !indexExists) {
					errors.push({
						file: relativePath,
						type: 'broken-link',
						target: href,
						message: `Broken internal link: ${href}`,
					});
				}
			}

			// Check images
			const images = root.querySelectorAll('img[src]');
			for (const img of images) {
				const src = img.getAttribute('src');

				// Skip external images, data URIs
				if (
					!src ||
					src.startsWith('http://') ||
					src.startsWith('https://') ||
					src.startsWith('data:')
				) {
					continue;
				}

				totalImages++;

				// Resolve to filesystem path
				let imagePath;
				if (src.startsWith('/')) {
					// Absolute path from site root
					imagePath = path.join(output, src);
				} else {
					// Relative path from current file
					imagePath = path.join(baseDir, src);
				}

				if (!existsSync(imagePath)) {
					errors.push({
						file: relativePath,
						type: 'missing-image',
						target: src,
						message: `Missing image: ${src}`,
					});
				}
			}
		} catch (error) {
			errors.push({
				file: path.relative(output, htmlFile),
				type: 'parse-error',
				message: `Failed to parse HTML: ${error.message}`,
			});
		}
	}

	// Report results
	if (errors.length === 0) {
		console.log(
			`✅ Link validation passed: ${totalLinks} links, ${totalImages} images\n`,
		);
		return { valid: true, errors: [] };
	}

	console.error(`❌ Link validation failed: ${errors.length} errors found\n`);

	// Group errors by type
	const brokenLinks = errors.filter((e) => e.type === 'broken-link');
	const missingImages = errors.filter((e) => e.type === 'missing-image');
	const parseErrors = errors.filter((e) => e.type === 'parse-error');

	if (brokenLinks.length > 0) {
		console.error(`\n🔗 Broken Links (${brokenLinks.length}):`);
		brokenLinks.forEach(({ file, target }) => {
			console.error(`   ${file} → ${target}`);
		});
	}

	if (missingImages.length > 0) {
		console.error(`\n🖼️  Missing Images (${missingImages.length}):`);
		missingImages.forEach(({ file, target }) => {
			console.error(`   ${file} → ${target}`);
		});
	}

	if (parseErrors.length > 0) {
		console.error(`\n⚠️  Parse Errors (${parseErrors.length}):`);
		parseErrors.forEach(({ file, message }) => {
			console.error(`   ${file}: ${message}`);
		});
	}

	console.error(
		'\n💡 Tip: Fix broken links and missing images before deployment\n',
	);

	if (options.throwOnError) {
		throw new Error(
			`Link validation failed with ${errors.length} error(s). Fix issues above.`,
		);
	}

	return { valid: false, errors };
}

/**
 * Validate links and throw if invalid
 * Use this in build pipeline to fail fast
 */
export async function validateLinksOrThrow(outputDir = '_site', options = {}) {
	return validateLinks(outputDir, { ...options, throwOnError: true });
}
