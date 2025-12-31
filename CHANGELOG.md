# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **Theme Defaults** - `data/navigation.js` and `data/site.js` with sensible defaults
- **User Override** - Create same filename in `content/_data/` to replace
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
- PurgeCSS and critical CSS utilities

---

## Upgrade Guides

- **v1 → v2**: See [MIGRATION.md](./MIGRATION.md)

## Version Support

- **v2.x**: Active development, recommended for new projects
- **v1.x**: Maintenance mode, security fixes only

---

[2.0.0]: https://github.com/artislismanis/eleventy-base-blog-template/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/artislismanis/eleventy-base-blog-template/releases/tag/v1.0.0
