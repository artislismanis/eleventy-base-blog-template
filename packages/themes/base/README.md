# @eleventy-themes/base-blog

A complete blog theme built on `@eleventy-themes/core` with self-describing metadata, cascade system, and extensible features.

**Version 2.0.0** - Convention-based architecture with monorepo structure

## Features

- **Self-Describing** - Theme exports its own metadata
- **@theme Alias** - Clean imports in layouts and scripts
- **Cascade System** - User files override theme files
- **Extensible Features** - Self-contained feature folders
- **Configurable Paths** - Content repo controls structure
- **Smart Validation** - Helpful errors with suggested fixes
- **CSS Custom Properties** - Easy theming via CSS variables

Built on **@eleventy-themes/core** for build-agnostic cascade resolution.

## Installation

```bash
npm install @eleventy-themes/core @eleventy-themes/base-blog
```

**Optional:** Install `@eleventy-themes/vite` for production optimizations:
```bash
npm install -D @eleventy-themes/vite
```

**Peer Dependencies:**
```bash
npm install @11ty/eleventy luxon
```

## Quick Start

### Minimal Setup (No Build Optimizations)

**File:** `eleventy.config.js`

```javascript
import { plugin as baseBlogTheme } from '@eleventy-themes/base-blog';

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(baseBlogTheme);

  return {
    dir: {
      input: 'content',
      output: '_site',
    },
  };
}
```

### With Vite Optimizations

**File:** `eleventy.config.js`

```javascript
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
      },
    }),
  });

  return {
    dir: {
      input: 'content',
      output: '_site',
    },
  };
}
```

### Create Content

**File:** `content/index.md`

```markdown
---
layout: home
title: My Blog
---

# Welcome!
```

### 4. Run

```bash
npm run dev
```

✅ **That's it!** You now have a working site.

---

## Project Structure

```
your-project/
├── eleventy.config.js     # Theme configuration
├── content/               # Your content
│   ├── index.md
│   ├── posts/
│   └── _data/
│       └── site.js       # Override theme defaults
├── overrides/            # Customizations
│   ├── layouts/          # Override/extend theme layouts
│   ├── features/         # Custom features
│   ├── scripts/          # Your JavaScript
│   └── styles/           # Your styles
└── public/               # Static assets (favicon, etc.)
```

---

## Core Concepts

### 1. Cascade Resolution

**User always wins.** For every resource type, user files take precedence:

| Resource | User Path | Theme Path | Winner |
|----------|-----------|------------|--------|
| Layouts | `overrides/layouts/` | `layouts/` | User |
| Features | `overrides/features/` | `features/` | User |
| Data | `content/_data/` | `data/` | User |
| Assets | `public/` | `public/` | User |

### 2. @theme Alias

**In Nunjucks templates** (works without build tools):

The `@theme` alias works automatically via `@eleventy-themes/core`:

```nunjucks
{% extends "@theme/layouts/base.njk" %}
```

**In JavaScript/SCSS** (requires build tool with alias support):

With Vite or another build tool configured with alias resolution:

```javascript
// With @eleventy-themes/vite or custom alias config
import { init } from '@theme/features/code-highlighting/index.js';
```

```scss
@use '@theme/styles/variables';
```

Without a build tool, use the package name directly:

```javascript
// Build-agnostic approach
import { init } from '@eleventy-themes/base-blog/features/code-highlighting/index.js';
```

### 3. Features

Features are self-contained, optional functionality modules. Each feature lives in its own folder with JavaScript, styles, and assets colocated.

---

## Customization

### Override Layouts

**Replace** a theme layout by creating a file with the same name:

**File:** `overrides/layouts/post.njk`
```nunjucks
{# Completely replaces theme's post.njk #}
<article>
  <h1>{{ title }}</h1>
  {{ content | safe }}
</article>
```

**Extend** a theme layout using `@theme`:

**File:** `overrides/layouts/custom.njk`
```nunjucks
{% extends "@theme/layouts/base.njk" %}

{% block content %}
  <div class="custom">
    {{ content | safe }}
  </div>
{% endblock %}
```

### Override Data

Create a file with the same name in `content/_data/`:

**File:** `content/_data/site.js`
```javascript
export default {
  title: 'My Awesome Blog',
  description: 'Thoughts on web development',
  url: 'https://myblog.com',
  language: 'en',
  author: {
    name: 'Your Name',
    email: 'you@example.com',
  },
};
```

This **completely replaces** the theme's `data/site.js`.

### Override Static Assets

Place a file with the same name in `public/`:

```
public/
├── favicon.svg       # Overrides theme's favicon
└── logo.png          # Your custom asset
```

### CSS Custom Properties

Override theme variables in your styles:

**File:** `overrides/styles/custom.scss`
```scss
:root {
  // Override code highlighting
  --code-bg: #2d2d2d;
  --code-fg: #f8f8f2;
  --code-copy-button-bg: rgba(139, 233, 253, 0.2);
}
```

See [CSS Custom Properties](#css-custom-properties-reference) for full list.

---

## Features

Features are **optional functionality modules** that can be loaded per-page via front matter. Each feature is self-contained in its own folder.

### Using Theme Features

**Zero-config** - just add to front matter:

```yaml
---
title: My Post
pageFeature: code-highlighting.auto
---
```

**With customization:**

**File:** `overrides/features/code-highlighting/index.js`
```javascript
// Build-agnostic approach
import { init, defaultConfig } from '@eleventy-themes/base-blog/features/code-highlighting/index.js';

// Or with build tool alias support (Vite, etc.)
// import { init, defaultConfig } from '@theme/features/code-highlighting/index.js';

init({
  ...defaultConfig,
  lineNumbers: true,
  onCopy: (text) => {
    console.log('Code copied!');
  },
});
```

**Front matter:**
```yaml
---
pageFeature: code-highlighting
---
```

### Creating Custom Features

**File:** `overrides/features/my-feature/index.js`
```javascript
console.log('My custom feature');

export function init() {
  // Your code
}

init();
```

**Front matter:**
```yaml
---
pageFeature: my-feature
---
```

### Available Theme Features

- **code-highlighting** - Copy button, line numbers, syntax highlighting support

---

## API

### Plugin Export

The main export is an Eleventy plugin created using `@eleventy-themes/core`:

```javascript
import { plugin as baseBlogTheme } from '@eleventy-themes/base-blog';

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(baseBlogTheme);
}
```

### Additional Exports

```javascript
import {
  plugin,      // Eleventy plugin
  metadata,    // Theme metadata from theme.json
  filters,     // Nunjucks filters
  shortcodes,  // Nunjucks shortcodes
  transforms,  // Eleventy transforms
} from '@eleventy-themes/base-blog';
```

### Theme Metadata

Access theme metadata programmatically:

```javascript
import { metadata } from '@eleventy-themes/base-blog';

console.log(metadata.name);     // '@eleventy-themes/base-blog'
console.log(metadata.version);  // '2.0.0'
console.log(metadata.paths);    // Theme paths configuration
```

For detailed cascade API documentation, see [@eleventy-themes/core](../core/README.md).

---

## CSS Custom Properties Reference

### Code Highlighting Bundle

```css
:root {
  /* Colors */
  --code-bg: #1e1e1e;
  --code-fg: #d4d4d4;

  /* Typography */
  --code-font-family: 'Fira Code', 'Consolas', monospace;
  --code-font-size: 0.875rem;
  --code-line-height: 1.6;

  /* Spacing & Shape */
  --code-border-radius: 0.5rem;
  --code-padding: 1rem;
  --code-margin: 1.5rem 0;

  /* Copy Button */
  --code-copy-button-bg: rgba(255, 255, 255, 0.1);
  --code-copy-button-fg: #fff;
  --code-copy-button-hover-bg: rgba(255, 255, 255, 0.2);
  --code-copy-button-padding: 0.375rem 0.75rem;
  --code-copy-button-font-size: 0.75rem;

  /* Line Numbers */
  --code-line-number-fg: rgba(255, 255, 255, 0.3);
  --code-line-number-width: 3rem;

  /* Scrollbar */
  --code-scrollbar-height: 8px;
  --code-scrollbar-thumb-bg: rgba(255, 255, 255, 0.2);
}
```

---

## Advanced Configuration

### Custom Override Paths

If your content repo has a different structure:

```javascript
theme.init(eleventyConfig, {
  projectRoot: __dirname,
  overridePaths: {
    layouts: 'src/layouts',
    bundles: 'src/bundles',
    scripts: 'src/scripts',
    styles: 'src/styles',
    data: 'content/_data',
    public: 'public',
  },
});
```

The theme will look for files in your custom locations.

### Using Without Vite

You can use the theme without Vite by manually configuring Eleventy:

```javascript
import theme from 'eleventy-base-blog-template';

export default function(eleventyConfig) {
  theme.init(eleventyConfig, { projectRoot: __dirname });

  // Manual passthrough
  eleventyConfig.addPassthroughCopy('public');

  // Your build setup...
}
```

**Note:** You'll lose auto-import and bundle features.

---

## Troubleshooting

### "Theme package not found"

**Problem:** Can't find theme in node_modules

**Solution:**
```bash
npm install eleventy-base-blog-template
```

### "No entry point found at overrides/scripts/main.js"

**Problem:** Missing user entry point (warning, not error)

**Solution:** Create the file:
```bash
mkdir -p overrides/scripts
echo "console.log('Site loaded');" > overrides/scripts/main.js
```

### "Feature X not found"

**Problem:** Front matter references non-existent feature

**Solution:**
- Check spelling: `code-highlighting.auto` (include `.auto` for zero-config)
- Create the feature in `overrides/features/X/index.js`
- See available features: check theme's `features/` directory

---

## Migration from v1

See [MIGRATION.md](./MIGRATION.md) for detailed upgrade instructions.

**Key Changes:**
- Package renamed: `eleventy-base-blog-template` → `@eleventy-themes/base-blog`
- Now uses `@eleventy-themes/core` for cascade system
- Simpler plugin-based API
- Bundles → Features (colocated structure)
- Build optimizations moved to `@eleventy-themes/vite`

## Related Packages

- [@eleventy-themes/core](../core/README.md) - Build-agnostic cascade system
- [@eleventy-themes/vite](../vite/README.md) - Vite production optimizations

## License

MIT
