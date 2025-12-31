# Theme Specification Compliance

This document describes how `eleventy-base-blog-template` v2.0.0 complies with the proposed Eleventy theme specification.

## Overview

This theme implements a complete theming system for Eleventy that includes:

- **Self-describing metadata** via `theme.json`
- **Cascade/override system** for layouts, data, bundles, and assets
- **Plugin API** for simple integration
- **Convention-based structure** with configurable paths
- **Bundle system** for modular features
- **@theme alias** for clean imports in templates

## Specification File

The `theme.json` file serves as the single source of truth for theme metadata, structure, and capabilities. This enables:

1. **Discovery**: Tools can read what the theme provides
2. **Validation**: Content repos can verify they meet theme requirements
3. **Documentation**: Auto-generated docs from machine-readable spec
4. **Tooling**: CLI tools can scaffold projects based on theme structure

## Directory Structure

```
eleventy-base-blog-template/
├── theme.json              # Theme specification (NEW)
├── lib/                    # Theme implementation
│   ├── cascade/            # Cascade resolution system
│   │   ├── index.mjs       # Unified cascade API
│   │   ├── resolver.mjs    # Shared path resolution utilities
│   │   ├── data.mjs        # Data file cascade
│   │   ├── bundles.mjs     # Bundle cascade
│   │   └── assets.mjs      # Static asset cascade
│   ├── eleventy/           # Eleventy-specific features
│   │   ├── filters.mjs     # Template filters
│   │   ├── shortcodes.mjs  # Template shortcodes
│   │   ├── transforms.mjs  # Output transforms
│   │   └── template-loader.mjs  # Custom Nunjucks loader with @theme
│   ├── build/              # Build tool integration
│   │   ├── vite.mjs        # Vite configuration
│   │   └── bundle-entries.mjs  # Bundle entry point resolution
│   ├── utils/              # Utilities
│   │   └── validate.mjs    # Theme validation
│   ├── index.mjs           # Main entry point (manual API)
│   ├── plugin.mjs          # Plugin API (recommended)
│   └── metadata.mjs        # Runtime metadata
├── layouts/                # Theme layouts
│   ├── base.njk
│   ├── home.njk
│   ├── post.njk
│   └── partials/
├── styles/                 # Theme styles
│   ├── main.scss
│   └── bundles/
├── scripts/                # Theme scripts
│   └── main.js
├── bundles/                # Feature bundles
│   ├── code-highlighting.js
│   └── code-highlighting.auto.js
├── data/                   # Default data files
│   ├── navigation.js
│   └── site.js
└── public/                 # Static assets
    ├── favicon.svg
    └── robots.txt
```

## Theme API

### Recommended: Plugin API

The simplest way to use the theme:

```javascript
import theme from 'eleventy-base-blog-template';

export default function (eleventyConfig) {
  // Theme setup - one line
  eleventyConfig.addPlugin(theme.plugin, {
    importMetaUrl: import.meta.url,
  });

  // Your content repo configuration
  eleventyConfig.addCollection('posts', ...);

  return {
    dir: {
      input: 'content',
      output: '_site',
    },
  };
}
```

### Alternative: Manual API

For advanced use cases requiring more control:

```javascript
import theme from 'eleventy-base-blog-template';
import { getThemeViteConfig, getPageBundleEntries } from 'eleventy-base-blog-template';
import EleventyVitePlugin from '@11ty/eleventy-plugin-vite';

export default function (eleventyConfig) {
  // Manual theme initialization
  theme.init(eleventyConfig, {
    projectRoot: __dirname,
    overridePaths: {
      layouts: 'my-layouts',
      data: 'my-data',
    },
  });

  // Manual Vite setup
  eleventyConfig.addPlugin(EleventyVitePlugin, {
    viteOptions: getThemeViteConfig(__dirname, {
      build: {
        rollupOptions: {
          input: getPageBundleEntries(__dirname),
        },
      },
    }),
  });

  // Your configuration...
}
```

## Cascade System

The theme implements a **user-first cascade** where user files override theme files:

### Resolution Order

For each resource type (layouts, data, bundles, styles, scripts, assets):

1. **User override path** (highest priority)
2. **Theme package path** (fallback)

### Example: Data Cascade

```
Content Repo                  Theme Package
└── content/_data/            └── node_modules/eleventy-base-blog-template/
    └── site.js (WINS)            └── data/
                                      └── site.js (fallback)
```

If `content/_data/site.js` exists, it's used. Otherwise, the theme's `data/site.js` is used.

### Example: Layout Cascade

```
Content Repo                  Theme Package
└── overrides/layouts/        └── node_modules/eleventy-base-blog-template/
    └── base.njk (WINS)           └── layouts/
                                      └── base.njk (fallback)
```

### Configurable Override Paths

Default override paths:

```javascript
{
  layouts: 'overrides/layouts',
  bundles: 'overrides/bundles',
  styles: 'overrides/styles',
  scripts: 'overrides/scripts',
  data: 'content/_data',
  public: 'public',
}
```

Customize via plugin options:

```javascript
eleventyConfig.addPlugin(theme.plugin, {
  importMetaUrl: import.meta.url,
  overridePaths: {
    layouts: 'my-layouts',
    data: 'my-data',
    public: 'static',
  },
});
```

## Bundle System

Bundles are modular features that can be selectively enabled:

### Explicit Init Pattern

```javascript
// In your layout or data file
import initCodeHighlighting from '@theme/bundles/code-highlighting.js';

initCodeHighlighting(options);
```

### Auto-Init Pattern

```javascript
// Zero-config - runs automatically with defaults
import '@theme/bundles/code-highlighting.auto.js';
```

### Bundle Structure

Each bundle can provide:

- **JavaScript**: Client-side functionality
- **Styles**: SCSS files with CSS custom properties
- **Configuration**: Options for customization

Example from `theme.json`:

```json
{
  "name": "code-highlighting",
  "entry": "bundles/code-highlighting.js",
  "auto": "bundles/code-highlighting.auto.js",
  "styles": "styles/bundles/code-highlighting.scss",
  "cssVariables": [
    "--code-bg-color",
    "--code-text-color",
    "--code-border-radius"
  ]
}
```

## @theme Alias

Templates can reference theme resources using the `@theme` alias:

```njk
{# Extend theme layout #}
{% extends "@theme/layouts/base.njk" %}

{# Include theme partial #}
{% include "@theme/layouts/partials/header.njk" %}
```

This is implemented via a custom Nunjucks loader that resolves `@theme` to the theme package path.

## CSS Custom Properties

The theme exposes CSS custom properties for styling customization:

### Global Properties

```css
/* Typography */
--font-family-base
--font-family-heading
--font-family-mono
--font-size-base
--line-height-base

/* Colors */
--color-primary
--color-secondary
--color-background
--color-text
--color-link

/* Spacing */
--spacing-unit
--container-max-width
```

### Per-Bundle Properties

Each bundle can define its own CSS custom properties. Example for code-highlighting bundle:

```css
--code-bg-color
--code-text-color
--code-border-radius
--code-padding
--code-font-family
--code-font-size
--code-line-height
```

Override in your content repo's styles:

```css
:root {
  --code-bg-color: #1e1e1e;
  --code-text-color: #d4d4d4;
}
```

## Filters and Shortcodes

### Filters

Available via `theme.json`:

- `readableDate` - Format dates for display
- `htmlDateString` - Format dates for HTML datetime attributes
- `head` - Get first N items from array
- `min` - Get minimum value
- `sortAlphabetically` - Sort strings alphabetically
- `getAllTags` - Extract all tags from collections
- `filterTagList` - Filter out special tags

### Shortcodes

- `year` - Current year for copyright notices
- `image` - Responsive image helper

### Adding Custom Filters

```javascript
eleventyConfig.addPlugin(theme.plugin, {
  importMetaUrl: import.meta.url,
  filters: {
    uppercase: (str) => str.toUpperCase(),
  },
});
```

## Validation

The theme includes validation to ensure correct setup:

### Automatic Validation

On initialization, the theme validates:

1. Theme package is installed
2. Override paths are configured correctly
3. Required dependencies are present

### Manual Validation

```javascript
import { validateTheme, logValidation } from 'eleventy-base-blog-template';

const validation = validateTheme(projectRoot, overridePaths);
logValidation(validation, { exitOnError: true });
```

## Migration from Other Systems

### From Hugo

Hugo users will find familiar concepts:

- **Theme structure**: Similar layout organization
- **Cascade**: Hugo's theme layering → Our cascade system
- **Partials**: Hugo partials → Nunjucks includes with @theme
- **Shortcodes**: Direct equivalent

**Difference**: No separate `themes/` directory - theme is an npm package.

### From Jekyll

Jekyll users will recognize:

- **Gem-based distribution**: Jekyll themes as gems → npm packages
- **Override hierarchy**: Jekyll's override system → Our cascade
- **Data files**: `_data/` → `content/_data/`
- **Layouts**: Similar structure and usage

**Difference**: JavaScript ecosystem, Vite instead of Jekyll assets pipeline.

## Extending the Theme

### Override Layouts

Create `overrides/layouts/base.njk` in your content repo to completely replace the base layout.

### Extend Layouts

```njk
{# In your content repo #}
{% extends "@theme/layouts/base.njk" %}

{% block content %}
  <div class="custom-wrapper">
    {{ super() }}
  </div>
{% endblock %}
```

### Add Custom Bundles

1. Create `overrides/bundles/my-feature.js`
2. Reference in your layout:
   ```javascript
   import initMyFeature from '@theme/bundles/my-feature.js';
   initMyFeature();
   ```

### Override Data

Create `content/_data/navigation.js` to override theme's default navigation.

## Future: @eleventy-themes/core

This theme will serve as the reference implementation for extracting reusable cascade logic into `@eleventy-themes/core` package, allowing other themes to reuse the same cascade system.

**Benefits of extraction:**

- Multiple themes can share the same cascade logic
- Standardized behavior across theme ecosystem
- Easier testing and maintenance
- Clear separation between "theming framework" and "theme design"

## Compliance Summary

This theme complies with the proposed specification by providing:

- ✅ `theme.json` with complete metadata
- ✅ Plugin API for simple setup
- ✅ Cascade system for all resource types
- ✅ Configurable override paths
- ✅ Bundle system with explicit and auto-init patterns
- ✅ @theme alias for template imports
- ✅ CSS custom properties for styling
- ✅ Self-describing structure
- ✅ Validation tooling
- ✅ Clear documentation

## See Also

- [THEME_SYSTEM_PROPOSAL.md](./THEME_SYSTEM_PROPOSAL.md) - Complete proposal for theme framework
- [API_COMPARISON.md](./API_COMPARISON.md) - API design decisions
- [ARCHITECTURE_DECISION.md](./ARCHITECTURE_DECISION.md) - Architectural considerations
- [MIGRATION.md](./MIGRATION.md) - Migration guide from v1.x
