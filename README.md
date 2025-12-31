# Eleventy Themes

An opinionated, build-agnostic theming system for Eleventy with self-describing metadata and extensible features.

## Packages

This monorepo contains three packages:

### [@eleventy-themes/core](./packages/core)

Build-agnostic cascade system for Eleventy themes. Provides template loading, data cascade, static asset cascade, and theme validation. Works with any build tool or no build tool at all.

**Use when:** You want the cascade/override system but plan to use your own build tools.

### [@eleventy-themes/vite](./packages/vite)

Vite integration with production optimizations (PurgeCSS, Critical CSS, HTML minification, link validation). Provides both a convenience config helper and individual plugins for cherry-picking.

**Use when:** You want opinionated production optimizations with Vite.

### [@eleventy-themes/base-blog](./packages/base-blog)

A complete blog theme built on `@eleventy-themes/core`. Demonstrates the cascade system, features, and best practices. Ready to use out of the box.

**Use when:** You want a working blog theme that you can customize.

## Quick Start

### Option 1: Minimal (Core Only)

```bash
npm install @eleventy-themes/core @eleventy-themes/base-blog
```

```js
// eleventy.config.js
import { plugin as baseBlogTheme } from '@eleventy-themes/base-blog';

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(baseBlogTheme);
}
```

### Option 2: With Vite Optimizations

```bash
npm install -D @eleventy-themes/core @eleventy-themes/vite @eleventy-themes/base-blog
npm install -D @11ty/eleventy-plugin-vite vite
```

```js
// eleventy.config.js
import { plugin as baseBlogTheme } from '@eleventy-themes/base-blog';
import { EleventyVitePlugin } from '@11ty/eleventy-plugin-vite';
import { createThemeViteConfig } from '@eleventy-themes/vite';

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(baseBlogTheme);

  eleventyConfig.addPlugin(EleventyVitePlugin, {
    viteOptions: createThemeViteConfig({
      optimizations: {
        purgeCSS: true,
        criticalCSS: true,
        minifyHTML: true,
        validateLinks: true,
      },
    }),
  });
}
```

## Philosophy

**Opinionated and good.** This system is built for what works, not to support every possible use case. It provides:

- **Convention over configuration** - Sensible defaults, minimal setup
- **Self-describing metadata** - Themes export their structure as data
- **Cascade/override system** - User files override theme files (user-first)
- **Colocated features** - Self-contained feature folders with JS, styles, and assets
- **Build-agnostic core** - Works with or without build tools
- **Optional optimizations** - Production plugins when you want them

## Architecture

Three-tier system:

1. **@eleventy-themes/core** - Build-agnostic cascade system
   - Template loading with `@theme` alias
   - Data cascade (theme defaults + user overrides)
   - Static assets cascade
   - Theme validation

2. **@eleventy-themes/vite** - Optional build integration
   - Production optimizations (PurgeCSS, Critical CSS, minification)
   - Individual plugins or convenience config
   - Graceful degradation for optional dependencies

3. **Theme packages** (like base-blog) - Design and content structure
   - Use `@eleventy-themes/core` for cascade system
   - Provide layouts, styles, scripts, features
   - Export self-describing metadata

## Flexibility

Choose your level:

- **Minimal:** Use core + theme, skip build optimizations
- **Convenience:** Use `createThemeViteConfig()` with boolean flags
- **Custom:** Use individual plugins from `@eleventy-themes/vite`
- **Roll your own:** Use only `@eleventy-themes/core` and build your own tools

## Development

```bash
# Install dependencies for all packages
npm install

# Run tests (when implemented)
npm test

# Build all packages (when build steps added)
npm run build
```

## Documentation

- [Core Package](./packages/core/README.md)
- [Vite Package](./packages/vite/README.md)
- [Base Blog Theme](./packages/base-blog/README.md)

## License

MIT
