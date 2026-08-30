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
import { FormField, form, maxLength } from '@angular/forms/signals';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import {
  FieldComponent,
  FieldErrorDirective,
  FieldHintDirective,
  FieldLabelDirective,
} from '@neural-ng/core/field';
import {
  TabComponent,
  TabListComponent,
  TabPanelComponent,
  TabPanelsComponent,
  TabsComponent,
  type NeuralTabsClasses,
  type NeuralTabValue,
} from '@neural-ng/core/tabs';
import { NeuralTextarea } from '@neural-ng/core/textarea';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';

type TextareaDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-textarea-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    FieldComponent,
    FieldErrorDirective,
    FieldHintDirective,
    FieldLabelDirective,
    FormField,
    FormsModule,
    NeuralTextarea,
    ReactiveFormsModule,
    TabComponent,
    TabListComponent,
    TabPanelComponent,
    TabPanelsComponent,
    TabsComponent,
  ],
  templateUrl: './textarea.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  templateValue = 'Template-driven forms keep native textarea behavior.';
  readonly reactiveControl = new FormControl(
    'Reactive Forms binds directly to the enhanced native element.',
    { nonNullable: true },
  );
  readonly profile = signal({
    biography: 'Signal Forms owns this model and its validation metadata.',
    growing:
      'This field grows through native CSS field-sizing.\nAdd another line to see it expand.',
  });
  readonly profileForm = form(this.profile, (path) => {
    maxLength(path.biography, 240, {
      message: 'Biography cannot exceed 240 characters.',
    });
  });

  readonly selectedView = signal<TextareaDocView>(
    resolveTextareaDocView(this.router.url),
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
    TextareaDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic', 'basic'],
      ['Angular Forms', 'forms'],
      ['Auto resize', 'auto-resize'],
      ['Resize modes', 'resize-modes'],
      ['States and Field', 'states'],
      ['Fluid', 'fluid'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['Native semantics', 'native-semantics'],
      ['Naming', 'naming'],
      ['Hints and errors', 'descriptions'],
      ['Keyboard and resize', 'keyboard'],
      ['State semantics', 'a11y-states'],
    ],
    api: [
      ['Directive', 'directive'],
      ['Inputs', 'inputs'],
      ['Methods', 'methods'],
      ['Native API', 'native-api'],
      ['Public types', 'public-types'],
    ],
    tokens: [['Design tokens', 'tokens']],
  };

  readonly importCode = `import {
  NeuralTextarea,
  type NeuralTextareaResizeMode,
} from '@neural-ng/core/textarea';

@Component({ imports: [NeuralTextarea] })
export class FeedbackForm {}`;

  readonly basicCode = `<label for="feedback">Feedback</label>
<textarea
  neuralTextarea
  id="feedback"
  name="feedback"
  rows="5"
  maxlength="500"
  placeholder="Tell us what could be better"
  fluid
></textarea>`;

  readonly ngModelCode = `import { FormsModule } from '@angular/forms';
import { NeuralTextarea } from '@neural-ng/core/textarea';

@Component({ imports: [FormsModule, NeuralTextarea] })
export class FeedbackForm {
  feedback = '';
}

<textarea neuralTextarea name="feedback" [(ngModel)]="feedback"></textarea>`;

  readonly reactiveCode = `import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuralTextarea } from '@neural-ng/core/textarea';

@Component({ imports: [ReactiveFormsModule, NeuralTextarea] })
export class FeedbackForm {
  readonly feedback = new FormControl('', { nonNullable: true });
}

<textarea neuralTextarea [formControl]="feedback"></textarea>`;

  readonly signalCode = `import { signal } from '@angular/core';
import { FormField, form, maxLength } from '@angular/forms/signals';
import { NeuralTextarea } from '@neural-ng/core/textarea';

@Component({ imports: [FormField, NeuralTextarea] })
export class ProfileForm {
  readonly model = signal({ biography: '' });
  readonly profileForm = form(this.model, (path) => {
    maxLength(path.biography, 240);
  });
}

<textarea neuralTextarea [formField]="profileForm.biography"></textarea>`;

  readonly autoResizeCode = `<textarea
  neuralTextarea
  autoResize
  [formField]="profileForm.growing"
  aria-label="Growing message"
  fluid
></textarea>`;

  readonly resizeCode = `<textarea neuralTextarea resizeMode="vertical"></textarea>
<textarea neuralTextarea resizeMode="horizontal"></textarea>
<textarea neuralTextarea resizeMode="both"></textarea>
<textarea neuralTextarea resizeMode="none"></textarea>`;

  readonly fieldCode = `<neural-field controlId="summary" required invalid fluid>
  <label neuralFieldLabel>Summary</label>
  <textarea neuralTextarea rows="4"></textarea>
  <small neuralFieldHint>Keep it concise.</small>
  <small neuralFieldError>A summary is required.</small>
</neural-field>`;

  readonly fluidCode = `<textarea neuralTextarea fluid rows="4"></textarea>`;

  readonly unstyledCode = `<textarea
  neuralTextarea
  unstyled
  class="min-h-32 w-full resize-y rounded-2xl border-2 border-cyan-400/35
    bg-slate-950 px-4 py-3 font-mono text-cyan-100 outline-none
    placeholder:text-cyan-700 focus:border-cyan-300 focus:ring-4
    focus:ring-cyan-400/15"
  placeholder="Consumer-owned textarea"
></textarea>`;

  readonly inputs = [
    ['fluid', 'boolean', 'false', 'Fills the available inline width.'],
    [
      'autoResize',
      'boolean',
      'false',
      'Uses CSS field-sizing: content and disables manual resizing.',
    ],
    [
      'resizeMode',
      'NeuralTextareaResizeMode',
      `'vertical'`,
      'Selects vertical, horizontal, both or no manual resizing.',
    ],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
  ] as const;

  readonly methods = [
    [
      'focus',
      '(options?: FocusOptions) => void',
      'Focuses the native textarea.',
    ],
    ['select', '() => void', 'Selects the complete native value.'],
  ] as const;

  readonly tokens = [
    '--neural-textarea-width',
    '--neural-textarea-min-height',
    '--neural-textarea-auto-min-block-size',
    '--neural-textarea-auto-max-block-size',
    '--neural-textarea-padding',
    '--neural-textarea-color',
    '--neural-textarea-color-hover',
    '--neural-textarea-color-focus',
    '--neural-textarea-color-invalid',
    '--neural-textarea-color-readonly',
    '--neural-textarea-caret-color',
    '--neural-textarea-background',
    '--neural-textarea-background-hover',
    '--neural-textarea-background-focus',
    '--neural-textarea-background-readonly',
    '--neural-textarea-border',
    '--neural-textarea-border-color-hover',
    '--neural-textarea-border-color-focus',
    '--neural-textarea-border-color-invalid',
    '--neural-textarea-radius',
    '--neural-textarea-shadow',
    '--neural-textarea-shadow-hover',
    '--neural-textarea-shadow-focus',
    '--neural-textarea-shadow-invalid',
    '--neural-textarea-backdrop-filter',
    '--neural-textarea-font-family',
    '--neural-textarea-font-size',
    '--neural-textarea-font-weight',
    '--neural-textarea-line-height',
    '--neural-textarea-placeholder-color',
    '--neural-textarea-placeholder-opacity',
    '--neural-textarea-focus-ring',
    '--neural-textarea-focus-ring-offset',
    '--neural-textarea-focus-color-invalid',
    '--neural-textarea-readonly-cursor',
    '--neural-textarea-disabled-opacity',
    '--neural-textarea-transition',
  ] as const;

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.selectedView.set(resolveTextareaDocView(event.urlAfterRedirects));
      }
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  selectView(value: NeuralTabValue | null): void {
    if (!isTextareaDocView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    const suffix = value === 'component' ? '' : `/${value}`;
    void this.router.navigateByUrl(`/docs/components/textarea${suffix}`);
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveTextareaDocView(url: string): TextareaDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isTextareaDocView(
  value: NeuralTabValue | null,
): value is TextareaDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
