# Code Review: Eleventy Base Blog Template v2.0

**Date:** 2025-12-31
**Reviewer:** Claude Code
**Focus:** DRY principles, architecture simplification, gaps, and framework comparison

---

## Executive Summary

This is a **well-architected theme package** with excellent developer experience. However, there are opportunities to:
1. **Reduce duplication** (5 major DRY violations identified)
2. **Simplify architecture** (consolidate path resolution)
3. **Fill feature gaps** (collections, SEO, i18n, RSS, sitemap)
4. **Borrow patterns** from Hugo/Jekyll (archetypes, taxonomies, content organization)

**Overall Grade:** B+ (Good architecture, needs refinement)

---

## 1. DRY Violations & Refactoring Opportunities

### 🔴 CRITICAL: Path Resolution Logic (Repeated 6× across codebase)

**Problem:** Same cascade resolution pattern in 4 files

**Current Code Pattern:**
```javascript
// This pattern appears in:
// - lib/data-cascade.mjs (lines 123-145)
// - lib/resolve-bundle.mjs (lines 23-60)
// - lib/static-assets.mjs (lines 129-151)
// - lib/validate.mjs (lines 196-248, 3 separate times)

const userPath = path.join(projectRoot, overridePaths.something, filename);
if (fs.existsSync(userPath)) {
  return userPath;
}

const themePath = path.join(
  projectRoot,
  'node_modules',
  metadata.name,
  metadata.paths.something,
  filename
);
if (fs.existsSync(themePath)) {
  return themePath;
}

return null;
```

**Recommendation:** Create `lib/path-resolver.mjs`

```javascript
// lib/path-resolver.mjs
import fs from 'fs';
import path from 'path';
import { metadata } from './metadata.mjs';

/**
 * Generic path resolver with cascade support
 *
 * @param {Object} options
 * @param {string} options.projectRoot - Content repo root
 * @param {string} options.userDir - User override directory (relative)
 * @param {string} options.themeDir - Theme directory (within package)
 * @param {string} options.filename - File to resolve
 * @param {boolean} options.throwOnMissing - Throw error if not found
 * @returns {{ path: string, source: 'user'|'theme' }|null}
 */
export function resolvePath({
  projectRoot,
  userDir,
  themeDir,
  filename,
  throwOnMissing = false,
  errorMessage = null
}) {
  // Check user override first
  const userPath = path.join(projectRoot, userDir, filename);
  if (fs.existsSync(userPath)) {
    return { path: userPath, source: 'user' };
  }

  // Fall back to theme
  const themePath = path.join(
    projectRoot,
    'node_modules',
    metadata.name,
    themeDir,
    filename
  );
  if (fs.existsSync(themePath)) {
    return { path: themePath, source: 'theme' };
  }

  // Not found
  if (throwOnMissing) {
    throw new Error(errorMessage || `File not found: ${filename}`);
  }

  return null;
}

/**
 * Get override path with fallback to default
 */
export function getOverridePath(overridePaths, key) {
  return overridePaths[key] || metadata.defaultOverridePaths[key];
}

/**
 * Get theme root path
 */
export function getThemeRoot(projectRoot) {
  return path.join(projectRoot, 'node_modules', metadata.name);
}

/**
 * Scan directory for files
 */
export function scanDirectory(dirPath, filter = () => true) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs.readdirSync(dirPath).filter(filter);
}
```

**Impact:**
- Eliminates ~80 lines of duplicated code
- Single source of truth for path resolution
- Easier to support alternative package managers (pnpm, yarn PnP)
- Consistent error handling

**Files to Refactor:**
1. `lib/data-cascade.mjs` - use `resolvePath()` in `resolveDataFile()`
2. `lib/resolve-bundle.mjs` - use `resolvePath()` in `resolveBundlePath()`
3. `lib/static-assets.mjs` - use `resolvePath()` in `resolveStaticAsset()`
4. `lib/validate.mjs` - use `resolvePath()` in multiple validation functions
5. `lib/nunjucks.mjs` - use `getThemeRoot()`
6. `lib/vite.mjs` - use `getThemeRoot()`

---

### 🟡 MODERATE: Override Path Extraction (Repeated 8×)

**Problem:**
```javascript
// Appears in EVERY lib file
const somePath = overridePaths.something || metadata.defaultOverridePaths.something;
```

**Solution:** Already addressed by `getOverridePath()` above

---

### 🟡 MODERATE: Source Tracking Pattern (Repeated 3×)

**Problem:** Same logic for tracking 'theme', 'user', 'override' sources

**Files:**
- `lib/data-cascade.mjs` (lines 194-207)
- `lib/resolve-bundle.mjs` (lines 104-121)
- `lib/static-assets.mjs` (lines 186-196)

**Recommendation:** Add to `path-resolver.mjs`

```javascript
/**
 * Scan both user and theme directories, track sources
 *
 * @returns {Map<string, { name, source, path }>}
 */
export function scanWithCascade({
  projectRoot,
  userDir,
  themeDir,
  filter = () => true
}) {
  const items = new Map();

  // Scan theme directory
  const themeFullPath = path.join(projectRoot, 'node_modules', metadata.name, themeDir);
  scanDirectory(themeFullPath, filter).forEach(file => {
    items.set(file, {
      name: file,
      source: 'theme',
      path: path.join(themeFullPath, file)
    });
  });

  // Scan user directory (override)
  const userFullPath = path.join(projectRoot, userDir);
  scanDirectory(userFullPath, filter).forEach(file => {
    const isOverride = items.has(file);
    items.set(file, {
      name: file,
      source: isOverride ? 'override' : 'user',
      path: path.join(userFullPath, file)
    });
  });

  return items;
}
```

---

### 🟡 MODERATE: Hardcoded 'node_modules' Path (6 files)

**Problem:** Breaks with pnpm, Yarn PnP, and monorepos

**Files:**
- validate.mjs, nunjucks.mjs, data-cascade.mjs, resolve-bundle.mjs, static-assets.mjs, vite.mjs

**Current:**
```javascript
path.join(projectRoot, 'node_modules', metadata.name)
```

**Solution 1:** Use `require.resolve()` (CJS) or `import.meta.resolve()` (ESM)
```javascript
// Get actual install location
const themePackageJson = import.meta.resolve('eleventy-base-blog-template/package.json');
const themeRoot = path.dirname(themePackageJson);
```

**Solution 2:** Make theme root configurable
```javascript
// In init() options
theme.init(eleventyConfig, {
  projectRoot: __dirname,
  themeRoot: path.dirname(require.resolve('eleventy-base-blog-template')), // optional
});
```

**Recommendation:** Solution 1 + add to metadata.mjs
```javascript
// lib/metadata.mjs
export const themeRoot = path.dirname(
  new URL(import.meta.url).pathname.replace('/lib/metadata.mjs', '')
);
```

---

## 2. Architecture Simplification Opportunities

### Pattern: Too Many Small Utilities

**Current State:**
- 11 files in `lib/`
- Some are <10 lines (shortcodes.mjs, transforms.mjs)
- Path resolution duplicated across 4 files

**Recommendation:** Consolidate into logical modules

**Proposed Structure:**
```
lib/
├── index.mjs              # Main entry (keep as-is)
├── metadata.mjs           # Theme config (keep as-is)
├── path-resolver.mjs      # NEW: Centralized path resolution
├── template-system.mjs    # MERGE: filters + shortcodes + transforms + nunjucks
├── content-system.mjs     # MERGE: data-cascade + collections + taxonomies
├── bundle-system.mjs      # MERGE: resolve-bundle + get-page-bundles
├── build-system.mjs       # MERGE: vite + static-assets
└── validation.mjs         # RENAME: validate.mjs
```

**Benefits:**
- Fewer files to navigate
- Related functionality co-located
- Easier to understand system boundaries
- Still maintains separation of concerns

---

### Pattern: Merge Related Cascades

**Current:** Three separate cascade systems
- `data-cascade.mjs` - data files
- `static-assets.mjs` - public files
- `resolve-bundle.mjs` - bundles
- `nunjucks.mjs` - layouts

**Recommendation:** Unified cascade API

```javascript
// lib/cascade.mjs
export function configureCascade(eleventyConfig, projectRoot, overridePaths) {
  configureDataCascade(eleventyConfig, projectRoot, overridePaths);
  configureLayoutCascade(eleventyConfig, projectRoot, overridePaths);
  configureBundleCascade(eleventyConfig, projectRoot, overridePaths);
  configureAssetCascade(eleventyConfig, projectRoot, overridePaths);
}
```

**Then in index.mjs:**
```javascript
// Before: 4 separate calls
configureNunjucks(...);
configureDataCascade(...);
configurePassthroughCopy(...);
// Bundle cascade is implicit

// After: 1 unified call
configureCascade(eleventyConfig, projectRoot, overridePaths);
```

---

## 3. Feature Gaps & Missing Functionality

### 🔴 CRITICAL GAPS

#### 3.1 No Collections System

**Problem:** Theme doesn't provide default collections

**What Hugo/Jekyll Have:**
- Auto-generated collections (posts, pages, drafts)
- Taxonomies (tags, categories, series)
- Related content
- Prev/next navigation

**Recommendation:** Add `lib/collections.mjs`

```javascript
// lib/collections.mjs
export function configureCollections(eleventyConfig) {
  // Posts collection (all markdown in blog/)
  eleventyConfig.addCollection('posts', function(collectionApi) {
    return collectionApi.getFilteredByGlob('content/blog/*.md')
      .filter(item => !item.data.draft)
      .reverse(); // newest first
  });

  // Tag collections
  eleventyConfig.addCollection('tagList', function(collectionApi) {
    const tagSet = new Set();
    collectionApi.getAll().forEach(item => {
      (item.data.tags || []).forEach(tag => tagSet.add(tag));
    });
    return [...tagSet].sort();
  });

  // Recent posts
  eleventyConfig.addCollection('recentPosts', function(collectionApi) {
    return collectionApi.getFilteredByGlob('content/blog/*.md')
      .filter(item => !item.data.draft)
      .reverse()
      .slice(0, 5);
  });

  // Related posts (by shared tags)
  eleventyConfig.addFilter('relatedPosts', function(collection, currentPost, limit = 3) {
    const currentTags = currentPost.data.tags || [];
    return collection
      .filter(post => post.url !== currentPost.url)
      .map(post => {
        const sharedTags = (post.data.tags || [])
          .filter(tag => currentTags.includes(tag));
        return { post, score: sharedTags.length };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.post);
  });
}
```

---

#### 3.2 No SEO/Meta Tags Support

**Problem:** base.njk has minimal meta tags

**What's Missing:**
- Open Graph tags
- Twitter Cards
- JSON-LD structured data
- Canonical URLs
- hreflang for i18n

**Recommendation:** Add `layouts/partials/seo.njk`

```nunjucks
{# layouts/partials/seo.njk #}
{% set pageTitle = title or site.title %}
{% set pageDescription = description or site.description %}
{% set pageImage = image or site.image or '/assets/images/default-og.png' %}
{% set pageUrl = site.url + page.url %}

{# Open Graph #}
<meta property="og:title" content="{{ pageTitle }}" />
<meta property="og:description" content="{{ pageDescription }}" />
<meta property="og:type" content="{% if layout == 'post' %}article{% else %}website{% endif %}" />
<meta property="og:url" content="{{ pageUrl }}" />
<meta property="og:image" content="{{ site.url }}{{ pageImage }}" />
<meta property="og:site_name" content="{{ site.title }}" />

{# Twitter Card #}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{{ pageTitle }}" />
<meta name="twitter:description" content="{{ pageDescription }}" />
<meta name="twitter:image" content="{{ site.url }}{{ pageImage }}" />
{% if site.author.twitter %}
<meta name="twitter:creator" content="@{{ site.author.twitter }}" />
{% endif %}

{# Canonical #}
<link rel="canonical" href="{{ pageUrl }}" />

{# JSON-LD Structured Data #}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "{% if layout == 'post' %}BlogPosting{% else %}WebPage{% endif %}",
  "headline": "{{ pageTitle }}",
  "description": "{{ pageDescription }}",
  "url": "{{ pageUrl }}",
  "datePublished": "{{ page.date | dateToISO }}",
  {% if layout == 'post' %}
  "dateModified": "{{ modified or page.date | dateToISO }}",
  {% endif %}
  "author": {
    "@type": "Person",
    "name": "{{ site.author.name }}",
    "url": "{{ site.author.url }}"
  },
  "publisher": {
    "@type": "Organization",
    "name": "{{ site.title }}",
    "url": "{{ site.url }}"
  }
}
</script>
```

Then in `base.njk`:
```nunjucks
<head>
  {# ... existing tags ... #}
  {% include "partials/seo.njk" %}
</head>
```

---

#### 3.3 No RSS/Atom Feed Support

**Problem:** No feed generation

**Recommendation:** Add `lib/feeds.mjs` or use `@11ty/eleventy-plugin-rss`

```javascript
// eleventy.config.mjs
import pluginRss from "@11ty/eleventy-plugin-rss";

export default function(eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);
  // ...
}
```

Then add `content/feed.njk`:
```nunjucks
---
permalink: /feed.xml
eleventyExcludeFromCollections: true
---
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>{{ site.title }}</title>
  <subtitle>{{ site.description }}</subtitle>
  <link href="{{ site.url }}/feed.xml" rel="self"/>
  <link href="{{ site.url }}/"/>
  <updated>{{ collections.posts | getNewestCollectionItemDate | dateToISO }}</updated>
  <id>{{ site.url }}/</id>
  <author>
    <name>{{ site.author.name }}</name>
    <email>{{ site.author.email }}</email>
  </author>
  {% for post in collections.posts | reverse | head(10) %}
  <entry>
    <title>{{ post.data.title }}</title>
    <link href="{{ site.url }}{{ post.url }}"/>
    <updated>{{ post.date | dateToISO }}</updated>
    <id>{{ site.url }}{{ post.url }}</id>
    <content type="html">{{ post.templateContent | htmlToAbsoluteUrls(site.url) }}</content>
  </entry>
  {% endfor %}
</feed>
```

---

#### 3.4 No Sitemap Generation

**Recommendation:** Add `content/sitemap.njk`

```nunjucks
---
permalink: /sitemap.xml
eleventyExcludeFromCollections: true
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  {% for page in collections.all %}
  {% if not page.data.excludeFromSitemap %}
  <url>
    <loc>{{ site.url }}{{ page.url }}</loc>
    <lastmod>{{ page.date | dateToISO }}</lastmod>
    <changefreq>{% if page.url == '/' %}daily{% else %}weekly{% endif %}</changefreq>
    <priority>{% if page.url == '/' %}1.0{% elif '/blog/' in page.url %}0.8{% else %}0.6{% endif %}</priority>
  </url>
  {% endif %}
  {% endfor %}
</urlset>
```

---

### 🟡 MODERATE GAPS

#### 3.5 No Pagination Support

**What Hugo/Jekyll Have:** Built-in pagination for lists

**Recommendation:** Add pagination helpers

```javascript
// lib/filters.mjs - add pagination filter
paginate: function(array, pageSize, pageNumber) {
  pageNumber = pageNumber || 1;
  const startIndex = (pageNumber - 1) * pageSize;
  return array.slice(startIndex, startIndex + pageSize);
},

paginationInfo: function(total, pageSize, currentPage) {
  const totalPages = Math.ceil(total / pageSize);
  return {
    currentPage,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    nextPage: currentPage + 1,
    prevPage: currentPage - 1
  };
}
```

---

#### 3.6 No Internationalization (i18n) Support

**What Hugo Has:** Built-in multi-language support

**Recommendation:** Add i18n structure

```javascript
// data/i18n.js
export default {
  en: {
    readMore: 'Read more',
    postedOn: 'Posted on',
    tags: 'Tags',
    relatedPosts: 'Related Posts'
  },
  es: {
    readMore: 'Leer más',
    postedOn: 'Publicado el',
    tags: 'Etiquetas',
    relatedPosts: 'Artículos Relacionados'
  }
};
```

```javascript
// lib/filters.mjs - add i18n filter
t: function(key, lang = 'en') {
  const translations = this.ctx.i18n || {};
  return translations[lang]?.[key] || key;
}
```

---

#### 3.7 No Image Optimization

**What Jekyll/Hugo Have:** Automatic image resizing, WebP conversion

**Recommendation:** Integrate `@11ty/eleventy-img`

```javascript
// lib/shortcodes.mjs
import Image from "@11ty/eleventy-img";

export default {
  async image(src, alt, sizes = "100vw") {
    const metadata = await Image(src, {
      widths: [300, 600, 1200],
      formats: ["webp", "jpeg"],
      outputDir: "./_site/assets/images/",
      urlPath: "/assets/images/"
    });

    const imageAttributes = {
      alt,
      sizes,
      loading: "lazy",
      decoding: "async",
    };

    return Image.generateHTML(metadata, imageAttributes);
  }
};
```

---

#### 3.8 No Search Functionality

**What Jekyll Has:** Plugins for search (Algolia, Lunr.js)

**Recommendation:** Add client-side search bundle

```javascript
// bundles/search.js
import Fuse from 'fuse.js';

export function init() {
  // Fetch search index
  fetch('/search-index.json')
    .then(res => res.json())
    .then(data => {
      const fuse = new Fuse(data, {
        keys: ['title', 'content', 'tags'],
        threshold: 0.3
      });

      // Wire up search UI
      // ...
    });
}
```

```nunjucks
{# content/search-index.njk #}
---
permalink: /search-index.json
eleventyExcludeFromCollections: true
---
[
{% for post in collections.posts %}
  {
    "title": {{ post.data.title | dump | safe }},
    "url": "{{ post.url }}",
    "content": {{ post.templateContent | striptags | dump | safe }},
    "tags": {{ post.data.tags | dump | safe }},
    "date": "{{ post.date | dateToISO }}"
  }{% if not loop.last %},{% endif %}
{% endfor %}
]
```

---

### 🟢 NICE-TO-HAVE GAPS

#### 3.9 No Content Archetypes (Hugo Feature)

**What Hugo Has:** Template scaffolding for new content

**Recommendation:** Add CLI tool or npm scripts

```json
// package.json scripts in theme
{
  "scripts": {
    "new:post": "node scripts/new-post.js"
  }
}
```

```javascript
// scripts/new-post.js
import fs from 'fs';
import path from 'path';
import { parseArgs } from 'util';

const { values } = parseArgs({
  options: {
    title: { type: 'string' },
    tags: { type: 'string' }
  }
});

const slug = values.title.toLowerCase().replace(/\s+/g, '-');
const date = new Date().toISOString().split('T')[0];

const content = `---
title: "${values.title}"
date: ${date}
tags: [${values.tags || ''}]
draft: true
---

Write your content here...
`;

const filename = `content/blog/${date}-${slug}.md`;
fs.writeFileSync(filename, content);
console.log(`Created: ${filename}`);
```

---

#### 3.10 No Draft/Scheduled Post Support

**Recommendation:** Add to collections

```javascript
// lib/collections.mjs
eleventyConfig.addCollection('posts', function(collectionApi) {
  const now = new Date();

  return collectionApi.getFilteredByGlob('content/blog/*.md')
    .filter(item => {
      // Exclude drafts
      if (item.data.draft) return false;

      // Exclude scheduled posts (future date)
      const postDate = new Date(item.data.date);
      if (postDate > now) return false;

      return true;
    })
    .reverse();
});
```

---

#### 3.11 No Reading Time Calculation

**Recommendation:** Add filter

```javascript
// lib/filters.mjs
readingTime: function(content) {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
}
```

---

#### 3.12 No Table of Contents Generation

**Recommendation:** Add shortcode

```javascript
// lib/shortcodes.mjs
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import markdownItTOC from "markdown-it-table-of-contents";

const md = markdownIt()
  .use(markdownItAnchor)
  .use(markdownItTOC);

export default {
  toc: function(content) {
    return md.render('[[toc]]\n' + content);
  }
};
```

---

## 4. Eleventy API Features Not Being Used

### Missing Eleventy Plugins

1. **@11ty/eleventy-plugin-rss** - RSS/Atom feeds
2. **@11ty/eleventy-img** - Image optimization
3. **@11ty/eleventy-plugin-syntaxhighlight** - Code highlighting (using custom)
4. **@11ty/eleventy-plugin-navigation** - Hierarchical navigation
5. **@11ty/eleventy-fetch** - Asset caching/fetching

### Missing Eleventy Features

1. **Collections** - Not configured (see gap 3.1)
2. **Computed Data** - Could use for SEO, reading time
3. **Directory Data Files** - Could set defaults for sections
4. **Global Data** - Partially used, could expand
5. **Pagination** - Not implemented
6. **Permalinks** - Basic usage, could enhance
7. **Template Languages** - Only Nunjucks, could support Liquid/Handlebars
8. **Custom Data File Formats** - Only .js, could support .yaml/.json
9. **Events** - Could use eleventy.before/after hooks
10. **Watch Targets** - Could watch theme files in dev mode

---

## 5. Comparison: Hugo & Jekyll Features

### Hugo Features Missing in This Theme

| Feature | Hugo | This Theme | Recommendation |
|---------|------|------------|----------------|
| Archetypes | ✅ Built-in | ❌ Missing | Add CLI tool (gap 3.9) |
| Taxonomies | ✅ Auto-generated | ❌ Missing | Add collections (gap 3.1) |
| Content Organization | ✅ Sections/Types | ⚠️ Manual | Add conventions |
| i18n | ✅ Built-in | ❌ Missing | Add structure (gap 3.6) |
| Image Processing | ✅ Built-in | ❌ Missing | Use @11ty/eleventy-img |
| Shortcodes | ✅ Rich library | ⚠️ Minimal | Expand library |
| Menus | ✅ Auto + manual | ⚠️ Manual only | Use eleventy-navigation |
| Related Content | ✅ Built-in | ❌ Missing | Add filter (gap 3.1) |
| RSS | ✅ Built-in | ❌ Missing | Add plugin (gap 3.3) |
| Sitemap | ✅ Built-in | ❌ Missing | Add template (gap 3.4) |
| Asset Pipeline | ✅ Built-in | ⚠️ Vite only | Current approach OK |
| Pagination | ✅ Built-in | ❌ Missing | Add helpers (gap 3.5) |
| Front Matter Cascade | ✅ Built-in | ❌ Missing | Use directory data |

### Jekyll Features Missing in This Theme

| Feature | Jekyll | This Theme | Recommendation |
|---------|--------|------------|----------------|
| Collections | ✅ Built-in | ❌ Missing | Add (gap 3.1) |
| Data Files | ✅ Multiple formats | ⚠️ JS only | Support .yaml/.json |
| Includes | ✅ Rich library | ⚠️ Basic | Expand partials |
| Liquid Filters | ✅ Rich library | ⚠️ Minimal | Expand filters |
| Plugins | ✅ Ecosystem | ⚠️ Limited | Document integration |
| Themes | ✅ Gem-based | ✅ NPM-based | Current approach good |
| Pagination | ✅ Built-in | ❌ Missing | Add (gap 3.5) |
| Excerpts | ✅ Auto | ❌ Missing | Add filter |
| Drafts | ✅ Built-in | ❌ Missing | Add (gap 3.10) |
| Sass | ✅ Built-in | ⚠️ Via Vite | Current approach better |

---

## 6. Design Principles to Borrow

### From Hugo

1. **Content Organization by Section**
   - Hugo: `content/blog/`, `content/docs/` auto-create collections
   - Recommendation: Add convention-based collections

```javascript
// lib/collections.mjs
export function autoConfigureCollections(eleventyConfig, contentDir = 'content') {
  const sections = fs.readdirSync(contentDir)
    .filter(name => fs.statSync(path.join(contentDir, name)).isDirectory());

  sections.forEach(section => {
    eleventyConfig.addCollection(section, function(collectionApi) {
      return collectionApi.getFilteredByGlob(`${contentDir}/${section}/**/*.md`);
    });
  });
}
```

2. **Front Matter Defaults (Directory Data)**
   - Hugo: Automatic front matter based on content type
   - Eleventy supports this! Just not documented/used

```javascript
// content/blog/blog.json
{
  "layout": "post",
  "tags": ["posts"],
  "permalink": "/blog/{{ page.fileSlug }}/"
}
```

3. **Taxonomies as First-Class Citizens**
   - Hugo: tags, categories, series all work the same way
   - Recommendation: Generic taxonomy system

```javascript
// lib/taxonomies.mjs
export function configureTaxonomies(eleventyConfig, taxonomies = ['tags', 'categories']) {
  taxonomies.forEach(taxonomy => {
    // Collection for all terms
    eleventyConfig.addCollection(`${taxonomy}List`, function(collectionApi) {
      const terms = new Set();
      collectionApi.getAll().forEach(item => {
        (item.data[taxonomy] || []).forEach(term => terms.add(term));
      });
      return [...terms].sort();
    });

    // Filter to get posts by term
    eleventyConfig.addFilter(`filterBy${taxonomy.charAt(0).toUpperCase() + taxonomy.slice(1)}`,
      function(collection, term) {
        return collection.filter(item =>
          (item.data[taxonomy] || []).includes(term)
        );
      }
    );
  });
}
```

### From Jekyll

1. **Includes with Parameters**
   - Jekyll: `{% include header.html param="value" %}`
   - Nunjucks supports this via macros!

```nunjucks
{# layouts/partials/card.njk #}
{% macro card(title, description, url) %}
<div class="card">
  <h3><a href="{{ url }}">{{ title }}</a></h3>
  <p>{{ description }}</p>
</div>
{% endmacro %}

{# Usage #}
{% import "partials/card.njk" as components %}
{{ components.card(post.title, post.description, post.url) }}
```

2. **Excerpts**
   - Jekyll: Auto-generated from content
   - Recommendation: Add filter

```javascript
// lib/filters.mjs
excerpt: function(content, length = 200) {
  const text = content.replace(/<[^>]*>/g, ''); // strip HTML
  return text.length > length
    ? text.substring(0, length) + '...'
    : text;
}
```

3. **Permalinks Patterns**
   - Jekyll: `/:categories/:year/:month/:day/:title/`
   - Recommendation: Document permalink patterns

```markdown
---
permalink: /{{ page.date | date: '%Y/%m/%d' }}/{{ title | slugify }}/
---
```

---

## 7. Specific Code Issues

### Issue 1: sortAlphabetically() is Broken

**File:** `lib/filters.mjs:52-54`

```javascript
sortAlphabetically: function (strings) {
  (strings || []).sort((b, a) => b.localeCompare(a));  // ❌ Doesn't return
},
```

**Problem:**
1. Doesn't return the sorted array
2. Parameters reversed (should be `(a, b)` for ascending)
3. Mutates original array

**Fix:**
```javascript
sortAlphabetically: function (strings) {
  return [...(strings || [])].sort((a, b) => a.localeCompare(b));
},
```

---

### Issue 2: base.njk Uses eleventy-navigation Without Checking

**File:** `layouts/base.njk:31`

```nunjucks
{%- for entry in collections.all | eleventyNavigation %}
```

**Problem:** `eleventyNavigation` filter won't exist unless user adds plugin

**Fix:** Use data file instead

```nunjucks
{# Use navigation data file #}
{%- for entry in navigation.main %}
  <li class="nav-item">
    <a href="{{ entry.url }}"
       {% if entry.url == page.url %}aria-current="page"{% endif %}>
      {{ entry.label }}
    </a>
  </li>
{%- endfor %}
```

---

### Issue 3: No Error Handling in Auto-Import Plugin

**File:** `lib/vite.mjs:51-68`

**Problem:** If theme files don't exist, Vite build fails with cryptic error

**Fix:** Add existence check

```javascript
transform(code, id) {
  if (id.endsWith('main.js')) {
    const themeMainJs = path.join(themeRoot, 'scripts', 'main.js');
    const themeMainScss = path.join(themeRoot, 'styles', 'main.scss');

    // Check files exist before importing
    let imports = '';
    if (fs.existsSync(themeMainScss)) {
      imports += `import '${metadata.name}/styles/main.scss';\n`;
    }
    if (fs.existsSync(themeMainJs)) {
      imports += `import '${metadata.name}/scripts/main.js';\n`;
    }

    return imports + code;
  }
  return code;
}
```

---

### Issue 4: Deep Merge Logic is Fragile

**File:** `lib/vite.mjs:138-166`

**Problem:** Manual deep merge could miss edge cases

**Recommendation:** Use library

```javascript
import { mergeConfig } from 'vite'; // Vite's own merge function

export function getThemeViteConfig(projectRoot, userOptions = {}) {
  const baseConfig = {
    // ... theme config ...
  };

  return mergeConfig(baseConfig, userOptions);
}
```

---

## 8. Package Structure Recommendations

### Add Scripts for Common Tasks

**Current:** No npm scripts in theme package

**Recommendation:**
```json
{
  "scripts": {
    "new:post": "node scripts/new-post.js",
    "new:page": "node scripts/new-page.js",
    "validate": "node scripts/validate-theme.js"
  },
  "bin": {
    "eleventy-theme": "./bin/cli.js"
  }
}
```

Then users can:
```bash
npx eleventy-theme new post "My New Post"
npx eleventy-theme new page "About"
```

---

### Add Default Content

**Current:** No example content in theme

**Recommendation:** Add `content-templates/` directory

```
content-templates/
├── index.md          # Homepage example
├── about.md          # About page example
├── blog/
│   └── first-post.md # Blog post example
└── README.md         # How to use templates
```

Users can copy to bootstrap their site.

---

### Add More Layouts

**Current:** Only 3 layouts (base, home, post)

**Missing:**
- `page.njk` - Standard pages
- `archive.njk` - Post archives
- `tag.njk` - Tag pages
- `404.njk` - Error page
- `search.njk` - Search page

---

### Export More Utilities

**Current:** Main exports in index.mjs

**Could Add:**
```javascript
// Path resolution utilities
export { resolvePath, getThemeRoot } from './path-resolver.mjs';

// Collection helpers
export { configureCollections, configureTaxonomies } from './collections.mjs';

// Content utilities
export { excerpt, readingTime, toc } from './content-utils.mjs';
```

---

## 9. Testing & Quality

### Missing: Tests

**Recommendation:** Add test suite

```javascript
// tests/path-resolver.test.js
import { describe, it, expect } from 'vitest';
import { resolvePath } from '../lib/path-resolver.mjs';

describe('resolvePath', () => {
  it('should resolve user file over theme file', () => {
    const result = resolvePath({
      projectRoot: '/project',
      userDir: 'content/_data',
      themeDir: 'data',
      filename: 'site.js'
    });

    expect(result.source).toBe('user');
  });
});
```

---

### Missing: Type Definitions

**Recommendation:** Add JSDoc or TypeScript definitions

```javascript
/**
 * @typedef {Object} ThemeOptions
 * @property {string} projectRoot - Absolute path to content repository root
 * @property {Object} [overridePaths] - Custom paths for content repository
 * @property {string} [overridePaths.layouts] - Path to layout overrides
 * @property {string} [overridePaths.data] - Path to data directory
 * @property {Object} [filters] - Custom Nunjucks filters
 * @property {Object} [shortcodes] - Custom Nunjucks shortcodes
 * @property {Object} [transforms] - Custom HTML transforms
 */

/**
 * Initialize Eleventy Base Blog Theme
 * @param {Object} eleventyConfig - Eleventy configuration object
 * @param {ThemeOptions} options - Theme configuration options
 * @returns {Object} eleventyConfig for chaining
 */
export function init(eleventyConfig, options = {}) {
  // ...
}
```

---

## 10. Priority Recommendations

### 🔥 DO IMMEDIATELY

1. **Fix sortAlphabetically() bug** (lib/filters.mjs:52)
2. **Create path-resolver.mjs** - Eliminate duplication (saves ~80 lines)
3. **Fix base.njk navigation** - Doesn't work without plugin
4. **Add RSS feed** - Essential for blog theme
5. **Add sitemap** - Essential for SEO

### 🎯 DO NEXT (1-2 weeks)

6. **Add collections system** - Core blog functionality
7. **Add SEO partial** - Critical for discoverability
8. **Add image optimization** - Performance and DX
9. **Refactor to unified cascade API** - Cleaner architecture
10. **Add pagination helpers** - Common blog need

### 📋 DO LATER (1-2 months)

11. **Add i18n support** - Expand audience
12. **Add search** - Better UX
13. **Add archetypes CLI** - Better DX
14. **Add more layouts** - Richer theme
15. **Add test suite** - Quality assurance
16. **Consolidate lib/ modules** - Simpler structure
17. **Add TypeScript definitions** - Better IDE support
18. **Support alternative package managers** - Broader compatibility

---

## Conclusion

This is a **solid v2.0 foundation** with excellent cascade architecture and developer experience. The main areas for improvement are:

1. **Reducing duplication** through shared path resolution utilities
2. **Filling feature gaps** to match Hugo/Jekyll feature parity
3. **Leveraging more Eleventy APIs** (plugins, collections, computed data)
4. **Adding content** (more layouts, examples, partials)

The theme is well-positioned to become a comprehensive Eleventy starter that rivals Hugo and Jekyll themes in functionality while maintaining Eleventy's flexibility.

**Estimated Effort:**
- Critical fixes: 4-8 hours
- Next priorities: 20-40 hours
- Full feature parity: 80-120 hours

---

## Appendix: Quick Wins

These can be done in <30 minutes each:

✅ Fix sortAlphabetically()
✅ Add RSS feed template
✅ Add sitemap template
✅ Add 404 layout
✅ Add page.njk layout
✅ Add excerpt filter
✅ Add readingTime filter
✅ Fix navigation in base.njk
✅ Add SEO partial
✅ Add getOverridePath() helper
✅ Document directory data files
✅ Add content-templates/ directory

These low-effort improvements would significantly increase the theme's value with minimal investment.
