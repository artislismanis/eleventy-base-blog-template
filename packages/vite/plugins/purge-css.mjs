import fs from 'fs';
import path from 'path';

import { glob } from 'glob';
import { PurgeCSS } from 'purgecss';

export async function purgeCSSFiles(outputDir = '_site', options = {}) {
	const cssFiles = glob.sync(`./${outputDir}/assets/css/*.css`);

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
				content: [`./${outputDir}/**/*.html`],
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

			console.log(`  ✓ ${path.relative(outputDir, file)} (${reduction}% smaller)`);
			successCount++;
		} catch (error) {
			errorCount++;
			errors.push({
				file: path.relative(outputDir, file),
				error: error.message,
			});
			console.error(`  ✗ ${path.relative(outputDir, file)}: ${error.message}`);
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
