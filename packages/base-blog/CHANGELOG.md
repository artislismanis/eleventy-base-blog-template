# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Breaking Changes

#### Bundles → Features Rename
- **BREAKING:** Renamed "bundles" to "features" throughout codebase
  - Directory: `bundles/` → `features/`
  - API: `getPageBundleEntries()` → `getFeatureEntries()`
  - Metadata: `metadata.bundles` → `metadata.features`
  - Override paths: `overrides/bundles` → `overrides/features`
  - Package exports: `./bundles/*` → `./features/*`

#### Colocated Feature Structure
- **BREAKING:** Features now use self-contained folder structure
  - **Before:** `bundles/code-highlighting.js` + `styles/bundles/code-highlighting.scss`
  - **After:** `features/code-highlighting/` folder containing:
    - `index.js` - Feature logic
    - `index.auto.js` - Auto-init variant
    - `styles.scss` - Feature styles
  - Benefits: Self-contained, easier to understand/share/delete
  - Aligns with modern component patterns (React/Vue)

### Added

#### Theme Specification System (Phase 1)
- **theme.json** - Machine-readable theme specification following proposed standard
  - Theme metadata (name, version, author, license)
  - Directory structure definition
  - Cascade system configuration
  - Feature declarations (renamed from bundles)
  - Layout documentation
  - CSS custom properties listing
  - API usage documentation
- **THEME_SPEC.md** - Complete documentation of specification compliance
- **THEME_SYSTEM_V2.md** - Refined proposal with build-agnostic architecture
- **Export for theme.json** - Added to package.json exports for programmatic access

### Changed
- **lib/ Organization** - Code reorganized into logical subdirectories:
  - `lib/cascade/` - Cascade resolution system (5 files)
    - `bundles.mjs` → `features.mjs`
  - `lib/eleventy/` - Eleventy-specific features (4 files)
  - `lib/build/` - Build tool integration (2 files)
    - `bundle-entries.mjs` → `feature-entries.mjs`
  - `lib/utils/` - Utilities (1 file)
- **Shared Resolver** - Created `lib/cascade/resolver.mjs` eliminating 125+ lines of duplication
- **theme.json structure**:
  - `"features"` (capabilities) → `"capabilities"`
  - `"bundles"` → `"themeFeatures"`
  - `"bundleSystem"` → `"featureSystem"`
  - `"perBundle"` → `"perFeature"`
- **Package keywords** - Added "cascade-system" and "feature-system"

### Removed
- **lib/create-config.mjs** - Removed incorrect API approach (took over entire config)
- **eleventy.config.CREATECONFIG.mjs** - Removed test file using wrong approach
- **Backward compatibility exports** - Removed `getPageBundleEntries` (use `getFeatureEntries`)
- **styles/bundles/** - Styles now colocated with features

### Fixed
- **sortAlphabetically() Filter** - Fixed missing return statement and reversed parameters

### Documentation
- **THEME_SPEC.md** - Theme specification compliance documentation
- **THEME_SYSTEM_PROPOSAL.md** - Initial proposal for reusable theming framework
- **THEME_SYSTEM_V2.md** - Refined proposal with build-agnostic core
- **API_COMPARISON.md** - Comparison of Manual vs Plugin vs createConfig APIs
- **ARCHITECTURE_DECISION.md** - Analysis of architectural decisions
- **IMPLEMENTATION_STATUS.md** - Project roadmap and progress tracker

### Migration Guide

#### Updating from Previous Version

**File Structure:**
```bash
# Rename directory
mv bundles features

# Restructure to colocated pattern
mkdir features/code-highlighting
mv features/code-highlighting.js features/code-highlighting/index.js
mv features/code-highlighting.auto.js features/code-highlighting/index.auto.js
mv styles/bundles/code-highlighting.scss features/code-highlighting/styles.scss
```

**Code Updates:**
```javascript
// Before
import { getPageBundleEntries } from 'eleventy-base-blog-template';
const entries = getPageBundleEntries(__dirname, {
  bundles: 'src/bundles'
});

// After
import { getFeatureEntries } from 'eleventy-base-blog-template';
const entries = getFeatureEntries(__dirname, {
  features: 'src/features'
});
```

**Import Paths:**
```javascript
// Before
import { init } from '@theme/bundles/code-highlighting.js';

// After
import { init } from '@theme/features/code-highlighting/index.js';
// Or simpler (index.js is implied):
import { init } from '@theme/features/code-highlighting';
```

---

## [2.0.0] - 2025-01-01

### 🎉 Major Release - Complete Rewrite

Version 2.0 is a complete architectural overhaul with breaking changes. See [MIGRATION.md](./MIGRATION.md) for upgrade instructions.

### Added

#### Core Infrastructure
- **Self-Describing Metadata** - Theme exports its own metadata (name, version, paths, layouts, bundles)
- **theme.init()** - Single initialization function replaces `initTheme()`
- **Configurable Override Paths** - Content repo controls its own directory structure
- **Smart Validation** - Automatic validation on init with helpful error messages
- **@theme Alias** - Clean imports for layouts, scripts, and styles

#### Nunjucks Integration
- **ThemeAwareLoader** - Custom Nunjucks loader supporting `@theme/` prefix
- **Cascade Resolution** - User overrides automatically preferred over theme files
- **Template Globals** - `theme.name` and `theme.path()` available in all templates

#### Vite Integration
- **Auto-Import Plugin** - Automatic theme style/script imports (no manual imports needed!)
- **@theme Alias** - Resolve imports like `import { x } from '@theme/bundles/...`
- **SCSS Support** - `@use '@theme/styles/...'` for clean style imports
- **$theme-name Variable** - Theme name available in all SCSS files

#### Bundle System
- **Explicit Init Pattern** - Bundles no longer auto-run, must call `init()`
- **Auto-Init Variants** - `.auto.js` versions for zero-config usage
- **Bundle Resolution** - `resolveBundlePath()` with user override support
- **Code Highlighting Bundle** - Complete example with copy button, line numbers
- **CSS Custom Properties** - 17+ variables for code highlighting theming
- **Bundle-Scoped Naming** - `--code-*`, `--gallery-*` to avoid collisions

#### Data Cascade
- **Automatic Registration** - Theme data files automatically registered via `addGlobalData()`
- **Theme Defaults** - `data/navigation.js` and `data/site.js` with sensible defaults
- **User Override** - Create same filename in `content/_data/` to automatically replace theme defaults
- **Native Eleventy Cascade** - User files in `_data/` directory take precedence over theme defaults
- **Programmatic Access** - `resolveDataFile()`, `dataFileExists()`, `getAvailableDataFiles()`

#### Static Assets Cascade
- **Theme Defaults** - `public/favicon.svg` and `public/robots.txt`
- **Per-File Override** - User files automatically replace theme files by name
- **Asset Resolution** - `resolveStaticAsset()` and `getAvailableAssets()`
- **configurePassthroughCopy()** - Automatic cascade configuration

#### Developer Experience
- **validateTheme()** - Comprehensive installation validation
- **Helpful Errors** - Clear messages with available options and next steps
- **Deprecation Warnings** - Detects old patterns (theme.config.mjs, manual imports)
- **Source Tracking** - All utilities report 'theme', 'user', or 'override' source

### Changed

#### Breaking Changes
- **API**: `initTheme()` → `theme.init()` (function renamed)
- **Imports**: Theme styles/scripts now auto-imported (remove manual imports)
- **Layouts**: Use `@theme/layouts/base.njk` instead of node_modules path
- **Bundles**: Use explicit `init()` instead of auto-run on import
- **Config**: `theme.config.mjs` no longer needed (theme is self-describing)
- **Nunjucks**: Layout paths auto-configured (remove manual `includes`/`layouts` config)

#### Improved
- **Performance**: Auto-import eliminates duplicate imports
- **Portability**: `@theme` alias works across different theme installations
- **Maintainability**: Cleaner codebase, better separation of concerns
- **Extensibility**: Easier to customize without losing theme updates

### Removed

- **theme.config.mjs** - No longer needed (replaced by theme metadata)
- **Manual Nunjucks Config** - Auto-configured by `init()`
- **Hard-coded Paths** - All paths now configurable
- **initTheme()** - Replaced by `theme.init()` (cleaner API)
- **PurgeCSS/Critical CSS Utilities** - Production optimizations belong in content repo, not theme package
- **utils/ and config/ directories** - Consolidated into `lib/` for simpler structure

### Fixed

- **Circular Dependencies** - Created `lib/metadata.mjs` to break import cycles
- **Path Resolution** - Consistent cascade across all resource types
- **Build Performance** - Eliminated redundant module loading

### Documentation

- **README.md** - Complete rewrite with v2 API documentation
- **MIGRATION.md** - Detailed v1 → v2 upgrade guide
- **CHANGELOG.md** - This file!
- **Code Comments** - Comprehensive JSDoc throughout codebase
- **Test Content Repo** - Complete working example at `/home/data/test-content/`

### Internal

- **Module Structure** - Separated metadata into own file to prevent circular deps
- **Import Paths** - All utilities import from `lib/metadata.mjs` directly
- **Error Handling** - Consistent error messages across all utilities
- **Validation** - Automatic on init, can be called separately if needed

---

## [1.0.0] - 2024-12-30

### Initial Release

- Basic theme with Vite integration
- Manual theme configuration
- Per-page bundle support
- Cascade override system
- Filters, shortcodes, transforms
- PurgeCSS and critical CSS utilities (removed in v2 - belong in content repo)

---

## Upgrade Guides

- **v1 → v2**: See [MIGRATION.md](./MIGRATION.md)

## Version Support

- **v2.x**: Active development, recommended for new projects
- **v1.x**: Maintenance mode, security fixes only

---

[2.0.0]: https://github.com/artislismanis/eleventy-base-blog-template/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/artislismanis/eleventy-base-blog-template/releases/tag/v1.0.0
