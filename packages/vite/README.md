# @eleventy-themes/vite

Vite integration with production optimizations for Eleventy themes.

## Features

- **PurgeCSS** - Remove unused CSS
- **Critical CSS** - Inline critical CSS, async load rest (Critters)
- **HTML Minification** - Minify HTML output
- **Link Validation** - Validate internal links
- **Non-HTML Preservation** - Preserve non-HTML files during build
- **Flexible Usage** - Use built-in tools or swap with custom implementations

## Installation

```bash
npm install -D @eleventy-themes/vite
```

**Optional peer dependencies** (install what you need):
```bash
npm install -D purgecss critters html-minifier-terser node-html-parser glob
```

## Usage

### Option 1: Convenience Config

Use `createThemeViteConfig()` with boolean flags:

```js
// eleventy.config.js
import { EleventyVitePlugin } from '@11ty/eleventy-plugin-vite';
import { createThemeViteConfig } from '@eleventy-themes/vite';

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(EleventyVitePlugin, {
    viteOptions: createThemeViteConfig({
      optimizations: {
        purgeCSS: true,      // Use built-in PurgeCSS
        criticalCSS: true,   // Use built-in Critters
        minifyHTML: true,    // Use built-in minifier
        validateLinks: true, // Use built-in validator
        preserveNonHtml: true,
      },
      dirs: {
        temp: '.11ty-vite',
        output: '_site',
      },
    }),
  });
}
```

### Option 2: Custom Implementations

Pass functions to use your own tools:

```js
import { createThemeViteConfig } from '@eleventy-themes/vite';
import myCustomPurge from './my-purge.js';

eleventyConfig.addPlugin(EleventyVitePlugin, {
  viteOptions: createThemeViteConfig({
    optimizations: {
      purgeCSS: async () => {
        await myCustomPurge();
      },
      criticalCSS: false,  // Skip this optimization
      minifyHTML: true,    // Use built-in
    },
  }),
});
```

### Option 3: Cherry-Pick Plugins

Import and use individual plugins:

```js
import { purgeCSSFiles, generateCriticalCSS } from '@eleventy-themes/vite';

export default {
  plugins: [
    {
      name: 'my-optimizations',
      apply: 'build',
      async closeBundle() {
        await purgeCSSFiles('_site');
        await generateCriticalCSS('_site');
      },
    },
  ],
};
```

## API

### `createThemeViteConfig(options)`

Create Vite config with theme optimizations.

**Parameters:**
- `options` (Object) - Configuration options
  - `optimizations` (Object) - Optimization settings
    - `purgeCSS` (boolean | function) - PurgeCSS configuration
    - `criticalCSS` (boolean | function) - Critical CSS configuration
    - `minifyHTML` (boolean | function) - HTML minification configuration
    - `validateLinks` (boolean | function) - Link validation configuration
    - `preserveNonHtml` (boolean | function) - Non-HTML preservation configuration
  - `dirs` (Object) - Directory configuration
    - `temp` (string) - Temp directory (default: '.11ty-vite')
    - `output` (string) - Output directory (default: '_site')
  - `plugins` (Array) - Additional Vite plugins
  - `...userConfig` - Any other Vite config options

**Returns:** Object - Vite configuration

### Individual Plugins

#### `purgeCSSFiles(outputDir, options)`

Remove unused CSS from all CSS files in output directory.

**Parameters:**
- `outputDir` (string) - Output directory path
- `options` (Object) - PurgeCSS options (optional)

#### `generateCriticalCSS(outputDir, options)`

Generate and inline critical CSS using Critters.

**Parameters:**
- `outputDir` (string) - Output directory path
- `options` (Object) - Critters options (optional)

#### `minifyHTML(outputDir, options)`

Minify all HTML files in output directory.

**Parameters:**
- `outputDir` (string) - Output directory path
- `options` (Object) - html-minifier-terser options (optional)

#### `validateLinks(outputDir, options)`

Validate internal links in HTML files.

**Parameters:**
- `outputDir` (string) - Output directory path
- `options` (Object) - Validation options (optional)
  - `throwOnError` (boolean) - Throw if broken links found

#### `validateLinksOrThrow(outputDir, options)`

Same as `validateLinks` but always throws on broken links.

#### `preserveNonHtmlFiles(tempDir, outputDir, options)`

Preserve non-HTML files from temp to output directory.

**Parameters:**
- `tempDir` (string) - Temp directory path
- `outputDir` (string) - Output directory path
- `options` (Object) - Options (optional)

## Philosophy

**Opinionated defaults, full flexibility.** You can:

1. Use built-in tools (pass `true`)
2. Swap with custom implementation (pass `function`)
3. Cherry-pick individual plugins
4. Skip entirely and roll your own

**Graceful degradation.** Optional peer dependencies allow you to install only what you need. If a peer dependency is missing, the plugin will warn but not fail.

## Dependencies

All optimization dependencies are **optional peer dependencies**:

- `purgecss` - For PurgeCSS functionality
- `critters` - For Critical CSS functionality
- `html-minifier-terser` - For HTML minification
- `node-html-parser` - For link validation
- `glob` - For file discovery

Install only what you need!

## License

MIT
