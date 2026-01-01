import fs from 'fs/promises';
import Critters from 'critters';
import { processFiles } from '../utils/file-processor.mjs';

export async function generateCriticalCSS(outputDir = '_site', options = {}) {
	const critters = new Critters({
		path: outputDir,
		...options,
		publicPath: '/',
		preload: 'swap',
		inlineFonts: true,
		pruneSource: true,
		mergeStylesheets: true,
		compress: true,
		logLevel: 'warn', // Only show warnings/errors from Critters
	});

	return processFiles({
		pattern: `${outputDir}/**/*.html`,
		outputDir,
		taskName: 'Critical CSS',
		errorTip: 'Check if CSS files exist and are properly linked in HTML',
		processor: async (file) => {
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
		},
	});
}
