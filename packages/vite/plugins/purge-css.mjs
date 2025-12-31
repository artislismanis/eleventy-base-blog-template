import fs from 'fs';
import path from 'path';

import { glob } from 'glob';
import { PurgeCSS } from 'purgecss';

import { eleventyDirs } from '../eleventy.config.mjs';

export async function purgeCSSFiles() {
	const { output } = eleventyDirs;
	const cssFiles = glob.sync(`./${output}/assets/css/*.css`);

	if (cssFiles.length === 0) {
		console.log('⚠️  PurgeCSS: No CSS files found to process');
		return;
	}

	let successCount = 0;
	let errorCount = 0;
	const errors = [];

	for (const file of cssFiles) {
		try {
			const originalSize = fs.statSync(file).size;

			const results = await new PurgeCSS().purge({
				content: [`./${output}/**/*.html`],
				css: [file],
				safelist: {
					standard: [/^is-/, /^has-/, /^js-/, /^page-/],
					deep: [/data-component/, /language-/, /code/, /pre/],
					greedy: [/language-/],
				},
				defaultExtractor: (content) => {
					const matches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
					return matches;
				},
				keyframes: true,
				fontFace: true,
				variables: true,
				rejected: false,
				rejectedCss: false,
			});

			fs.writeFileSync(file, results[0].css);

			const newSize = fs.statSync(file).size;
			const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);

			console.log(`  ✓ ${path.relative(output, file)} (${reduction}% smaller)`);
			successCount++;
		} catch (error) {
			errorCount++;
			errors.push({
				file: path.relative(output, file),
				error: error.message,
			});
			console.error(`  ✗ ${path.relative(output, file)}: ${error.message}`);
		}
	}

	console.log(
		`\n✓ PurgeCSS completed: ${successCount} files processed${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
	);

	if (errorCount > 0) {
		console.error('\n❌ PurgeCSS Errors:');
		errors.forEach(({ file, error }) => {
			console.error(`   ${file}: ${error}`);
		});
		throw new Error(
			`PurgeCSS failed for ${errorCount} file(s). See errors above.`,
		);
	}
}
