# API Simplification - Before & After

## Summary

**Reduced from 45 lines to 3 lines** for basic theme setup!

---

## ❌ OLD API (Verbose, Error-Prone)

```javascript
import path from 'path';
import { fileURLToPath } from 'url';
import EleventyVitePlugin from '@11ty/eleventy-plugin-vite';

// Import theme and utilities
import theme, {
  getThemeViteConfig,
  getPageBundleEntries,
  configurePassthroughCopy,
} from 'eleventy-base-blog-template';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function (eleventyConfig) {
  // Initialize theme
  theme.init(eleventyConfig, {
    projectRoot: __dirname,
  });

  // Configure static assets with cascade
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
      data: '_data',
    },
  };
}
```

**Problems:**
- 45 lines of boilerplate
- Must import 4 separate functions
- Must manually get `__dirname`
- Must manually call `configurePassthroughCopy`
- Must manually configure Vite plugin
- Must manually call `getPageBundleEntries`
- Easy to forget a step
- Confusing for beginners

---

## ✅ NEW API (Simple, Foolproof)

```javascript
import theme from 'eleventy-base-blog-template';

export default theme.createConfig({ importMetaUrl: import.meta.url });
```

**That's it!** 3 lines total.

### What It Does Automatically

1. ✅ Detects project root from `import.meta.url`
2. ✅ Initializes theme (filters, shortcodes, transforms)
3. ✅ Configures Nunjucks with @theme alias
4. ✅ Configures data cascade
5. ✅ Configures asset cascade (passthrough copy)
6. ✅ Adds Vite plugin with theme config
7. ✅ Sets up bundle entry points
8. ✅ Returns directory structure

---

## Customization (Optional)

### Custom Directories

```javascript
export default theme.createConfig({
  importMetaUrl: import.meta.url,
  eleventy: {
    input: 'src',
    output: 'dist',
  },
});
```

### Custom Vite Config

```javascript
export default theme.createConfig({
  importMetaUrl: import.meta.url,
  vite: {
    server: { port: 3000 },
    // ... any vite options
  },
});
```

### Custom Filters

```javascript
export default theme.createConfig({
  importMetaUrl: import.meta.url,
  filters: {
    myFilter: (str) => str.toUpperCase(),
    anotherFilter: (arr) => arr.reverse(),
  },
});
```

### Custom Override Paths

```javascript
export default theme.createConfig({
  importMetaUrl: import.meta.url,
  overridePaths: {
    layouts: 'my-layouts',
    data: 'my-data',
    bundles: 'my-bundles',
    public: 'my-public',
  },
});
```

### Everything Together

```javascript
import theme from 'eleventy-base-blog-template';

export default theme.createConfig({
  importMetaUrl: import.meta.url,

  // Custom directories
  eleventy: {
    input: 'src',
    output: 'dist',
  },

  // Custom Vite config
  vite: {
    server: { port: 3000 },
  },

  // Custom filters
  filters: {
    uppercase: (str) => str.toUpperCase(),
  },

  // Custom shortcodes
  shortcodes: {
    year: () => new Date().getFullYear(),
  },

  // Custom override paths
  overridePaths: {
    layouts: 'my-layouts',
  },
});
```

Still much shorter and clearer than the old way!

---

## Advanced: Manual Setup (Old Way Still Works)

If you need complete control, the old API still works:

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
  // Manual initialization
  theme.init(eleventyConfig, {
    projectRoot: __dirname,
    filters: { /* ... */ },
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

  // Manual directory config
  return {
    dir: { input: 'content', output: '_site' },
  };
}
```

**When to use manual setup:**
- Need to add other Eleventy plugins with specific ordering
- Complex custom configuration
- Want to understand every step
- Migrating from old version

**When to use createConfig:**
- Just want the theme to work (99% of users)
- Minimal configuration
- Best practices by default

---

## Comparison Matrix

| Feature | Old API | New API |
|---------|---------|---------|
| **Lines of code** | 45 | 3 |
| **Manual imports** | 5 | 1 |
| **Auto-configure Vite** | ❌ No | ✅ Yes |
| **Auto-configure cascade** | ❌ Partial | ✅ Complete |
| **Auto-detect __dirname** | ❌ No | ✅ Yes |
| **Customizable** | ✅ Yes | ✅ Yes |
| **Beginner friendly** | ❌ No | ✅ Yes |
| **Error prone** | ⚠️ High | ✅ Low |

---

## Migration Path

### From v2.0 → v2.1 (Non-Breaking)

Both APIs work! You can migrate gradually:

**Option 1: Keep old config** (works fine)
```javascript
// Your existing config still works
import theme, { getThemeViteConfig, ... } from 'eleventy-base-blog-template';
```

**Option 2: Migrate to new API** (recommended)
```javascript
// Much simpler!
import theme from 'eleventy-base-blog-template';
export default theme.createConfig({ importMetaUrl: import.meta.url });
```

---

## Why This Matters

### For Beginners
- **Lower barrier to entry** - Copy one line, it just works
- **Fewer concepts** - Don't need to understand Vite, cascades, etc.
- **Less to break** - Fewer moving parts

### For Everyone
- **Less boilerplate** - 93% reduction in config code
- **Faster setup** - Copy one line vs. 45 lines
- **Easier maintenance** - Update theme, config stays same
- **Better defaults** - Theme controls its own integration

### For Theme Authors
- **Better DX** - Users love simple APIs
- **Fewer support issues** - Less to go wrong
- **Easier documentation** - One example covers 99% of cases
- **Cleaner upgrades** - Internal changes don't affect users

---

## Implementation Details

The `createConfig()` function is a thin wrapper that:

1. Auto-detects `__dirname` from `import.meta.url`
2. Calls `theme.init()` with all options
3. Adds Vite plugin with correct configuration
4. Returns Eleventy config with sensible defaults
5. Merges user options with theme defaults

**Source:** `lib/create-config.mjs` (~120 lines)

All the complexity is hidden. Users get simplicity, theme gets control.

---

## What About Plugin Extraction?

This API also works perfectly if we extract cascade to a plugin later:

**Future plugin version:**
```javascript
// Theme would just call plugin internally
import themePlugin from '@11ty/eleventy-plugin-themes';

export function createConfig(options) {
  return function(eleventyConfig) {
    // Use plugin
    eleventyConfig.addPlugin(themePlugin, { /* theme config */ });

    // Add theme-specific stuff (filters, styles, etc.)
    // ...
  };
}
```

**Users wouldn't notice:** Their config stays exactly the same!

```javascript
// Still just one line
export default theme.createConfig({ importMetaUrl: import.meta.url });
```

---

## Documentation Impact

### Before (45 lines of setup)
Users needed to understand:
- ES module __dirname
- Vite configuration
- Eleventy plugin system
- Cascade configuration
- Bundle entry points
- Directory structure

### After (3 lines of setup)
Users need to understand:
- Pass `import.meta.url`

Everything else is optional customization.

---

## Conclusion

**Old API:** Powerful but verbose
**New API:** Simple but flexible
**Result:** Best of both worlds

Users can start with 3 lines, customize as needed, or go full manual if they want complete control.

**Backwards compatible:** Old configs still work
**Future proof:** Works with or without plugin extraction
**User friendly:** 93% less boilerplate

✅ Win-win-win
