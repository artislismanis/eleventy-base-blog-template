# Eleventy Base Blog Template

A minimal, performant Eleventy blog theme with Vite integration, per-page CSS/JS bundles, and a flexible cascade override system.

## Features

- **Modern Build Pipeline**: Vite for fast development and optimized production builds
- **Per-Page Bundles**: Optional feature bundles (code highlighting, analytics, etc.) loaded only on pages that need them
- **Cascade Override System**: Override layouts, filters, shortcodes, or styles without modifying theme files
- **Performance Optimized**: Automatic PurgeCSS, critical CSS generation (optional), content hashing
- **Dark Mode Ready**: Built-in dark mode support using CSS custom properties
- **Accessibility First**: Semantic HTML, ARIA attributes, skip links, keyboard navigation
- **RSS Feed**: Built-in RSS/Atom feed support
- **Syntax Highlighting**: Prism.js integration for code blocks
- **SEO Friendly**: Sitemap, meta tags, semantic markup

## Installation

```bash
npm install github:artislismanis/eleventy-base-blog-template
```

## Quick Start

### 1. Directory Structure

Create this structure in your project:

```
your-blog/
├── content/                    # Your content
│   ├── posts/                 # Blog posts (Markdown)
│   ├── _data/                 # Site data (site.js)
│   ├── index.njk              # Homepage
│   └── blog.njk               # Blog index
├── overrides/                 # Your customizations (optional)
│   ├── layouts/               # Override theme layouts
│   ├── lib/                   # Custom filters/shortcodes
│   │   ├── filters.mjs
│   │   └── shortcodes.mjs
│   ├── scripts/               # Your JavaScript
│   │   └── main.js            # Entry point
│   ├── styles/                # Your styles
│   │   └── custom.scss
│   └── bundles/               # Page-specific bundles
│       └── code-highlighting.js
├── public/                    # Static files
├── eleventy.config.mjs        # Eleventy config
└── package.json
```

### 2. Configure Eleventy

**eleventy.config.mjs:**

```javascript
import path from 'path';
import { fileURLToPath } from 'url';
import { initTheme } from 'eleventy-base-blog-template';
import { getThemeViteConfig } from 'eleventy-base-blog-template/config/vite.mjs';
import { getPageBundleEntries } from 'eleventy-base-blog-template/utils/get-page-bundles.mjs';
import { purgeCSSFiles } from 'eleventy-base-blog-template/utils/purge-css.mjs';

// Import your custom filters/shortcodes
import userFilters from './overrides/lib/filters.mjs';
import userShortcodes from './overrides/lib/shortcodes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function (eleventyConfig) {
  // Initialize theme with your custom filters/shortcodes
  initTheme(eleventyConfig, {
    filters: userFilters,
    shortcodes: userShortcodes,
  });

  // Add Eleventy plugins
  eleventyConfig.addPlugin(EleventyPluginNavigation);
  eleventyConfig.addPlugin(EleventyPluginRss);
  eleventyConfig.addPlugin(EleventyPluginSyntaxhighlight);

  // Get theme Vite config
  const themeViteConfig = getThemeViteConfig(__dirname);

  eleventyConfig.addPlugin(EleventyVitePlugin, {
    viteOptions: {
      resolve: themeViteConfig.resolve,
      css: themeViteConfig.css,
      build: {
        rollupOptions: {
          input: getPageBundleEntries(__dirname),
        },
      },
      plugins: [
        {
          name: 'css-post-build',
          apply: 'build',
          async closeBundle() {
            await purgeCSSFiles();
          },
        },
      ],
    },
  });

  return {
    dir: {
      input: 'content',
      output: '_site',
      includes: '../node_modules/eleventy-base-blog-template/layouts',
      layouts: '../node_modules/eleventy-base-blog-template/layouts',
      data: '_data',
    },
  };
}
```

### 3. Create Your Entry Point

**overrides/scripts/main.js:**

```javascript
// Import theme styles and scripts
import 'eleventy-base-blog-template/styles/main.scss';
import 'eleventy-base-blog-template/scripts/main.js';

// Add your site-specific JavaScript
console.log('My blog loaded!');
```

### 4. Create Site Data

**content/_data/site.js:**

```javascript
export default {
  title: 'My Blog',
  description: 'Thoughts on web development',
  url: 'https://myblog.com',
  language: 'en',
  author: {
    name: 'Your Name',
    email: 'you@example.com',
  },
};
```

## Customization

### Override Layouts

Create a layout file in `overrides/layouts/` with the same name as the theme layout:

**overrides/layouts/base.njk:**

```nunjucks
{# Completely custom base layout #}
<!doctype html>
<html lang="en">
  <head>
    <title>{{ title }}</title>
  </head>
  <body>
    {{ content | safe }}
  </body>
</html>
```

Or extend the theme layout:

```nunjucks
{# Extend theme's base layout #}
{% extends "node_modules/eleventy-base-blog-template/layouts/base.njk" %}

{% block header %}
  <header class="custom-header">
    {# Your custom header #}
  </header>
{% endblock %}
```

### Add Custom Filters

**overrides/lib/filters.mjs:**

```javascript
export default {
  // Override theme filter
  currentYear: () => new Date().getFullYear() + ' (Custom)',

  // Add new filter
  uppercase: (str) => str.toUpperCase(),

  customDate: (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },
};
```

### Customize Styles

**overrides/styles/custom.scss:**

```scss
// Import theme styles
@use 'eleventy-base-blog-template/styles/main';

// Override CSS custom properties
:root {
  --color-primary: #ff6b6b;
  --background-color: #f5f5f5;
}

// Add custom styles
.my-component {
  background: var(--color-primary);
}
```

Then update `overrides/scripts/main.js`:

```javascript
import '../styles/custom.scss'; // Import your custom styles
import 'eleventy-base-blog-template/scripts/main.js';
```

### Create Page Bundles

Create a bundle that's only loaded on specific pages:

**overrides/bundles/code-highlighting.js:**

```javascript
import '../../styles/bundles/code-highlighting.scss';

// Add copy buttons to code blocks
document.querySelectorAll('pre[class*="language-"]').forEach((pre) => {
  const button = document.createElement('button');
  button.textContent = 'Copy';
  button.addEventListener('click', () => {
    navigator.clipboard.writeText(pre.querySelector('code').textContent);
  });
  pre.appendChild(button);
});
```

Use in page front matter:

```yaml
---
title: My Post with Code
pageBundle: code-highlighting
---
```

## Available Filters

- `currentYear()` - Get current year
- `dateToFormat(date, format)` - Format dates (uses Luxon)
- `dateToISO(date)` - Convert to ISO string
- `filterTagList(tags)` - Remove internal tags
- `head(array, n)` - Get first N elements
- `min(...numbers)` - Find minimum value
- `obfuscate(str)` - Obfuscate to HTML entities
- `sortAlphabetically(strings)` - Sort alphabetically

## Available Shortcodes

- `currentBuildDate()` - ISO timestamp of build time

## Build Utilities

### PurgeCSS

Automatically removes unused CSS in production builds:

```javascript
import { purgeCSSFiles } from 'eleventy-base-blog-template/utils/purge-css.mjs';

// In Vite plugin closeBundle hook
await purgeCSSFiles();
```

### Critical CSS (Optional)

Generate and inline critical CSS:

```javascript
import { generateCriticalCSS } from 'eleventy-base-blog-template/utils/generate-critical.mjs';

// In Vite plugin closeBundle hook (after PurgeCSS)
if (process.env.GENERATE_CRITICAL_CSS === 'true') {
  await generateCriticalCSS();
}
```

Set `.env` file:

```bash
GENERATE_CRITICAL_CSS=true
```

### Bundle Discovery

Automatically discover entry points:

```javascript
import { getPageBundleEntries } from 'eleventy-base-blog-template/utils/get-page-bundles.mjs';

// Returns entry points for Vite
const entries = getPageBundleEntries(__dirname);
// { main: 'overrides/scripts/main.js', 'code-highlighting': 'overrides/bundles/code-highlighting.js' }
```

## Upgrading

Update the theme:

```bash
npm update eleventy-base-blog-template
```

Pin to specific version:

```json
{
  "dependencies": {
    "eleventy-base-blog-template": "github:artislismanis/eleventy-base-blog-template#v1.0.0"
  }
}
```

## License

MIT License - see LICENSE file for details

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## Credits

Built with [Eleventy](https://www.11ty.dev/) and [Vite](https://vitejs.dev/).
