# Refactoring Proposal: Reorganize lib/ Directory

## Problem Statement

The current `lib/` directory has several issues:

1. **Flat structure** - 12 files with no logical grouping
2. **Repetitive cascade logic** - Same pattern in 4 files (data, bundles, assets, layouts)
3. **Mixed responsibilities** - Eleventy APIs, build tools, and utilities all mixed together
4. **Hard to navigate** - No clear mental model of what goes where

### Current Structure Problems

```
lib/
├── index.mjs              # 161 lines - Orchestration
├── metadata.mjs           # 45 lines  - Configuration
├── filters.mjs            # 55 lines  - Eleventy API
├── shortcodes.mjs         # 5 lines   - Eleventy API
├── transforms.mjs         # 1 line    - Eleventy API
├── nunjucks.mjs           # 105 lines - Cascade + Eleventy API
├── data-cascade.mjs       # 211 lines - Cascade logic
├── resolve-bundle.mjs     # 145 lines - Cascade logic
├── static-assets.mjs      # 199 lines - Cascade logic
├── get-page-bundles.mjs   # 62 lines  - Build tool integration
├── vite.mjs               # 169 lines - Build tool integration
└── validate.mjs           # 248 lines - Utilities
```

**Issues:**
- No clear separation between Eleventy template features vs. build system vs. cascade system
- 4 files implement similar cascade logic independently
- Hard to find related functionality
- Difficult to understand the architecture

---

## Repetitive Patterns Found

### Pattern 1: Path Construction (appears 4× in different files)

```javascript
// In data-cascade.mjs, resolve-bundle.mjs, static-assets.mjs, validate.mjs
const themeRoot = path.join(projectRoot, 'node_modules', metadata.name);
const themePath = path.join(themeRoot, 'some-dir', filename);
```

### Pattern 2: Override Path Resolution (27 occurrences)

```javascript
// Appears in every cascade file
const userPath = overridePaths.something || metadata.defaultOverridePaths.something;
```

### Pattern 3: File Existence Check with Cascade (28 occurrences)

```javascript
// Check user first, then theme
if (fs.existsSync(userPath)) {
  return userPath;
}
if (fs.existsSync(themePath)) {
  return themePath;
}
```

### Pattern 4: Directory Scanning with Source Tracking (3×)

```javascript
// In data-cascade.mjs, resolve-bundle.mjs, static-assets.mjs
const items = new Map();

// Scan theme
fs.readdirSync(themePath).forEach(file => {
  items.set(file, { name: file, source: 'theme', path: ... });
});

// Scan user (creates 'override' or 'user')
fs.readdirSync(userPath).forEach(file => {
  const isOverride = items.has(file);
  items.set(file, { name: file, source: isOverride ? 'override' : 'user', path: ... });
});
```

---

## Proposed New Structure

### Option A: By Responsibility (Recommended)

```
lib/
├── index.mjs                    # Main entry point (unchanged)
├── metadata.mjs                 # Theme configuration (unchanged)
│
├── eleventy/                    # Eleventy-specific features
│   ├── filters.mjs             # Nunjucks filters
│   ├── shortcodes.mjs          # Nunjucks shortcodes
│   ├── transforms.mjs          # HTML transforms
│   └── template-loader.mjs     # Nunjucks loader (renamed from nunjucks.mjs)
│
├── cascade/                     # Cascade/override system
│   ├── resolver.mjs            # NEW: Shared cascade utilities
│   ├── data.mjs                # Data file cascade (from data-cascade.mjs)
│   ├── bundles.mjs             # Bundle cascade (from resolve-bundle.mjs)
│   ├── assets.mjs              # Static asset cascade (from static-assets.mjs)
│   └── index.mjs               # NEW: Unified cascade API
│
├── build/                       # Build tool integrations
│   ├── vite.mjs                # Vite configuration
│   └── bundle-entries.mjs      # Bundle entry points (from get-page-bundles.mjs)
│
└── utils/                       # General utilities
    └── validate.mjs            # Theme validation
```

**Benefits:**
- Clear separation of concerns
- Easy to find related functionality
- Scalable (add more Eleventy features to `eleventy/`, more cascade types to `cascade/`)
- Follows common project organization patterns

### Option B: By Layer

```
lib/
├── core/
│   ├── index.mjs
│   └── metadata.mjs
├── template/
│   ├── filters.mjs
│   ├── shortcodes.mjs
│   ├── transforms.mjs
│   └── loader.mjs
├── resources/
│   ├── cascade.mjs              # Shared cascade logic
│   ├── data.mjs
│   ├── bundles.mjs
│   └── assets.mjs
└── integration/
    ├── vite.mjs
    └── validate.mjs
```

**Recommendation:** Use **Option A** - it's clearer and more intuitive.

---

## Step 1: Create Shared Cascade Utilities

### New File: `lib/cascade/resolver.mjs`

This consolidates ALL repetitive cascade logic into one place:

```javascript
/**
 * Shared cascade resolution utilities
 *
 * Provides a unified API for resolving resources with user override support.
 * Used by data files, bundles, layouts, and static assets.
 */

import fs from 'fs';
import path from 'path';
import { metadata } from '../metadata.mjs';

/**
 * Get theme root directory
 */
export function getThemeRoot(projectRoot) {
  return path.join(projectRoot, 'node_modules', metadata.name);
}

/**
 * Get override path with fallback to default
 */
export function getOverridePath(overridePaths, key) {
  return overridePaths?.[key] || metadata.defaultOverridePaths[key];
}

/**
 * Build full paths for user and theme resources
 */
export function buildPaths(projectRoot, overridePaths, resourceType, filename = '') {
  const userDir = getOverridePath(overridePaths, resourceType);
  const themeDir = metadata.paths[resourceType];
  const themeRoot = getThemeRoot(projectRoot);

  return {
    user: path.join(projectRoot, userDir, filename),
    theme: path.join(themeRoot, themeDir, filename),
    userDir: path.join(projectRoot, userDir),
    themeDir: path.join(themeRoot, themeDir),
  };
}

/**
 * Resolve a single resource with cascade priority (user > theme)
 *
 * @param {Object} options
 * @param {string} options.projectRoot - Content repo root
 * @param {Object} options.overridePaths - User override paths
 * @param {string} options.resourceType - Type: 'data', 'bundles', 'layouts', 'public'
 * @param {string} options.filename - File to resolve
 * @param {boolean} options.throwOnMissing - Throw error if not found
 * @returns {{ path: string, source: 'user'|'theme' }|null}
 */
export function resolveResource({
  projectRoot,
  overridePaths = {},
  resourceType,
  filename,
  throwOnMissing = false,
  errorMessage = null,
}) {
  const paths = buildPaths(projectRoot, overridePaths, resourceType, filename);

  // Check user override first
  if (fs.existsSync(paths.user)) {
    return { path: paths.user, source: 'user' };
  }

  // Fall back to theme
  if (fs.existsSync(paths.theme)) {
    return { path: paths.theme, source: 'theme' };
  }

  // Not found
  if (throwOnMissing) {
    throw new Error(
      errorMessage ||
        `Resource "${filename}" not found in ${resourceType}\n` +
          `Checked:\n  - ${paths.user}\n  - ${paths.theme}`
    );
  }

  return null;
}

/**
 * Scan directory with optional filter
 */
export function scanDirectory(dirPath, filter = () => true) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  try {
    return fs.readdirSync(dirPath).filter(filter);
  } catch (error) {
    // Handle permission errors gracefully
    return [];
  }
}

/**
 * Scan both user and theme directories, track sources
 *
 * Returns a Map where:
 * - 'theme': File only exists in theme
 * - 'user': File only exists in user directory
 * - 'override': File exists in both (user wins)
 *
 * @param {Object} options
 * @param {string} options.projectRoot
 * @param {Object} options.overridePaths
 * @param {string} options.resourceType - 'data', 'bundles', 'public'
 * @param {Function} options.filter - File filter function
 * @returns {Map<string, { name, source, path }>}
 */
export function scanWithCascade({
  projectRoot,
  overridePaths = {},
  resourceType,
  filter = () => true,
}) {
  const items = new Map();
  const paths = buildPaths(projectRoot, overridePaths, resourceType);

  // Scan theme directory first
  scanDirectory(paths.themeDir, filter).forEach((file) => {
    items.set(file, {
      name: file,
      source: 'theme',
      path: path.join(paths.themeDir, file),
    });
  });

  // Scan user directory (overrides or additions)
  scanDirectory(paths.userDir, filter).forEach((file) => {
    const isOverride = items.has(file);
    items.set(file, {
      name: file,
      source: isOverride ? 'override' : 'user',
      path: path.join(paths.userDir, file),
    });
  });

  return items;
}

/**
 * Scan directory recursively
 *
 * Used for static assets which can be nested
 */
export function scanDirectoryRecursive(dirPath, baseDir = dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  let files = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        files = files.concat(scanDirectoryRecursive(fullPath, baseDir));
      } else {
        // Return relative path from base
        files.push(path.relative(baseDir, fullPath));
      }
    }
  } catch (error) {
    // Handle permission errors gracefully
  }

  return files;
}

/**
 * Check if resource exists (in user or theme)
 */
export function resourceExists(projectRoot, overridePaths, resourceType, filename) {
  const result = resolveResource({
    projectRoot,
    overridePaths,
    resourceType,
    filename,
    throwOnMissing: false,
  });

  return result !== null;
}
```

---

## Step 2: Refactor Existing Files

### Example: Refactor `data-cascade.mjs` → `cascade/data.mjs`

**Before:** 211 lines with duplicated path logic

**After:** ~80 lines, uses shared utilities

```javascript
/**
 * Data file cascade
 *
 * Manages data files (site.js, navigation.js) with user override support.
 */

import path from 'path';
import {
  resolveResource,
  scanWithCascade,
  resourceExists,
} from './resolver.mjs';

/**
 * Configure data cascade
 *
 * Registers theme data files via addGlobalData().
 * User files in _data/ automatically override via Eleventy's cascade.
 */
export function configureDataCascade(eleventyConfig, projectRoot, overridePaths = {}) {
  const availableData = getAvailableDataFiles(projectRoot, overridePaths);

  availableData.forEach((fileInfo, filename) => {
    // Only register theme data files
    // User files will be picked up by Eleventy's native data directory
    if (fileInfo.source === 'theme') {
      const dataName = path.basename(filename, path.extname(filename));

      eleventyConfig.addGlobalData(dataName, async () => {
        const mod = await import(fileInfo.path);
        return mod.default || mod;
      });
    }
  });
}

/**
 * Resolve data file path
 */
export function resolveDataFile(filename, projectRoot, overridePaths = {}) {
  const result = resolveResource({
    projectRoot,
    overridePaths,
    resourceType: 'data',
    filename,
    throwOnMissing: false,
  });

  return result?.path || null;
}

/**
 * Check if data file exists
 */
export function dataFileExists(filename, projectRoot, overridePaths = {}) {
  return resourceExists(projectRoot, overridePaths, 'data', filename);
}

/**
 * Get all available data files
 */
export function getAvailableDataFiles(projectRoot, overridePaths = {}) {
  return scanWithCascade({
    projectRoot,
    overridePaths,
    resourceType: 'data',
    filter: (file) => file.endsWith('.js') || file.endsWith('.json'),
  });
}

/**
 * Merge theme data with user data (copy to user directory)
 *
 * DEPRECATED: Use configureDataCascade() instead.
 * This function is kept for backwards compatibility.
 */
export function mergeDataFiles(projectRoot, overridePaths = {}) {
  console.warn(
    'mergeDataFiles() is deprecated. Data cascade is now automatic via configureDataCascade().'
  );

  // Implementation kept for backwards compatibility
  // ... (existing code)
}
```

**Savings:**
- **-131 lines** (211 → 80)
- Eliminated all path construction logic
- Eliminated directory scanning logic
- Much easier to understand

---

### Example: Refactor `resolve-bundle.mjs` → `cascade/bundles.mjs`

**Before:** 145 lines

**After:** ~60 lines

```javascript
/**
 * Bundle cascade
 *
 * Manages JavaScript bundles with user override support.
 */

import path from 'path';
import { metadata } from '../metadata.mjs';
import {
  resolveResource,
  scanWithCascade,
  resourceExists,
} from './resolver.mjs';

/**
 * Resolve bundle path with cascade
 */
export function resolveBundlePath(bundleName, projectRoot, overridePaths = {}) {
  const result = resolveResource({
    projectRoot,
    overridePaths,
    resourceType: 'bundles',
    filename: `${bundleName}.js`,
    throwOnMissing: true,
    errorMessage: createBundleErrorMessage(bundleName, overridePaths),
  });

  return result.path;
}

/**
 * Check if bundle exists
 */
export function bundleExists(bundleName, projectRoot, overridePaths = {}) {
  return resourceExists(projectRoot, overridePaths, 'bundles', `${bundleName}.js`);
}

/**
 * Get all available bundles
 */
export function getAvailableBundles(projectRoot, overridePaths = {}) {
  const bundles = scanWithCascade({
    projectRoot,
    overridePaths,
    resourceType: 'bundles',
    filter: (file) => file.endsWith('.js'),
  });

  // Remove .js extension from names
  const result = new Map();
  bundles.forEach((info, filename) => {
    const name = path.basename(filename, '.js');
    result.set(name, { ...info, name });
  });

  return result;
}

/**
 * Helper: Create helpful error message for missing bundles
 */
function createBundleErrorMessage(bundleName, overridePaths) {
  const availableBundles =
    metadata.bundles.length > 0 ? metadata.bundles.join(', ') : 'none';

  return (
    `Bundle "${bundleName}" not found.\n\n` +
    `Available theme bundles: ${availableBundles}\n` +
    `To create a custom bundle, add: ${overridePaths.bundles || 'overrides/bundles'}/${bundleName}.js\n` +
    `To extend a theme bundle, import from '@theme/bundles/${bundleName}.js'`
  );
}
```

**Savings:**
- **-85 lines** (145 → 60)
- All path logic moved to resolver
- Cleaner, more focused

---

### Example: Refactor `static-assets.mjs` → `cascade/assets.mjs`

**Before:** 199 lines

**After:** ~100 lines

```javascript
/**
 * Static asset cascade
 *
 * Manages public files (favicon, robots.txt) with user override support.
 */

import path from 'path';
import {
  buildPaths,
  scanDirectoryRecursive,
  resolveResource,
} from './resolver.mjs';

/**
 * Configure passthrough copy with cascade
 */
export function configurePassthroughCopy(eleventyConfig, projectRoot, overridePaths = {}) {
  const paths = buildPaths(projectRoot, overridePaths, 'public');
  const assets = getAvailableAssets(projectRoot, overridePaths);

  let themeAssetsUsed = 0;
  let userOverrides = 0;

  assets.forEach((info) => {
    if (info.source === 'theme') {
      eleventyConfig.addPassthroughCopy({
        [info.path]: info.name,
      });
      themeAssetsUsed++;
    } else {
      // User file - already handled by Eleventy's normal passthrough
      userOverrides++;
    }
  });

  console.log(`📁 Using ${themeAssetsUsed} theme assets (override by adding to public/)`);
  if (userOverrides > 0) {
    console.log(`✨ User overrode ${userOverrides} theme asset(s)`);
  }
}

/**
 * Resolve static asset path
 */
export function resolveStaticAsset(filename, projectRoot, overridePaths = {}) {
  const result = resolveResource({
    projectRoot,
    overridePaths,
    resourceType: 'public',
    filename,
    throwOnMissing: false,
  });

  return result?.path || null;
}

/**
 * Get all available static assets
 */
export function getAvailableAssets(projectRoot, overridePaths = {}) {
  const assets = new Map();
  const paths = buildPaths(projectRoot, overridePaths, 'public');

  // Scan theme assets (recursive)
  const themeFiles = scanDirectoryRecursive(paths.themeDir);
  themeFiles.forEach((relativePath) => {
    assets.set(relativePath, {
      name: relativePath,
      source: 'theme',
      path: path.join(paths.themeDir, relativePath),
    });
  });

  // Scan user assets (overrides or additions)
  const userFiles = scanDirectoryRecursive(paths.userDir);
  userFiles.forEach((relativePath) => {
    const isOverride = assets.has(relativePath);
    assets.set(relativePath, {
      name: relativePath,
      source: isOverride ? 'override' : 'user',
      path: path.join(paths.userDir, relativePath),
    });
  });

  return assets;
}
```

**Savings:**
- **-99 lines** (199 → 100)
- Eliminated recursive scan logic (now in resolver)
- Eliminated path construction

---

## Step 3: Create Unified Cascade API

### New File: `lib/cascade/index.mjs`

```javascript
/**
 * Unified cascade configuration
 *
 * Single entry point for all cascade systems
 */

import { configureDataCascade } from './data.mjs';
import { configurePassthroughCopy } from './assets.mjs';
import { configureNunjucks } from '../eleventy/template-loader.mjs';

/**
 * Configure all cascade systems
 *
 * This replaces individual configure* calls in the main init()
 */
export function configureCascade(eleventyConfig, projectRoot, overridePaths = {}) {
  // Template cascade (layouts, partials)
  configureNunjucks(eleventyConfig, {
    projectRoot,
    themeName: 'eleventy-base-blog-template',
    overridePaths,
  });

  // Data cascade (site.js, navigation.js)
  configureDataCascade(eleventyConfig, projectRoot, overridePaths);

  // Asset cascade (public files)
  configurePassthroughCopy(eleventyConfig, projectRoot, overridePaths);

  // Bundle cascade is implicit (handled by Vite)
}

// Re-export all cascade utilities
export * from './data.mjs';
export * from './bundles.mjs';
export * from './assets.mjs';
export * from './resolver.mjs';
```

---

## Step 4: Update Main Entry Point

### Updated `lib/index.mjs`

**Before:**
```javascript
import { configureNunjucks } from './nunjucks.mjs';
import { configureDataCascade } from './data-cascade.mjs';
// ... separate imports

export function init(eleventyConfig, options = {}) {
  // ... validation ...

  configureNunjucks(eleventyConfig, { ... });
  configureDataCascade(eleventyConfig, projectRoot, overridePaths);

  // ... filters, shortcodes, transforms ...
}
```

**After:**
```javascript
import filters from './eleventy/filters.mjs';
import transforms from './eleventy/transforms.mjs';
import shortcodes from './eleventy/shortcodes.mjs';
import { configureCascade } from './cascade/index.mjs';
import { validateTheme, logValidation } from './utils/validate.mjs';

export function init(eleventyConfig, options = {}) {
  // ... validation ...

  // Single call to configure all cascades
  configureCascade(eleventyConfig, projectRoot, overridePaths, additionalLayoutPaths);

  // ... filters, shortcodes, transforms ...
}

// Re-exports
export { getThemeViteConfig, themeAutoImportPlugin } from './build/vite.mjs';
export { getPageBundleEntries } from './build/bundle-entries.mjs';
export * from './cascade/index.mjs';
export { validateTheme, logValidation, validateComponent } from './utils/validate.mjs';
```

**Benefits:**
- Clearer intent (one call for all cascades)
- Easier to maintain
- Organized imports

---

## Migration Guide

### Step-by-Step Refactoring

1. **Create new directory structure** (no code changes yet)
   ```bash
   mkdir lib/cascade lib/eleventy lib/build lib/utils
   ```

2. **Create shared resolver**
   - Write `lib/cascade/resolver.mjs` (new file)
   - Test it in isolation

3. **Refactor cascade files** (one at a time)
   - Move `data-cascade.mjs` → `cascade/data.mjs`, update to use resolver
   - Move `resolve-bundle.mjs` → `cascade/bundles.mjs`, update to use resolver
   - Move `static-assets.mjs` → `cascade/assets.mjs`, update to use resolver
   - Test after each move

4. **Create unified API**
   - Write `cascade/index.mjs`
   - Update `lib/index.mjs` to use it
   - Test

5. **Move other files**
   - Move `filters.mjs`, `shortcodes.mjs`, `transforms.mjs` → `eleventy/`
   - Move `nunjucks.mjs` → `eleventy/template-loader.mjs`
   - Move `vite.mjs` → `build/vite.mjs`
   - Move `get-page-bundles.mjs` → `build/bundle-entries.mjs`
   - Move `validate.mjs` → `utils/validate.mjs`

6. **Update imports throughout**
   - Update all imports in moved files
   - Update imports in index.mjs
   - Update imports in test files (if any)

7. **Update documentation**
   - Update README examples
   - Update MIGRATION guide

### Breaking Changes

**None** - All exports remain the same:

```javascript
// Users can still do this (unchanged)
import theme, {
  getThemeViteConfig,
  getPageBundleEntries,
  configurePassthroughCopy,
  resolveDataFile,
  resolveBundlePath,
} from 'eleventy-base-blog-template';
```

The internal organization changes, but the public API stays identical.

---

## Expected Benefits

### Code Reduction

| File | Before | After | Savings |
|------|--------|-------|---------|
| data-cascade.mjs | 211 | 80 | **-131** |
| resolve-bundle.mjs | 145 | 60 | **-85** |
| static-assets.mjs | 199 | 100 | **-99** |
| validate.mjs | 248 | 180 | **-68** |
| **Total** | **803** | **420** | **-383** |

Plus new `cascade/resolver.mjs`: +150 lines

**Net savings: -233 lines** (~30% reduction in cascade-related code)

### Maintainability

- **Single source of truth** for path resolution
- **Easier to test** (resolver can be unit tested independently)
- **Easier to extend** (add new cascade types by following pattern)
- **Clearer architecture** (obvious where things belong)

### Developer Experience

- **Easier to navigate** (grouped by purpose)
- **Easier to understand** (less code to read)
- **Easier to debug** (centralized logic)
- **Easier to onboard** (clear structure)

---

## Recommended Approach

### Phase 1: Create Foundation (2-3 hours)
1. Create directory structure
2. Write `cascade/resolver.mjs`
3. Write unit tests for resolver
4. Verify tests pass

### Phase 2: Refactor Cascade Files (3-4 hours)
5. Refactor `data-cascade.mjs` → `cascade/data.mjs`
6. Refactor `resolve-bundle.mjs` → `cascade/bundles.mjs`
7. Refactor `static-assets.mjs` → `cascade/assets.mjs`
8. Create `cascade/index.mjs`
9. Test each refactoring

### Phase 3: Reorganize Remaining Files (1-2 hours)
10. Move Eleventy files to `eleventy/`
11. Move build files to `build/`
12. Move utils to `utils/`
13. Update all imports

### Phase 4: Polish (1 hour)
14. Update `index.mjs` to use new structure
15. Update documentation
16. Final testing

**Total Time: 7-10 hours**

---

## Questions to Consider

1. **Should `metadata.mjs` move?**
   - Option: Keep at root (it's foundational)
   - Option: Move to `core/metadata.mjs`
   - **Recommendation:** Keep at root

2. **Should we version this refactoring?**
   - Option: v2.1.0 (minor - internal refactoring, no API changes)
   - Option: v3.0.0 (major - to signal significant reorganization)
   - **Recommendation:** v2.1.0 (no breaking changes)

3. **Should we add tests first?**
   - Option: Write tests for current code, then refactor
   - Option: Refactor, then add tests
   - **Recommendation:** Add tests for resolver first, then refactor

---

## Next Steps

**Option 1: Start with resolver**
- Create `lib/cascade/resolver.mjs`
- Write comprehensive tests
- Verify it works in isolation
- Then refactor one file at a time

**Option 2: Move files first**
- Reorganize directory structure
- Update imports
- Then extract shared logic

**Recommendation:** Option 1 - safer and more testable.

Ready to proceed?
