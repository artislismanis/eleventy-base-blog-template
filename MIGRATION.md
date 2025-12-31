# Migration Guide: v1 → v2

This guide helps you upgrade from `eleventy-base-blog-template` v1.x to v2.0.

## Breaking Changes Summary

| Change | v1 | v2 |
|--------|----|----|
| Init function | `initTheme()` | `theme.init()` |
| Theme imports | Manual | Auto-imported |
| Layout extends | Node modules path | `@theme/` alias |
| Bundle extends | Package name | `@theme/` alias |
| Theme config | `theme.config.mjs` | Not needed (metadata in theme) |
| Nunjucks config | Manual | Automatic |

---

## Step-by-Step Migration

### 1. Update Theme Package

```bash
npm install eleventy-base-blog-template@^2.0.0
```

### 2. Update eleventy.config.mjs

**Before (v1):**
```javascript
import { initTheme } from 'eleventy-base-blog-template';
import { getThemeViteConfig } from 'eleventy-base-blog-template/config/vite.mjs';
import { getPageBundleEntries } from 'eleventy-base-blog-template/utils/get-page-bundles.mjs';

export default function (eleventyConfig) {
  initTheme(eleventyConfig, {
    filters: userFilters,
    shortcodes: userShortcodes,
  });

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
    },
  });

  return {
    dir: {
      input: 'content',
      output: '_site',
      includes: '../node_modules/eleventy-base-blog-template/layouts',
      layouts: '../node_modules/eleventy-base-blog-template/layouts',
    },
  };
}
```

**After (v2):**
```javascript
import theme, {
  getThemeViteConfig,
  getPageBundleEntries,
  configurePassthroughCopy,
} from 'eleventy-base-blog-template';

export default function (eleventyConfig) {
  // ✅ New: init() instead of initTheme()
  theme.init(eleventyConfig, {
    projectRoot: __dirname,  // ✅ New: required
    filters: userFilters,
    shortcodes: userShortcodes,
  });

  // ✅ New: Configure static assets cascade
  configurePassthroughCopy(eleventyConfig, __dirname);

  eleventyConfig.addPlugin(EleventyVitePlugin, {
    // ✅ Simplified: getThemeViteConfig handles everything
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
      // ✅ Removed: Nunjucks auto-configured by init()
    },
  };
}
```

### 3. Remove Manual Theme Imports

**Before (v1):**
```javascript
// overrides/scripts/main.js
import 'eleventy-base-blog-template/styles/main.scss';
import 'eleventy-base-blog-template/scripts/main.js';

console.log('My site loaded');
```

**After (v2):**
```javascript
// overrides/scripts/main.js
// ✅ No imports needed - theme auto-imports!

console.log('My site loaded');
```

### 4. Update Layout Extends

**Before (v1):**
```nunjucks
{# overrides/layouts/custom.njk #}
{% extends "../node_modules/eleventy-base-blog-template/layouts/base.njk" %}

{% block content %}
  {{ content | safe }}
{% endblock %}
```

**After (v2):**
```nunjucks
{# overrides/layouts/custom.njk #}
{% extends "@theme/layouts/base.njk" %}

{% block content %}
  {{ content | safe }}
{% endblock %}
```

### 5. Update Bundle Imports (if any)

**Before (v1):**
```javascript
// overrides/bundles/code-highlighting.js
import 'eleventy-base-blog-template/bundles/code-highlighting.js';
```

**After (v2):**
```javascript
// overrides/bundles/code-highlighting.js
import { init, defaultConfig } from '@theme/bundles/code-highlighting.js';

init({
  ...defaultConfig,
  lineNumbers: true,
});
```

### 6. Delete Deprecated Files

```bash
# Delete theme.config.mjs (no longer needed)
rm theme.config.mjs

# Or if you have theme.config.js
rm theme.config.js
```

### 7. Test Your Build

```bash
npm run build
```

Check for:
- ✅ No errors
- ✅ Styles load correctly
- ✅ Scripts execute
- ✅ Layouts render
- ✅ Bundles work on specific pages

---

## Feature Comparison

### Data Files

**v1:** No theme defaults, user must create all data files

**v2:** Theme provides defaults, user overrides by creating same filename

```javascript
// Theme provides data/site.js with defaults
// User overrides by creating content/_data/site.js
export default {
  title: 'My Blog',  // Replaces theme default
  // ...
};
```

### Static Assets

**v1:** User must provide all assets

**v2:** Theme provides defaults (favicon, robots.txt), user overrides per-file

```
public/
└── favicon.svg  # ✅ Overrides theme's default favicon
```

### Bundles

**v1:** Bundles auto-run on import

**v2:** Bundles use explicit init pattern

**Zero-config option:**
```yaml
---
pageBundle: code-highlighting.auto
---
```

**With customization:**
```javascript
import { init } from '@theme/bundles/code-highlighting.js';
init({ lineNumbers: true });
```

---

## Troubleshooting

### Build Fails: "Cannot find module"

**Problem:** Old v1 import paths

**Solution:** Update to v2 import patterns:
```javascript
// ❌ v1
import { getThemeViteConfig } from 'eleventy-base-blog-template/config/vite.mjs';

// ✅ v2
import { getThemeViteConfig } from 'eleventy-base-blog-template';
```

### Styles Not Loading

**Problem:** Manual imports in main.js

**Solution:** Remove manual theme imports (v2 auto-imports):
```javascript
// ❌ Remove these
import 'eleventy-base-blog-template/styles/main.scss';
import 'eleventy-base-blog-template/scripts/main.js';
```

### Layouts Not Found

**Problem:** Old Nunjucks configuration

**Solution:** Remove manual `includes`/`layouts` config, v2 handles it:
```javascript
return {
  dir: {
    input: 'content',
    output: '_site',
    // ❌ Remove these
    // includes: '../node_modules/...',
    // layouts: '../node_modules/...',
  },
};
```

### Validation Warnings

**Problem:** v2 validates theme installation

**Solution:** Follow suggested fixes in warning messages. Common warnings:
- Create `overrides/scripts/main.js` if missing
- Delete deprecated `theme.config.mjs`
- Remove manual theme imports

---

## New Features in v2

### 1. @theme Alias

Clean, portable imports everywhere:

```nunjucks
{% extends "@theme/layouts/base.njk" %}
```

```javascript
import { init } from '@theme/bundles/code.js';
```

```scss
@use '@theme/styles/variables';
```

### 2. Configurable Override Paths

Content repo controls its own structure:

```javascript
theme.init(eleventyConfig, {
  projectRoot: __dirname,
  overridePaths: {
    layouts: 'src/layouts',
    scripts: 'src/scripts',
  },
});
```

### 3. Smart Validation

Theme validates itself on init and provides helpful errors:

```
❌ Theme Validation Errors:

1. No entry point found at overrides/scripts/main.js
   Create this file to add site-specific JavaScript.
   Example:
     // overrides/scripts/main.js
     console.log('Site loaded');
```

### 4. CSS Custom Properties

17+ variables per bundle for easy theming:

```scss
:root {
  --code-bg: #2d2d2d;
  --code-fg: #f8f8f2;
}
```

---

## Migration Checklist

- [ ] Update theme to v2: `npm install eleventy-base-blog-template@^2.0.0`
- [ ] Update `eleventy.config.mjs`:
  - [ ] Change `initTheme()` → `theme.init()`
  - [ ] Add `projectRoot: __dirname`
  - [ ] Add `configurePassthroughCopy()`
  - [ ] Simplify Vite config with `getThemeViteConfig()`
  - [ ] Remove manual `includes`/`layouts` paths
- [ ] Update `overrides/scripts/main.js`:
  - [ ] Remove manual theme imports
- [ ] Update all layout files:
  - [ ] Replace `node_modules/eleventy-base-blog-template` → `@theme`
- [ ] Update bundle imports (if any):
  - [ ] Use `@theme/bundles/...` instead of package name
- [ ] Delete deprecated files:
  - [ ] `theme.config.mjs` or `theme.config.js`
- [ ] Test build:
  - [ ] `npm run build`
  - [ ] Check for errors
  - [ ] Verify styles load
  - [ ] Verify scripts execute
  - [ ] Check bundled pages work

---

## Need Help?

- Check [README.md](./README.md) for v2 documentation
- Review test example at `/home/data/test-content/`
- Open issue at [github.com/artislismanis/eleventy-base-blog-template](https://github.com/artislismanis/eleventy-base-blog-template)

---

**Estimated Migration Time:** 15-30 minutes for a typical site

**Difficulty:** Easy (mostly find/replace operations)
