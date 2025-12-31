import fs from 'fs';
import path from 'path';
import { metadata } from '../lib/metadata.mjs';

/**
 * Validate theme installation and provide helpful errors
 *
 * Checks that the theme is properly installed and configured.
 * Provides warnings for common issues and deprecated patterns.
 *
 * @param {string} projectRoot - Project root path
 * @param {Object} overridePaths - Override paths configuration
 * @returns {Object} Validation result { errors, warnings, isValid }
 *   - errors: Array of error messages (critical issues)
 *   - warnings: Array of warning messages (non-critical)
 *   - isValid: Boolean - true if no errors (warnings are OK)
 *
 * @example
 * // In eleventy.config.mjs (optional - init() calls this automatically)
 * import { validateTheme } from 'eleventy-base-blog-template';
 *
 * const validation = validateTheme(__dirname);
 * if (!validation.isValid) {
 *   console.error('Theme validation failed:', validation.errors);
 *   process.exit(1);
 * }
 */
export function validateTheme(projectRoot, overridePaths = {}) {
	const errors = [];
	const warnings = [];

	// Get configured paths
	const scriptsPath = overridePaths.scripts || metadata.defaultOverridePaths.scripts;
	const layoutsPath = overridePaths.layouts || metadata.defaultOverridePaths.layouts;

	// Check required theme directories exist
	const requiredThemeDirs = ['layouts', 'styles', 'scripts'];
	const themeRoot = path.join(projectRoot, 'node_modules', metadata.name);

	if (!fs.existsSync(themeRoot)) {
		errors.push(
			`Theme package not found at: ${themeRoot}\n` +
			`  Did you run 'npm install ${metadata.name}'?`
		);
		// Can't continue without theme installed
		return { errors, warnings, isValid: false };
	}

	requiredThemeDirs.forEach((dir) => {
		const fullPath = path.join(themeRoot, dir);
		if (!fs.existsSync(fullPath)) {
			errors.push(
				`Missing required theme directory: ${dir}\n` +
				`  Expected at: ${fullPath}\n` +
				`  This may indicate a corrupted theme installation.`
			);
		}
	});

	// Check user entry point exists
	const mainEntry = path.join(projectRoot, scriptsPath, 'main.js');
	if (!fs.existsSync(mainEntry)) {
		warnings.push(
			`No entry point found at ${scriptsPath}/main.js\n` +
			`  Create this file to add site-specific JavaScript.\n` +
			`  Example:\n` +
			`    // ${scriptsPath}/main.js\n` +
			`    console.log('Site loaded');\n`
		);
	}

	// Check for deprecated patterns
	const deprecatedFiles = [
		{
			path: path.join(projectRoot, 'theme.config.mjs'),
			message:
				`Found deprecated theme.config.mjs\n` +
				`  This file is no longer needed in v2.\n` +
				`  Theme metadata is now self-describing.\n` +
				`  You can safely delete this file.`,
		},
		{
			path: path.join(projectRoot, 'theme.config.js'),
			message:
				`Found deprecated theme.config.js\n` +
				`  This file is no longer needed in v2.\n` +
				`  You can safely delete this file.`,
		},
	];

	deprecatedFiles.forEach(({ path: filePath, message }) => {
		if (fs.existsSync(filePath)) {
			warnings.push(message);
		}
	});

	// Check for old-style manual theme imports in main.js
	if (fs.existsSync(mainEntry)) {
		const mainContent = fs.readFileSync(mainEntry, 'utf-8');
		const hasManualImport =
			mainContent.includes(`import '${metadata.name}/styles`) ||
			mainContent.includes(`import '${metadata.name}/scripts`) ||
			mainContent.includes(`import 'eleventy-base-blog-template/styles`) ||
			mainContent.includes(`import 'eleventy-base-blog-template/scripts`);

		if (hasManualImport) {
			warnings.push(
				`Found manual theme imports in ${scriptsPath}/main.js\n` +
				`  Theme v2 auto-imports styles and scripts.\n` +
				`  You can remove these import statements:\n` +
				`    - import '${metadata.name}/styles/...';\n` +
				`    - import '${metadata.name}/scripts/...';\n` +
				`  They are now automatically included by the build system.`
			);
		}
	}

	// Check layouts directory exists (optional but recommended)
	const userLayoutsPath = path.join(projectRoot, layoutsPath);
	if (!fs.existsSync(userLayoutsPath)) {
		warnings.push(
			`No layouts directory found at ${layoutsPath}/\n` +
			`  Create this directory to override or extend theme layouts.\n` +
			`  Example:\n` +
			`    ${layoutsPath}/post.njk - Override theme's post layout\n` +
			`    {% extends "@theme/layouts/base.njk" %} - Extend theme's base layout`
		);
	}

	// Validate Nunjucks dependency (peer dependency)
	const nunjucksPath = path.join(projectRoot, 'node_modules', 'nunjucks');
	if (!fs.existsSync(nunjucksPath)) {
		errors.push(
			`Nunjucks not found. This is a required peer dependency.\n` +
			`  Install it with: npm install nunjucks`
		);
	}

	return {
		errors,
		warnings,
		isValid: errors.length === 0,
	};
}

/**
 * Log validation results in a friendly format
 *
 * @param {Object} validation - Result from validateTheme()
 * @param {Object} options - Logging options
 * @param {boolean} options.exitOnError - Exit process if validation fails (default: false)
 * @returns {void}
 */
export function logValidation(validation, options = {}) {
	const { exitOnError = false } = options;

	if (validation.errors.length > 0) {
		console.error('\n❌ Theme Validation Errors:\n');
		validation.errors.forEach((error, i) => {
			console.error(`${i + 1}. ${error}\n`);
		});

		if (exitOnError) {
			process.exit(1);
		}
	}

	if (validation.warnings.length > 0) {
		console.warn('\n⚠️  Theme Validation Warnings:\n');
		validation.warnings.forEach((warning, i) => {
			console.warn(`${i + 1}. ${warning}\n`);
		});
	}

	if (validation.isValid && validation.warnings.length === 0) {
		console.log('✅ Theme validation passed!');
	}
}

/**
 * Validate a specific component exists
 *
 * @param {string} type - Component type ('layout', 'bundle', 'data')
 * @param {string} name - Component name
 * @param {string} projectRoot - Project root path
 * @param {Object} overridePaths - Override paths configuration
 * @returns {Object} { exists, path, source } or { exists: false }
 */
export function validateComponent(type, name, projectRoot, overridePaths = {}) {
	const layoutsPath = overridePaths.layouts || metadata.defaultOverridePaths.layouts;
	const bundlesPath = overridePaths.bundles || metadata.defaultOverridePaths.bundles;
	const dataPath = overridePaths.data || metadata.defaultOverridePaths.data;

	const themeRoot = path.join(projectRoot, 'node_modules', metadata.name);

	switch (type) {
		case 'layout': {
			// Check user first
			const userPath = path.join(projectRoot, layoutsPath, `${name}.njk`);
			if (fs.existsSync(userPath)) {
				return { exists: true, path: userPath, source: 'user' };
			}

			// Check theme
			const themePath = path.join(themeRoot, 'layouts', `${name}.njk`);
			if (fs.existsSync(themePath)) {
				return { exists: true, path: themePath, source: 'theme' };
			}

			return { exists: false };
		}

		case 'bundle': {
			// Check user first
			const userPath = path.join(projectRoot, bundlesPath, `${name}.js`);
			if (fs.existsSync(userPath)) {
				return { exists: true, path: userPath, source: 'user' };
			}

			// Check theme
			const themePath = path.join(themeRoot, 'bundles', `${name}.js`);
			if (fs.existsSync(themePath)) {
				return { exists: true, path: themePath, source: 'theme' };
			}

			return { exists: false };
		}

		case 'data': {
			// Check user first
			const userPath = path.join(projectRoot, dataPath, name);
			if (fs.existsSync(userPath)) {
				return { exists: true, path: userPath, source: 'user' };
			}

			// Check theme
			const themePath = path.join(themeRoot, 'data', name);
			if (fs.existsSync(themePath)) {
				return { exists: true, path: themePath, source: 'theme' };
			}

			return { exists: false };
		}

		default:
			return { exists: false };
	}
}
