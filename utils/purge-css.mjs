import fs from 'fs';

import { glob } from 'glob';
import { PurgeCSS } from 'purgecss';

export async function purgeCSSFiles() {
	const cssFiles = glob.sync('./_site/assets/css/*.css');

	for (const file of cssFiles) {
		const results = await new PurgeCSS().purge({
			content: ['./_site/**/*.html'],
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
	}

	console.log('✓ PurgeCSS completed');
}
