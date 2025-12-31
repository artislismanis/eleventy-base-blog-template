# Theme Library Organization

This directory contains the theme's implementation, organized by responsibility:

## Directory Structure

```
lib/
├── cascade/            # Cascade/override system
├── eleventy/           # Eleventy-specific features
├── build/              # Build tool integration
├── utils/              # General utilities
├── index.mjs           # Main entry point (manual API)
├── plugin.mjs          # Plugin API (recommended)
└── metadata.mjs        # Runtime metadata
```

## Modules by Directory

### cascade/ - Cascade Resolution System

Core system for resolving resources with user-first priority:

- **index.mjs** - Unified cascade API (`configureCascade()`)
- **resolver.mjs** - Shared path resolution utilities (eliminates duplication)
- **data.mjs** - Data file cascade (`configureDataCascade()`)
- **bundles.mjs** - Bundle cascade (`resolveBundlePath()`)
- **assets.mjs** - Static asset cascade (`configurePassthroughCopy()`)

### eleventy/ - Eleventy-Specific Features

Template engine integration and Eleventy features:

- **filters.mjs** - Template filters (date formatting, sorting, etc.)
- **shortcodes.mjs** - Template shortcodes (year, image, etc.)
- **transforms.mjs** - Output transforms
- **template-loader.mjs** - Custom Nunjucks loader with `@theme` alias support

### build/ - Build Tool Integration

Integration with Vite and bundle system:

- **vite.mjs** - Vite configuration with `@theme` alias and auto-import
- **bundle-entries.mjs** - Bundle entry point resolution for Rollup

### utils/ - Utilities

General utilities:

- **validate.mjs** - Theme installation and configuration validation

## Entry Points

### plugin.mjs (Recommended)

Theme as Eleventy plugin - simplest setup:

```javascript
import theme from 'eleventy-base-blog-template';

eleventyConfig.addPlugin(theme.plugin, {
  importMetaUrl: import.meta.url,
});
```

### index.mjs (Manual API)

Manual initialization for advanced use cases:

```javascript
import theme from 'eleventy-base-blog-template';

theme.init(eleventyConfig, {
  projectRoot: __dirname,
  overridePaths: { /* custom paths */ },
});
```

## metadata.mjs

Single source of truth for theme structure. Separate file to prevent circular dependencies.

Defines:
- Theme name and version
- Internal directory structure
- Default override paths
- Available layouts and bundles
- Asset entry points

## Design Principles

### Separation of Concerns

Each directory has a clear responsibility:

- **cascade/** - "How do we resolve resources?" (framework-level)
- **eleventy/** - "What features does Eleventy need?" (integration)
- **build/** - "How do we build assets?" (tooling)
- **utils/** - "What helpers do we need?" (utilities)

### DRY (Don't Repeat Yourself)

The `cascade/resolver.mjs` module provides shared utilities used by all cascade modules, eliminating 125+ lines of duplication.

### Future Extraction

The cascade system is architected to be extracted into `@eleventy-themes/core` package for reuse across multiple themes.

## Import Patterns

### For Theme Developers

```javascript
// Use unified API
import { configureCascade } from './cascade/index.mjs';

// Or import specific modules
import { configureDataCascade } from './cascade/data.mjs';
import { resolveBundlePath } from './cascade/bundles.mjs';
```

### For Content Repos

```javascript
// Recommended: Plugin API
import theme from 'eleventy-base-blog-template';
eleventyConfig.addPlugin(theme.plugin, { importMetaUrl: import.meta.url });

// Advanced: Granular imports
import { getThemeViteConfig, getPageBundleEntries } from 'eleventy-base-blog-template';
```

## See Also

- [THEME_SPEC.md](../THEME_SPEC.md) - Theme specification compliance
- [API_COMPARISON.md](../API_COMPARISON.md) - API design decisions
- [ARCHITECTURE_DECISION.md](../ARCHITECTURE_DECISION.md) - Architectural analysis
