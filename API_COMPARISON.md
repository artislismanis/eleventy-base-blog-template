# API Comparison - Three Approaches

## The Key Difference

**Question:** Who controls the Eleventy configuration?

- **Manual API** - You control everything (most verbose)
- **Plugin API** - Theme handles theme setup, you control content config ✅ **RECOMMENDED**
- **createConfig API** - Theme controls everything (too opinionated) ❌ **REMOVED**

---

## ✅ RECOMMENDED: Plugin API

**Theme configures itself, you configure your content.**

```javascript
import theme from 'eleventy-base-blog-template';

export default function (eleventyConfig) {
  // Theme setup - ONE LINE
  eleventyConfig.addPlugin(theme.plugin, {
    importMetaUrl: import.meta.url,
  });

  // YOUR control over content organization
  eleventyConfig.addCollection('posts', function (api) {
    return api.getFilteredByGlob('content/blog/*.md');
  });

  eleventyConfig.addCollection('projects', function (api) {
    return api.getFilteredByGlob('content/projects/*.md');
  });

  // YOUR other plugins
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginSitemap);

  // YOUR custom filters
  eleventyConfig.addFilter('customDate', (date) => {
    // Your date logic
  });

  // YOUR directory structure
  return {
    dir: {
      input: 'content',
      output: '_site',
      data: '_data',
    },
  };
}
```

### What Theme Plugin Does Automatically

- ✅ Initializes theme (filters, shortcodes, transforms)
- ✅ Configures Nunjucks with @theme alias
- ✅ Configures data cascade
- ✅ Configures asset cascade
- ✅ Adds Vite plugin with correct config
- ✅ Sets up bundle entry points

### What YOU Still Control

- ✅ Collections (posts, projects, etc.)
- ✅ Other Eleventy plugins (RSS, sitemap, etc.)
- ✅ Custom filters/shortcodes
- ✅ Directory structure
- ✅ Pagination
- ✅ Anything else Eleventy offers

### Customization Example

```javascript
eleventyConfig.addPlugin(theme.plugin, {
  importMetaUrl: import.meta.url,

  // Custom filters
  filters: {
    uppercase: (str) => str.toUpperCase(),
  },

  // Custom Vite config
  vite: {
    server: { port: 3000 },
  },

  // Custom override paths
  overridePaths: {
    layouts: 'my-layouts',
    data: 'my-data',
  },
});
```

---

## ⚙️ Manual API (Old Way)

**Full control, but verbose.**

```javascript
import path from 'path';
import { fileURLToPath } from 'url';
import EleventyVitePlugin from '@11ty/eleventy-plugin-vite';
import theme, {
  getThemeViteConfig,
  getPageBundleEntries,
} from 'eleventy-base-blog-template';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function (eleventyConfig) {
  // Manual theme initialization
  theme.init(eleventyConfig, {
    projectRoot: __dirname,
    filters: { myFilter: (str) => str.toUpperCase() },
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

  // Your collections
  eleventyConfig.addCollection('posts', ...);

  // Your directory structure
  return {
    dir: {
      input: 'content',
      output: '_site',
    },
  };
}
```

### When to Use Manual API

- Migrating from old version
- Need specific plugin ordering
- Want to understand every step
- Have complex custom requirements

---

## ❌ createConfig API (Removed)

**This was too opinionated - it took over the entire config.**

```javascript
// DON'T USE - Prevents you from adding collections, plugins, etc.
import theme from 'eleventy-base-blog-template';

export default theme.createConfig({ importMetaUrl: import.meta.url });
// ❌ You can't add collections
// ❌ You can't add other plugins
// ❌ You can't customize Eleventy
```

**Why removed:** Content repo MUST control its own content organization (collections, pagination, RSS, etc.). The theme should only configure itself, not the content.

---

## Side-by-Side Comparison

### Manual API (Old)
```javascript
// 45 lines
import path from 'path';
import { fileURLToPath } from 'url';
import EleventyVitePlugin from '@11ty/eleventy-plugin-vite';
import theme, {
  getThemeViteConfig,
  getPageBundleEntries,
} from 'eleventy-base-blog-template';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function (eleventyConfig) {
  theme.init(eleventyConfig, {
    projectRoot: __dirname,
  });

  eleventyConfig.addPlugin(EleventyVitePlugin, {
    viteOptions: getThemeViteConfig(__dirname, {
      build: {
        rollupOptions: {
          input: getPageBundleEntries(__dirname),
        },
      },
    }),
  });

  // Your collections
  eleventyConfig.addCollection('posts', ...);

  return {
    dir: {
      input: 'content',
      output: '_site',
    },
  };
}
```

### Plugin API (New) ✅
```javascript
// 21 lines
import theme from 'eleventy-base-blog-template';

export default function (eleventyConfig) {
  // Theme setup - one line
  eleventyConfig.addPlugin(theme.plugin, {
    importMetaUrl: import.meta.url,
  });

  // Your collections
  eleventyConfig.addCollection('posts', ...);

  return {
    dir: {
      input: 'content',
      output: '_site',
    },
  };
}
```

**Reduction:** 45 lines → 21 lines (53% reduction)

**More importantly:** Clear separation of concerns!

---

## Migration Guide

### From Manual API → Plugin API

**Before:**
```javascript
import path from 'path';
import { fileURLToPath } from 'url';
import EleventyVitePlugin from '@11ty/eleventy-plugin-vite';
import theme, {
  getThemeViteConfig,
  getPageBundleEntries,
} from 'eleventy-base-blog-template';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function (eleventyConfig) {
  theme.init(eleventyConfig, { projectRoot: __dirname });

  eleventyConfig.addPlugin(EleventyVitePlugin, {
    viteOptions: getThemeViteConfig(__dirname, {
      build: {
        rollupOptions: {
          input: getPageBundleEntries(__dirname),
        },
      },
    }),
  });

  // Rest of your config...
}
```

**After:**
```javascript
import theme from 'eleventy-base-blog-template';

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(theme.plugin, {
    importMetaUrl: import.meta.url,
  });

  // Rest of your config...
}
```

**Steps:**
1. Remove `path`, `fileURLToPath`, `EleventyVitePlugin` imports
2. Remove individual theme function imports
3. Remove `__dirname` setup
4. Replace `theme.init()` + `addPlugin(EleventyVitePlugin)` with single `addPlugin(theme.plugin)`
5. Pass `importMetaUrl: import.meta.url` instead of `projectRoot: __dirname`

---

## Layer Separation

### Layer 1: Eleventy (Framework)
- Collections API
- Pagination
- Template languages
- Plugin system

### Layer 1.5: Theme Plugin (Design Infrastructure)
- Cascade system
- Template loader
- Vite integration
- **← THIS IS WHAT theme.plugin DOES**

### Layer 2: Theme Package (Visual Design)
- Layouts
- Styles
- Components
- Filters (presentation)

### Layer 3: Content Repo (Your Site)
- Content
- Collections configuration
- RSS, sitemap
- Site-specific plugins
- **← THIS IS WHAT YOU DO IN YOUR CONFIG**

**The plugin API respects this separation!**

---

## Summary

| Aspect | Manual API | Plugin API | createConfig |
|--------|-----------|------------|--------------|
| **Lines of code** | 45 | 21 | 3 |
| **Theme setup** | Manual | Auto | Auto |
| **Collections** | ✅ You control | ✅ You control | ❌ No control |
| **Other plugins** | ✅ You control | ✅ You control | ❌ No control |
| **Directory structure** | ✅ You control | ✅ You control | ⚠️ Limited |
| **Customization** | ✅ Full | ✅ Full | ⚠️ Limited |
| **Beginner friendly** | ❌ Complex | ✅ Simple | ✅ Simple |
| **Layer separation** | ⚠️ Mixed | ✅ Clear | ❌ Wrong |

**Recommended:** Plugin API - simplifies theme setup while preserving your control over content.

---

## Real-World Example

```javascript
import theme from 'eleventy-base-blog-template';
import pluginRss from '@11ty/eleventy-plugin-rss';

export default function (eleventyConfig) {
  // THEME (design layer)
  eleventyConfig.addPlugin(theme.plugin, {
    importMetaUrl: import.meta.url,
  });

  // YOUR CONTENT (content layer)

  // Collections
  eleventyConfig.addCollection('posts', function (api) {
    return api.getFilteredByGlob('content/blog/**/*.md')
      .filter(item => !item.data.draft)
      .reverse();
  });

  eleventyConfig.addCollection('projects', function (api) {
    return api.getFilteredByGlob('content/projects/*.md');
  });

  // Other plugins
  eleventyConfig.addPlugin(pluginRss);

  // Custom filters for your content
  eleventyConfig.addFilter('relatedPosts', function(collection, current) {
    // Your logic
  });

  // YOUR STRUCTURE
  return {
    dir: {
      input: 'content',
      output: '_site',
      data: '_data',
    },
  };
}
```

**Clear separation:** Theme does theme things, you do content things.
