import path from 'path';
import fs from 'fs/promises';

import { glob } from 'glob';
import Critters from 'critters';

export async function generateCriticalCSS() {
	console.log('\n Generating critical CSS...\n');

	const htmlFiles = await glob('_site/**/*.html');

	const critters = new Critters({
		path: '_site',
		publicPath: '/',
		preload: 'swap',
		inlineFonts: true,
		pruneSource: true,
		mergeStylesheets: true,
		compress: true,
		logLevel: 'info',
	});

	for (const file of htmlFiles) {
		try {
			const html = await fs.readFile(file, 'utf-8');
			const inlined = await critters.process(html);

			// Remove leftover stylesheet links and their noscript fallbacks
			const tidy_link = inlined.replace(
				/<link[^>]+rel=["']stylesheet["'][^>]*>/gi,
				'',
			);
			const tidy_script = tidy_link.replace(
				/<noscript>\s*<link[^>]+rel=["']stylesheet["'][^>]*>\s*<\/noscript>/gi,
				'',
			);

			await fs.writeFile(file, tidy_script);

			console.log(`✓ ${path.relative('_site', file)}`);
		} catch (error) {
			console.error(`✗ ${file}:`, error.message);
		}
	}

	console.log(`\n✓ Critical CSS generated for ${htmlFiles.length} pages\n`);
}
