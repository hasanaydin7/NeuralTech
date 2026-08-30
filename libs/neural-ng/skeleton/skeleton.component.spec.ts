import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralSkeleton } from './skeleton.component';
import type { NeuralSkeletonClasses } from './skeleton.types';

@Component({
  imports: [NeuralSkeleton],
  template: `
    <neural-skeleton
      shape="circle"
      animation="wave"
      size="3rem"
      borderRadius="40%"
      skeletonClass="consumer-root"
      [unstyled]="unstyled"
      [classes]="classes"
    />
  `,
})
class SkeletonHost {
  unstyled = false;
  classes: NeuralSkeletonClasses = {
    root: 'slot-root',
    effect: 'slot-effect',
  };
}

describe('NeuralSkeleton', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideNeuralNg()],
    }),
  );

  it('renders a decorative rounded pulse skeleton by default', () => {
    const fixture = TestBed.createComponent(NeuralSkeleton);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-skeleton-root',
    ) as HTMLElement;

    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.getAttribute('role')).toBeNull();
    expect(root.dataset['shape']).toBe('rounded');
    expect(root.dataset['animation']).toBe('pulse');
    expect(root.style.width).toBe('100%');
    expect(root.style.height).toBe('1rem');
    expect(root.classList).toContain('neural-skeleton-rounded-base');
    expect(root.classList).toContain('neural-skeleton-pulse-base');
  });

  it('uses size for both circle dimensions', () => {
    const fixture = TestBed.createComponent(NeuralSkeleton);
    fixture.componentRef.setInput('shape', 'circle');
    fixture.componentRef.setInput('size', '4rem');
    fixture.componentRef.setInput('width', '20rem');
    fixture.componentRef.setInput('height', '8rem');
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-skeleton-root',
    ) as HTMLElement;

    expect(root.style.width).toBe('4rem');
    expect(root.style.height).toBe('4rem');
    expect(root.classList).toContain('neural-skeleton-circle-base');
  });

  it('applies rectangle dimensions and a custom radius', () => {
    const fixture = TestBed.createComponent(NeuralSkeleton);
    fixture.componentRef.setInput('shape', 'rectangle');
    fixture.componentRef.setInput('width', '12rem');
    fixture.componentRef.setInput('height', '5rem');
    fixture.componentRef.setInput('borderRadius', '1.25rem');
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-skeleton-root',
    ) as HTMLElement;

    expect(root.style.width).toBe('12rem');
    expect(root.style.height).toBe('5rem');
    expect(root.style.borderRadius).toBe('1.25rem');
    expect(root.classList).toContain('neural-skeleton-rectangle-base');
  });

  it('falls back from blank lengths', () => {
    const fixture = TestBed.createComponent(NeuralSkeleton);
    fixture.componentRef.setInput('width', ' ');
    fixture.componentRef.setInput('height', '');
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-skeleton-root',
    ) as HTMLElement;

    expect(root.style.width).toBe('100%');
    expect(root.style.height).toBe('1rem');
  });

  it('renders the wave only on the effect slot', () => {
    const fixture = TestBed.createComponent(NeuralSkeleton);
    fixture.componentRef.setInput('animation', 'wave');
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-skeleton-root',
    ) as HTMLElement;
    const effect = fixture.nativeElement.querySelector(
      '.neural-skeleton-effect-root',
    ) as HTMLElement;

    expect(root.classList).not.toContain('neural-skeleton-pulse-base');
    expect(effect.classList).toContain('neural-skeleton-wave-effect-root');
    expect(effect.classList).toContain('neural-skeleton-wave-effect-base');
  });

  it('disables animation classes when animation is none', () => {
    const fixture = TestBed.createComponent(NeuralSkeleton);
    fixture.componentRef.setInput('animation', 'none');
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-skeleton-root',
    ) as HTMLElement;
    const effect = fixture.nativeElement.querySelector(
      '.neural-skeleton-effect-root',
    ) as HTMLElement;

    expect(root.classList).not.toContain('neural-skeleton-pulse-root');
    expect(effect.classList).not.toContain('neural-skeleton-wave-effect-root');
  });

  it('retains structural sizing and consumer slots in unstyled mode', () => {
    const fixture = TestBed.createComponent(SkeletonHost);
    fixture.componentInstance.unstyled = true;
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-skeleton-root',
    ) as HTMLElement;
    const effect = fixture.nativeElement.querySelector(
      '.neural-skeleton-effect-root',
    ) as HTMLElement;

    expect(root.style.width).toBe('3rem');
    expect(root.style.height).toBe('3rem');
    expect(root.style.borderRadius).toBe('40%');
    expect(root.classList).toContain('consumer-root');
    expect(root.classList).toContain('slot-root');
    expect(root.classList).not.toContain('neural-skeleton-base');
    expect(root.classList).not.toContain('neural-skeleton-circle-base');
    expect(effect.classList).toContain('slot-effect');
    expect(effect.classList).toContain('neural-skeleton-wave-effect-root');
    expect(effect.classList).not.toContain('neural-skeleton-wave-effect-base');
  });
});
