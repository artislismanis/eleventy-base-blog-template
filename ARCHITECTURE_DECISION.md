# Architecture Decision: Should Cascade System Be a Separate Plugin?

## Question

Should the cascade/override system be extracted into a separate Eleventy plugin that could be used by ANY theme, not just this one?

## Current State

**Right now:** The theme includes the cascade system directly in `lib/cascade/`

```
eleventy-base-blog-template/
└── lib/
    ├── cascade/          # Theme override system
    │   ├── resolver.mjs  # Shared utilities
    │   ├── data.mjs
    │   ├── bundles.mjs
    │   └── assets.mjs
    ├── eleventy/         # Theme-specific filters, layouts
    └── build/            # Theme-specific build tools
```

## The Three Layers (Your Model)

```
┌─────────────────────────────────────┐
│ 1. Eleventy (Machines)              │
│    - Collections, pagination, etc.  │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ 2. Theme Repo (Design)              │
│    - Layouts, styles, components    │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ 3. Content Repo (Production Line)   │
│    - Content, config, build         │
└─────────────────────────────────────┘
```

## The Proposal: Add a "1.5" Layer

```
┌─────────────────────────────────────┐
│ 1. Eleventy Core (Machines)         │
│    - Collections, pagination, etc.  │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ 1.5. @11ty/eleventy-plugin-themes   │ ← NEW!
│    - Generic cascade/override       │
│    - Theme resolution                │
│    - Standard theme API              │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ 2. Any Theme Package                │
│    - Uses plugin for overrides      │
│    - Focuses purely on design       │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ 3. Content Repo (Production Line)   │
│    - Content, config, build         │
└─────────────────────────────────────┘
```

---

## Option A: Extract to Separate Plugin ✨

### What Would Be Extracted

**New package:** `@11ty/eleventy-plugin-themes` (or similar)

```
@11ty/eleventy-plugin-themes/
├── lib/
│   ├── resolver.mjs      # Generic path resolution
│   ├── data.mjs          # Data file cascade
│   ├── assets.mjs        # Static asset cascade
│   ├── bundles.mjs       # Script bundle cascade
│   └── template-loader.mjs  # Nunjucks loader with cascade
└── index.mjs             # Plugin entry point
```

### What Would Stay in Theme

```
eleventy-base-blog-template/
├── lib/
│   ├── index.mjs         # Uses the plugin
│   ├── filters.mjs       # Theme-specific filters
│   ├── shortcodes.mjs    # Theme-specific shortcodes
│   └── vite.mjs          # Theme-specific build
├── layouts/              # Design
├── styles/               # Design
└── data/                 # Default data
```

### How It Would Work

**1. Theme Package** (simplified):
```javascript
// eleventy-base-blog-template/lib/index.mjs
import themesPlugin from '@11ty/eleventy-plugin-themes';
import filters from './filters.mjs';

export function init(eleventyConfig, options = {}) {
  // Use the standard theme plugin
  eleventyConfig.addPlugin(themesPlugin, {
    themeName: 'eleventy-base-blog-template',
    projectRoot: options.projectRoot,
    resourceTypes: ['layouts', 'data', 'bundles', 'public'],
    overridePaths: options.overridePaths,
  });

  // Register theme-specific filters
  Object.keys(filters).forEach(name => {
    eleventyConfig.addFilter(name, filters[name]);
  });

  return eleventyConfig;
}
```

**2. Content Repo** (unchanged):
```javascript
// content-repo/eleventy.config.mjs
import theme from 'eleventy-base-blog-template';

export default function(eleventyConfig) {
  theme.init(eleventyConfig, { projectRoot: __dirname });
}
```

### Benefits of Option A

✅ **Standardization** - All Eleventy themes could use same pattern
✅ **DRY at ecosystem level** - Don't duplicate cascade logic across themes
✅ **Official support** - Could become standard like other @11ty plugins
✅ **Easier theme development** - Theme authors focus on design, not mechanics
✅ **Better testing** - Plugin tested independently, themes just use it
✅ **Smaller themes** - Themes become lighter (just design assets)

### Challenges of Option A

❌ **Overhead** - Requires maintaining separate package
❌ **Coordination** - Need Eleventy team buy-in for @11ty namespace
❌ **Migration** - Existing theme users would need to install plugin
❌ **Complexity** - Two packages instead of one for users
❌ **Flexibility** - Themes might have unique cascade needs

---

## Option B: Keep Cascade in Theme ✅ (Current)

### Rationale

The cascade system, while reusable in concept, is actually **theme-specific** because:

1. **Tight coupling to theme structure**
   - Knows about layouts, bundles, data, assets
   - Hardcoded to specific directory conventions
   - Theme-specific validation

2. **Not truly generic**
   - Different themes might want different cascade rules
   - Hugo themes work differently than Jekyll themes
   - This theme has specific bundle system

3. **Simplicity for users**
   - Single `npm install eleventy-base-blog-template`
   - No plugin coordination
   - Easier to understand

4. **Development velocity**
   - Can iterate quickly
   - No cross-package coordination
   - Theme controls its destiny

### What WE Should Do Instead

**Better separation WITHIN the theme:**

```
lib/
├── cascade/          # ← Infrastructure (could be extracted later)
│   └── ...
├── theme/            # ← Design concerns
│   ├── filters.mjs
│   ├── layouts.mjs
│   └── styles.mjs
└── integration/      # ← Eleventy integration
    └── ...
```

This gives us:
- ✅ Clear separation of concerns
- ✅ Easy to extract later if needed
- ✅ Single package for users
- ✅ Full control over implementation

---

## Option C: Hybrid Approach 🎯 (Recommended)

### Keep In Theme NOW, Design for Extraction LATER

**Phase 1: Current refactoring** (DONE ✅)
- Organize cascade code in `lib/cascade/`
- Clean API in `lib/cascade/index.mjs`
- Well-documented, self-contained

**Phase 2: Prove the pattern**
- Use theme in production
- See what other themes need
- Identify truly generic parts

**Phase 3: Extract when mature**
- If multiple themes emerge wanting same pattern
- Extract to `@11ty/eleventy-plugin-themes`
- Theme becomes thin wrapper

### Why This Is Best

1. **Validate before extracting**
   - We don't know if other themes want this pattern
   - Might discover limitations
   - Avoid premature abstraction

2. **Easy to extract later**
   - Clean boundaries already exist
   - `lib/cascade/` is self-contained
   - Just move to new package

3. **No user impact now**
   - Single package
   - Works immediately
   - Can add plugin later without breaking

---

## Separation of Concerns: What Should Be Where?

### Layer 1: Eleventy Core
**Responsibility:** Generic SSG machinery

✅ Collections API
✅ Pagination
✅ Template languages
✅ Data cascade (for content)
✅ Plugins API

### Layer 1.5: Theme Plugin (Future?)
**Responsibility:** Generic theme infrastructure

🤔 Path resolution (user > theme)
🤔 Override detection
🤔 Asset cascade
🤔 Template loader with cascade

### Layer 2: This Theme
**Responsibility:** Design language

✅ Layouts (base.njk, post.njk, etc.)
✅ Styles (typography, colors, components)
✅ Presentation filters (dateToFormat, excerpt)
✅ Default data structures (navigation, site)
✅ Visual components

❌ Collections (content repo's job)
❌ RSS feed (content repo's job)
❌ Site-specific logic (content repo's job)

### Layer 3: Content Repo
**Responsibility:** Content & build orchestration

✅ Actual content (posts, pages)
✅ Collections configuration
✅ RSS feed template
✅ Sitemap generation
✅ Custom filters/shortcodes
✅ Build scripts
✅ Deployment

---

## Decision: Option C (Hybrid)

### Keep cascade in theme for now because:

1. ✅ **Unproven pattern** - Only one theme uses it currently
2. ✅ **Simpler for users** - Single `npm install`
3. ✅ **Faster iteration** - Can improve without cross-package coordination
4. ✅ **Already well-organized** - Easy to extract later if needed

### But design for future extraction:

1. ✅ Clean API boundary (`lib/cascade/index.mjs`)
2. ✅ Generic naming (not theme-specific)
3. ✅ Good documentation
4. ✅ Self-contained module

### When to reconsider extraction:

- ⏱️ **Multiple themes** want same pattern
- ⏱️ **Eleventy team** shows interest in standardization
- ⏱️ **Community** requests it as plugin
- ⏱️ **Pattern** proves stable over 6+ months

---

## What This Means for Current Refactoring

The refactoring we just completed is **PERFECT** for this decision:

```
lib/
├── cascade/          # ← Self-contained, could move to plugin
│   ├── resolver.mjs  #    Generic utilities
│   ├── data.mjs      #    Generic data cascade
│   ├── bundles.mjs   #    Generic bundle cascade
│   ├── assets.mjs    #    Generic asset cascade
│   └── index.mjs     #    Clean API
│
├── eleventy/         # ← Theme-specific, stays in theme
│   ├── filters.mjs   #    Design filters
│   ├── shortcodes.mjs#    Design shortcodes
│   └── template-loader.mjs
│
├── build/            # ← Theme-specific, stays in theme
│   └── vite.mjs      #    Build tool integration
│
└── utils/            # ← Theme-specific
    └── validate.mjs  #    Theme validation
```

We can extract `cascade/` to a plugin later **without changing anything else**.

---

## Your Question Answered

> Should the cascade API sit in a separate 11ty plugin?

**Short answer:** Not yet, but we're ready to if needed.

**Long answer:**

The cascade system IS reusable infrastructure, but it's also deeply tied to THIS theme's conventions. Here's what we should do:

1. **✅ NOW** - Keep it in theme, well-organized (DONE)
2. **🔜 LATER** - If other themes emerge, extract common parts
3. **🎯 PRINCIPLE** - Design should be theme-specific, infrastructure could be generic

The key insight is: **Your three-layer model is correct.** The cascade system sits between layers 1 and 2. It COULD be layer 1.5, but we need proof that it's truly generic first.

---

## Action Items

✅ **Completed:**
- Organized cascade code into `lib/cascade/`
- Created clean API boundaries
- Made it self-contained
- Fixed sortAlphabetically() bug

🎯 **Next:**
- Document the cascade system clearly
- Use theme in production
- Watch for other themes wanting similar pattern
- Revisit extraction decision in 6 months

📝 **If we extract later:**
1. Create `@11ty/eleventy-plugin-themes` package
2. Move `lib/cascade/*` to it
3. Theme imports plugin instead
4. Update docs
5. Version as v3.0 (breaking change)

---

## Conclusion

Your intuition is excellent - the cascade system IS generic infrastructure. But pragmatically, we should **prove the pattern works** before extracting it. The refactoring we just completed makes extraction easy when the time comes.

**For now:** Theme bundles everything together (simpler for users)
**Future:** If demand exists, extract to official plugin (ecosystem benefit)
**Always:** Keep clear boundaries so extraction is easy
