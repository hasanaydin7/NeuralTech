import {
  DestroyRef,
  DOCUMENT,
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  isDevMode,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NEURAL_COLOR_MODE_CONFIG } from './color-mode.config';
import {
  type NeuralColorMode,
  type NeuralResolvedColorMode,
} from './color-mode.types';

const COLOR_MODE_ATTRIBUTE = 'data-neural-mode';

@Injectable({ providedIn: 'root' })
export class NeuralColorModeService {
  private readonly config = inject(NEURAL_COLOR_MODE_CONFIG);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly preferenceState = signal<NeuralColorMode>(
    this.config.defaultMode,
  );
  private readonly systemDarkState = signal(false);
  private initialized = false;
  private mediaQuery: MediaQueryList | null = null;

  readonly preference = this.preferenceState.asReadonly();
  readonly resolvedMode = computed<NeuralResolvedColorMode>(() => {
    const preference = this.preferenceState();
    return preference === 'system'
      ? this.systemDarkState()
        ? 'dark'
        : 'light'
      : preference;
  });
  readonly isDark = computed(() => this.resolvedMode() === 'dark');

  constructor() {
    inject(DestroyRef).onDestroy(() => this.destroy());
    this.initialize();
  }

  initialize(): void {
    if (this.initialized || !this.isBrowser) {
      return;
    }

    this.initialized = true;
    const view = this.document.defaultView;
    this.mediaQuery =
      view?.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
    this.systemDarkState.set(this.mediaQuery?.matches ?? false);

    const storedMode = this.readStoredMode();
    if (storedMode !== null) {
      this.preferenceState.set(storedMode);
    }

    this.mediaQuery?.addEventListener('change', this.handleSystemChange);
    view?.addEventListener('storage', this.handleStorageChange);
    this.applyResolvedMode();
  }

  set(mode: NeuralColorMode): void {
    assertColorMode(mode);
    this.preferenceState.set(mode);
    this.writeStoredMode(mode);
    this.applyResolvedMode();
  }

  reset(): void {
    this.preferenceState.set(this.config.defaultMode);
    this.removeStoredMode();
    this.applyResolvedMode();
  }

  private readonly handleSystemChange = (event: MediaQueryListEvent): void => {
    this.systemDarkState.set(event.matches);
    if (this.preferenceState() === 'system') {
      this.applyResolvedMode();
    }
  };

  private readonly handleStorageChange = (event: StorageEvent): void => {
    if (
      this.config.storageKey === null ||
      event.key !== this.config.storageKey
    ) {
      return;
    }

    const nextMode = event.newValue;
    if (nextMode === null) {
      this.preferenceState.set(this.config.defaultMode);
    } else if (isColorMode(nextMode)) {
      this.preferenceState.set(nextMode);
    } else {
      return;
    }

    this.applyResolvedMode();
  };

  private applyResolvedMode(): void {
    if (!this.isBrowser) {
      return;
    }

    this.document.documentElement.setAttribute(
      COLOR_MODE_ATTRIBUTE,
      this.resolvedMode(),
    );
  }

  private readStoredMode(): NeuralColorMode | null {
    if (this.config.storageKey === null) {
      return null;
    }

    try {
      const value = this.document.defaultView?.localStorage.getItem(
        this.config.storageKey,
      );
      if (value === null || value === undefined) {
        return null;
      }
      if (isColorMode(value)) {
        return value;
      }
      if (isDevMode()) {
        console.warn(`NeuralNg ignored invalid stored color mode "${value}".`);
      }
    } catch {
      // Storage may be unavailable because of browser privacy or security rules.
    }

    return null;
  }

  private writeStoredMode(mode: NeuralColorMode): void {
    if (this.config.storageKey === null || !this.isBrowser) {
      return;
    }

    try {
      this.document.defaultView?.localStorage.setItem(
        this.config.storageKey,
        mode,
      );
    } catch {
      // A working color mode must not depend on storage availability.
    }
  }

  private removeStoredMode(): void {
    if (this.config.storageKey === null || !this.isBrowser) {
      return;
    }

    try {
      this.document.defaultView?.localStorage.removeItem(
        this.config.storageKey,
      );
    } catch {
      // A working color mode must not depend on storage availability.
    }
  }

  private destroy(): void {
    this.mediaQuery?.removeEventListener('change', this.handleSystemChange);
    this.document.defaultView?.removeEventListener(
      'storage',
      this.handleStorageChange,
    );
  }
}

function isColorMode(value: string): value is NeuralColorMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

function assertColorMode(value: string): asserts value is NeuralColorMode {
  if (!isColorMode(value)) {
    throw new Error(
      `NeuralNg color mode must be light, dark, or system; received "${value}".`,
    );
  }
}
