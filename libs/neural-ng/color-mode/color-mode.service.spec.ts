import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralColorMode } from './color-mode.providers';
import { NeuralColorModeService } from './color-mode.service';

describe('NeuralColorModeService', () => {
  let systemDark = false;
  let systemListener: ((event: MediaQueryListEvent) => void) | undefined;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-neural-mode');
    systemDark = false;
    systemListener = undefined;

    window.matchMedia = vi.fn().mockImplementation(
      () =>
        ({
          get matches() {
            return systemDark;
          },
          media: '(prefers-color-scheme: dark)',
          onchange: null,
          addEventListener: (
            _type: string,
            listener: (event: MediaQueryListEvent) => void,
          ) => {
            systemListener = listener;
          },
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as MediaQueryList,
    );
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    document.documentElement.removeAttribute('data-neural-mode');
  });

  it('resolves the default system preference and writes a concrete DOM mode', () => {
    systemDark = true;
    TestBed.configureTestingModule({ providers: [provideNeuralColorMode()] });

    const service = TestBed.inject(NeuralColorModeService);

    expect(service.preference()).toBe('system');
    expect(service.resolvedMode()).toBe('dark');
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.dataset['neuralMode']).toBe('dark');
  });

  it('persists explicit preferences and reset restores the configured default', () => {
    TestBed.configureTestingModule({
      providers: [provideNeuralColorMode({ defaultMode: 'light' })],
    });
    const service = TestBed.inject(NeuralColorModeService);

    service.set('dark');

    expect(service.preference()).toBe('dark');
    expect(service.resolvedMode()).toBe('dark');
    expect(localStorage.getItem('neural-color-mode')).toBe('dark');

    service.reset();

    expect(service.preference()).toBe('light');
    expect(service.resolvedMode()).toBe('light');
    expect(localStorage.getItem('neural-color-mode')).toBeNull();
  });

  it('loads a valid stored preference', () => {
    localStorage.setItem('neural-color-mode', 'dark');
    TestBed.configureTestingModule({ providers: [provideNeuralColorMode()] });

    const service = TestBed.inject(NeuralColorModeService);

    expect(service.preference()).toBe('dark');
    expect(document.documentElement.dataset['neuralMode']).toBe('dark');
  });

  it('tracks operating-system changes only while preference is system', () => {
    TestBed.configureTestingModule({ providers: [provideNeuralColorMode()] });
    const service = TestBed.inject(NeuralColorModeService);

    systemDark = true;
    systemListener?.({ matches: true } as MediaQueryListEvent);
    expect(service.resolvedMode()).toBe('dark');

    service.set('light');
    systemDark = false;
    systemListener?.({ matches: false } as MediaQueryListEvent);
    expect(service.resolvedMode()).toBe('light');
  });

  it('can disable persistence', () => {
    TestBed.configureTestingModule({
      providers: [provideNeuralColorMode({ storageKey: null })],
    });
    const service = TestBed.inject(NeuralColorModeService);

    service.set('dark');

    expect(localStorage.length).toBe(0);
    expect(document.documentElement.dataset['neuralMode']).toBe('dark');
  });

  it('does not access or mutate the DOM on the server', () => {
    TestBed.configureTestingModule({
      providers: [
        provideNeuralColorMode({ defaultMode: 'dark' }),
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    const service = TestBed.inject(NeuralColorModeService);

    expect(service.resolvedMode()).toBe('dark');
    expect(document.documentElement.hasAttribute('data-neural-mode')).toBe(
      false,
    );
  });

  it('validates provider options', () => {
    expect(() =>
      provideNeuralColorMode({ defaultMode: 'sepia' as 'light' }),
    ).toThrowError(/defaultMode/);
    expect(() => provideNeuralColorMode({ storageKey: '  ' })).toThrowError(
      /storageKey/,
    );
  });
});
