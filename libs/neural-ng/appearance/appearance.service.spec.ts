import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '@neural-ng/core';
import { provideNeuralAppearance } from './appearance.providers';
import { NeuralAppearanceService } from './appearance.service';
import {
  NEURAL_SURFACE_STEPS,
  type NeuralSurfaceScale,
} from './appearance.types';

describe('NeuralAppearanceService', () => {
  beforeEach(() => {
    localStorage.clear();
    clearRootAppearance();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    clearRootAppearance();
  });

  it('applies and persists primary, surface, mode, and direction', () => {
    TestBed.configureTestingModule({
      providers: [
        provideNeuralNg(),
        provideNeuralAppearance({
          primary: 'violet',
          surface: 'ocean-ink',
          mode: 'light',
          direction: 'ltr',
          storageKey: 'test-appearance',
        }),
      ],
    });
    const service = TestBed.inject(NeuralAppearanceService);

    expect(service.primary()).toBe('violet');
    expect(service.surface()).toBe('ocean-ink');
    expect(service.resolvedMode()).toBe('light');
    expect(document.documentElement.dataset['neuralPrimary']).toBe('violet');
    expect(document.documentElement.dataset['neuralSurface']).toBe('ocean-ink');
    expect(
      document.documentElement.style.getPropertyValue(
        '--neural-color-primary-500',
      ),
    ).toBe('#8b5cf6');

    service.setPrimary('rose');
    service.setSurface('carbon');
    service.setMode('dark');
    service.setRtl(true);
    TestBed.flushEffects();

    expect(service.snapshot()).toEqual({
      primary: 'rose',
      surface: 'carbon',
      mode: 'dark',
      resolvedMode: 'dark',
      direction: 'rtl',
    });
    expect(localStorage.getItem('test-appearance-primary')).toBe('rose');
    expect(localStorage.getItem('test-appearance-surface')).toBe('carbon');
    expect(localStorage.getItem('test-appearance-mode')).toBe('dark');
    expect(localStorage.getItem('test-appearance-direction')).toBe('rtl');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('restores stored palette and direction preferences', () => {
    localStorage.setItem('restore-primary', 'emerald');
    localStorage.setItem('restore-surface', 'sand');
    localStorage.setItem('restore-direction', 'rtl');
    localStorage.setItem('restore-mode', 'dark');
    TestBed.configureTestingModule({
      providers: [
        provideNeuralNg(),
        provideNeuralAppearance({ storageKey: 'restore' }),
      ],
    });

    const service = TestBed.inject(NeuralAppearanceService);
    expect(service.primary()).toBe('emerald');
    expect(service.surface()).toBe('sand');
    expect(service.mode()).toBe('dark');
    expect(service.direction()).toBe('rtl');
  });

  it('supports registered custom primary and surface palettes', () => {
    const customSurface = Object.fromEntries(
      NEURAL_SURFACE_STEPS.map((step) => [step, 'rgb(' + step + ' 0 0)']),
    ) as unknown as NeuralSurfaceScale;
    TestBed.configureTestingModule({
      providers: [
        provideNeuralNg(),
        provideNeuralAppearance({
          primary: 'brand',
          surface: 'brand-surface',
          primaryPalettes: [
            { value: 'brand', label: 'Brand', color: '#123456' },
          ],
          surfacePalettes: [
            {
              value: 'brand-surface',
              label: 'Brand surface',
              color: 'rgb(500 0 0)',
              scale: customSurface,
            },
          ],
        }),
      ],
    });

    const service = TestBed.inject(NeuralAppearanceService);
    expect(service.primary()).toBe('brand');
    expect(service.surface()).toBe('brand-surface');
    expect(
      document.documentElement.style.getPropertyValue(
        '--neural-color-surface-900',
      ),
    ).toBe('rgb(900 0 0)');
  });

  it('keeps server rendering deterministic without mutating the DOM', () => {
    TestBed.configureTestingModule({
      providers: [
        provideNeuralNg(),
        provideNeuralAppearance({
          primary: 'rose',
          surface: 'carbon',
          mode: 'dark',
          direction: 'rtl',
        }),
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    const service = TestBed.inject(NeuralAppearanceService);
    expect(service.snapshot()).toEqual({
      primary: 'rose',
      surface: 'carbon',
      mode: 'dark',
      resolvedMode: 'dark',
      direction: 'rtl',
    });
    expect(document.documentElement.dataset['neuralPrimary']).toBeUndefined();
    expect(document.documentElement.dataset['neuralSurface']).toBeUndefined();
  });

  it('rejects unknown defaults and invalid storage keys', () => {
    expect(() => provideNeuralAppearance({ primary: 'missing' })).toThrowError(
      /not registered/,
    );
    expect(() => provideNeuralAppearance({ storageKey: '  ' })).toThrowError(
      /storageKey/,
    );
  });
});

function clearRootAppearance(): void {
  const root = document.documentElement;
  root.removeAttribute('data-neural-primary');
  root.removeAttribute('data-neural-surface');
  root.removeAttribute('data-neural-mode');
  root.removeAttribute('data-neural-direction');
  root.removeAttribute('data-neural-density');
  root.removeAttribute('dir');
  for (const step of [
    0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
  ]) {
    root.style.removeProperty('--neural-color-primary-' + step);
    root.style.removeProperty('--neural-color-surface-' + step);
  }
}
