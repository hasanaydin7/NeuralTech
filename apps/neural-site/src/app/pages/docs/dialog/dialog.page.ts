import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NeuralButton } from '@neural-ng/core/button';
import {
  NeuralDialog,
  NeuralDialogBody,
  NeuralDialogFooter,
  NeuralDialogHeader,
  NeuralDialogInitialFocus,
  type NeuralDialogClasses,
  type NeuralDialogClose,
} from '@neural-ng/core/dialog';
import { NeuralInput } from '@neural-ng/core/input';
import {
  NeuralTab,
  NeuralTabList,
  NeuralTabPanel,
  NeuralTabPanels,
  NeuralTabs,
  type NeuralTabsClasses,
  type NeuralTabValue,
} from '@neural-ng/core/tabs';
import { filter } from 'rxjs';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';

type DialogDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-dialog-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    NeuralButton,
    NeuralDialog,
    NeuralDialogBody,
    NeuralDialogFooter,
    NeuralDialogHeader,
    NeuralDialogInitialFocus,
    NeuralInput,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './dialog.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly selectedView = signal<DialogDocView>(resolveView(this.router.url));
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly pageLinks: Record<
    DialogDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Native modal', 'native-modal'],
      ['Controlled state', 'controlled'],
      ['Non-modal', 'non-modal'],
      ['Responsive width', 'responsive'],
      ['Full screen', 'full-screen'],
      ['Lifecycle', 'lifecycle'],
      ['Unstyled', 'unstyled'],
      ['Boundaries', 'boundaries'],
    ],
    accessibility: [
      ['Native semantics', 'native-semantics'],
      ['Accessible name', 'accessible-name'],
      ['Focus lifecycle', 'focus-lifecycle'],
      ['Keyboard', 'keyboard'],
      ['Dismiss policy', 'dismiss-policy'],
      ['SSR and hydration', 'ssr'],
    ],
    api: [
      ['Inputs', 'inputs'],
      ['Outputs', 'outputs'],
      ['Methods', 'methods'],
      ['Sections', 'sections'],
      ['Class slots', 'class-slots'],
      ['Types', 'types'],
    ],
    tokens: [
      ['Surface', 'surface-tokens'],
      ['Layout', 'layout-tokens'],
      ['Close control', 'close-tokens'],
      ['Motion', 'motion-tokens'],
    ],
  };

  readonly controlledOpen = signal(false);
  readonly nonModalOpen = signal(false);
  readonly lastClose = signal('No dialog closed yet.');
  readonly lifecycle = signal('Closed');
  readonly headlessClasses: NeuralDialogClasses = {
    root: 'w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-[1.75rem] border border-cyan-300/30 bg-slate-950 p-0 text-cyan-50 shadow-[0_32px_100px_rgba(2,8,23,.72)] backdrop:bg-slate-950/65 backdrop:backdrop-blur-sm',
    header: 'border-b border-cyan-300/15 px-6 py-5',
    body: 'px-6 py-5 leading-7 text-cyan-50/75',
    footer: 'flex justify-end gap-3 border-t border-cyan-300/15 px-6 py-4',
    closeButton:
      'absolute right-4 top-4 grid size-9 cursor-pointer place-items-center rounded-full text-cyan-200 transition hover:bg-cyan-300/10 focus-visible:outline-2 focus-visible:outline-cyan-300',
    closeIcon: 'nt nt-x',
  };

  readonly importCode = `import {
  NeuralDialog,
  NeuralDialogHeader,
  NeuralDialogBody,
  NeuralDialogFooter,
  NeuralDialogInitialFocus,
} from '@neural-ng/core/dialog';

@Component({ imports: [NeuralDialog, NeuralDialogHeader] })`;
  readonly basicCode = `<neural-button label="Edit profile" (clicked)="dialog.show()" />

<neural-dialog
  #dialog
  ariaLabelledby="profile-title"
  ariaDescribedby="profile-description"
  (closed)="handleClose($event)"
>
  <neural-dialog-header><h2 id="profile-title">Edit profile</h2></neural-dialog-header>
  <neural-dialog-body>
    <p id="profile-description">Update your public display name.</p>
    <input neuralInput neuralDialogInitialFocus aria-label="Display name" />
  </neural-dialog-body>
  <neural-dialog-footer>
    <neural-button label="Cancel" outlined (clicked)="dialog.close()" />
    <neural-button label="Save" (clicked)="dialog.close('api', 'saved')" />
  </neural-dialog-footer>
</neural-dialog>`;
  readonly controlledCode = `<neural-dialog
  [open]="open()"
  (openChange)="open.set($event)"
  [closeOnEscape]="false"
  [dismissibleBackdrop]="false"
  ariaLabel="Release review"
/>`;
  readonly nonModalCode = `<neural-dialog
  [modal]="false"
  [(open)]="panelOpen"
  ariaLabel="Non-modal task details"
/>`;
  readonly responsiveCode = `<neural-dialog
  #dialog
  fluid
  showFullScreenButton
  ariaLabel="Responsive dialog"
  (fullChange)="trackFullScreen($event)"
>
  <!-- Width remains viewport-safe. -->
</neural-dialog>`;
  readonly fullCode = `<neural-dialog
  #dialog
  full
  showFullScreenButton
  ariaLabelledby="workspace-title"
>
  <neural-dialog-header>
    <h2 id="workspace-title">Focused workspace</h2>
  </neural-dialog-header>
  <neural-dialog-body>
    <!-- Fills 100vw × 100dvh and scrolls internally. -->
  </neural-dialog-body>
</neural-dialog>`;
  readonly lifecycleCode = `<neural-dialog
  (opened)="track('opened')"
  (closed)="track($event.reason, $event.returnValue)"
/>`;
  readonly unstyledCode = `<neural-dialog
  #dialog
  unstyled
  [classes]="classes"
  ariaLabelledby="headless-title"
>
  <neural-dialog-header><h2 id="headless-title">Consumer owned</h2></neural-dialog-header>
  <neural-dialog-body>Native behavior remains intact.</neural-dialog-body>
</neural-dialog>`;

  readonly inputs = [
    ['open', 'ModelSignal<boolean>', 'false', 'Controlled visibility model.'],
    ['modal', 'boolean', 'true', 'Uses showModal(); false uses show().'],
    ['closable', 'boolean', 'true', 'Renders the localized close action.'],
    ['closeOnEscape', 'boolean', 'true', 'Allows Escape dismissal.'],
    [
      'dismissibleBackdrop',
      'boolean',
      'true',
      'Allows pointer dismissal outside a modal.',
    ],
    ['fluid', 'boolean', 'false', 'Uses the viewport-safe fluid width.'],
    [
      'full',
      'boolean',
      'false',
      'Fills the complete dynamic viewport; takes precedence over fluid.',
    ],
    [
      'showFullScreenButton',
      'boolean',
      'false',
      'Shows a full-screen toggle immediately before the close action.',
    ],
    ['ariaLabel', 'string | null', 'null', 'Direct accessible name.'],
    [
      'ariaLabelledby',
      'string | null',
      'null',
      'ID of the visible dialog heading.',
    ],
    [
      'ariaDescribedby',
      'string | null',
      'null',
      'ID of descriptive dialog content.',
    ],
    ['closeLabel', 'string | null', 'locale', 'Close-button label override.'],
    [
      'enterFullScreenLabel',
      'string | null',
      'locale',
      'Accessible enter-full-screen label override.',
    ],
    [
      'exitFullScreenLabel',
      'string | null',
      'locale',
      'Accessible exit-full-screen label override.',
    ],
    ['unstyled', 'boolean', 'false', 'Removes every Neural visual class.'],
    ['dialogClass', 'string', "''", 'Additive class on native dialog.'],
    ['classes', 'NeuralDialogClasses', '{}', 'Typed additive slot classes.'],
  ] as const;
  readonly outputs = [
    ['openChange', 'boolean', 'Generated by the open model.'],
    ['fullChange', 'boolean', 'User-triggered full-screen state change.'],
    ['opened', 'void', 'Native dialog entered the top layer.'],
    ['closed', 'NeuralDialogClose', 'Every completed close with exact reason.'],
  ] as const;
  readonly methods = [
    ['show()', 'void', 'Opens with modal/non-modal policy.'],
    [
      "close(reason = 'api', returnValue = '', event?)",
      'void',
      'Closes and records intent plus native return value.',
    ],
  ] as const;
  readonly sections = [
    ['neural-dialog-header', 'headerClass', 'Semantic header slot.'],
    ['neural-dialog-body', 'bodyClass', 'Main content slot.'],
    ['neural-dialog-footer', 'footerClass', 'Action-row slot.'],
    ['neuralDialogInitialFocus', 'directive', 'Receives focus after opening.'],
  ] as const;
  readonly classSlots = [
    ['root', 'Native dialog element.'],
    ['header', 'Projected header section.'],
    ['body', 'Projected body section.'],
    ['footer', 'Projected footer section.'],
    ['closeButton', 'Localized close button.'],
    ['closeIcon', 'Neural Icons close glyph.'],
    ['fullScreenButton', 'Optional full-screen toggle action.'],
    ['fullScreenIcon', 'Dynamic maximize/minimize Neural Icon.'],
  ] as const;
  readonly publicTypes = [
    [
      'NeuralDialogCloseReason',
      "'api' | 'escape' | 'backdrop' | 'close-button' | 'native'",
    ],
    ['NeuralDialogClose', '{ reason, returnValue, nativeEvent? }'],
    ['NeuralDialogClasses', 'Typed additive class-slot contract.'],
  ] as const;
  readonly surfaceTokens = [
    '--neural-dialog-color',
    '--neural-dialog-background',
    '--neural-dialog-border',
    '--neural-dialog-radius',
    '--neural-dialog-shadow',
    '--neural-dialog-backdrop',
    '--neural-dialog-backdrop-filter',
    '--neural-dialog-font-family',
  ] as const;
  readonly layoutTokens = [
    '--neural-dialog-width',
    '--neural-dialog-full-border',
    '--neural-dialog-full-radius',
    '--neural-dialog-full-shadow',
    '--neural-dialog-header-gap',
    '--neural-dialog-header-padding',
    '--neural-dialog-header-border',
    '--neural-dialog-body-padding',
    '--neural-dialog-body-color',
    '--neural-dialog-footer-justify',
    '--neural-dialog-footer-gap',
    '--neural-dialog-footer-padding',
    '--neural-dialog-footer-border',
  ] as const;
  readonly closeTokens = [
    '--neural-dialog-close-inset',
    '--neural-dialog-close-size',
    '--neural-dialog-close-color',
    '--neural-dialog-close-color-hover',
    '--neural-dialog-close-background',
    '--neural-dialog-close-background-hover',
    '--neural-dialog-close-border',
    '--neural-dialog-close-radius',
    '--neural-dialog-close-icon-size',
    '--neural-dialog-focus-ring',
    '--neural-dialog-focus-ring-offset',
  ] as const;
  readonly motionTokens = [
    '--neural-dialog-enter-distance',
    '--neural-dialog-enter-scale',
    '--neural-dialog-enter-duration',
    '--neural-dialog-enter-easing',
    '--neural-dialog-leave-duration',
    '--neural-dialog-leave-easing',
    '--neural-dialog-transition',
  ] as const;

  constructor() {
    const subscription = this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) =>
        this.selectedView.set(resolveView(event.urlAfterRedirects)),
      );
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  recordClose(event: NeuralDialogClose): void {
    this.lastClose.set(
      `${event.reason}${event.returnValue ? ` · ${event.returnValue}` : ''}`,
    );
    this.lifecycle.set(`Closed · ${event.reason}`);
  }

  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/dialog${value === 'component' ? '' : `/${value}`}`,
    );
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveView(url: string): DialogDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isView(value: NeuralTabValue | null): value is DialogDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
