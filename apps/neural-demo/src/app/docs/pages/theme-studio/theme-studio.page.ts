import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  AccordionComponent,
  AccordionContentComponent,
  AccordionHeaderComponent,
  AccordionPanelComponent,
  type NeuralAccordionModelValue,
} from '@neural-ng/core/accordion';
import { NeuralButton } from '@neural-ng/core/button';
import {
  NeuralCheckbox,
  NeuralTriStateCheckbox,
  type NeuralTriStateCheckboxValue,
} from '@neural-ng/core/checkbox';
import { FieldComponent, FieldLabelDirective } from '@neural-ng/core/field';
import {
  FileUploadComponent,
  type NeuralFileSelectionChange,
} from '@neural-ng/core/file-upload';
import { NeuralInput } from '@neural-ng/core/input';
import { ProgressBarComponent } from '@neural-ng/core/progress-bar';
import { RadioGroupComponent } from '@neural-ng/core/radio';
import { SelectComponent } from '@neural-ng/core/select';
import { NeuralSwitch } from '@neural-ng/core/switch';
import {
  TabComponent,
  TabListComponent,
  TabPanelComponent,
  TabPanelsComponent,
  TabsComponent,
  type NeuralTabsClasses,
} from '@neural-ng/core/tabs';
import { NeuralTextarea } from '@neural-ng/core/textarea';
import { EditorComponent, type NeuralEditorDocument } from '@neural-ng/editor';
import {
  compileTheme,
  getComponentThemeContract,
  listThemeComponents,
  listThemePresets,
  migrateThemeRecipe,
  validateThemeRecipe,
  type NeuralThemeArtifacts,
  type NeuralThemeDiagnostic,
  type NeuralThemePresetSummary,
  type NeuralThemeRecipe,
  type NeuralThemeTokenContractEntry,
} from '@neural-ng/theme/browser';

interface StudioCompileState {
  readonly artifacts?: NeuralThemeArtifacts;
  readonly diagnostics: readonly NeuralThemeDiagnostic[];
}

interface StudioBrandPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly primary: string;
  readonly surface: 'slate' | 'gray' | 'zinc' | 'neutral' | 'stone';
}

interface StudioComponentOverride {
  readonly component: string;
  readonly property: string;
  readonly token: string;
  readonly value: string | number;
}

type StudioStep = 'brand' | 'feel' | 'preview' | 'export';
type StudioPreviewSection = 'overview' | 'forms' | 'feedback' | 'editor';

const DEFAULT_RECIPE: NeuralThemeRecipe = {
  schemaVersion: 1,
  name: 'studio-preview',
  extends: 'neutral',
  color: {
    primary: '#2563eb',
    surface: 'slate',
    success: '#16a34a',
    warning: '#ca8a04',
    error: '#dc2626',
  },
  typography: {
    sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
    scale: 'default',
  },
  shape: {
    radius: 'medium',
    border: 'default',
  },
  density: 'comfortable',
  elevation: 'soft',
  motion: 'default',
  modes: {
    dark: 'auto',
  },
};

const BRAND_PRESETS: readonly StudioBrandPreset[] = [
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Clear blue actions with a cool slate foundation.',
    primary: '#2563eb',
    surface: 'slate',
  },
  {
    id: 'violet',
    name: 'Violet',
    description: 'Expressive product surfaces with a refined neutral base.',
    primary: '#7c3aed',
    surface: 'zinc',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Calm emerald actions for operational interfaces.',
    primary: '#059669',
    surface: 'stone',
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Warm brand emphasis with a soft gray foundation.',
    primary: '#e11d48',
    surface: 'gray',
  },
];

@Component({
  selector: 'app-theme-studio-page',
  imports: [
    AccordionComponent,
    AccordionContentComponent,
    AccordionHeaderComponent,
    AccordionPanelComponent,
    NeuralButton,
    NeuralCheckbox,
    FieldComponent,
    FieldLabelDirective,
    FileUploadComponent,
    NeuralInput,
    ProgressBarComponent,
    EditorComponent,
    RadioGroupComponent,
    SelectComponent,
    NeuralSwitch,
    TabComponent,
    TabListComponent,
    TabPanelComponent,
    TabPanelsComponent,
    TabsComponent,
    NeuralTextarea,
    NeuralTriStateCheckbox,
  ],
  templateUrl: './theme-studio.page.html',
  styleUrls: [
    '../shared-doc-page.scss',
    './theme-studio.page.scss',
    './theme-studio.spacing.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeStudioPage {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly previewStyleId = 'neural-theme-studio-preview';

  readonly steps: readonly {
    readonly id: StudioStep;
    readonly number: string;
    readonly label: string;
    readonly description: string;
  }[] = [
    {
      id: 'brand',
      number: '01',
      label: 'Brand',
      description: 'Name, primary and surface',
    },
    {
      id: 'feel',
      number: '02',
      label: 'Feel',
      description: 'Shape, density and motion',
    },
    {
      id: 'preview',
      number: '03',
      label: 'Preview',
      description: 'Review real components',
    },
    {
      id: 'export',
      number: '04',
      label: 'Export',
      description: 'Install the generated theme',
    },
  ];

  readonly basePresets = listThemePresets();
  readonly brandPresets = BRAND_PRESETS;
  readonly componentOptions = listThemeComponents().map((component) => ({
    value: component,
    label: formatComponentName(component),
  }));
  readonly surfaceOptions = [
    { value: 'slate', label: 'Slate', light: '#f8fafc', dark: '#0f172a' },
    { value: 'gray', label: 'Gray', light: '#f9fafb', dark: '#111827' },
    { value: 'zinc', label: 'Zinc', light: '#fafafa', dark: '#18181b' },
    { value: 'neutral', label: 'Neutral', light: '#fafafa', dark: '#171717' },
    { value: 'stone', label: 'Stone', light: '#fafaf9', dark: '#1c1917' },
  ] as const;

  readonly elevationOptions = [
    { value: 'none', label: 'Flat' },
    { value: 'soft', label: 'Soft' },
    { value: 'default', label: 'Balanced' },
    { value: 'strong', label: 'Strong' },
  ] as const;
  readonly borderOptions = [
    { value: 'none', label: 'None' },
    { value: 'subtle', label: 'Subtle' },
    { value: 'default', label: 'Balanced' },
    { value: 'strong', label: 'Strong' },
  ] as const;
  readonly typographyScaleOptions = [
    { value: 'compact', label: 'Compact' },
    { value: 'default', label: 'Default' },
    { value: 'large', label: 'Large' },
  ] as const;
  readonly motionOptions = [
    { value: 'reduced', label: 'Reduced' },
    { value: 'fast', label: 'Fast' },
    { value: 'default', label: 'Default' },
    { value: 'slow', label: 'Slow' },
  ] as const;
  readonly previewModeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ] as const;

  readonly workspaceTabsClasses: NeuralTabsClasses = {
    root: 'theme-studio-tabs-root',
    list: 'theme-studio-tabs',
    tab: 'theme-studio-tab',
    activeTab: 'is-active',
    panels: 'theme-studio-tab-panels',
    panel: 'theme-studio-builder',
  };
  readonly previewTabsClasses: NeuralTabsClasses = {
    root: 'theme-studio-preview-tabs-root',
    list: 'theme-studio-preview-tabs',
    tab: 'theme-studio-preview-tab',
    activeTab: 'is-active',
    panels: 'theme-studio-preview-panels',
    panel: 'theme-studio-preview-panel-slot',
  };
  readonly recipeUploadClasses = {
    root: 'theme-studio-import-root',
    dropzone: 'theme-studio-import-dropzone',
    dropzoneText: 'theme-studio-import-copy',
    chooseButton: 'theme-studio-import-button',
    message: 'theme-studio-import-message',
  } as const;

  readonly recipe = signal<NeuralThemeRecipe>(DEFAULT_RECIPE);
  readonly recipeText = signal(formatRecipe(DEFAULT_RECIPE));
  readonly jsonDiagnostic = signal<string | null>(null);
  readonly migrationNotice = signal<string | null>(null);
  readonly activeStep = signal<StudioStep>('brand');
  readonly previewSection = signal<StudioPreviewSection>('overview');
  readonly previewMode = signal<'light' | 'dark'>('light');
  readonly copied = signal<string | null>(null);
  readonly advancedBrand = signal<NeuralAccordionModelValue>(null);
  readonly advancedExport = signal<NeuralAccordionModelValue>(null);
  readonly advancedComponents = signal<NeuralAccordionModelValue>(null);
  readonly recipeImportFiles = signal<readonly File[]>([]);
  readonly selectedComponent = signal('button');
  readonly selectedToken = signal('--neural-button-radius');
  readonly overrideValue = signal('');
  private readonly undoStack = signal<readonly NeuralThemeRecipe[]>([]);
  private readonly redoStack = signal<readonly NeuralThemeRecipe[]>([]);

  readonly previewChecked = signal(true);
  readonly previewInherited = signal<NeuralTriStateCheckboxValue>(null);
  readonly previewSwitch = signal(false);
  readonly previewPlan = signal<string | null>('team');
  readonly previewDocument = signal<NeuralEditorDocument>({
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'A consistent product voice' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Core and Editor resolve the same generated token graph.',
          },
        ],
      },
    ],
  });

  readonly plans = [
    { label: 'Starter', value: 'starter' },
    { label: 'Team', value: 'team' },
    { label: 'Enterprise', value: 'enterprise' },
  ] as const;

  readonly canUndo = computed(() => this.undoStack().length > 0);
  readonly canRedo = computed(() => this.redoStack().length > 0);

  readonly activeStepIndex = computed(() =>
    Math.max(
      0,
      this.steps.findIndex((step) => step.id === this.activeStep()),
    ),
  );

  readonly themeSummary = computed(() => this.artifacts()?.summary);
  readonly qualityStatus = computed(
    () => this.themeSummary()?.quality.status ?? 'preview',
  );
  readonly effectivePrimary = computed(
    () =>
      this.themeSummary()?.primary ?? this.recipe().color?.primary ?? '#2563eb',
  );
  readonly effectiveSurface = computed(
    () =>
      this.themeSummary()?.surface ?? this.recipe().color?.surface ?? 'slate',
  );
  readonly effectiveRadius = computed(
    () =>
      this.themeSummary()?.radius ?? this.recipe().shape?.radius ?? 'medium',
  );
  readonly effectiveDensity = computed(
    () =>
      this.themeSummary()?.density ?? this.recipe().density ?? 'comfortable',
  );
  readonly effectiveElevation = computed(
    () => this.themeSummary()?.elevation ?? this.recipe().elevation ?? 'soft',
  );
  readonly effectiveMotion = computed(
    () => this.themeSummary()?.motion ?? this.recipe().motion ?? 'default',
  );
  readonly selectedComponentContract = computed<
    readonly NeuralThemeTokenContractEntry[]
  >(() => getComponentThemeContract(this.selectedComponent()));
  readonly tokenOptions = computed(() =>
    this.selectedComponentContract().map((entry) => ({
      value: entry.name,
      label: tokenProperty(entry.name, this.selectedComponent()),
    })),
  );
  readonly componentOverrides = computed<readonly StudioComponentOverride[]>(
    () =>
      Object.entries(this.recipe().components ?? {})
        .flatMap(([component, values]) =>
          Object.entries(values).map(([property, value]) => ({
            component,
            property,
            token: `--neural-${component}-${toKebab(property)}`,
            value,
          })),
        )
        .sort((left, right) => left.token.localeCompare(right.token, 'en')),
  );

  readonly compileState = computed<StudioCompileState>(() => {
    const recipe = this.recipe();
    const validation = validateThemeRecipe(recipe);
    if (!validation.valid) return { diagnostics: validation.diagnostics };
    try {
      return {
        artifacts: compileTheme(recipe, {
          includeTailwind: false,
          scope: 'theme',
        }),
        diagnostics: validation.diagnostics,
      };
    } catch (error) {
      return {
        diagnostics: [
          {
            severity: 'error',
            code: 'studio.compile',
            path: '$',
            message: error instanceof Error ? error.message : String(error),
          },
        ],
      };
    }
  });

  readonly artifacts = computed(() => this.compileState().artifacts);
  readonly diagnostics = computed(() => this.compileState().diagnostics);
  readonly report = computed(() => {
    const report = this.artifacts()?.report;
    return report
      ? (JSON.parse(report) as { diagnostics?: NeuralThemeDiagnostic[] })
      : undefined;
  });
  readonly allDiagnostics = computed(() => [
    ...this.diagnostics(),
    ...(this.report()?.diagnostics ?? []),
  ]);
  readonly errorCount = computed(
    () =>
      this.allDiagnostics().filter(
        (diagnostic) => diagnostic.severity === 'error',
      ).length + (this.jsonDiagnostic() ? 1 : 0),
  );
  readonly warningCount = computed(
    () =>
      this.allDiagnostics().filter(
        (diagnostic) => diagnostic.severity === 'warning',
      ).length,
  );
  readonly readyToExport = computed(
    () => Boolean(this.artifacts()) && this.errorCount() === 0,
  );
  readonly integrationSnippet = computed(() => {
    const name = this.recipe().name;
    return `@import 'tailwindcss';\n@import '@neural-ng/icons/icons.css';\n@import './styles/generated/${name}.css';\n\n<html data-neural-theme="${name}" data-neural-mode="light">`;
  });

  constructor() {
    effect(() => {
      const css = this.artifacts()?.css;
      if (!this.isBrowser || !css) return;
      let style = this.document.getElementById(
        this.previewStyleId,
      ) as HTMLStyleElement | null;
      if (!style) {
        style = this.document.createElement('style');
        style.id = this.previewStyleId;
        style.dataset['neuralThemeStudio'] = 'preview';
        this.document.head.append(style);
      }
      style.textContent = css;
    });
  }

  nextStep(): void {
    const next = this.steps[this.activeStepIndex() + 1];
    if (next) this.activeStep.set(next.id);
  }

  previousStep(): void {
    const previous = this.steps[this.activeStepIndex() - 1];
    if (previous) this.activeStep.set(previous.id);
  }

  applyBasePreset(preset: NeuralThemePresetSummary): void {
    const current = this.recipe();
    this.updateRecipe({
      ...(current.$schema ? { $schema: current.$schema } : {}),
      schemaVersion: 1,
      name: current.name,
      extends: preset.id,
      ...(current.description ? { description: current.description } : {}),
      modes: { dark: 'auto' },
      ...(current.output ? { output: current.output } : {}),
      ...(current.generator ? { generator: current.generator } : {}),
    });
  }

  applyPreset(preset: StudioBrandPreset): void {
    this.updateRecipe({
      ...this.recipe(),
      color: {
        ...this.recipe().color,
        primary: preset.primary,
        surface: preset.surface,
      },
    });
  }

  updateName(value: string): void {
    this.updateRecipe({ ...this.recipe(), name: value.trim().toLowerCase() });
  }

  updatePrimary(value: string): void {
    this.updateColor('primary', value);
  }

  updateSurface(value: string): void {
    this.updateColor('surface', value);
  }

  updateStatus(key: 'success' | 'warning' | 'error', value: string): void {
    this.updateColor(key, value);
  }

  updateRadius(value: string): void {
    this.updateRecipe({
      ...this.recipe(),
      shape: { ...this.recipe().shape, radius: value },
    });
  }

  updateBorder(value: string): void {
    this.updateRecipe({
      ...this.recipe(),
      shape: {
        ...this.recipe().shape,
        border: value as 'none' | 'subtle' | 'default' | 'strong',
      },
    });
  }

  updateDensity(value: string): void {
    this.updateRecipe({
      ...this.recipe(),
      density: value as 'compact' | 'comfortable' | 'spacious',
    });
  }

  updateElevation(value: string): void {
    this.updateRecipe({
      ...this.recipe(),
      elevation: value as 'none' | 'soft' | 'default' | 'strong',
    });
  }

  updateMotion(value: string): void {
    this.updateRecipe({
      ...this.recipe(),
      motion: value as 'reduced' | 'fast' | 'default' | 'slow',
    });
  }

  updateTypographyScale(value: string): void {
    this.updateRecipe({
      ...this.recipe(),
      typography: {
        ...this.recipe().typography,
        scale: value as 'compact' | 'default' | 'large',
      },
    });
  }

  updateSelectedComponent(value: string): void {
    this.selectedComponent.set(value);
    const first = getComponentThemeContract(value)[0]?.name ?? '';
    this.selectedToken.set(first);
    this.overrideValue.set('');
  }

  updateSelectedToken(value: string): void {
    this.selectedToken.set(value);
    const component = this.selectedComponent();
    const property = tokenProperty(value, component);
    const current = this.recipe().components?.[component]?.[property];
    this.overrideValue.set(current === undefined ? '' : String(current));
  }

  applyComponentOverride(): void {
    const component = this.selectedComponent();
    const token = this.selectedToken();
    const value = this.overrideValue().trim();
    if (!component || !token || !value) return;
    const property = tokenProperty(token, component);
    this.updateRecipe({
      ...this.recipe(),
      components: {
        ...this.recipe().components,
        [component]: {
          ...this.recipe().components?.[component],
          [property]: value,
        },
      },
    });
  }

  removeComponentOverride(override: StudioComponentOverride): void {
    const components: Record<
      string,
      Record<string, string | number>
    > = Object.fromEntries(
      Object.entries(this.recipe().components ?? {}).map(
        ([component, values]) => [component, { ...values }],
      ),
    );
    const values = components[override.component] ?? {};
    delete values[override.property];
    if (Object.keys(values).length === 0) delete components[override.component];
    else components[override.component] = values;

    const next: Record<string, unknown> = { ...this.recipe() };
    if (Object.keys(components).length > 0) next['components'] = components;
    else delete next['components'];
    this.updateRecipe(next as unknown as NeuralThemeRecipe);
  }

  updateRecipeText(value: string): void {
    this.recipeText.set(value);
    try {
      const parsed = JSON.parse(value) as unknown;
      const migration = migrateThemeRecipe(parsed);
      const validation = validateThemeRecipe(migration.recipe);
      if (!validation.valid) {
        this.jsonDiagnostic.set(
          validation.diagnostics[0]?.message ?? 'Invalid recipe.',
        );
        return;
      }
      this.migrationNotice.set(
        migration.changed
          ? migration.fromVersion === migration.toVersion
            ? `Normalized schema v${migration.toVersion}: ${migration.changes.join(', ')}.`
            : `Migrated schema v${migration.fromVersion} to v${migration.toVersion}: ${migration.changes.join(', ')}.`
          : null,
      );
      this.updateRecipe(migration.recipe, {
        preserveMigrationNotice: true,
        syncText: migration.changed,
      });
    } catch (error) {
      this.jsonDiagnostic.set(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  undo(): void {
    const stack = this.undoStack();
    const previous = stack[stack.length - 1];
    if (!previous) return;
    this.undoStack.set(stack.slice(0, -1));
    this.redoStack.update((entries) =>
      [this.recipe(), ...entries].slice(0, 50),
    );
    this.applyRecipe(previous);
  }

  redo(): void {
    const stack = this.redoStack();
    const next = stack[0];
    if (!next) return;
    this.redoStack.set(stack.slice(1));
    this.undoStack.update((entries) => [...entries, this.recipe()].slice(-50));
    this.applyRecipe(next);
  }

  reset(): void {
    this.activeStep.set('brand');
    this.previewSection.set('overview');
    this.previewMode.set('light');
    this.updateRecipe(DEFAULT_RECIPE);
  }

  async importRecipe(event: NeuralFileSelectionChange): Promise<void> {
    const file = event.addedFiles[0];
    if (!file) return;
    const text = await file.text();
    this.updateRecipeText(text);
    this.activeStep.set('export');
    this.recipeImportFiles.set([]);
  }

  async copyRecipe(): Promise<void> {
    await this.copyText(this.recipeText(), 'Recipe copied');
  }

  async copyIntegration(): Promise<void> {
    await this.copyText(this.integrationSnippet(), 'Integration copied');
  }

  downloadRecipe(): void {
    this.download(
      `${this.recipe().name}.theme.json`,
      this.recipeText(),
      'application/json',
    );
  }

  downloadCss(): void {
    const artifacts = this.artifacts();
    if (artifacts) {
      this.download(`${artifacts.name}.css`, artifacts.css, 'text/css');
    }
  }

  downloadTokens(): void {
    const artifacts = this.artifacts();
    if (artifacts) {
      this.download(
        `${artifacts.name}.tokens.json`,
        artifacts.tokens,
        'application/json',
      );
    }
  }

  downloadReport(): void {
    const artifacts = this.artifacts();
    if (artifacts) {
      this.download(
        `${artifacts.name}.report.json`,
        artifacts.report,
        'application/json',
      );
    }
  }

  private updateColor(key: string, value: string): void {
    this.updateRecipe({
      ...this.recipe(),
      color: { ...this.recipe().color, [key]: value },
    });
  }

  private updateRecipe(
    recipe: NeuralThemeRecipe,
    options: {
      readonly preserveMigrationNotice?: boolean;
      readonly syncText?: boolean;
    } = {},
  ): void {
    if (formatRecipe(recipe) === formatRecipe(this.recipe())) {
      if (options.syncText !== false) this.recipeText.set(formatRecipe(recipe));
      this.jsonDiagnostic.set(null);
      if (!options.preserveMigrationNotice) this.migrationNotice.set(null);
      return;
    }
    this.undoStack.update((entries) => [...entries, this.recipe()].slice(-50));
    this.redoStack.set([]);
    this.applyRecipe(recipe, options);
  }

  private applyRecipe(
    recipe: NeuralThemeRecipe,
    options: {
      readonly preserveMigrationNotice?: boolean;
      readonly syncText?: boolean;
    } = {},
  ): void {
    this.recipe.set(recipe);
    if (options.syncText !== false) this.recipeText.set(formatRecipe(recipe));
    this.jsonDiagnostic.set(null);
    if (!options.preserveMigrationNotice) this.migrationNotice.set(null);
  }

  private async copyText(value: string, label: string): Promise<void> {
    if (!this.isBrowser || !navigator.clipboard) return;
    await navigator.clipboard.writeText(value);
    this.copied.set(label);
    window.setTimeout(() => this.copied.set(null), 1600);
  }

  private download(filename: string, value: string, type: string): void {
    if (!this.isBrowser) return;
    const url = URL.createObjectURL(new Blob([value], { type }));
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}

function tokenProperty(token: string, component: string): string {
  const prefix = `--neural-${component}-`;
  return token.startsWith(prefix) ? token.slice(prefix.length) : token;
}

function formatComponentName(value: string): string {
  return value
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function toKebab(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function formatRecipe(recipe: NeuralThemeRecipe): string {
  return `${JSON.stringify(recipe, null, 2)}\n`;
}
