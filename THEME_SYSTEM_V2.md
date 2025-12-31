# Eleventy Theme System v2 - Build-Agnostic Architecture

This document refines the theme system proposal based on critical feedback:
- Clearer mandatory vs optional structure
- Build-system agnostic core
- Standard terminology (features instead of bundles)
- Minimal theme.json schema

## Core Principles

### 1. Separation of Concerns

```
┌─────────────────────────────────────────┐
│  @eleventy-themes/core                  │  Build-system agnostic
│  - Cascade resolution                   │  Works with ANY build setup
│  - Template loading                     │  or NO build system
│  - Data cascade                         │
│  - Validation                           │
└─────────────────────────────────────────┘
         ▲                ▲
         │                │
         │                └──────────────────┐
         │                                   │
┌────────┴─────────┐              ┌─────────┴────────────┐
│  Theme Package   │              │  Build Integrations  │  Optional
│  - Layouts       │              │  - @11ty/vite        │  Choose your tool
│  - Styles        │              │  - @11ty/webpack     │
│  - Features      │              │  - Custom            │
└──────────────────┘              └──────────────────────┘
         ▲
         │
┌────────┴─────────┐
│  Content Repo    │  Full control
│  - Content       │  Content + Build choice
│  - Collections   │
│  - Build config  │
└──────────────────┘
```

### 2. Progressive Enhancement

**Minimal theme:**
```
my-theme/
├── theme.json      # Metadata
└── layouts/        # At least one layout
    └── base.njk
```

**Full-featured theme:**
```
my-theme/
├── theme.json      # Metadata
├── layouts/        # Templates
├── styles/         # Optional CSS
├── scripts/        # Optional JS
├── features/       # Optional features
├── data/           # Optional defaults
└── public/         # Optional assets
```

## theme.json Schema

### Minimal Required

```json
{
  "name": "my-theme",
  "version": "1.0.0",
  "structure": {
    "layouts": "layouts"
  }
}
```

### Full Specification

```json
{
  "$schema": "https://eleventy-themes.dev/schema/v1.json",

  "// ═══════════════════════════════════════",
  "// REQUIRED FIELDS",
  "// ═══════════════════════════════════════",

  "name": "my-theme",
  "version": "1.0.0",

  "structure": {
    "layouts": "layouts"
  },

  "// ═══════════════════════════════════════",
  "// RECOMMENDED FIELDS",
  "// ═══════════════════════════════════════",

  "description": "A brief description",
  "author": "Your Name",
  "license": "MIT",
  "homepage": "https://github.com/user/my-theme",

  "// ═══════════════════════════════════════",
  "// OPTIONAL FIELDS",
  "// ═══════════════════════════════════════",

  "structure": {
    "layouts": "layouts",
    "partials": "layouts/partials",
    "styles": "styles",
    "scripts": "scripts",
    "features": "features",
    "data": "data",
    "public": "public"
  },

  "cascade": {
    "enabled": true,
    "defaultOverridePaths": {
      "layouts": "overrides/layouts",
      "styles": "overrides/styles",
      "data": "content/_data",
      "public": "public"
    },
    "resolution": "user-first"
  },

  "layouts": [
    {
      "name": "base",
      "path": "layouts/base.njk",
      "description": "Base layout"
    }
  ],

  "features": [
    {
      "name": "syntax-highlighting",
      "entry": "features/syntax-highlighting.js",
      "styles": "styles/features/syntax-highlighting.scss",
      "optional": true
    }
  ],

  "data": [
    {
      "name": "site",
      "path": "data/site.js",
      "description": "Default site config"
    }
  ],

  "// Freestyle - add anything else your theme needs",
  "cssVariables": { ... },
  "customField": "anything"
}
```

## Terminology Changes

| Old Term | New Term | Reason |
|----------|----------|--------|
| Bundles | **Features** | Standard across frameworks, clearer intent |
| Bundle init | Feature init | Consistency |
| @theme/bundles | @theme/features | Consistency |

## Mandatory vs Optional Structure

### MVP Theme (Mandatory)

**Required files:**
- `theme.json` - Minimum: name, version, structure.layouts
- `layouts/base.njk` - At least one layout

**Required in theme.json:**
```json
{
  "name": "my-theme",
  "version": "1.0.0",
  "structure": {
    "layouts": "layouts"
  }
}
```

**Validation rules:**
1. ✅ theme.json exists
2. ✅ Required fields present (name, version, structure.layouts)
3. ✅ Layouts directory exists
4. ✅ At least one .njk file in layouts/

### Optional Enhancements

Everything else is optional:
- **Styles** - Theme can provide CSS, or not
- **Scripts** - Theme can provide JS, or not
- **Features** - Optional feature sets
- **Data** - Default data files
- **Assets** - Favicons, robots.txt, etc.
- **Filters/Shortcodes** - Custom template helpers

## Build-System Agnostic Core

### What's in @eleventy-themes/core

**Build-system agnostic functionality:**

```javascript
// @eleventy-themes/core

export function createThemePlugin(themeSpec, options = {}) {
  return function themePlugin(eleventyConfig, userOptions = {}) {
    // 1. Validate theme spec
    validateTheme(themeSpec);

    // 2. Configure Nunjucks with @theme alias
    configureTemplateLoader(eleventyConfig, {
      themeName: themeSpec.name,
      themeLayouts: themeSpec.structure.layouts,
      overridePaths: userOptions.overridePaths,
    });

    // 3. Configure data cascade (Eleventy native)
    configureDataCascade(eleventyConfig, {
      themeData: themeSpec.structure.data,
      overridePaths: userOptions.overridePaths,
    });

    // 4. Configure static assets (Eleventy passthrough copy)
    configureAssetCascade(eleventyConfig, {
      themeAssets: themeSpec.structure.public,
      overridePaths: userOptions.overridePaths,
    });

    // 5. Register theme filters, shortcodes, transforms
    registerThemeHelpers(eleventyConfig, options.helpers);
  };
}
```

**No build-system dependencies:**
- No Vite imports
- No Webpack imports
- Works with Eleventy's native features only

### What's in Build Integrations

**@eleventy-themes/vite** (optional):

```javascript
export function createViteConfig(themeSpec, userConfig = {}) {
  return {
    resolve: {
      alias: {
        '@theme': path.resolve('node_modules', themeSpec.name),
      },
    },
    // Auto-import theme styles
    plugins: [autoImportThemeAssets(themeSpec)],
    ...userConfig,
  };
}
```

**@eleventy-themes/webpack** (future):

```javascript
export function createWebpackConfig(themeSpec, userConfig = {}) {
  // Similar Webpack integration
}
```

## Theme Package Structure

### Without Build System

```javascript
// my-theme/lib/index.mjs
import { createThemePlugin } from '@eleventy-themes/core';
import metadata from '../theme.json' assert { type: 'json' };
import filters from './filters.mjs';

export const plugin = createThemePlugin(metadata, {
  helpers: { filters },
});

export default { plugin, metadata };
```

### With Vite Integration (Optional)

```javascript
// my-theme/lib/index.mjs
import { createThemePlugin } from '@eleventy-themes/core';
import metadata from '../theme.json' assert { type: 'json' };

export const plugin = createThemePlugin(metadata, { ... });

// Optional Vite integration
export { viteConfig } from './vite.mjs';

export default { plugin, metadata };
```

```javascript
// my-theme/lib/vite.mjs
import { createViteConfig } from '@eleventy-themes/vite';
import metadata from '../theme.json' assert { type: 'json' };

export function viteConfig(userConfig = {}) {
  return createViteConfig(metadata, userConfig);
}
```

## Content Repo Usage

### Minimal (No Build System)

```javascript
// eleventy.config.mjs
import theme from 'my-theme';

export default function(eleventyConfig) {
  eleventyConfig.addPlugin(theme.plugin, {
    importMetaUrl: import.meta.url,
  });

  // Your content config
  eleventyConfig.addCollection('posts', ...);

  return {
    dir: { input: 'content', output: '_site' }
  };
}
```

No build system needed! Cascade works with Eleventy's native features.

### With Vite (Optional)

```javascript
// eleventy.config.mjs
import theme from 'my-theme';
import { viteConfig } from 'my-theme/vite';
import EleventyVitePlugin from '@11ty/eleventy-plugin-vite';

export default function(eleventyConfig) {
  // Theme (build-agnostic)
  eleventyConfig.addPlugin(theme.plugin, {
    importMetaUrl: import.meta.url,
  });

  // Vite (optional - your choice)
  eleventyConfig.addPlugin(EleventyVitePlugin, {
    viteOptions: viteConfig({
      // Your custom Vite config
    }),
  });

  return {
    dir: { input: 'content', output: '_site' }
  };
}
```

### With Webpack (Future)

```javascript
import theme from 'my-theme';
import { webpackConfig } from 'my-theme/webpack';
// Same pattern, different build tool
```

## Validation Rules (validateSpec)

Core validation in @eleventy-themes/core:

```javascript
export function validateTheme(themeSpec) {
  const errors = [];

  // 1. Required fields
  if (!themeSpec.name) errors.push('Missing required field: name');
  if (!themeSpec.version) errors.push('Missing required field: version');
  if (!themeSpec.structure?.layouts) {
    errors.push('Missing required field: structure.layouts');
  }

  // 2. Layouts directory exists
  const layoutsPath = path.join(themeRoot, themeSpec.structure.layouts);
  if (!fs.existsSync(layoutsPath)) {
    errors.push(`Layouts directory not found: ${layoutsPath}`);
  }

  // 3. At least one layout exists
  const layouts = fs.readdirSync(layoutsPath).filter(f => f.endsWith('.njk'));
  if (layouts.length === 0) {
    errors.push('No layouts found - theme must provide at least one .njk layout');
  }

  // 4. Declared layouts exist
  if (themeSpec.layouts) {
    themeSpec.layouts.forEach(layout => {
      const layoutPath = path.join(themeRoot, layout.path);
      if (!fs.existsSync(layoutPath)) {
        errors.push(`Declared layout not found: ${layout.path}`);
      }
    });
  }

  // 5. No build-system requirements in core
  // (Build integrations are optional)

  // 6. Structure paths don't escape theme package
  Object.values(themeSpec.structure || {}).forEach(structPath => {
    if (structPath.includes('..')) {
      errors.push(`Invalid path (escapes theme): ${structPath}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

## Migration from Current Implementation

### Phase 1: Update Terminology
- [x] Rename bundles/ → features/
- [x] Update theme.json: bundles → features
- [x] Update code references
- [x] Update documentation

### Phase 2: Extract Core
- [ ] Create @eleventy-themes/core package
- [ ] Move cascade logic (build-agnostic parts)
- [ ] Move template loader
- [ ] Move validation
- [ ] No Vite dependencies

### Phase 3: Extract Build Integrations
- [ ] Create @eleventy-themes/vite package
- [ ] Move Vite-specific code
- [ ] Make optional in theme package

### Phase 4: Update Theme Package
- [ ] Use @eleventy-themes/core
- [ ] Optional: Export vite integration
- [ ] Validate against minimal spec

## Benefits of This Architecture

### 1. Build-System Neutral
- Core theme works without ANY build system
- Vite, Webpack, Parcel, etc. are opt-in
- Future-proof against build tool changes

### 2. Clear Responsibilities

| Layer | Responsibility | Build System |
|-------|---------------|--------------|
| @eleventy-themes/core | Cascade, templates, data | Agnostic ✅ |
| Theme package | Layouts, styles, features | Agnostic ✅ |
| Build integrations | @theme in build tools | Specific 🔧 |
| Content repo | Content + build choice | Their choice ✅ |

### 3. Minimal Barrier to Entry

**Simple theme:**
```
my-theme/
├── theme.json (3 required fields)
└── layouts/base.njk
```

**Simple usage:**
```javascript
eleventyConfig.addPlugin(theme.plugin, {
  importMetaUrl: import.meta.url
});
```

No build system knowledge required!

### 4. Progressive Enhancement
- Start simple (layouts only)
- Add styles when needed
- Add features when needed
- Add build integration when needed

## Comparison with Other Systems

### Hugo
- ✅ We match: Modular features, clear separation
- ✅ We improve: Build-system neutral, npm ecosystem
- ❌ Hugo advantage: Larger ecosystem

### Jekyll
- ✅ We match: Gem/npm distribution, override system
- ✅ We improve: Modern build tools, JavaScript
- ❌ Jekyll advantage: Established ecosystem

### Our Advantages
1. **Build-agnostic core** - Works with or without build tools
2. **Minimal MVP** - 2 files to start
3. **Clear validation** - Machine-checkable rules
4. **Progressive** - Add complexity as needed
5. **Standard terms** - "Features" not "bundles"

## Questions Answered

### Q: Is there another word for bundles?
**A: "Features"** - Standard term, clearer intent, optional nature obvious

### Q: What's mandatory vs optional?
**A:**
- **Mandatory:** theme.json (3 fields) + layouts/ (1+ file)
- **Optional:** Everything else

### Q: What's the minimum theme.json structure?
**A:**
```json
{
  "name": "my-theme",
  "version": "1.0.0",
  "structure": { "layouts": "layouts" }
}
```

### Q: What does validateSpec check?
**A:**
1. Required fields exist
2. Layouts directory exists
3. At least one layout file
4. Declared resources exist
5. Paths don't escape theme
6. No build-system requirements

### Q: Should configureBuildTools be theme's job?
**A: No!** Build system is content repo's choice:
- Core theme: build-agnostic
- Build integrations: optional packages
- Content repo: chooses Vite, Webpack, or nothing

### Q: How to be build-system neutral?
**A:** Separate core cascade logic from build tools:
- @eleventy-themes/core - Works with Eleventy native features only
- @eleventy-themes/vite - Optional Vite integration
- @eleventy-themes/webpack - Optional Webpack integration

## Next Steps

1. Update current theme to use "features" terminology
2. Define minimal theme.json schema
3. Extract build-agnostic core
4. Create optional Vite integration package
5. Document MVP theme creation
6. Create validation rules
