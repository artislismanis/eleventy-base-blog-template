import path from 'path';
import fs from 'fs/promises';

import { glob } from 'glob';
import Critters from 'critters';

import { eleventyDirs } from '../eleventy.config.mjs';

export async function generateCriticalCSS() {
	// Check if critical CSS generation is enabled via environment variable
	const isEnabled = process.env.GENERATE_CRITICAL_CSS === 'true';

	if (!isEnabled) {
		console.log('⏭️  Critical CSS skipped (disabled)');
		return;
	}

	console.log('\n📦 Generating critical CSS...\n');

	const { output } = eleventyDirs;
	const htmlFiles = await glob(`${output}/**/*.html`);

	if (htmlFiles.length === 0) {
		console.log('⚠️  Critical CSS: No HTML files found to process');
		return;
	}

	const critters = new Critters({
		path: output,
		publicPath: '/',
		preload: 'swap',
		inlineFonts: true,
		pruneSource: true,
		mergeStylesheets: true,
		compress: true,
		logLevel: 'warn', // Only show warnings/errors from Critters
	});

	let successCount = 0;
	let errorCount = 0;
	const errors = [];

	for (const file of htmlFiles) {
		try {
			const html = await fs.readFile(file, 'utf-8');
			const inlined = await critters.process(html);

			// Remove leftover stylesheet links and their noscript fallbacks
			const tidy_link = inlined.replace(
				/<link[^>]+rel=["']stylesheet["'][^>]*>/gi,
				'',
			);
			const tidy_noscript = tidy_link.replace(
				/<noscript>\s*<link[^>]+rel=["']stylesheet["'][^>]*>\s*<\/noscript>/gi,
				'',
			);
			// Remove any remaining empty noscript tags
			const tidy_final = tidy_noscript.replace(
				/<noscript>\s*<\/noscript>/gi,
				'',
			);

			await fs.writeFile(file, tidy_final);

			console.log(`✓ ${path.relative(output, file)}`);
			successCount++;
		} catch (error) {
			errorCount++;
			errors.push({
				file: path.relative(output, file),
				error: error.message,
				stack: error.stack,
			});
			console.error(`✗ ${path.relative(output, file)}: ${error.message}`);
		}
	}

	console.log(
		`\n✓ Critical CSS generated: ${successCount}/${htmlFiles.length} pages${errorCount > 0 ? `, ${errorCount} failed` : ''}\n`,
	);

	if (errorCount > 0) {
		console.error('\n❌ Critical CSS Errors:');
		errors.forEach(({ file, error }) => {
			console.error(`   ${file}: ${error}`);
		});
		console.error(
			'\nTip: Check if CSS files exist and are properly linked in HTML',
		);
		throw new Error(
			`Critical CSS generation failed for ${errorCount} file(s). See errors above.`,
		);
	}
}
