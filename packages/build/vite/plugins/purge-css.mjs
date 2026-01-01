import fs from 'fs';
import { PurgeCSS } from 'purgecss';
import { processFiles } from '../utils/file-processor.mjs';

export async function purgeCSSFiles(outputDir = '_site', options = {}) {
	return processFiles({
		pattern: `./${outputDir}/assets/css/*.css`,
		outputDir,
		taskName: 'PurgeCSS',
		processor: async (file) => {
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

			return {
				message: ` (${reduction}% smaller)`,
				stats: { originalSize, newSize, reduction },
			};
		},
	});
}
