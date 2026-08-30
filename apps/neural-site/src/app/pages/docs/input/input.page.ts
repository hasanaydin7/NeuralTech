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
  FieldComponent,
  FieldHintDirective,
  FieldLabelDirective,
} from '@neural-ng/core/field';
import { NeuralInput, NeuralInputGroup } from '@neural-ng/core/input';
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

type InputDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-input-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    CodeView,
    FieldComponent,
    FieldHintDirective,
    FieldLabelDirective,
    FormField,
    FormsModule,
    NeuralInput,
    NeuralInputGroup,
    ReactiveFormsModule,
    TabComponent,
    TabListComponent,
    TabPanelComponent,
    TabPanelsComponent,
    TabsComponent,
  ],
  templateUrl: './input.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  templateValue = 'NgModel';
  readonly reactiveControl = new FormControl('Reactive Forms', {
    nonNullable: true,
  });
  readonly model = signal({
    query: 'Signals',
    signalValue: 'Signal Forms',
  });
  readonly inputForm = form(this.model);
  readonly selectedView = signal<InputDocView>(
    resolveInputDocView(this.router.url),
  );
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
    InputDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic', 'basic'],
      ['Icons', 'icons'],
      ['Native types', 'native-types'],
      ['Sizes', 'sizes'],
      ['Variants', 'variants'],
      ['States', 'states'],
      ['Angular Forms', 'forms'],
      ['Fluid', 'fluid'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['Naming', 'naming'],
      ['Descriptions', 'descriptions'],
      ['Input purpose', 'input-purpose'],
      ['States', 'a11y-states'],
    ],
    api: [
      ['Directive', 'directive'],
      ['Inputs', 'inputs'],
      ['InputGroup', 'input-group-api'],
      ['Methods', 'methods'],
      ['Native API', 'native-api'],
    ],
    tokens: [['Design tokens', 'tokens']],
  };

  readonly importCode = `import { NeuralInput } from '@neural-ng/core/input';

@Component({
  imports: [NeuralInput],
  // ...
})`;

  readonly basicCode = `<label for="component-search">Search components</label>
<input
  neuralInput
  id="component-search"
  name="query"
  type="search"
  autocomplete="off"
  placeholder="Try Button"
/>`;

  readonly iconCode = `<neural-input-group
  startIcon="nt nt-search"
  endIcon="nt nt-sparkles"
  fluid
>
  <input neuralInput aria-label="Search agents" placeholder="Search agents" />
</neural-input-group>`;

  readonly nativeTypesCode = `<input neuralInput type="text" autocomplete="name" />
<input neuralInput type="email" autocomplete="email" inputmode="email" />
<input neuralInput type="password" autocomplete="current-password" />
<input neuralInput type="search" enterkeyhint="search" />
<input neuralInput type="tel" autocomplete="tel" inputmode="tel" />
<input neuralInput type="url" autocomplete="url" inputmode="url" />`;

  readonly sizeCode = `<input neuralInput inputSize="small" aria-label="Small" />
<input neuralInput inputSize="medium" aria-label="Medium" />
<input neuralInput inputSize="large" aria-label="Large" />

<!-- Native size remains native and can coexist. -->
<input neuralInput inputSize="small" size="24" />`;

  readonly variantCode = `<input neuralInput variant="outlined" placeholder="Outlined" />
<input neuralInput variant="filled" placeholder="Filled" />`;

  readonly stateCode = `<input neuralInput value="Available" />
<input neuralInput value="Visible, not editable" readonly />
<input neuralInput value="Unavailable" disabled />
<input
  neuralInput
  value="Invalid value"
  aria-invalid="true"
  aria-describedby="value-error"
/>
<small id="value-error">Enter a valid value.</small>`;

  readonly ngModelCode = `import { FormsModule } from '@angular/forms';
import { NeuralInput } from '@neural-ng/core/input';

@Component({ imports: [FormsModule, NeuralInput] })
export class ProfileForm {
  displayName = 'NgModel';
}

<input neuralInput name="displayName" [(ngModel)]="displayName" />`;

  readonly reactiveFormsCode = `import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuralInput } from '@neural-ng/core/input';

@Component({ imports: [ReactiveFormsModule, NeuralInput] })
export class ProfileForm {
  readonly displayName = new FormControl('Reactive Forms', {
    nonNullable: true,
  });
}

<input neuralInput [formControl]="displayName" />`;

  readonly signalFormsCode = `import { signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { NeuralInput } from '@neural-ng/core/input';

@Component({ imports: [FormField, NeuralInput] })
export class ProfileForm {
  readonly model = signal({ displayName: 'Signal Forms' });
  readonly profileForm = form(this.model);
}

<input neuralInput [formField]="profileForm.displayName" />`;

  readonly fluidCode = `<input neuralInput fluid type="search" placeholder="Full width" />`;

  readonly unstyledCode = `<input
  neuralInput
  unstyled
  class="w-full rounded-xl border-2 border-cyan-500/35 bg-slate-950
    px-4 py-3 font-mono text-cyan-100 placeholder:text-cyan-700
    focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/15"
  placeholder="Consumer-owned input"
/>`;

  readonly inputs = [
    [
      'inputSize',
      'NeuralInputSize',
      `'medium'`,
      'Visual size; native HTML size remains untouched.',
    ],
    [
      'variant',
      'NeuralInputVariant',
      `'outlined'`,
      'Outlined or filled token treatment.',
    ],
    ['fluid', 'boolean', 'false', 'Fills the available inline width.'],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
  ] as const;

  readonly groupInputs = [
    ['startIcon', 'string | null', 'null', 'Logical leading icon classes.'],
    ['endIcon', 'string | null', 'null', 'Logical trailing icon classes.'],
    ['fluid', 'boolean', 'false', 'Fills the available inline width.'],
    ['unstyled', 'boolean', 'false', 'Removes group visual classes.'],
    ['inputGroupClass', 'string', "''", 'Additive group-root classes.'],
    ['iconClass', 'string', "''", 'Additive classes shared by both icons.'],
  ] as const;

  readonly methods = [
    ['focus', '(options?: FocusOptions) => void', 'Focuses the native input.'],
    ['select', '() => void', 'Selects the native input value.'],
  ] as const;

  readonly tokens = [
    '--neural-input-width',
    '--neural-input-min-height',
    '--neural-input-padding',
    '--neural-input-small-min-height',
    '--neural-input-small-padding',
    '--neural-input-small-font-size',
    '--neural-input-large-min-height',
    '--neural-input-large-padding',
    '--neural-input-large-font-size',
    '--neural-input-color',
    '--neural-input-color-hover',
    '--neural-input-color-focus',
    '--neural-input-color-invalid',
    '--neural-input-caret-color',
    '--neural-input-background',
    '--neural-input-background-hover',
    '--neural-input-background-focus',
    '--neural-input-background-readonly',
    '--neural-input-filled-background',
    '--neural-input-filled-background-hover',
    '--neural-input-filled-background-focus',
    '--neural-input-filled-border-color',
    '--neural-input-filled-border-color-hover',
    '--neural-input-filled-border-color-focus',
    '--neural-input-border',
    '--neural-input-border-color-hover',
    '--neural-input-border-color-focus',
    '--neural-input-border-color-invalid',
    '--neural-input-radius',
    '--neural-input-shadow',
    '--neural-input-shadow-hover',
    '--neural-input-shadow-focus',
    '--neural-input-shadow-invalid',
    '--neural-input-font-family',
    '--neural-input-font-size',
    '--neural-input-font-weight',
    '--neural-input-line-height',
    '--neural-input-placeholder-color',
    '--neural-input-placeholder-opacity',
    '--neural-input-focus-ring',
    '--neural-input-focus-ring-offset',
    '--neural-input-disabled-opacity',
    '--neural-input-transition',
  ] as const;

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.selectedView.set(resolveInputDocView(event.urlAfterRedirects));
      }
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  selectView(value: NeuralTabValue | null): void {
    if (!isInputDocView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    const suffix = value === 'component' ? '' : `/${value}`;
    void this.router.navigateByUrl(`/docs/components/input${suffix}`);
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveInputDocView(url: string): InputDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isInputDocView(value: NeuralTabValue | null): value is InputDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
