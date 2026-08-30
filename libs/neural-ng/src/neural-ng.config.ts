import {
  DOCUMENT,
  Injectable,
  InjectionToken,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  provideAppInitializer,
  signal,
  type EnvironmentProviders,
  makeEnvironmentProviders,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  NEURAL_EN_LOCALE,
  NEURAL_LOCALE,
  NeuralLocaleService,
  type NeuralLocale,
  type NeuralTextDirection,
} from './neural-locale';

export type NeuralDirection = NeuralTextDirection | 'auto';
export type NeuralDensity = 'compact' | 'comfortable' | 'spacious';

export interface NeuralNgConfig {
  readonly unstyled: boolean;
  readonly direction: NeuralDirection;
  readonly density: NeuralDensity;
}

export interface NeuralNgOptions extends Partial<NeuralNgConfig> {
  readonly locale?: NeuralLocale;
}

const DEFAULT_NEURAL_NG_CONFIG: NeuralNgConfig = Object.freeze({
  unstyled: false,
  direction: 'auto',
  density: 'comfortable',
});

export const NEURAL_NG_CONFIG = new InjectionToken<NeuralNgConfig>(
  'NEURAL_NG_CONFIG',
  { factory: () => DEFAULT_NEURAL_NG_CONFIG },
);

export function provideNeuralNg(
  options: NeuralNgOptions = {},
): EnvironmentProviders {
  const { locale = NEURAL_EN_LOCALE, ...config } = options;
  const resolvedConfig = validateNeuralNgConfig({
    ...DEFAULT_NEURAL_NG_CONFIG,
    ...config,
  });

  return makeEnvironmentProviders([
    {
      provide: NEURAL_NG_CONFIG,
      useValue: resolvedConfig,
    },
    { provide: NEURAL_LOCALE, useValue: locale },
    provideAppInitializer(() => inject(NeuralNgService).initialize()),
  ]);
}

@Injectable({ providedIn: 'root' })
export class NeuralNgService {
  private readonly initialConfig = inject(NEURAL_NG_CONFIG);
  private readonly locale = inject(NeuralLocaleService);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly directionState = signal<NeuralDirection>(
    this.initialConfig.direction,
  );
  private readonly densityState = signal<NeuralDensity>(
    this.initialConfig.density,
  );
  private initialized = false;

  readonly direction = this.directionState.asReadonly();
  readonly density = this.densityState.asReadonly();
  readonly resolvedDirection = computed<NeuralTextDirection>(() => {
    const direction = this.directionState();
    return direction === 'auto' ? this.locale.direction() : direction;
  });

  constructor() {
    effect(() => {
      const direction = this.resolvedDirection();
      const density = this.densityState();
      this.applyRootPreferences(direction, density);
    });
  }

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.applyRootPreferences(this.resolvedDirection(), this.densityState());
  }

  setDirection(direction: NeuralDirection): void {
    assertDirection(direction);
    this.directionState.set(direction);
  }

  setDensity(density: NeuralDensity): void {
    assertDensity(density);
    this.densityState.set(density);
  }

  reset(): void {
    this.directionState.set(this.initialConfig.direction);
    this.densityState.set(this.initialConfig.density);
  }

  private applyRootPreferences(
    direction: NeuralTextDirection,
    density: NeuralDensity,
  ): void {
    if (!this.isBrowser) return;
    const root = this.document.documentElement;
    root.dir = direction;
    root.dataset['neuralDirection'] = direction;
    root.dataset['neuralDensity'] = density;
  }
}

function validateNeuralNgConfig(config: NeuralNgConfig): NeuralNgConfig {
  assertDirection(config.direction);
  assertDensity(config.density);
  return Object.freeze({ ...config });
}

function assertDirection(
  direction: string,
): asserts direction is NeuralDirection {
  if (direction !== 'auto' && direction !== 'ltr' && direction !== 'rtl') {
    throw new Error(
      `NeuralNg direction must be auto, ltr, or rtl; received "${direction}".`,
    );
  }
}

function assertDensity(density: string): asserts density is NeuralDensity {
  if (
    density !== 'compact' &&
    density !== 'comfortable' &&
    density !== 'spacious'
  ) {
    throw new Error(
      `NeuralNg density must be compact, comfortable, or spacious; received "${density}".`,
    );
  }
}
