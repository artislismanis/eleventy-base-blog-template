# Implementation Status - Theme System

This document tracks the progress of implementing the reusable Eleventy theming system.

## Current Status: Phase 1 Complete ✅

The foundation for a reusable theming system is now in place.

## Completed Work

### ✅ Phase 1: Foundation (Current Theme)

#### Theme Specification
- [x] Created `theme.json` with complete theme metadata
- [x] Defined directory structure in spec
- [x] Documented cascade system configuration
- [x] Listed all features, layouts, bundles
- [x] Documented CSS custom properties
- [x] Added theme.json to package.json exports

#### Code Organization
- [x] Reorganized lib/ into logical subdirectories:
  - `lib/cascade/` - Cascade resolution (5 files)
  - `lib/eleventy/` - Template features (4 files)
  - `lib/build/` - Build integration (2 files)
  - `lib/utils/` - Utilities (1 file)
- [x] Created `lib/cascade/resolver.mjs` (shared utilities)
- [x] Eliminated 125+ lines of duplicated code
- [x] Fixed `sortAlphabetically()` filter bug

#### API Design
- [x] Plugin API (recommended approach)
- [x] Manual API (advanced use cases)
- [x] Removed createConfig (wrong approach)
- [x] Clear separation: theme configures itself, user configures content

#### Documentation
- [x] `THEME_SPEC.md` - Specification compliance documentation
- [x] `THEME_SYSTEM_PROPOSAL.md` - Complete framework proposal
- [x] `API_COMPARISON.md` - API design comparison
- [x] `ARCHITECTURE_DECISION.md` - Architectural analysis
- [x] `lib/README.md` - Code organization documentation
- [x] Updated `CHANGELOG.md` with all changes

#### Architecture
- [x] Three-layer model defined (Eleventy → Theme → Content)
- [x] Cascade system with user-first priority
- [x] @theme alias for clean imports
- [x] Bundle system with init patterns
- [x] Validation tooling

## Next Steps

### 🔄 Phase 2: Extract Core (Short-term)

Create `@eleventy-themes/core` package with reusable cascade logic:

#### Tasks
- [ ] Create new npm package `@eleventy-themes/core`
- [ ] Move cascade system from `eleventy-base-blog-template/lib/cascade/` to core
- [ ] Move template loader from `lib/eleventy/template-loader.mjs` to core
- [ ] Move build integration from `lib/build/` to core
- [ ] Add comprehensive tests
- [ ] Publish to npm
- [ ] Update `eleventy-base-blog-template` to use `@eleventy-themes/core`

#### Benefits
- Other themes can reuse the same cascade system
- Standardized behavior across themes
- Easier to maintain and test
- Clear separation: framework vs design

### 📋 Phase 3: Formalize Spec (Medium-term)

Create `@eleventy-themes/spec` package with formal specification:

#### Tasks
- [ ] Write formal specification document
- [ ] Define theme.json JSON Schema
- [ ] Create validation tools
- [ ] Create testing helpers
- [ ] Document best practices
- [ ] Publish specification
- [ ] Create example implementations

#### Deliverables
- JSON Schema for `theme.json`
- CLI validator: `npx @eleventy-themes/validate`
- Testing utilities for theme developers
- Official spec website/docs

### 🎨 Phase 4: Ecosystem (Long-term)

Build out theme ecosystem and tooling:

#### Tasks
- [ ] Create additional example themes:
  - Documentation theme
  - Portfolio theme
  - Minimal blog theme
- [ ] Build theme dev kit with CLI:
  - `npx create-eleventy-theme`
  - Theme scaffolding
  - Testing framework
  - Documentation generator
- [ ] Create theme registry/directory
- [ ] Write comprehensive guides
- [ ] Build community

## Current Architecture

### Package Structure
```
eleventy-base-blog-template/          # This theme (reference implementation)
├── theme.json                         # ✅ Theme specification
├── lib/
│   ├── cascade/                       # ✅ Will become @eleventy-themes/core
│   ├── eleventy/                      # ✅ Theme-specific features
│   ├── build/                         # ✅ Will become part of core
│   └── utils/                         # ✅ Theme-specific utilities
├── layouts/                           # ✅ Theme layouts
├── styles/                            # ✅ Theme styles
├── bundles/                           # ✅ Feature bundles
└── data/                              # ✅ Default data files

Future packages (not yet created):
@eleventy-themes/core/                 # 🔄 Phase 2
@eleventy-themes/spec/                 # 📋 Phase 3
@eleventy-themes/create-theme/         # 🎨 Phase 4
```

### API Surface

#### Current (Plugin API)
```javascript
import theme from 'eleventy-base-blog-template';

eleventyConfig.addPlugin(theme.plugin, {
  importMetaUrl: import.meta.url,
});
```

#### Future (With Core Extracted)
```javascript
// In theme package
import { createThemePlugin } from '@eleventy-themes/core';
import metadata from './theme.json' assert { type: 'json' };

export default createThemePlugin(metadata, {
  filters: { /* theme-specific filters */ },
  shortcodes: { /* theme-specific shortcodes */ },
});

// In content repo (unchanged!)
import theme from 'eleventy-base-blog-template';
eleventyConfig.addPlugin(theme.plugin, {
  importMetaUrl: import.meta.url,
});
```

## Key Design Decisions

### 1. Theme as Plugin (Not Config Replacement)
- ✅ Theme configures itself
- ✅ User controls collections, other plugins, directory structure
- ❌ Theme does NOT take over entire config

### 2. User-First Cascade
- User files ALWAYS override theme files
- Clear priority: User > Theme
- Works for layouts, data, bundles, assets

### 3. Convention + Configuration
- Sensible defaults (convention)
- Everything configurable (configuration)
- Content repo controls its own structure

### 4. Self-Describing Metadata
- theme.json as single source of truth
- Machine-readable for tooling
- Human-readable for documentation
- Enables discovery and validation

## Comparison with Other Systems

### vs Hugo Themes

| Aspect | Hugo | This System |
|--------|------|-------------|
| Distribution | Git submodules | npm packages ✅ |
| Metadata | theme.toml | theme.json ✅ |
| Override | Theme layering | Cascade system ✅ |
| Build | Hugo | Vite ✅ |
| Templates | Go templates | Nunjucks ✅ |
| Ecosystem | Large | Building 🔄 |

### vs Jekyll Themes

| Aspect | Jekyll | This System |
|--------|--------|-------------|
| Distribution | RubyGems | npm packages ✅ |
| Override | File replacement | Cascade system ✅ |
| Build | Jekyll assets | Vite ✅ |
| Config | YAML | JavaScript ✅ |
| Plugins | Ruby gems | npm packages ✅ |
| Ecosystem | Established | Building 🔄 |

### Advantages

1. **JavaScript Ecosystem** - npm, modern tooling, active ecosystem
2. **Vite Integration** - Fast builds, HMR, modern asset pipeline
3. **Type Safety** - Can use TypeScript, JSDoc
4. **Programmatic** - Full JavaScript capabilities
5. **Modular** - Bundle system for feature composition

## Timeline (Estimated)

### Phase 1: Foundation ✅ (Completed)
- Initial implementation: 1 week
- Documentation: 2 days
- Testing: 1 day

### Phase 2: Extract Core 🔄 (Next)
- Create package structure: 1 day
- Move and refactor code: 2-3 days
- Write tests: 2-3 days
- Documentation: 1-2 days
- **Total: ~1-2 weeks**

### Phase 3: Formalize Spec 📋
- Write specification: 3-4 days
- Create JSON Schema: 1-2 days
- Build tooling: 2-3 days
- Documentation: 2 days
- **Total: ~1-2 weeks**

### Phase 4: Ecosystem 🎨
- Additional themes: 1-2 weeks each
- Dev kit: 1-2 weeks
- Documentation site: 1 week
- **Total: ~1-2 months**

## Questions to Consider

Before proceeding to Phase 2:

1. **Package naming**: `@eleventy-themes/core` or different namespace?
2. **Version strategy**: Independent or synchronized versions?
3. **Backward compatibility**: How to handle breaking changes?
4. **Testing strategy**: Unit tests, integration tests, E2E tests?
5. **Documentation hosting**: GitHub Pages, dedicated site, or ReadTheDocs?

## Success Criteria

### For Current Theme
- ✅ theme.json exists and is complete
- ✅ Code is well-organized
- ✅ Plugin API works correctly
- ✅ Documentation is comprehensive
- ✅ Test content repo validates approach

### For Core Package (Phase 2)
- [ ] Published to npm
- [ ] Other themes can use it
- [ ] Has test coverage >80%
- [ ] Documentation is clear
- [ ] Breaking changes have migration guide

### For Specification (Phase 3)
- [ ] JSON Schema validates correctly
- [ ] Validation tool works
- [ ] At least 3 themes comply
- [ ] Community feedback incorporated

### For Ecosystem (Phase 4)
- [ ] At least 5 public themes
- [ ] Active community
- [ ] Dev kit is usable
- [ ] Good documentation

## Resources

### Documentation
- [THEME_SPEC.md](./THEME_SPEC.md) - Current theme spec compliance
- [THEME_SYSTEM_PROPOSAL.md](./THEME_SYSTEM_PROPOSAL.md) - Complete vision
- [API_COMPARISON.md](./API_COMPARISON.md) - API design rationale
- [ARCHITECTURE_DECISION.md](./ARCHITECTURE_DECISION.md) - Key decisions

### Code
- [lib/README.md](./lib/README.md) - Code organization
- [theme.json](./theme.json) - Theme specification

### Examples
- [test-content/](../test-content/) - Working content repo example

## Notes

This is a personal project for building a sensible theming system for Eleventy. The goal is not to become the "official" solution, but to create a well-designed, reusable approach that works well and can be shared with others.

The system learns from Hugo and Jekyll's successes while leveraging JavaScript ecosystem advantages.
