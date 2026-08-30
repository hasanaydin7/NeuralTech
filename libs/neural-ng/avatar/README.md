# NeuralNg Avatar

Image, initials, icon, and custom fallback identities for Angular 22+.

```ts
import { NeuralAvatar, NeuralAvatarGroup, type NeuralAvatarClasses } from '@neural-ng/core/avatar';

@Component({ imports: [NeuralAvatar, NeuralAvatarGroup] })
export class Example {}
```

## Image and fallback

```html
<neural-avatar src="/users/ada.webp" srcSet="/users/ada.webp 1x, /users/ada@2x.webp 2x" sizes="48px" name="Ada Lovelace" loading="lazy" />
```

`name` supplies the native image alt text when `alt` is not explicitly set.
It also derives a two-letter fallback from the first and last words. Override
that value with `initials`.

Fallback priority is:

1. Valid `src`
2. Explicit or derived initials
3. `iconClass`
4. Projected fallback content

```html
<neural-avatar name="Ada Lovelace" />
<neural-avatar initials="AL" ariaLabel="Ada Lovelace" />
<neural-avatar iconClass="nt nt-user" ariaLabel="Account" />
<neural-avatar ariaLabel="Neural AI"><strong>AI</strong></neural-avatar>
```

Neural Icons are optional. Avatar never adds an icon package dependency;
consumers opt in with `iconClass`.

## Sizes and shapes

Sizes are `extra-small`, `small`, `medium`, `large`, and `extra-large`. Shapes are `circle`, `rounded`,
and `square`. `imageFit` accepts `cover` or `contain`. Responsive image inputs
are `srcSet` and `sizes`; native loading inputs are `loading`, `decoding`,
`fetchPriority`, and `referrerPolicy`.

`imageLoaded` and `imageError` emit the native `Event`. An image error switches
to fallback without displaying a broken image. Changing `src` resets the error
state and retries.

## Badge composition

Import `NeuralBadgeDirective` from `@neural-ng/core/badge` and place it directly on
the Avatar host:

```html
<neural-avatar name="Ada Lovelace" neuralBadge="" neuralBadgeDot neuralBadgePosition="bottom-end" neuralBadgeSeverity="success" neuralBadgeAriaLabel="Online" />
```

Notification counts use the same API:

```html
<neural-avatar name="Ada Lovelace" [neuralBadge]="5" neuralBadgePosition="top-end" neuralBadgeSeverity="error" />
```

## AvatarGroup

```html
<neural-avatar-group [max]="3" ariaLabel="Project team" overflowLabel="{count} more teammates">
  <neural-avatar name="Ada Lovelace" />
  <neural-avatar name="Grace Hopper" />
  <neural-avatar name="Margaret Hamilton" />
  <neural-avatar name="Radia Perlman" />
</neural-avatar-group>
```

`max` limits visible projected Avatars and renders `+N` for the remainder.
`overflowLabel` must retain the `{count}` placeholder and should be localized.
Logical overlap follows RTL automatically.

## Headless mode

Avatar inputs:

- `unstyled`
- `avatarClass`
- `classes`: `root`, `image`, `fallback`, `initials`, `icon`, `content`

AvatarGroup inputs:

- `unstyled`
- `groupClass`
- `classes`: `root`, `overflow`

Structural hooks remain in unstyled mode. Global headless mode is available
through `provideNeuralNg({ unstyled: true })`.

Primary tokens include `--neural-avatar-*-size`,
`--neural-avatar-fallback-*`, `--neural-avatar-group-overlap`, and
`--neural-avatar-group-overflow-*`.

`AvatarComponent` and `AvatarGroupComponent` remain deprecated compatibility
aliases. New code should use `NeuralAvatar` and `NeuralAvatarGroup`.

## Beta boundary

Beta includes native responsive images, deterministic fallbacks, image retry,
five sizes, three shapes, shared Badge composition, grouped overflow, RTL, and
headless ownership. Upload, crop, presence transport, profile fetching,
interactive user menus, and tooltip behavior remain separate concerns.
