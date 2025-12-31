# Eleventy Theme System Proposal

## Vision

Create a **standardized theme framework** for Eleventy that makes themes:
- Easily swappable (change one import, get new design)
- Predictable (consistent structure across themes)
- Extensible (themes can add features beyond MVP)
- Configurable (flexible but with sensible defaults)

**Goal:** Define a clear contract/interface between themes and content repos, inspired by Hugo and Jekyll's best practices.

---

## Current State Analysis

### What Hugo Does Well

**1. Clear Theme Structure**
```
theme/
├── archetypes/      # Content templates
├── assets/          # Build-time assets (SCSS, JS)
├── layouts/         # Templates
│   ├── _default/    # Default layouts
│   ├── partials/    # Reusable components
│   └── shortcodes/  # Custom shortcodes
├── static/          # Static assets (images, fonts)
├── data/            # Default data
├── i18n/            # Translations
└── theme.toml       # Theme metadata
```

**2. Theme Layering**
```yaml
# config.toml
theme = ["my-custom-theme", "base-theme"]
# Multiple themes compose, later ones override earlier
```

**3. Predictable Overrides**
```
User file:           layouts/post.html
Theme file:          themes/mytheme/layouts/post.html
Result:              User wins, always
```

**4. Archetypes (Content Templates)**
```bash
hugo new post/my-post.md
# Uses archetype to scaffold new content with front matter
```

**5. Theme Configuration**
```toml
# theme.toml - Theme declares what it supports
[params]
  mainSections = ["blog", "docs"]
  showReadingTime = true
  customCSS = []
```

---

### What Jekyll Does Well

**1. Gem-Based Distribution**
```ruby
# Gemfile
gem "my-theme", "~> 1.0"
# npm equivalent: npm install my-theme
```

**2. Clear Override Hierarchy**
```
Priority (highest to lowest):
1. User's site files (_layouts/, _includes/, assets/)
2. Theme's files
3. Jekyll defaults
```

**3. Theme Config**
```yaml
# _config.yml
theme: my-theme
# All other config is site-specific, not theme-specific
```

**4. Includes & Layouts Separation**
```
_layouts/      # Page templates
_includes/     # Reusable components (partials)
_sass/         # Styles
assets/        # JS, images
```

**5. Data Files**
```yaml
# _data/navigation.yml
- name: Home
  link: /
- name: Blog
  link: /blog/
```

---

## What Both Do Wrong (Lessons for Us)

### Hugo Issues
- ❌ Too much magic (content organization affects URL structure)
- ❌ Themes can be too opinionated about content types
- ❌ Complex lookup order (confusing for beginners)

### Jekyll Issues
- ❌ Ruby dependency (not JavaScript ecosystem)
- ❌ Limited build tooling (no modern JS/CSS pipeline)
- ❌ Themes can't easily add Eleventy plugins

### Eleventy's Advantage
- ✅ JavaScript ecosystem (npm, Vite, modern tooling)
- ✅ Flexible (not opinionated about content)
- ✅ Powerful plugin system
- ✅ Modern async/await, ES modules

---

## Proposed: Eleventy Theme Framework

### Package Structure

```
@eleventy-themes/
├── core/              # Theme engine (cascade, resolution, etc.)
├── spec/              # Theme specification/interface
└── examples/
    ├── blog/          # Blog theme (our current theme)
    ├── docs/          # Documentation theme
    └── portfolio/     # Portfolio theme
```

---

## 1. Theme Specification (`@eleventy-themes/spec`)

**Define the contract that all themes must implement.**

### Required Theme Structure

```
my-theme/
├── theme.json           # Theme metadata (REQUIRED)
├── lib/
│   ├── index.mjs       # Theme entry point
│   └── plugin.mjs      # Theme as Eleventy plugin
├── layouts/            # Templates
│   ├── base.njk        # Base template (REQUIRED)
│   └── partials/       # Reusable components
├── data/               # Default data files
│   └── navigation.js   # Example default
├── styles/             # CSS/SCSS
│   └── main.scss
├── scripts/            # JavaScript
│   └── main.js
├── bundles/            # Page-specific bundles (optional)
├── public/             # Static assets
└── README.md           # Usage documentation
```

### Theme Metadata (`theme.json`)

```json
{
  "name": "my-theme",
  "version": "1.0.0",
  "description": "A blog theme for Eleventy",
  "author": "Your Name",

  "spec": "1.0.0",  // Theme spec version

  "eleventy": {
    "min": "3.0.0",  // Minimum Eleventy version
    "max": "4.0.0"   // Maximum tested version
  },

  "features": {
    "bundles": true,       // Supports page bundles
    "darkMode": true,      // Has dark mode
    "i18n": false,         // i18n support
    "search": false        // Built-in search
  },

  "layouts": [
    "base",              // Available layouts
    "home",
    "post",
    "page",
    "archive"
  ],

  "bundles": [
    "code-highlighting",  // Available bundles
    "gallery"
  ],

  "config": {
    // Default configuration options
    "navigation": {
      "position": "header",
      "items": []
    },
    "footer": {
      "show": true
    }
  },

  "overridePaths": {
    // Default override paths (configurable by user)
    "layouts": "overrides/layouts",
    "data": "content/_data",
    "bundles": "overrides/bundles",
    "styles": "overrides/styles",
    "scripts": "overrides/scripts",
    "public": "public"
  }
}
```

### Theme Plugin Interface

**Every theme MUST export a plugin that follows this interface:**

```javascript
// my-theme/lib/plugin.mjs

export default function themePlugin(eleventyConfig, options = {}) {
  // 1. Validate theme spec compatibility
  validateSpec(options);

  // 2. Initialize cascade system (provided by @eleventy-themes/core)
  initCascade(eleventyConfig, {
    themeName: metadata.name,
    projectRoot: options.projectRoot,
    overridePaths: options.overridePaths,
  });

  // 3. Register theme filters
  registerFilters(eleventyConfig, themeFilters, options.filters);

  // 4. Register theme shortcodes
  registerShortcodes(eleventyConfig, themeShortcodes, options.shortcodes);

  // 5. Register theme transforms
  registerTransforms(eleventyConfig, themeTransforms, options.transforms);

  // 6. Add build tooling (Vite, PostCSS, etc.)
  configureBuildTools(eleventyConfig, options);

  // 7. Return theme metadata
  return metadata;
}
```

---

## 2. Theme Core (`@eleventy-themes/core`)

**Extract all the cascade/resolution logic into a reusable package.**

### What Core Provides

```javascript
// @eleventy-themes/core

export {
  // Cascade system
  createCascade,
  resolveResource,
  scanWithCascade,

  // Template system
  ThemeAwareLoader,      // Nunjucks loader with @theme support
  configureTemplates,

  // Build tools
  createViteConfig,
  createBundleConfig,

  // Utilities
  validateTheme,
  getThemeMetadata,

  // Plugin helper
  createThemePlugin,     // Factory for creating theme plugins
};
```

### Core API Example

```javascript
// How a theme uses the core

import { createThemePlugin } from '@eleventy-themes/core';
import filters from './filters.mjs';
import metadata from '../theme.json';

export default createThemePlugin({
  metadata,
  filters,
  shortcodes,
  transforms,
  // Core handles all the cascade, Vite, etc.
});
```

---

## 3. Content Repo Setup (User's Site)

### Simple Setup (MVP)

```javascript
// eleventy.config.mjs

import blogTheme from '@eleventy-themes/blog';

export default function (eleventyConfig) {
  // Just add the theme
  eleventyConfig.addPlugin(blogTheme, {
    importMetaUrl: import.meta.url,
  });

  // Add your collections
  eleventyConfig.addCollection('posts', function (api) {
    return api.getFilteredByGlob('content/blog/**/*.md');
  });

  return {
    dir: {
      input: 'content',
      output: '_site',
    },
  };
}
```

### Switching Themes

```javascript
// Change this line to switch themes:
import theme from '@eleventy-themes/blog';
// to:
import theme from '@eleventy-themes/docs';
// Everything else stays the same!
```

### Override Structure

```
my-site/
├── content/                 # Your content
│   ├── blog/
│   ├── _data/              # Override theme data
│   │   └── navigation.js   # Your navigation
│   └── index.md
├── overrides/              # Override theme files
│   ├── layouts/            # Override layouts
│   │   └── post.njk       # Your custom post layout
│   ├── styles/             # Override styles
│   │   └── custom.scss    # Your custom styles
│   └── bundles/            # Override bundles
├── public/                 # Override static assets
│   └── favicon.svg        # Your favicon
└── eleventy.config.mjs
```

---

## 4. Theme Swapping Demo

### Before (Current Theme)

```javascript
import currentTheme from 'eleventy-base-blog-template';

eleventyConfig.addPlugin(currentTheme.plugin, {
  importMetaUrl: import.meta.url,
});
```

**Website:** Blog layout with sidebar, dark mode

### After (Switch to Docs Theme)

```javascript
import docsTheme from '@eleventy-themes/docs';

eleventyConfig.addPlugin(docsTheme, {
  importMetaUrl: import.meta.url,
});
```

**Website:** Documentation layout with TOC, search

**Same content, different design!**

---

## 5. Theme Features Beyond MVP

### Themes Can Add Features

```javascript
// @eleventy-themes/advanced-blog/lib/plugin.mjs

export default function advancedBlogTheme(eleventyConfig, options = {}) {
  // Use core for MVP functionality
  const basePlugin = createThemePlugin({
    metadata,
    filters,
    shortcodes,
  });

  basePlugin(eleventyConfig, options);

  // Add extra features
  if (options.features?.search) {
    setupSearch(eleventyConfig);
  }

  if (options.features?.comments) {
    setupComments(eleventyConfig);
  }

  // Add advanced collections
  eleventyConfig.addCollection('relatedPosts', function (api) {
    // Smart related posts logic
  });
}
```

**User enables features:**

```javascript
eleventyConfig.addPlugin(advancedBlogTheme, {
  importMetaUrl: import.meta.url,
  features: {
    search: true,
    comments: true,
  },
});
```

---

## 6. Configuration Philosophy

### Three Levels of Config

**1. Theme Defaults** (in theme.json)
```json
{
  "config": {
    "postsPerPage": 10,
    "showAuthor": true
  }
}
```

**2. User Overrides** (in eleventy.config.mjs)
```javascript
eleventyConfig.addPlugin(theme, {
  importMetaUrl: import.meta.url,
  config: {
    postsPerPage: 20,  // Override theme default
  },
});
```

**3. Data Files** (in content/_data/)
```javascript
// content/_data/theme.js
export default {
  postsPerPage: 15,  // Override via data (highest priority)
};
```

**Priority:** Data files > User config > Theme defaults

---

## 7. Theme Development Kit

### Create New Theme CLI

```bash
npm create @eleventy-themes/theme my-new-theme

cd my-new-theme
npm install
npm run dev
```

**Generated structure:**
```
my-new-theme/
├── theme.json          # Pre-filled metadata
├── lib/
│   ├── index.mjs      # Uses @eleventy-themes/core
│   ├── filters.mjs    # Your filters
│   └── shortcodes.mjs # Your shortcodes
├── layouts/
│   └── base.njk       # Starter template
├── styles/
│   └── main.scss      # Your styles
├── example/           # Example content for testing
└── README.md
```

### Theme Testing

```javascript
// test/theme.test.js

import { validateTheme, testCascade } from '@eleventy-themes/core/testing';
import myTheme from '../lib/index.mjs';

describe('My Theme', () => {
  it('follows spec 1.0', () => {
    expect(validateTheme(myTheme)).toBe(true);
  });

  it('cascade works', () => {
    expect(testCascade(myTheme, {
      layouts: ['base', 'post'],
      data: ['navigation', 'site'],
    })).toBe(true);
  });
});
```

---

## 8. Comparison to Hugo/Jekyll

| Feature | Hugo | Jekyll | This Proposal |
|---------|------|--------|---------------|
| **Theme switching** | ✅ Easy | ✅ Easy | ✅ Easy |
| **Override hierarchy** | ✅ Clear | ✅ Clear | ✅ Clear |
| **Modern tooling** | ⚠️ Limited | ❌ No | ✅ Vite/npm |
| **JS ecosystem** | ❌ Go | ❌ Ruby | ✅ JavaScript |
| **Plugin system** | ⚠️ Limited | ⚠️ Limited | ✅ Full Eleventy |
| **Spec compliance** | ❌ No spec | ❌ No spec | ✅ JSON spec |
| **Testable themes** | ⚠️ Manual | ⚠️ Manual | ✅ Test helpers |
| **Theme features** | ⚠️ Config only | ⚠️ Config only | ✅ Plugin-based |
| **Content coupling** | ❌ High | ⚠️ Medium | ✅ Low |

---

## 9. Implementation Roadmap

### Phase 1: Extract Core ✅ (Partially Done)
- [x] Extract cascade system
- [x] Extract template loader
- [x] Extract build tools
- [ ] Package as `@eleventy-themes/core`
- [ ] Add tests

### Phase 2: Define Spec
- [ ] Write `theme.json` schema
- [ ] Document theme interface
- [ ] Create validation tools
- [ ] Write spec documentation

### Phase 3: Refactor Current Theme
- [ ] Implement spec in current theme
- [ ] Use core for cascade
- [ ] Add theme.json
- [ ] Test spec compliance

### Phase 4: Theme Dev Kit
- [ ] `create-eleventy-theme` CLI
- [ ] Starter template
- [ ] Testing helpers
- [ ] Documentation

### Phase 5: Example Themes
- [ ] Refactor blog theme
- [ ] Create docs theme
- [ ] Create portfolio theme
- [ ] Prove themes are swappable

---

## 10. Benefits of This Approach

### For Theme Authors
- ✅ **Don't reinvent the wheel** - Core handles cascade, resolution
- ✅ **Focus on design** - Just write layouts and styles
- ✅ **Testable** - Spec compliance tests built-in
- ✅ **Documented** - Clear interface to implement

### For Users
- ✅ **Swappable themes** - Change import, get new design
- ✅ **Predictable** - All themes follow same structure
- ✅ **Configurable** - Override anything
- ✅ **No lock-in** - Easy to switch themes

### For Ecosystem
- ✅ **Standardization** - Themes are compatible
- ✅ **Quality** - Spec ensures best practices
- ✅ **Composability** - Themes can build on each other
- ✅ **Growth** - Easy to create new themes

---

## 11. Key Design Principles

### 1. Separation of Concerns
- **Theme** = Design (how it looks)
- **Content** = Information (what it says)
- **Config** = Behavior (how it works)

### 2. Convention over Configuration
- Sensible defaults
- Predictable structure
- Override only when needed

### 3. Progressive Enhancement
- MVP works out of box
- Features are opt-in
- Themes can extend spec

### 4. Zero Lock-In
- Switch themes easily
- No migration needed
- Content stays same

### 5. Modern Tooling
- npm ecosystem
- ES modules
- Vite, PostCSS, etc.
- JavaScript all the way

---

## 12. What Makes This Different

### vs. Hugo Themes
- ✅ JavaScript ecosystem (npm, modern tools)
- ✅ Less opinionated about content
- ✅ Spec-based (testable, validated)
- ✅ Full plugin system

### vs. Jekyll Themes
- ✅ Modern build pipeline (Vite)
- ✅ Async/await, ES modules
- ✅ Component-based (not just templates)
- ✅ JavaScript ecosystem

### vs. Current Eleventy Themes
- ✅ **Standardized** (spec to follow)
- ✅ **Swappable** (common interface)
- ✅ **Reusable core** (don't duplicate cascade logic)
- ✅ **Testable** (validation built-in)

---

## 13. Next Steps

### Immediate (This Theme)
1. ✅ Finish refactoring cascade
2. ✅ Create plugin API
3. [ ] Add theme.json
4. [ ] Document spec compliance

### Short-term (Extract Core)
1. [ ] Create `@eleventy-themes/core` package
2. [ ] Move cascade, template loader, build tools
3. [ ] Add tests
4. [ ] Publish to npm

### Medium-term (Create Spec)
1. [ ] Write formal spec document
2. [ ] Create `@eleventy-themes/spec` package
3. [ ] Add validation tools
4. [ ] Create testing helpers

### Long-term (Ecosystem)
1. [ ] Create more example themes
2. [ ] Build theme dev kit
3. [ ] Write comprehensive docs
4. [ ] Grow theme ecosystem

---

## Conclusion

**Goal:** Create a standardized theme framework for Eleventy that borrows the best from Hugo and Jekyll while leveraging JavaScript ecosystem advantages.

**Key Innovation:** Spec-based themes with reusable core, making themes:
- Easy to create (use core)
- Easy to use (plugin API)
- Easy to swap (common interface)
- Easy to extend (beyond spec)

**This isn't about making ONE theme better - it's about creating a SYSTEM for great themes.**

Would you like to proceed with extracting the core into `@eleventy-themes/core`?
