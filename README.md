# Eleventy Base Blog Template

A **convention-based Eleventy theme** with self-describing metadata, `@theme` alias, auto-import, and extensible bundles.

**Version 2.0.0** - Complete rewrite with modern architecture

## Features

✨ **Self-Describing** - Theme exports its own metadata, no manual configuration needed
🎨 **@theme Alias** - Clean imports in layouts, scripts, and styles
⚡ **Auto-Import** - No manual theme imports, build system handles it
🧩 **Extensible Bundles** - Use as-is, customize, or completely replace
🎯 **Configurable Paths** - Content repo controls its own structure
📦 **Cascade System** - User always wins (layouts, data, assets, bundles)
🔍 **Smart Validation** - Helpful errors with suggested fixes
🎨 **CSS Custom Properties** - 17+ variables per bundle for easy theming

---

## Installation

```bash
npm install eleventy-base-blog-template
```

**Peer Dependencies** (install these too):
```bash
npm install @11ty/eleventy @11ty/eleventy-plugin-vite vite sass-embedded nunjucks luxon
```

---

## Quick Start

### 1. Initialize Theme

**File:** `eleventy.config.mjs`

```javascript
import path from 'path';
import { fileURLToPath } from 'url';
import EleventyVitePlugin from '@11ty/eleventy-plugin-vite';

import theme, {
  getThemeViteConfig,
  getPageBundleEntries,
  configurePassthroughCopy,
} from 'eleventy-base-blog-template';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function (eleventyConfig) {
  // Initialize theme
  theme.init(eleventyConfig, {
    projectRoot: __dirname,
  });

  // Configure static assets
  configurePassthroughCopy(eleventyConfig, __dirname);

  // Configure Vite
  eleventyConfig.addPlugin(EleventyVitePlugin, {
    viteOptions: getThemeViteConfig(__dirname, {
      build: {
        rollupOptions: {
          input: getPageBundleEntries(__dirname),
        },
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

### 2. Create Entry Point

**File:** `overrides/scripts/main.js`

```javascript
// No imports needed! Theme assets auto-imported.

console.log('Site loaded');
```

### 3. Create Content

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
├── eleventy.config.mjs    # Theme configuration
├── content/               # Your content
│   ├── index.md
│   ├── posts/
│   └── _data/
│       └── site.js       # Override theme defaults
├── overrides/            # Customizations
│   ├── layouts/          # Override/extend theme layouts
│   ├── bundles/          # Custom bundles
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
| Bundles | `overrides/bundles/` | `bundles/` | User |
| Data | `content/_data/` | `data/` | User |
| Assets | `public/` | `public/` | User |

### 2. @theme Alias

Reference theme files explicitly using `@theme/`:

**Nunjucks:**
```nunjucks
{% extends "@theme/layouts/base.njk" %}
```

**JavaScript:**
```javascript
import { init } from '@theme/bundles/code-highlighting.js';
```

**SCSS:**
```scss
@use '@theme/styles/variables';
```

### 3. Auto-Import

Theme styles and scripts are **automatically imported** into your main entry point. No manual imports needed!

**Your file:**
```javascript
// overrides/scripts/main.js
console.log('My code');
```

**Vite transforms to:**
```javascript
// Auto-imported by theme
import 'eleventy-base-blog-template/styles/main.scss';
import 'eleventy-base-blog-template/scripts/main.js';

console.log('My code');
```

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

## Bundles

Bundles are **optional JavaScript features** loaded per-page via front matter.

### Using Theme Bundles

**Zero-config** - just add to front matter:

```yaml
---
title: My Post
pageBundle: code-highlighting.auto
---
```

**With customization:**

**File:** `overrides/bundles/code-highlighting.js`
```javascript
import { init, defaultConfig } from '@theme/bundles/code-highlighting.js';

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
pageBundle: code-highlighting
---
```

### Creating Custom Bundles

**File:** `overrides/bundles/my-feature.js`
```javascript
console.log('My custom bundle');

export function init() {
  // Your code
}

init();
```

**Front matter:**
```yaml
---
pageBundle: my-feature
---
```

### Available Theme Bundles

- **code-highlighting** - Copy button, line numbers, syntax highlighting support

---

## API Reference

### theme.init(eleventyConfig, options)

Initialize the theme with Eleventy config.

**Parameters:**
- `eleventyConfig` (Object) - Eleventy configuration object
- `options` (Object) - Configuration options
  - `projectRoot` (string) - Path to content repo root (default: `process.cwd()`)
  - `overridePaths` (Object) - Custom paths for content repo files
    - `layouts` (string) - User layouts path (default: `'overrides/layouts'`)
    - `bundles` (string) - User bundles path (default: `'overrides/bundles'`)
    - `scripts` (string) - User scripts path (default: `'overrides/scripts'`)
    - `styles` (string) - User styles path (default: `'overrides/styles'`)
    - `data` (string) - User data path (default: `'content/_data'`)
    - `public` (string) - User public assets path (default: `'public'`)
  - `filters` (Object) - Custom Nunjucks filters (merged with theme, user wins)
  - `shortcodes` (Object) - Custom Nunjucks shortcodes (merged with theme, user wins)
  - `transforms` (Object) - Custom Eleventy transforms (merged with theme, user wins)

**Example:**
```javascript
theme.init(eleventyConfig, {
  projectRoot: __dirname,
  overridePaths: {
    layouts: 'src/layouts',
    scripts: 'src/scripts',
  },
  filters: {
    myFilter: (value) => value.toUpperCase(),
  },
});
```

### getThemeViteConfig(projectRoot, userOptions)

Get Vite configuration with theme integration.

**Parameters:**
- `projectRoot` (string) - Project root path
- `userOptions` (Object) - User Vite config (merged with theme defaults)

**Returns:** Vite configuration object

**Example:**
```javascript
const viteConfig = getThemeViteConfig(__dirname, {
  build: {
    rollupOptions: {
      input: getPageBundleEntries(__dirname),
    },
  },
});
```

### getPageBundleEntries(projectRoot, overridePaths)

Get Vite entry points for all bundles (main + discovered bundles).

**Parameters:**
- `projectRoot` (string) - Project root path
- `overridePaths` (Object) - Override paths configuration

**Returns:** Object mapping bundle names to file paths

**Example:**
```javascript
const entries = getPageBundleEntries(__dirname);
// { main: '/path/to/main.js', 'code-highlighting': '/path/to/bundle.js' }
```

### configurePassthroughCopy(eleventyConfig, projectRoot, overridePaths)

Configure Eleventy passthrough copy with cascade (user overrides theme).

**Parameters:**
- `eleventyConfig` (Object) - Eleventy configuration
- `projectRoot` (string) - Project root path
- `overridePaths` (Object) - Override paths configuration

**Example:**
```javascript
configurePassthroughCopy(eleventyConfig, __dirname);
```

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

### "Bundle X not found"

**Problem:** Front matter references non-existent bundle

**Solution:**
- Check spelling: `code-highlighting.auto` (include `.auto` for zero-config)
- Create the bundle in `overrides/bundles/X.js`
- See available bundles: check theme's `bundles/` directory

### Theme styles not loading

**Problem:** Manual imports in main.js conflicting with auto-import

**Solution:** Remove these lines from `overrides/scripts/main.js`:
```javascript
// ❌ Remove these
import 'eleventy-base-blog-template/styles/main.scss';
import 'eleventy-base-blog-template/scripts/main.js';
```

Theme v2 auto-imports these automatically.

---

## Migration from v1

See [MIGRATION.md](./MIGRATION.md) for detailed upgrade instructions.

**TL;DR:**
- ✅ `initTheme()` → `theme.init()`
- ✅ Remove manual theme imports from main.js
- ✅ Update layout extends to use `@theme/` prefix
- ✅ Delete `theme.config.mjs` (no longer needed)

---

## License

MIT © Artis Lismanis

---

## Contributing

Issues and PRs welcome at [github.com/artislismanis/eleventy-base-blog-template](https://github.com/artislismanis/eleventy-base-blog-template)
