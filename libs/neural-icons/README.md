# Neural Icons

Neural Icons is the optional, framework-independent icon package for NeuralNg.
It exposes a low-friction `nt nt-*` class API backed by SVG CSS masks rather
than an icon font.

## Install

```sh
npm install @neural-ng/icons
```

Import the stylesheet once:

```css
@import '@neural-ng/icons/icons.css';
```

Use an empty `i` or `span` element:

```html
<i class="nt nt-user" aria-hidden="true"></i>
<span class="nt nt-search" aria-hidden="true"></span>
<i class="nt nt-spinner nt-spin" aria-hidden="true"></i>
```

Icons inherit `color` and use `1em` for width and height, so regular CSS and
utility classes control them without an Angular component:

```html
<i class="nt nt-bell text-2xl text-blue-500" aria-hidden="true"></i>
```

## Motion

`nt-spin` rotates an icon clockwise and `nt-spin-reverse` rotates it in the
opposite direction. `nt-spin-dual` separates supported artwork into two masks,
rotating the outer layer clockwise and the inner layer counter-clockwise:

```html
<i class="nt nt-loader-3 nt-spin-dual" aria-hidden="true"></i>
```

The initial layered set contains only `loader-3`. On other icons,
`nt-spin-dual` safely falls back to rotating the complete icon. More icons can
be added after visual review. Use `--nt-spin-duration` for the whole/outer
layer and `--nt-spin-inner-duration` for the inner layer:

```css
.fast-loader {
  --nt-spin-duration: 1.2s;
  --nt-spin-inner-duration: 0.55s;
}
```

All motion classes stop when `prefers-reduced-motion: reduce` is active.

## Accessibility

Most icons are decorative. Hide those icons from assistive technology and put
the accessible name on the interactive control:

```html
<button type="button" aria-label="Open profile">
  <i class="nt nt-user" aria-hidden="true"></i>
</button>
```

Do not rely on an icon shape or CSS class name as an accessible name. When an
icon conveys information without nearby text, provide visually hidden text.

## Content Security Policy

Neural Icons embeds each SVG in CSS as a `data:` URL. No runtime request is
made to Tabler, a CDN, or any third party. Applications with a restrictive
Content Security Policy must allow embedded image data:

```http
Content-Security-Policy: img-src 'self' data:;
```

Without `data:` in the effective `img-src` policy, browsers may render CSS
masks as transparent. Add the source to an existing policy; do not replace a
more restrictive application policy wholesale.

## Icon sets

The default stylesheet remains a curated 67-icon set so applications do not
pay for icons they do not use:

```css
@import '@neural-ng/icons/icons.css';
```

The complete Tabler 3.46.0 inventory is available through explicit entry
points:

```css
/* 5,130 outline icons: nt-user, nt-search, ... */
@import '@neural-ng/icons/outline.css';

/* 1,054 filled icons: nt-filled-user, nt-filled-bell, ... */
@import '@neural-ng/icons/filled.css';

/* Both styles (6,184 SVG files). */
@import '@neural-ng/icons/all.css';
```

Use a category when a smaller payload is preferable. Category names follow
Tabler's metadata and are lowercase kebab-case:

```css
@import '@neural-ng/icons/categories/arrows.css';
@import '@neural-ng/icons/categories/communication.css';
@import '@neural-ng/icons/brands.css';
```

Filled categories use the same category names:

```css
@import '@neural-ng/icons/categories/filled/system.css';
```

`metadata.json` is the machine-readable catalog used by the NeuralNg demo. It
contains every icon name, available style, category, supported effect, and
inventory count:

```js
import metadata from '@neural-ng/icons/metadata.json';
```

Brand icons are opt-in because their names and logos may be protected by their
respective trademark owners. The MIT license covers the distributed artwork;
it does not grant trademark rights or imply endorsement.

`manifest.json` remains the canonical mapping for the curated set. Update it
and run:

```sh
npx nx run neural-icons:generate
npx nx test neural-icons
npx nx build neural-icons
```

## Source and license

The SVG designs are selected from Tabler Icons 3.46.0 and converted into CSS
masks at build time. Tabler Icons are distributed under the MIT License.
See `THIRD_PARTY_NOTICES.md` and the bundled license notice. NeuralNg does not
claim the upstream drawings as original NeuralNg artwork.

Future NeuralNg-specific icons will use the same 24x24 outline design contract
and will be identified separately in the manifest.
