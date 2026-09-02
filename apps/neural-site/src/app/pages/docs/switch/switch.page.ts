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
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import {
  NeuralField,
  NeuralFieldError,
  NeuralFieldHint,
} from '@neural-ng/core/field';
import {
  NeuralSwitch,
  type NeuralSwitchChange,
  type NeuralSwitchClasses,
} from '@neural-ng/core/switch';
import {
  NeuralTab,
  NeuralTabList,
  NeuralTabPanel,
  NeuralTabPanels,
  NeuralTabs,
  type NeuralTabsClasses,
  type NeuralTabValue,
} from '@neural-ng/core/tabs';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';

type SwitchDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-switch-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    FormField,
    FormsModule,
    NeuralField,
    NeuralFieldError,
    NeuralFieldHint,
    NeuralSwitch,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
    ReactiveFormsModule,
  ],
  templateUrl: './switch.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwitchPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly selectedView = signal<SwitchDocView>(resolveView(this.router.url));
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly notifications = signal(false);
  readonly accountActive = signal(true);
  readonly readonlyValue = signal(true);
  readonly disabledValue = signal(false);
  readonly invalidValue = signal(false);
  readonly rtlValue = signal(true);
  readonly headlessValue = signal(true);
  readonly eventStatus = signal('No user change yet.');
  readonly formsModel = signal({ notifications: false });
  readonly signalForm = form(this.formsModel);
  readonly reactiveNotifications = new FormControl(true, {
    nonNullable: true,
  });
  templateNotifications = false;
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly headlessClasses: NeuralSwitchClasses = {
    root: 'group inline-flex items-center gap-3 font-mono text-sm text-cyan-100',
    input: 'peer sr-only',
    track:
      'relative inline-flex h-7 w-12 items-center rounded-full border border-slate-600 bg-slate-800 transition peer-focus-visible:ring-4 peer-focus-visible:ring-cyan-400/20',
    checkedTrack: '!border-cyan-400 !bg-cyan-500/30',
    thumb:
      'absolute start-1 size-5 rounded-full bg-slate-300 shadow transition-transform group-data-[state=checked]:translate-x-5',
    label: 'font-bold',
  };
  readonly pageLinks: Record<
    SwitchDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic', 'basic'],
      ['State labels', 'state-labels'],
      ['Forms', 'forms'],
      ['States and Field', 'states'],
      ['Events', 'events-demo'],
      ['RTL', 'rtl'],
      ['Unstyled', 'unstyled'],
      ['Boundaries', 'boundaries'],
    ],
    accessibility: [
      ['Native semantics', 'native'],
      ['Accessible name', 'accessible-name'],
      ['Keyboard', 'keyboard'],
      ['Readonly and disabled', 'readonly-disabled'],
      ['Field state', 'field-state'],
      ['SSR', 'ssr'],
    ],
    api: [
      ['Models and inputs', 'inputs'],
      ['Outputs', 'outputs'],
      ['Methods', 'methods'],
      ['Class slots', 'class-slots'],
      ['Public types', 'types'],
      ['Legacy alias', 'alias'],
    ],
    tokens: [
      ['Layout and typography', 'layout-tokens'],
      ['Track', 'track-tokens'],
      ['Thumb and state', 'state-tokens'],
      ['Motion', 'motion-tokens'],
    ],
  };
  readonly importCode = `import { NeuralSwitch } from '@neural-ng/core/switch';\n\n@Component({ imports: [NeuralSwitch] })`;
  readonly basicCode = `<neural-switch [(checked)]="notifications">\n  Product notifications\n</neural-switch>`;
  readonly labelsCode = `<neural-switch\n  [(checked)]="active"\n  onLabel="On"\n  offLabel="Off"\n  ariaLabel="Account status"\n/>`;
  readonly formsCode = `<!-- Signal Forms -->\n<neural-switch [formField]="signalForm.notifications">Signals</neural-switch>\n\n<!-- Reactive Forms -->\n<neural-switch [formControl]="notificationsControl">Reactive</neural-switch>\n\n<!-- Template-driven Forms -->\n<neural-switch name="notifications" [(ngModel)]="notifications">Template</neural-switch>`;
  readonly statesCode = `<neural-switch disabled>Disabled</neural-switch>\n<neural-switch readonly [checked]="true">Readonly</neural-switch>\n\n<neural-field controlId="marketing-consent" required invalid fluid>\n  <neural-switch>Marketing consent</neural-switch>\n  <small neuralFieldHint>You can change this later.</small>\n  <small neuralFieldError>Consent is required.</small>\n</neural-field>`;
  readonly eventCode = `<neural-switch\n  [(checked)]="notifications"\n  (stateChange)="changed($event)"\n  (touch)="touched()"\n>\n  Notifications\n</neural-switch>`;
  readonly unstyledCode = `<neural-switch\n  unstyled\n  [(checked)]="agentMode"\n  [classes]="switchClasses"\n>\n  Agent mode\n</neural-switch>`;
  readonly inputs = [
    [
      'checked',
      'model<boolean>',
      'false',
      'Authoritative binary value; checkedChange supports two-way binding.',
    ],
    ['disabled', 'boolean', 'false', 'Disables the native checkbox.'],
    [
      'readonly',
      'boolean',
      'false',
      'Keeps focusability while preventing user mutation.',
    ],
    ['required', 'boolean', 'false', 'Enables native required validation.'],
    ['invalid', 'boolean', 'false', 'Exposes ARIA and visual invalid state.'],
    ['pending', 'boolean', 'false', 'Exposes aria-busy on the input.'],
    [
      'touched / dirty',
      'boolean',
      'false',
      'Forms state inputs retained for adapter parity.',
    ],
    ['fluid', 'boolean', 'false', 'Expands the root to available width.'],
    ['inputId', 'string', "''", 'Explicit native input id.'],
    ['name', 'string', "''", 'Native form submission name.'],
    ['inputValue', 'string', "'on'", 'Native value submitted when checked.'],
    [
      'ariaLabel',
      'string',
      "''",
      'Accessible name when no visible label is projected.',
    ],
    [
      'onLabel / offLabel',
      'string',
      "''",
      'Optional visual state text inside the track.',
    ],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['switchClass', 'string', "''", 'Additive root classes.'],
    ['inputClass', 'string', "''", 'Additive native input classes.'],
    ['labelClass', 'string', "''", 'Additive projected label classes.'],
    ['classes', 'NeuralSwitchClasses', '{}', 'Typed visual class slots.'],
  ] as const;
  readonly outputs = [
    [
      'checkedChange',
      'boolean',
      'Generated by the checked model for two-way binding.',
    ],
    [
      'stateChange',
      'NeuralSwitchChange',
      'User-only event with current value, previous value and native event.',
    ],
    ['touch', 'void', 'Emitted when the native input blurs.'],
  ] as const;
  readonly methods = [
    ['focus(options?)', 'void', 'Focuses the native checkbox.'],
    ['reset()', 'void', 'Sets checked to false without a user event.'],
  ] as const;
  readonly publicTypes = [
    [
      'NeuralSwitchChange',
      '{ checked: boolean; previousChecked: boolean; nativeEvent: Event }',
    ],
    [
      'NeuralSwitchClasses',
      'Typed root, native input, track, thumb, label and state-label slots.',
    ],
  ] as const;
  readonly layoutTokens = [
    '--neural-switch-gap',
    '--neural-switch-width',
    '--neural-switch-label-color',
    '--neural-switch-font-family',
    '--neural-switch-font-size',
    '--neural-switch-line-height',
    '--neural-switch-state-label-font-size',
    '--neural-switch-state-label-font-weight',
  ];
  readonly trackTokens = [
    '--neural-switch-track-width',
    '--neural-switch-track-height',
    '--neural-switch-track-padding',
    '--neural-switch-track-color',
    '--neural-switch-track-background',
    '--neural-switch-track-background-hover',
    '--neural-switch-track-background-checked',
    '--neural-switch-track-background-checked-hover',
    '--neural-switch-track-border',
    '--neural-switch-track-border-color-hover',
    '--neural-switch-track-border-color-checked',
    '--neural-switch-track-border-color-focus',
    '--neural-switch-track-border-color-invalid',
    '--neural-switch-track-radius',
    '--neural-switch-track-shadow',
    '--neural-switch-track-shadow-focus',
  ];
  readonly stateTokens = [
    '--neural-switch-thumb-size',
    '--neural-switch-thumb-background',
    '--neural-switch-thumb-background-checked',
    '--neural-switch-thumb-radius',
    '--neural-switch-thumb-shadow',
    '--neural-switch-thumb-translate',
    '--neural-switch-focus-ring',
    '--neural-switch-focus-ring-offset',
    '--neural-switch-disabled-opacity',
  ];
  readonly motionTokens = [
    '--neural-switch-transition',
    '--neural-switch-thumb-transition',
  ];

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.selectedView.set(resolveView(event.urlAfterRedirects));
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  stateChanged(event: NeuralSwitchChange): void {
    this.eventStatus.set(
      `${event.previousChecked ? 'On' : 'Off'} → ${event.checked ? 'On' : 'Off'}`,
    );
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/switch${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveView(url: string): SwitchDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is SwitchDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
