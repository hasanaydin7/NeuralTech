# NeuralNg Sidebar

Responsive application-shell navigation that composes with `NeuralMenu` and `NeuralPanelMenu`.

```ts
import { NeuralSidebar, NeuralSidebarContent, NeuralSidebarHeader, NeuralSidebarInitialFocus, NeuralSidebarLabel, NeuralSidebarLayout, NeuralSidebarMain, NeuralSidebarTrigger } from '@neural-ng/core/sidebar';
```

```html
<neural-sidebar-layout>
  <neural-sidebar id="navigation" [(open)]="open" side="start" variant="inset" collapseMode="icon" openOnHover breakpoint="64rem" mobileMode="offcanvas">
    <neural-sidebar-header><span neuralSidebarLabel>Workspace</span></neural-sidebar-header>
    <neural-sidebar-content><neural-panel-menu [items]="items" /></neural-sidebar-content>
  </neural-sidebar>
  <main neuralSidebarMain>
    <button #trigger="neuralSidebarTrigger" [neuralSidebarTrigger]="'navigation'" [attr.aria-label]="trigger.expanded() ? 'Collapse navigation' : 'Expand navigation'">
      <i class="nt" [class.nt-layout-sidebar-left-collapse]="trigger.expanded()" [class.nt-layout-sidebar-left-expand]="!trigger.expanded()"></i>
    </button>
  </main>
</neural-sidebar-layout>
```

`NeuralPanelMenu` automatically adopts a flush Sidebar presentation. In `icon` mode its labels, metadata, indicators, and separators collapse into a centered icon rail. Activating a parent icon opens its children in a logical-side flyout; after that explicit disclosure, hovering a nested parent opens its next flyout after `hoverOpenDelay`. Deeper branches cascade sideways instead of expanding the first panel vertically. Closing or replacing a root flyout clears every descendant expansion, so reopening the root starts from a clean state. The same PanelMenu state and keyboard model remain active across every level. Escape, outside pointer interaction, and Angular navigation close the flyout. Set `iconMenu="hidden"` when child navigation must not be available in the collapsed state. Use `neuralSidebarLabel` for custom header and footer labels.

`NeuralMenu` also adopts the flush Sidebar surface. In collapsed `icon` mode,
its action labels, metadata, group headings, and separators reduce to centered
top-level icons; hover and keyboard focus expose each action label beside the
rail. Import `NeuralMenu` independently from `@neural-ng/core/menu` and project
it into `neural-sidebar-content` exactly like `NeuralPanelMenu`.

Set `openOnHover` to temporarily expand a collapsed desktop icon rail without changing the controlled `open` model. `hoverOpenDelay` defaults to `100`ms and `hoverCloseDelay` to `180`ms. Focused content remains expanded until focus leaves, touch pointers are ignored, and `hoverChange` reports the temporary state. When hover expansion is disabled, focused or hovered rail items expose their label beside the rail; parent icons can still open their child flyout.

`start` and `end` follow document direction. Offcanvas mode supplies backdrop dismissal, Escape handling, focus containment, background scroll locking, navigation dismissal, and focus restoration. `showBackdrop="false"` removes only the visual backdrop without changing overlay positioning; `modal` and `blockScroll` remain independent policies. Apply `neuralSidebarInitialFocus` to the preferred first control. Set `blockScroll="false"`, `closeOnNavigation="false"`, or `closeOnMobile="false"` to opt out of those policies. `unstyled` removes visual classes while retaining structural hooks.
