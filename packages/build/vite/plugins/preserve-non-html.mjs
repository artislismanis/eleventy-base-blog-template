/**
 * Preserve Non-HTML Files
 * Copies non-HTML files (XML, TXT, XSL) from Vite temp folder to output
 * Ensures feed files and other static assets are included in build
 */

import fs from 'fs/promises';
import path from 'path';

import { glob } from 'glob';

/**
 * Copy non-HTML files from .11ty-vite to _site
 * @param {string} tempDir - Vite temp directory (default: '.11ty-vite')
 * @param {string} outputDir - Output directory (default: '_site')
 * @param {string[]} extensions - File extensions to preserve (default: ['xml', 'txt', 'xsl'])
 */
export async function preserveNonHtmlFiles(
	tempDir = '.11ty-vite',
	outputDir = '_site',
	extensions = ['xml', 'txt', 'xsl'],
) {
	console.log('\n📋 Preserving non-HTML files...\n');

	const pattern = `${tempDir}/**/*.{${extensions.join(',')}}`;
	const files = await glob(pattern);

	if (files.length === 0) {
		console.log('   No non-HTML files to preserve\n');
		return;
	}

	let copiedCount = 0;

	for (const file of files) {
		const dest = file.replace(tempDir, outputDir);
		await fs.mkdir(path.dirname(dest), { recursive: true });
		await fs.copyFile(file, dest);
		copiedCount++;

		const relativePath = path.relative(outputDir, dest);
		console.log(`   ✓ ${relativePath}`);
	}

	console.log(`\n✅ Preserved ${copiedCount} non-HTML file(s)\n`);
}
