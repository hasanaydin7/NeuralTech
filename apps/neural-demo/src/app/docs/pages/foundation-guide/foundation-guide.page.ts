import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import { CodeView, type CodeExampleLanguage } from '../../../shared/code-view';

type GuideKey =
  | 'configuration'
  | 'ai-first'
  | 'headless'
  | 'accessibility'
  | 'ssr'
  | 'color-mode';

interface GuideContent {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly sectionTitle: string;
  readonly principles: readonly string[];
  readonly codeTitle: string;
  readonly fileName: string;
  readonly language: CodeExampleLanguage;
  readonly code: string;
  readonly notes: readonly string[];
}

const GUIDES: Record<GuideKey, GuideContent> = {
  configuration: {
    eyebrow: 'Getting Started',
    title: 'Configuration',
    description:
      'Configure headless mode, logical direction, density and locale once while retaining component-level overrides.',
    sectionTitle: 'Application contract',
    principles: [
      'Register provideNeuralNg in app.config.ts; do not create a global NgModule.',
      'Use direction auto to follow the active NeuralNg locale.',
      'Global unstyled is inherited by every component and combines with typed consumer slots.',
      'Keep visual theme and resolved light/dark mode independent.',
    ],
    codeTitle: 'Standalone application configuration',
    fileName: 'app.config.ts',
    language: 'typescript',
    code: `import { ApplicationConfig } from '@angular/core';
import { provideNeuralNg } from '@neural-ng/core';
import { provideNeuralLocale } from '@neural-ng/core/i18n';
import { neuralEn } from '@neural-ng/core/locales/en';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNeuralNg({
      unstyled: false,
      direction: 'auto',
      density: 'comfortable'
    }),
    provideNeuralLocale(neuralEn)
  ]
};`,
    notes: [
      'Import one stable theme globally unless the whole application is unstyled.',
      'Component inputs remain the narrowest override layer.',
    ],
  },
  'ai-first': {
    eyebrow: 'Guides',
    title: 'AI-first workflow',
    description:
      'Give coding agents small, deterministic context instead of asking them to infer a large UI framework.',
    sectionTitle: 'Context discipline',
    principles: [
      'Import only the component secondary entry point used by the task.',
      'Read README for examples and llms.txt for non-negotiable generation rules.',
      'Use documented model, input and output names; never invent on-prefixed events.',
      'Preserve structural hooks, ARIA behavior and form ownership in headless markup.',
    ],
    codeTitle: 'Repository-wide agent contract',
    fileName: 'AGENTS.md',
    language: 'markup',
    code: `# NeuralNg component workflow

For every requested component:
1. Import from @neural-ng/core/<entry-point>.
2. Read node_modules/@neural-ng/core/<entry-point>/README.md.
3. Read node_modules/@neural-ng/core/<entry-point>/llms.txt.
4. Generate standalone Angular 22 code.
5. Use documented Signals, models, slots, and semantic events only.

Never infer one component's API from another component.
Preserve SSR, keyboard, Forms, and unstyled behavior.`,
    notes: [
      'Every component owns its examples and strict generation rules at its secondary entry point.',
      'Repository guides explain shared conventions; component context files define component APIs.',
    ],
  },
  headless: {
    eyebrow: 'Guides',
    title: 'Headless mode',
    description:
      'Move visual ownership to the consumer without losing NeuralNg behavior, semantics or predictable DOM hooks.',
    sectionTitle: 'Styling layers',
    principles: [
      'Structural *-root classes remain; visual *-base classes are removed by unstyled.',
      'Use typed classes slots with CSS, Tailwind or another styling system.',
      'Enable global headless mode with provideNeuralNg({ unstyled: true }).',
      'Do not replace internal keyboard, overlay, focus or ARIA logic.',
    ],
    codeTitle: 'Consumer-owned visuals',
    fileName: 'profile.html',
    language: 'html',
    code: `<neural-button
  unstyled
  class="inline-flex items-center rounded-lg px-4 py-2"
  [classes]="{ label: 'font-semibold' }"
>
  Save profile
</neural-button>`,
    notes: [
      'The cascade remains structural -> component tokens -> theme -> consumer classes.',
      'Typed slots make class ownership discoverable to TypeScript and coding agents.',
    ],
  },
  accessibility: {
    eyebrow: 'Guides',
    title: 'Accessibility',
    description:
      'NeuralNg owns component semantics and interaction while applications provide domain-specific names and descriptions.',
    sectionTitle: 'Shared responsibility',
    principles: [
      'Use Neural Field labels or provide ariaLabel/ariaLabelledBy when no visible label exists.',
      'Do not remove roles, aria-controls, aria-expanded or roving tabindex hooks.',
      'Keyboard behavior follows the relevant WAI-ARIA pattern and logical RTL direction.',
      'Test focus, disabled states, reduced motion and axe scans in real browsers.',
    ],
    codeTitle: 'Field-owned accessible name',
    fileName: 'account-form.html',
    language: 'html',
    code: `<neural-field>
  <label neuralFieldLabel>Work email</label>
  <input
    neuralInput
    type="email"
    autocomplete="email"
    [formField]="profileForm.email"
  />
  <small neuralFieldHint>Used for account notifications.</small>
  <small neuralFieldError>Enter a valid work email.</small>
</neural-field>`,
    notes: [
      'Headless mode removes visuals only; accessibility behavior remains.',
      'Component demos and Playwright tests are part of the public accessibility contract.',
    ],
  },
  ssr: {
    eyebrow: 'Guides',
    title: 'SSR and hydration',
    description:
      'Render deterministic component shells on the server and activate browser-only overlays after hydration.',
    sectionTitle: 'Server-safe rules',
    principles: [
      'Never access browser or layout APIs without a platform guard.',
      'Generate stable IDs through Angular APP_ID-aware services, not random values.',
      'Keep popovers, dialogs and loading overlays closed during server rendering.',
      'Keep public state as serializable plain values with deterministic defaults.',
    ],
    codeTitle: 'Hydration-ready bootstrap',
    fileName: 'app.config.ts',
    language: 'typescript',
    code: `import { ApplicationConfig } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [provideClientHydration()]
};`,
    notes: [
      'The demo production build prerenders every public documentation route.',
      'Playwright waits for Angular hydration before interacting with examples.',
    ],
  },
  'color-mode': {
    eyebrow: 'APIs',
    title: 'Color Mode',
    description:
      'Resolve light, dark and system independently from visual theme and primary/surface palettes.',
    sectionTitle: 'Mode ownership',
    principles: [
      'Set light, dark or system through NeuralColorModeService.',
      'Read resolvedMode when an integration needs the actual light/dark result.',
      'The data-neural-mode attribute is also the Tailwind dark selector.',
      'Theme and palettes can change without resetting mode.',
    ],
    codeTitle: 'Reactive mode control',
    fileName: 'theme-toggle.ts',
    language: 'typescript',
    code: `import { inject } from '@angular/core';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';

export class ThemeToggle {
  readonly colorMode = inject(NeuralColorModeService);
  readonly resolvedMode = this.colorMode.resolvedMode;

  useSystem(): void {
    this.colorMode.set('system');
  }
}`,
    notes: [
      'resolvedMode is always light or dark and follows system preference changes.',
      'Mode persistence is SSR-safe and applies before interactive overlays open.',
    ],
  },
};

@Component({
  selector: 'app-foundation-guide-page',
  imports: [CodeView],
  templateUrl: './foundation-guide.page.html',
  styleUrl: './foundation-guide.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoundationGuidePage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly content =
    GUIDES[inject(ActivatedRoute).snapshot.data['guide'] as GuideKey];
}
