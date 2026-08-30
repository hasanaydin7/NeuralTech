import { SiteOnThisPage } from '../../../shared/on-this-page';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { NeuralButton, NeuralButtonGroup } from '@neural-ng/core/button';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import {
  TabComponent,
  TabListComponent,
  TabPanelComponent,
  TabPanelsComponent,
  TabsComponent,
  type NeuralTabsClasses,
  type NeuralTabValue,
} from '@neural-ng/core/tabs';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';

type ButtonDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-button-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    NeuralButton,
    NeuralButtonGroup,
    CodeView,
    TabComponent,
    TabListComponent,
    TabPanelComponent,
    TabPanelsComponent,
    TabsComponent,
  ],
  templateUrl: './button.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly lastEvent = signal('Waiting for interaction');
  readonly saving = signal(false);
  readonly view = resolveButtonDocView(this.router.url);
  readonly selectedView = signal<ButtonDocView>(this.view);
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
    ButtonDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic', 'basic'],
      ['Severities', 'severity'],
      ['Variants', 'variants'],
      ['Icons & sizing', 'icons'],
      ['Button group', 'button-group'],
      ['States', 'states'],
      ['Badges', 'badges'],
      ['Forms', 'forms'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [['Overview', 'accessibility']],
    api: [
      ['Inputs', 'inputs'],
      ['Output', 'output'],
    ],
    tokens: [['Design tokens', 'tokens']],
  };
  private loadingTimer: ReturnType<typeof setTimeout> | undefined;

  readonly importCode = `import { NeuralButton, NeuralButtonGroup } from '@neural-ng/core/button';

@Component({
  imports: [NeuralButton, NeuralButtonGroup],
  // ...
})`;

  readonly basicCode = `<neural-button label="Save changes" severity="primary" />

<neural-button [label]="saveLabel()" (clicked)="save($event)" />`;

  readonly severityCode = `<neural-button severity="primary">Primary</neural-button>
<neural-button severity="secondary">Secondary</neural-button>
<neural-button severity="neutral">Neutral</neural-button>
<neural-button severity="success">Success</neural-button>
<neural-button severity="info">Info</neural-button>
<neural-button severity="warning">Warning</neural-button>
<neural-button severity="error">Error</neural-button>`;

  readonly variantCode = `<neural-button severity="primary">Solid</neural-button>
<neural-button severity="primary" outlined>Outlined</neural-button>
<neural-button severity="primary" raised>Raised</neural-button>
<neural-button severity="primary" text>Text</neural-button>
<neural-button severity="primary" text raised>Text raised</neural-button>
<neural-button severity="primary" rounded>Rounded</neural-button>`;

  readonly groupCode = `<neural-button-group ariaLabel="Text alignment">
  <neural-button icon="nt nt-align-left" ariaLabel="Align left" />
  <neural-button icon="nt nt-align-center" ariaLabel="Align center" />
  <neural-button icon="nt nt-align-right" ariaLabel="Align right" />
</neural-button-group>

<neural-button-group orientation="vertical" ariaLabel="View mode">
  <neural-button label="List" icon="nt nt-list" />
  <neural-button label="Grid" icon="nt nt-layout-grid" />
</neural-button-group>`;

  readonly iconCode = `<neural-button label="Save" icon="nt nt-check" severity="primary" />

<neural-button
  label="Continue"
  icon="nt nt-arrow-right"
  iconPosition="end"
/>

<neural-button icon="nt nt-settings" ariaLabel="Open settings" />`;

  readonly sizeCode = `<neural-button label="Small" size="small" />
<neural-button label="Default" size="medium" />
<neural-button label="Large" size="large" />

<!-- Override only the glyph; the control remains medium. -->
<neural-button label="Compact icon" icon="nt nt-check" iconSize="small" />`;

  readonly stateCode = `<neural-button [disabled]="true">Disabled</neural-button>
<neural-button [loading]="saving()" loadingLabel="Saving changes">
  Save changes
</neural-button>`;

  readonly badgeCode = `<neural-button [badge]="128" [badgeMax]="99" badgePosition="start" badgeSeverity="info">
  Inbox
</neural-button>

<neural-button
  icon="nt nt-bell"
  ariaLabel="Notifications"
  [badge]="8"
  badgePosition="top-end"
  badgeSeverity="error"
/>`;

  readonly formCode = `<form (ngSubmit)="createProject()">
  <neural-button type="reset" severity="secondary">Reset</neural-button>
  <neural-button type="submit" severity="primary">Create project</neural-button>
</form>`;

  readonly unstyledCode = `<neural-button
  [unstyled]="true"
  buttonClass="inline-flex items-center gap-2 rounded-full border border-cyan-300/30
    bg-cyan-400/10 px-5 py-2.5 font-bold text-cyan-700 backdrop-blur-xl
    transition hover:-translate-y-0.5 hover:bg-cyan-400/20 focus-visible:outline-2
    focus-visible:outline-offset-2 focus-visible:outline-cyan-500 dark:text-cyan-200"
>
  <i class="nt nt-sparkles" aria-hidden="true"></i>
  Tailwind owned
</neural-button>`;

  readonly inputs = [
    [
      'type',
      `'button' | 'submit' | 'reset'`,
      `'button'`,
      'Native button type.',
    ],
    [
      'severity',
      'NeuralButtonSeverity',
      `'neutral'`,
      'Semantic visual intent.',
    ],
    ['disabled', 'boolean', 'false', 'Disables native interaction.'],
    ['loading', 'boolean', 'false', 'Displays progress and blocks activation.'],
    [
      'loadingLabel',
      'string',
      `'Loading'`,
      'Visible and accessible busy label.',
    ],
    [
      'ariaLabel',
      'string | null',
      'null',
      'Accessible name for icon-only actions.',
    ],
    ['ariaExpanded', "'true' | 'false' | null", 'null', 'Disclosure state.'],
    ['ariaControls', 'string | null', 'null', 'Controlled surface ID.'],
    [
      'ariaKeyShortcuts',
      'string | null',
      'null',
      'Composite-control shortcuts.',
    ],
    ['title', 'string', `''`, 'Supplementary native title.'],
    [
      'label',
      'string | null',
      'null',
      'Visible label; projection remains the fallback.',
    ],
    [
      'icon',
      'string | null',
      'null',
      'Icon class string, such as nt nt-check.',
    ],
    [
      'iconPosition',
      `'start' | 'end'`,
      `'start'`,
      'Logical icon position around the label.',
    ],
    [
      'size',
      `'small' | 'medium' | 'large'`,
      `'medium'`,
      'Preset control size.',
    ],
    [
      'iconSize',
      `'small' | 'medium' | 'large' | null`,
      'null',
      'Icon size override; null follows the control size.',
    ],
    ['outlined', 'boolean', 'false', 'Uses a transparent bordered treatment.'],
    ['raised', 'boolean', 'false', 'Adds elevation to any visual variant.'],
    ['text', 'boolean', 'false', 'Uses a borderless text treatment.'],
    ['rounded', 'boolean', 'false', 'Uses the pill-shaped radius token.'],
    ['buttonClass', 'string', `''`, 'Classes applied to the native button.'],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    [
      'badge',
      'string | number | null',
      'null',
      'Inline or floating badge value.',
    ],
    [
      'badgePosition',
      'NeuralButtonBadgePosition',
      `'end'`,
      'Inline or corner position.',
    ],
    [
      'badgeSeverity',
      'NeuralBadgeSeverity',
      `'neutral'`,
      'Badge semantic color.',
    ],
    ['badgeSize', 'NeuralBadgeSize', `'small'`, 'Badge size.'],
    ['badgeMax', 'number | null', 'null', 'Maximum count before + formatting.'],
    [
      'badgeAriaLabel',
      'string | null',
      'null',
      'Accessible badge description.',
    ],
    ['badgeClass', 'string', `''`, 'Consumer classes for the badge.'],
  ] as const;

  readonly tokens = [
    '--neural-button-padding',
    '--neural-button-gap',
    '--neural-button-radius',
    '--neural-button-rounded-radius',
    '--neural-button-group-radius',
    '--neural-button-font-size',
    '--neural-button-font-weight',
    '--neural-button-background',
    '--neural-button-background-hover',
    '--neural-button-color',
    '--neural-button-border-color',
    '--neural-button-shadow',
    '--neural-button-shadow-hover',
    '--neural-button-raised-shadow',
    '--neural-button-raised-shadow-hover',
    '--neural-button-focus-ring',
    '--neural-button-disabled-opacity',
    '--neural-button-transition',
  ] as const;

  constructor() {
    const navigationSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.selectedView.set(resolveButtonDocView(event.urlAfterRedirects));
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.loadingTimer) clearTimeout(this.loadingTimer);
      navigationSubscription.unsubscribe();
    });
  }

  noteClick(event: MouseEvent): void {
    this.lastEvent.set(
      `clicked emitted · ${event.type} · ${new Date().toLocaleTimeString()}`,
    );
  }

  simulateSave(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.lastEvent.set('Loading prevents repeated activation');
    this.loadingTimer = setTimeout(() => {
      this.saving.set(false);
      this.lastEvent.set('Save completed');
    }, 1400);
  }

  selectView(value: NeuralTabValue | null): void {
    if (!isButtonDocView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    const suffix = value === 'component' ? '' : `/${value}`;
    void this.router.navigateByUrl(`/docs/components/button${suffix}`);
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveButtonDocView(url: string): ButtonDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isButtonDocView(value: NeuralTabValue | null): value is ButtonDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
