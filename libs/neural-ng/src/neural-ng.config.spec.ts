import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  NEURAL_NG_CONFIG,
  NeuralNgService,
  provideNeuralNg,
} from './neural-ng.config';

describe('NeuralNgService', () => {
  const originalDirection = document.documentElement.dir;

  beforeEach(() => {
    document.documentElement.removeAttribute('dir');
    document.documentElement.removeAttribute('data-neural-direction');
    document.documentElement.removeAttribute('data-neural-density');
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    document.documentElement.dir = originalDirection;
    document.documentElement.removeAttribute('data-neural-direction');
    document.documentElement.removeAttribute('data-neural-density');
  });

  it('applies configured direction and density to the document root', () => {
    TestBed.configureTestingModule({
      providers: [provideNeuralNg({ direction: 'rtl', density: 'compact' })],
    });

    const service = TestBed.inject(NeuralNgService);
    service.initialize();

    expect(service.resolvedDirection()).toBe('rtl');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.dataset['neuralDirection']).toBe('rtl');
    expect(document.documentElement.dataset['neuralDensity']).toBe('compact');
  });

  it('resolves auto direction from the active locale', () => {
    TestBed.configureTestingModule({
      providers: [
        provideNeuralNg({
          locale: { code: 'ar', direction: 'rtl' },
          direction: 'auto',
        }),
      ],
    });

    const service = TestBed.inject(NeuralNgService);
    service.initialize();

    expect(service.direction()).toBe('auto');
    expect(service.resolvedDirection()).toBe('rtl');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('updates runtime preferences and resets to provider defaults', () => {
    TestBed.configureTestingModule({ providers: [provideNeuralNg()] });
    const service = TestBed.inject(NeuralNgService);
    service.initialize();

    service.setDirection('rtl');
    service.setDensity('spacious');
    TestBed.flushEffects();

    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.dataset['neuralDensity']).toBe('spacious');

    service.reset();
    TestBed.flushEffects();

    expect(service.direction()).toBe('auto');
    expect(service.density()).toBe('comfortable');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('does not mutate the document root on the server', () => {
    TestBed.configureTestingModule({
      providers: [
        provideNeuralNg({ direction: 'rtl', density: 'compact' }),
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    const service = TestBed.inject(NeuralNgService);
    service.initialize();

    expect(service.resolvedDirection()).toBe('rtl');
    expect(document.documentElement.hasAttribute('dir')).toBe(false);
    expect(document.documentElement.hasAttribute('data-neural-density')).toBe(
      false,
    );
  });

  it('exposes immutable validated defaults', () => {
    TestBed.configureTestingModule({ providers: [provideNeuralNg()] });

    expect(TestBed.inject(NEURAL_NG_CONFIG)).toEqual({
      unstyled: false,
      direction: 'auto',
      density: 'comfortable',
    });
    expect(() =>
      provideNeuralNg({ direction: 'vertical' as 'ltr' }),
    ).toThrowError(/direction/);
    expect(() =>
      provideNeuralNg({ density: 'dense' as 'compact' }),
    ).toThrowError(/density/);
  });
});
