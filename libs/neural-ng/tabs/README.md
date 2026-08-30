# NeuralNg Tabs v0.1 Beta

Composable, Signal-first and headless-friendly tabs for Angular 22+.

Current component maturity: `beta`.

## Import

```ts
import { NeuralTab, NeuralTabList, NeuralTabPanel, NeuralTabPanels, NeuralTabs } from '@neural-ng/core/tabs';
```

Add the standalone declarations used by the template to the consumer
component's `imports` array. The former `*Component` names remain deprecated
aliases for migration only.

## Basic usage

```ts
readonly activeTab = signal<string | number | null>('profile');
```

```html
<neural-tabs [(value)]="activeTab">
  <neural-tab-list ariaLabel="Account sections">
    <neural-tab value="profile" iconClass="nt-user">Profile</neural-tab>
    <neural-tab value="security">
      <i class="my-security-icon" aria-hidden="true"></i>
      Security
    </neural-tab>
    <neural-tab value="billing" disabled>Billing</neural-tab>
  </neural-tab-list>

  <neural-tab-panels>
    <neural-tab-panel value="profile">Profile content</neural-tab-panel>
    <neural-tab-panel value="security">Security content</neural-tab-panel>
    <neural-tab-panel value="billing">Billing content</neural-tab-panel>
  </neural-tab-panels>
</neural-tabs>
```

Tab and panel values are strings or numbers, must be unique within their group,
and must match. If `value` is null, invalid, disabled, or removed, the first
enabled tab becomes active.

## Icons

`iconClass` is a convenience input on `neural-tab`. A Neural Icons name such as
`nt-user` automatically receives the required `nt` base class:

```html
<neural-tab value="profile" iconClass="nt-user">Profile</neural-tab>
```

Multiple classes, including color utilities, are preserved. Other class-based
icon systems are not modified. For custom markup, badges, or layered icons,
project content directly inside the tab instead. Tabs has no package dependency
on `@neural-ng/icons`.

## Activation and orientation

Automatic activation is the default. Arrow-key focus immediately selects the
new tab. Manual activation moves focus only; Enter or Space selects it:

```html
<neural-tabs orientation="vertical" activationMode="manual">
  <!-- list and panels -->
</neural-tabs>
```

- Horizontal lists use Left/Right. Their direction follows computed LTR/RTL.
- Vertical lists use Up/Down.
- Home and End move to the first and last enabled tab.
- Navigation wraps and skips disabled tabs.
- Tab moves through the tablist as one stop using roving `tabindex`.

## Responsive overflow and motion

Horizontal lists scroll naturally when their container becomes narrower than
their tabs. Vertical lists use block-axis overflow when the consumer gives the
list a constrained height. Focused tabs remain reachable through native browser
scrolling; no duplicate navigation buttons are added to the accessibility tree.

Styled tabs use a token-driven active indicator and a short panel-enter motion.
`prefers-reduced-motion: reduce` disables panel animation and makes indicator
transitions effectively immediate. Both behaviors are absent in `unstyled`
mode and can be replaced by consumer classes.

## Accessibility

The components implement the WAI-ARIA Tabs pattern with native buttons,
`tablist`, `tab`, and `tabpanel` roles, linked IDs, `aria-selected`,
`aria-controls`, and `aria-labelledby`. Give each list an accessible name using
`ariaLabel` or `ariaLabelledby`.

Panels are focusable by default so keyboard users can enter their content. Set
`[focusable]="false"` when the panel begins with an appropriate focusable
element. Generated IDs are deterministic and SSR/hydration-safe; use `tabsId`
when a stable application-defined prefix is preferred.

In development builds, NeuralNg warns once per invalid composition signature:
duplicate tab/panel values, tabs without panels, and panels without tabs. These
diagnostics do not run in production builds.

## Class slots and unstyled mode

`tabsClass`, `listClass`, `tabClass`, `panelsClass`, and `panelClass` are
additive native-element classes. Typed class slots can style shared parts:

```html
<neural-tabs
  unstyled
  tabsClass="my-tabs"
  [classes]="{
    list: 'my-list',
    tab: 'my-tab',
    activeTab: 'my-tab-active',
    disabledTab: 'my-tab-disabled',
    panels: 'my-panels',
    panel: 'my-panel'
  }"
>
  <!-- list and panels -->
</neural-tabs>
```

`unstyled` removes visual `*-base` classes while retaining structural classes,
behavior, and ARIA. Global `provideNeuralNg({ unstyled: true })` is also
respected.

The reference themes expose component tokens under `--neural-tabs-*` and
`--neural-tab-*`, including list spacing/border, tab colors/backgrounds,
active/hover/focus/disabled states, typography, transitions, and panel padding.
Override tokens on any ancestor to theme one Tabs instance without replacing
its class structure.

The Neutral theme has no tab or list border by default. Opt in with
`--neural-tab-border` or `--neural-tabs-list-border`. Vertical layouts keep the
list and panel visually separate through `--neural-tabs-vertical-gap`.

Motion and overflow tokens include `--neural-tab-indicator-*`,
`--neural-tab-panel-enter-*`, `--neural-tabs-scrollbar-color`, and
`--neural-tabs-scrollbar-width`.

## Public inputs

### `neural-tabs`

| Input            | Default        | Purpose                                     |
| ---------------- | -------------- | ------------------------------------------- |
| `value`          | `null`         | Active string/number model value            |
| `orientation`    | `'horizontal'` | Horizontal or vertical keyboard behavior    |
| `activationMode` | `'automatic'`  | Automatic or manual selection on focus      |
| `tabsId`         | generated      | ID prefix linking tabs and panels           |
| `unstyled`       | `false`        | Remove visual classes                       |
| `tabsClass`      | `''`           | Add classes to the root element             |
| `classes`        | `{}`           | Typed root/list/tab/state/panel class slots |

### Child components

- `neural-tab-list`: `ariaLabel`, `ariaLabelledby`, `listClass`.
- `neural-tab`: required `value`; `disabled`, `iconClass`, `tabClass`.
- `neural-tab-panels`: `panelsClass`.
- `neural-tab-panel`: required `value`; `focusable`, `panelClass`.

Panel content is eager in the Beta release and inactive panels use the native
`hidden` state. A lazy rendering API is intentionally deferred until its SSR,
state preservation, and accessibility contract is settled.
