# @eleventy-themes/core

Build-agnostic cascade system for Eleventy themes.

## Features

- **Template Loading** - ThemeAwareLoader with `@theme` alias for Nunjucks
- **Data Cascade** - User data files override theme defaults
- **Static Assets Cascade** - User assets override theme assets
- **Feature Resolution** - Discover and resolve features from user or theme
- **Theme Validation** - Helpful errors with suggested fixes
- **Self-Describing Metadata** - Themes export their structure as data

## Installation

```bash
npm install @eleventy-themes/core
```

## Usage

### Creating a Theme

```js
// my-theme/lib/index.mjs
import { createThemePlugin } from '@eleventy-themes/core';
import themeMetadata from '../theme.json' assert { type: 'json' };
import filters from './filters.mjs';
import shortcodes from './shortcodes.mjs';

export const plugin = createThemePlugin(themeMetadata, {
  helpers: {
    filters,
    shortcodes,
  },
});

export { themeMetadata as metadata };
```

### Using a Theme

```js
// eleventy.config.js
import { plugin as myTheme } from 'my-theme';

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(myTheme);
}
```

## API

### `createThemePlugin(themeMetadata, options)`

Creates an Eleventy plugin from theme metadata.

**Parameters:**
- `themeMetadata` (Object) - Theme specification from theme.json
- `options` (Object) - Configuration options
  - `helpers` (Object) - Theme helpers
    - `filters` (Object) - Nunjucks filters
    - `shortcodes` (Object) - Nunjucks shortcodes
    - `transforms` (Object) - Eleventy transforms

**Returns:** Function - Eleventy plugin function

**Example:**
```js
const plugin = createThemePlugin(metadata, {
  helpers: {
    filters: {
      uppercase: (str) => str.toUpperCase(),
    },
  },
});
```

### Cascade Functions

#### `resolveLayout(layoutName, projectRoot, overridePaths)`

Resolve layout file (user overrides theme).

**Parameters:**
- `layoutName` (string) - Layout name (e.g., 'base')
- `projectRoot` (string) - Project root path
- `overridePaths` (Object) - Override paths config

**Returns:** Object - `{ path, source }` where source is 'user' or 'theme'

#### `resolveDataFile(dataName, projectRoot, overridePaths)`

Resolve data file (user overrides theme).

#### `resolveFeaturePath(featureName, projectRoot, overridePaths)`

Resolve feature file (user overrides theme).

#### `resolveStaticAsset(assetPath, projectRoot, overridePaths)`

Resolve static asset (user overrides theme).

### Validation

#### `validateTheme(themeMetadata)`

Validate theme metadata structure.

**Returns:** Object - `{ valid, errors }` where errors is array of validation errors

#### `logValidation(validationResult)`

Log validation results to console with helpful formatting.

## Theme Metadata Format

```json
{
  "name": "my-theme",
  "version": "1.0.0",
  "paths": {
    "layouts": "layouts",
    "features": "features",
    "styles": "styles",
    "scripts": "scripts",
    "data": "data",
    "public": "public"
  },
  "defaultOverridePaths": {
    "layouts": "overrides/layouts",
    "features": "overrides/features",
    "data": "content/_data",
    "public": "public"
  }
}
```

See `@eleventy-themes/base-blog` for a complete example.

## Philosophy

**Build-agnostic** - Works with any build tool or no build tool. The core cascade system has zero build tool dependencies.

**User-first** - User files always win in cascade resolution.

**Convention over configuration** - Sensible defaults, minimal setup required.

## License

MIT
