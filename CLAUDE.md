# Eleventy Theme Framework Architecture

This document defines the architectural principles, package responsibilities, and design patterns for the Eleventy theme framework.

## Overview

This is a **convention-based theme framework** for Eleventy that enables swappable, maintainable themes through clear separation of concerns and a well-defined specification.

### Package Architecture

```
┌─────────────────────────────────────────────────┐
│  @eleventy-themes/core                          │
│  FRAMEWORK SPECIFICATION & IMPLEMENTATION       │
│  - Theme conventions & schema                   │
│  - Cascade resolution algorithm                 │
│  - Integration API for build systems            │
│  - Validation & error handling                  │
└────────────┬────────────────────────────────────┘
             │ provides spec to
             │
     ┌───────┴────────┬──────────────────┐
     │                │                  │
     ▼                ▼                  ▼
┌─────────┐    ┌─────────────┐   ┌──────────────┐
│  Vite   │    │  Webpack    │   │  Future...   │
│ Adapter │    │  Adapter    │   │  Adapters    │
└─────────┘    └─────────────┘   └──────────────┘
     │
     │ uses spec with
     │
     ▼
┌──────────────────────────────────────────────────┐
│  Theme Implementations                           │
│  (follow the spec defined by core)               │
│  - @eleventy-themes/base-blog                    │
│  - @eleventy-themes/docs                         │
│  - etc.                                          │
└──────────────────────────────────────────────────┘
```

---

## @eleventy-themes/core

### Role: Framework Specification & Canonical Implementation

Core is **not just a utility package** - it is the **theme framework itself**. It defines:

#### 1. **The Specification**

Establishes conventions for:
- Theme structure and file organization
- Metadata schema (theme.json)
- Cascade resolution order (user-first override pattern)
- Feature discovery mechanism
- Resource path conventions

#### 2. **The Integration API**

Provides the contract that:
- Build systems (Vite, Webpack) consume
- Content repositories integrate with
- Themes implement against
- Enables theme swappability (any theme following the spec works)

#### 3. **The Validation Layer**

Ensures:
- Themes conform to the specification
- Metadata is valid and complete
- Required resources exist
- Helpful error messages guide developers

#### 4. **The Canonical Implementation**

Reference implementation of:
- Cascade resolution algorithm
- Feature discovery
- Resource resolution
- Template engine configuration

### Design Principles (Core)

**1. Build System Agnostic**
- Must work with any build system (Vite, Webpack, Rollup, none)
- Zero build system dependencies
- Pure cascade logic

**2. Single Source of Truth**
- ALL cascade logic lives here
- ALL theme convention enforcement lives here
- ONE place to understand how the framework works

**3. Minimal Surface Area**
```javascript
// Simple, focused API that hides complexity
getAvailableFeatures(projectRoot, themeMetadata, overridePaths?)
resolveResource({projectRoot, overridePaths, resourceType, filename})
configureTemplateEngine(eleventyConfig, {projectRoot, themeName, overridePaths})
```

**4. Convention over Configuration**
- Theme metadata defines defaults
- Sensible fallbacks for all paths
- User overrides are optional, not required

---

## @eleventy-themes/vite (and other build adapters)

### Role: Build System Integration Layer

Build adapters are **thin wrappers** that:
1. Consume core's API
2. Translate framework concepts → build system concepts
3. Add build-specific optimizations

### Responsibilities

**DO:**
- ✅ Convert framework features → build system entry points
- ✅ Configure build system with theme-aware settings
- ✅ Add build-specific optimizations (code splitting, tree shaking)
- ✅ Provide build system plugins (auto-import, aliases)

**DO NOT:**
- ❌ Implement cascade logic (core owns this)
- ❌ Discover features (core owns this)
- ❌ Validate themes (core owns this)
- ❌ Know about theme internals (only consume core's API)

### Design Principles (Build Adapters)

**1. Adapter Pattern**
- Adapt core's framework API → specific build system
- Example: `getAvailableFeatures()` → `vite.rollupOptions.input`

**2. Dependency Inversion**
```javascript
// ✅ Depend on core's abstraction, not implementation details
import { getAvailableFeatures } from '@eleventy-themes/core';

// ❌ Don't reimplement core's logic
// fs.readdirSync(featuresDir)... // NO!
```

**3. Minimal Parameter Passing**
```javascript
// ✅ GOOD: Core extracts what it needs
getFeatureEntries(projectRoot, themeMetadata)

// ❌ BAD: Passing parameters core already has
getFeatureEntries(projectRoot, themeName, overridePaths, themeFeatures)
```

---

## Theme Packages

### Role: Content & Presentation Implementation

Themes are **declarative blueprints** that follow the core spec.

### Structure (Defined by Core Spec)

```
theme/
├── theme.json              # Metadata (spec contract)
├── layouts/                # Template files
├── features/               # Self-contained JS features
│   └── code-highlighting/
│       ├── index.js        # Entry point
│       ├── index.auto.js   # Auto-init variant
│       └── styles.scss     # Feature styles
├── styles/                 # Global styles
├── data/                   # Default data
└── public/                 # Static assets
```

### theme.json Schema (Core Spec)

```json
{
  "name": "@eleventy-themes/base-blog",
  "version": "1.0.0",
  "cascade": {
    "enabled": true,
    "defaultOverridePaths": {
      "layouts": "overrides/layouts",
      "features": "overrides/features",
      "styles": "overrides/styles",
      "scripts": "overrides/scripts"
    },
    "resolution": "user-first"
  },
  "themeFeatures": [
    {
      "name": "code-highlighting",
      "entry": "features/code-highlighting/index.js"
    }
  ]
}
```

**Key Point:** Themes are **data**, not logic. All framework logic lives in core.

---

## Naming Conventions

### Principle: Technology-Agnostic APIs

**Public APIs should use framework terminology, not specific technology names.**

This enables:
- Future extensibility to other technologies
- Clearer semantic meaning
- Less coupling to implementation details

### Examples

**❌ BAD: Technology-specific naming**
```javascript
// Assumes Nunjucks forever
configureNunjucks(config, options)

// Assumes Vite forever
getViteEntries(root, metadata)

// Assumes SCSS forever
compileSCSS(inputPath)
```

**✅ GOOD: Generic, framework-level naming**
```javascript
// Works with any template engine
configureTemplateEngine(config, options)

// Works with any build system
getFeatureEntries(root, metadata)

// Generic asset concept
compileStyles(inputPath)
```

### Internal Implementation Can Be Specific

```javascript
// ✅ Public API is generic
export function configureTemplateEngine(eleventyConfig, options) {
  // ✅ Internal implementation can be specific
  const nunjucksEnv = new Nunjucks.Environment(loader);
  eleventyConfig.setLibrary('njk', nunjucksEnv);
  return nunjucksEnv;
}
```

The implementation uses Nunjucks, but the API doesn't force you to know that.

### Naming Checklist

When creating public APIs, ask:

- [ ] Could this work with a different technology? → Use generic name
- [ ] Is this framework concept or tech implementation? → Framework concept gets generic name
- [ ] Would changing underlying tech require renaming? → If yes, name is too specific
- [ ] Does the name describe WHAT or HOW? → Public APIs describe WHAT

**Examples:**

| Concept | ❌ Too Specific | ✅ Generic |
|---------|----------------|-----------|
| Template configuration | `configureNunjucks()` | `configureTemplateEngine()` |
| Build entries | `getViteEntries()` | `getFeatureEntries()` |
| Style compilation | `compileSCSS()` | `compileStyles()` |
| Asset bundling | `runWebpack()` | `bundleAssets()` |
| Package manager | `npmInstall()` | `installDependencies()` |

### Class and Type Names

**Same principle applies to classes:**

```javascript
// ❌ Technology-specific
class NunjucksThemeLoader { }
class ViteBundleManager { }

// ✅ Generic
class ThemeAwareLoader { }      // Currently Nunjucks, but name doesn't say so
class BuildManager { }          // Could be Vite, Webpack, etc.
```

---

## SOLID Principles Applied

### Single Responsibility Principle (SRP)

Each package has ONE reason to change:

| Package | Responsibility | Changes When... |
|---------|---------------|----------------|
| **Core** | Framework specification | Theme conventions evolve |
| **Vite** | Vite integration | Vite API changes or new optimizations needed |
| **Theme** | Content presentation | Design or content structure changes |

### Open/Closed Principle (OCP)

- **Core spec is stable** (open for extension via new resource types, closed for modification)
- **Build adapters extend** core without modifying it
- **Themes extend** via user overrides without modifying theme code

### Dependency Inversion Principle (DIP)

```javascript
// High-level modules (Vite) depend on abstractions (Core's API)
import { getAvailableFeatures } from '@eleventy-themes/core';

// Not on low-level details (filesystem, specific paths)
// ❌ import { readdirSync } from 'fs';
```

### Interface Segregation Principle (ISP)

Core provides focused interfaces:
```javascript
// Feature discovery interface
getAvailableFeatures(projectRoot, themeMetadata)

// Resource resolution interface
resolveResource({projectRoot, resourceType, filename})

// Not one giant "doEverything()" function
```

### Liskov Substitution Principle (LSP)

Any theme following the spec can replace another:
```javascript
// Swap themes by changing import
import { metadata } from '@eleventy-themes/base-blog';
// import { metadata } from '@eleventy-themes/docs';

// Rest of code unchanged - themes are interchangeable
eleventyConfig.addPlugin(theme, { projectRoot: __dirname });
```

---

## DRY Principle Applied

**Don't Repeat Yourself:** Every piece of knowledge must have a single, unambiguous, authoritative representation.

### Knowledge Ownership

| Knowledge | Owner | Why |
|-----------|-------|-----|
| Cascade algorithm | Core | Framework specification |
| Feature discovery | Core | Convention enforcement |
| Override resolution | Core | Single source of truth |
| Build entry points | Build Adapter | Build system specific |
| Theme layouts | Theme | Content presentation |

### Anti-Pattern: Logic Duplication

**❌ WRONG: Same logic in multiple places**
```javascript
// In vite package
const overrides = overridePaths || themeMetadata.cascade?.defaultOverridePaths;

// In core package
const overrides = overridePaths || themeMetadata.cascade?.defaultOverridePaths;
```

**✅ RIGHT: Extract to core, others consume**
```javascript
// Core implements once
export function getAvailableFeatures(projectRoot, themeMetadata, overridePaths) {
  const resolved = overridePaths || themeMetadata.cascade?.defaultOverridePaths || {};
  // ...
}

// Vite consumes
const features = getAvailableFeatures(projectRoot, themeMetadata);
```

---

## Separation of Concerns (SoC)

### Layered Architecture

```
┌────────────────────────────────────────┐
│  Presentation Layer (Themes)           │
│  - Layouts, styles, features           │
└────────────┬───────────────────────────┘
             │
┌────────────▼───────────────────────────┐
│  Integration Layer (Build Adapters)    │
│  - Vite, Webpack configuration         │
└────────────┬───────────────────────────┘
             │
┌────────────▼───────────────────────────┐
│  Framework Layer (Core)                │
│  - Specification & implementation      │
└────────────────────────────────────────┘
```

**Each layer:**
- Has clear responsibilities
- Depends only on layers below
- Exposes stable interfaces
- Can be tested independently

---

## Code Review Checklist

### Architectural Violations to Watch For

**1. Build logic in core**
```javascript
// ❌ Core should not know about build systems
if (vite.mode === 'production') { ... }

// ✅ Core provides data, build adapter decides what to do
export function getAvailableFeatures(...) { ... }
```

**2. Cascade logic outside core**
```javascript
// ❌ Build adapter reimplementing cascade
fs.readdirSync(userDir).forEach(...)

// ✅ Build adapter consumes core's API
const features = getAvailableFeatures(projectRoot, themeMetadata);
```

**3. Theme containing framework logic**
```javascript
// ❌ Theme implementing feature discovery
export function findFeatures() { ... }

// ✅ Theme declares features in metadata
"themeFeatures": [{"name": "code-highlighting", ...}]
```

**4. Parameter proliferation**
```javascript
// ❌ Passing what core can extract from metadata
getFeatures(root, name, paths, features, overrides, ...)

// ✅ Core extracts what it needs
getFeatures(projectRoot, themeMetadata)
```

**5. Technology-specific public API names**
```javascript
// ❌ Couples API to implementation
export function configureNunjucks(...) { }

// ✅ Generic, extensible naming
export function configureTemplateEngine(...) { }
```

### Design Pattern Violations

**1. Breaking Adapter Pattern**
```javascript
// ❌ Vite adapter knowing theme internals
const themeFeaturesPath = path.join(theme, 'features');

// ✅ Vite adapter using core's abstraction
const features = getAvailableFeatures(projectRoot, themeMetadata);
```

**2. Breaking DRY**
```javascript
// ❌ Same logic in two packages
// packages/vite/utils.js
const resolved = overrides || defaults;

// packages/core/cascade.js
const resolved = overrides || defaults;

// ✅ Logic in core, others import
import { resolveOverrides } from '@eleventy-themes/core';
```

**3. Breaking SRP**
```javascript
// ❌ Function doing too much
function doEverything() {
  discoverFeatures();
  createViteConfig();
  optimizeAssets();
}

// ✅ Each function has one job
getAvailableFeatures(...)  // Core
getFeatureEntries(...)     // Vite - uses core
optimizeBuild(...)         // Vite - separate concern
```

---

## Testing Strategy

### Core Package
**Tests the specification:**
- Cascade resolution follows spec
- Feature discovery finds theme + user features
- Validation catches spec violations
- Works without build system dependencies
- Template engine configuration works

### Build Adapters
**Tests the integration:**
- Correctly consumes core's API
- Generates valid build system config
- Does NOT test cascade logic (core's job)
- Mocks core for unit tests

### Themes
**Tests the implementation:**
- Metadata is valid per spec
- Required resources exist
- Features are properly structured
- Does NOT test framework logic

---

## Extension Points

### Adding New Build System Support

```javascript
// packages/webpack/index.js
import { getAvailableFeatures } from '@eleventy-themes/core';

export function getWebpackEntries(projectRoot, themeMetadata) {
  // 1. Get features from core (follows spec)
  const features = getAvailableFeatures(projectRoot, themeMetadata);

  // 2. Transform to webpack format (adapter responsibility)
  const entries = {};
  features.forEach(feature => {
    entries[feature.name] = feature.path;
  });

  return entries;
}
```

**Key Point:** New adapter = new transformation logic. Core spec doesn't change.

### Adding New Template Engine Support

```javascript
// In core/lib/template-loader.mjs
export function configureTemplateEngine(eleventyConfig, options) {
  // Could detect template engine from options or config
  const engine = options.templateEngine || 'nunjucks';

  if (engine === 'nunjucks') {
    return configureNunjucksEngine(eleventyConfig, options);
  } else if (engine === 'liquid') {
    return configureLiquidEngine(eleventyConfig, options);
  }
  // ...
}
```

**Key Point:** Generic API name allows for multiple implementations.

---

## Recommended Reading

- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID) - Foundation of object-oriented design
- [Adapter Pattern](https://refactoring.guru/design-patterns/adapter) - How build integrations work
- [Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns) - Why we have packages
- [Convention over Configuration](https://en.wikipedia.org/wiki/Convention_over_configuration) - Theme framework philosophy
- [Single Source of Truth](https://en.wikipedia.org/wiki/Single_source_of_truth) - Why core owns cascade logic
- [Naming Conventions](https://en.wikipedia.org/wiki/Naming_convention_(programming)) - Why names matter

---

## Decision Framework

When adding new functionality, ask:

**Q: Is it about how themes are structured/discovered?**
→ **Core** (specification)

**Q: Is it about integrating with a specific build tool?**
→ **Build Adapter** (Vite, Webpack, etc.)

**Q: Is it about presenting content?**
→ **Theme** (layouts, styles, features)

**Q: Does it duplicate existing logic?**
→ **Refactor** (DRY violation)

**Q: Does it make one package know too much about another?**
→ **Refactor** (SoC violation)

**Q: Does the API name reference specific technology?**
→ **Rename** to be generic and extensible

---

## Summary

**Core = Specification + API + Validation**
- Defines how themes work
- Provides integration interface
- Enforces conventions
- Build-system agnostic
- Template-engine agnostic (in API, specific in implementation)

**Build Adapters = Integration Layer**
- Consume core's API
- Adapt to specific build tools
- Add build-specific optimizations
- Zero framework logic
- Generic names, specific implementation

**Themes = Implementation**
- Follow the spec
- Declare capabilities in metadata
- Provide content and presentation
- Zero framework logic

**Naming = Technology-Agnostic**
- Public APIs describe WHAT, not HOW
- Use framework terminology
- Enable future extensibility
- Keep implementation details internal

**Remember:** Core is not just a helper library - it **IS** the theme framework. Everything else either consumes it (adapters) or conforms to it (themes).
