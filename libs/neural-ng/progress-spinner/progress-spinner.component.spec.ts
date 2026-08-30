import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { neuralTr } from '../locales/tr';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralProgressSpinner } from './progress-spinner.component';
import type { NeuralProgressSpinnerClasses } from './progress-spinner.types';

@Component({
  imports: [NeuralProgressSpinner],
  template: `
    <neural-progress-spinner
      size="large"
      severity="success"
      [strokeWidth]="6"
      [speed]="1200"
      label="Uploading"
      ariaValueText="Upload in progress"
      spinnerClass="consumer-root"
      [unstyled]="unstyled"
      [classes]="classes"
    />
  `,
})
class ProgressSpinnerHost {
  unstyled = false;
  classes: NeuralProgressSpinnerClasses = {
    root: 'slot-root',
    svg: 'slot-svg',
    track: 'slot-track',
    indicator: 'slot-indicator',
    label: 'slot-label',
  };
}

describe('NeuralProgressSpinner', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideNeuralNg()],
    }),
  );

  it('renders an indeterminate progressbar without numeric ARIA values', () => {
    const fixture = TestBed.createComponent(NeuralProgressSpinner);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-root',
    ) as HTMLElement;

    expect(root.getAttribute('role')).toBe('progressbar');
    expect(root.getAttribute('aria-label')).toBe('Loading');
    expect(root.getAttribute('aria-valuemin')).toBeNull();
    expect(root.getAttribute('aria-valuemax')).toBeNull();
    expect(root.getAttribute('aria-valuenow')).toBeNull();
    expect(
      fixture.nativeElement.querySelector(
        '.neural-progress-spinner-label-root',
      ),
    ).toBeNull();
  });

  it('uses SVG circles, normalized stroke width, and bounded speed', () => {
    const fixture = TestBed.createComponent(NeuralProgressSpinner);
    fixture.componentRef.setInput('strokeWidth', 20);
    fixture.componentRef.setInput('speed', 40);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-root',
    ) as HTMLElement;
    const circles = fixture.nativeElement.querySelectorAll('circle');

    expect(circles).toHaveLength(2);
    expect(circles[0].getAttribute('stroke-width')).toBe('12');
    expect(circles[1].getAttribute('stroke-width')).toBe('12');
    expect(
      root.style.getPropertyValue('--neural-progress-spinner-duration'),
    ).toBe('200ms');
  });

  it('supports size, severity, visible labels, and consumer slots', () => {
    const fixture = TestBed.createComponent(ProgressSpinnerHost);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-root',
    ) as HTMLElement;
    const indicator = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-indicator-root',
    ) as SVGCircleElement;

    expect(root.dataset['size']).toBe('large');
    expect(root.dataset['severity']).toBe('success');
    expect(root.classList).toContain('neural-progress-spinner-large-base');
    expect(root.classList).toContain('consumer-root');
    expect(root.classList).toContain('slot-root');
    expect(root.getAttribute('aria-label')).toBe('Uploading');
    expect(root.getAttribute('aria-valuetext')).toBe('Upload in progress');
    expect(indicator.classList).toContain(
      'neural-progress-spinner-success-base',
    );
    expect(indicator.getAttribute('stroke-width')).toBe('6');
    expect(
      fixture.nativeElement.querySelector('.neural-progress-spinner-label-root')
        .textContent,
    ).toContain('Uploading');
  });

  it('supports primary and secondary severities', () => {
    const fixture = TestBed.createComponent(NeuralProgressSpinner);
    fixture.componentRef.setInput('severity', 'primary');
    fixture.detectChanges();
    let indicator = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-indicator-root',
    ) as SVGCircleElement;
    expect(indicator.classList).toContain(
      'neural-progress-spinner-primary-base',
    );

    fixture.componentRef.setInput('severity', 'secondary');
    fixture.detectChanges();
    indicator = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-indicator-root',
    ) as SVGCircleElement;
    expect(indicator.classList).toContain(
      'neural-progress-spinner-secondary-base',
    );
  });

  it('supports the opt-in multicolor animation variant', () => {
    const fixture = TestBed.createComponent(NeuralProgressSpinner);
    fixture.componentRef.setInput('variant', 'multicolor');
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-root',
    ) as HTMLElement;
    const indicator = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-indicator-root',
    ) as SVGCircleElement;

    expect(root.dataset['variant']).toBe('multicolor');
    expect(indicator.classList).toContain(
      'neural-progress-spinner-multicolor-base',
    );
  });

  it('supports dynamic stroke motion alone and with multicolor', () => {
    const fixture = TestBed.createComponent(NeuralProgressSpinner);
    fixture.componentRef.setInput('dynamicStroke', true);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-root',
    ) as HTMLElement;
    let indicator = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-indicator-root',
    ) as SVGCircleElement;

    expect(root.dataset['dynamicStroke']).toBe('true');
    expect(indicator.classList).toContain(
      'neural-progress-spinner-dynamic-stroke-base',
    );

    fixture.componentRef.setInput('variant', 'multicolor');
    fixture.detectChanges();
    indicator = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-indicator-root',
    ) as SVGCircleElement;
    expect(indicator.classList).toContain(
      'neural-progress-spinner-multicolor-dynamic-stroke-base',
    );
    expect(indicator.classList).not.toContain(
      'neural-progress-spinner-dynamic-stroke-base',
    );
  });

  it('renders a counter-rotating inner arc in dual mode and reverses both directions', () => {
    const fixture = TestBed.createComponent(NeuralProgressSpinner);
    fixture.componentRef.setInput('dual', true);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-root',
    ) as HTMLElement;
    let outer = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-indicator-root:not(.neural-progress-spinner-inner-indicator-root)',
    ) as SVGCircleElement;
    let inner = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-inner-indicator-root',
    ) as SVGCircleElement;

    expect(root.dataset['dual']).toBe('true');
    expect(root.dataset['reverse']).toBe('false');
    expect(fixture.nativeElement.querySelectorAll('circle')).toHaveLength(4);
    expect(outer.classList).not.toContain(
      'neural-progress-spinner-reverse-all-base',
    );
    expect(inner.classList).toContain(
      'neural-progress-spinner-reverse-all-base',
    );

    fixture.componentRef.setInput('reverse', true);
    fixture.detectChanges();
    outer = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-indicator-root:not(.neural-progress-spinner-inner-indicator-root)',
    ) as SVGCircleElement;
    inner = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-inner-indicator-root',
    ) as SVGCircleElement;
    expect(root.dataset['reverse']).toBe('true');
    expect(outer.classList).toContain(
      'neural-progress-spinner-reverse-all-base',
    );
    expect(inner.classList).not.toContain(
      'neural-progress-spinner-reverse-all-base',
    );
  });

  it('keeps dual multicolor arcs synchronized by default and allows independent cycles', () => {
    const fixture = TestBed.createComponent(NeuralProgressSpinner);
    fixture.componentRef.setInput('dual', true);
    fixture.componentRef.setInput('variant', 'multicolor');
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-root',
    ) as HTMLElement;
    let inner = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-inner-indicator-root',
    ) as SVGCircleElement;

    expect(root.dataset['syncDualColor']).toBe('true');
    expect(inner.classList).toContain(
      'neural-progress-spinner-reverse-motion-base',
    );
    expect(inner.classList).not.toContain(
      'neural-progress-spinner-reverse-all-base',
    );

    fixture.componentRef.setInput('syncDualColor', false);
    fixture.detectChanges();
    inner = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-inner-indicator-root',
    ) as SVGCircleElement;
    expect(root.dataset['syncDualColor']).toBe('false');
    expect(inner.classList).toContain(
      'neural-progress-spinner-reverse-all-base',
    );
  });

  it('allows aria-labelledby to own the accessible name', () => {
    const fixture = TestBed.createComponent(NeuralProgressSpinner);
    fixture.componentRef.setInput('ariaLabel', 'Ignored label');
    fixture.componentRef.setInput('ariaLabelledBy', 'loading-title');
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-root',
    ) as HTMLElement;

    expect(root.getAttribute('aria-label')).toBeNull();
    expect(root.getAttribute('aria-labelledby')).toBe('loading-title');
  });

  it('can hide a visual label without removing the accessible name', () => {
    const fixture = TestBed.createComponent(NeuralProgressSpinner);
    fixture.componentRef.setInput('label', 'Loading projects');
    fixture.componentRef.setInput('showLabel', false);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-root',
    ) as HTMLElement;

    expect(root.getAttribute('aria-label')).toBe('Loading projects');
    expect(
      fixture.nativeElement.querySelector(
        '.neural-progress-spinner-label-root',
      ),
    ).toBeNull();
  });

  it('resolves the default accessible label from the active locale', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideNeuralNg({ locale: neuralTr })],
    });
    const fixture = TestBed.createComponent(NeuralProgressSpinner);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-root',
    ) as HTMLElement;

    expect(root.getAttribute('aria-label')).toBe(
      neuralTr.messages?.common?.loading,
    );
  });

  it('keeps structural and consumer hooks in unstyled mode', () => {
    const fixture = TestBed.createComponent(ProgressSpinnerHost);
    fixture.componentInstance.unstyled = true;
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-root',
    ) as HTMLElement;
    const svg = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-svg-root',
    ) as SVGElement;
    const track = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-track-root',
    ) as SVGCircleElement;
    const indicator = fixture.nativeElement.querySelector(
      '.neural-progress-spinner-indicator-root',
    ) as SVGCircleElement;

    expect(root.classList).toContain('slot-root');
    expect(root.classList).not.toContain('neural-progress-spinner-base');
    expect(svg.classList).toContain('slot-svg');
    expect(svg.classList).not.toContain('neural-progress-spinner-svg-base');
    expect(track.classList).toContain('slot-track');
    expect(track.classList).not.toContain('neural-progress-spinner-track-base');
    expect(indicator.classList).toContain('slot-indicator');
    expect(indicator.classList).not.toContain(
      'neural-progress-spinner-indicator-base',
    );
    expect(indicator.classList).not.toContain(
      'neural-progress-spinner-success-base',
    );
  });
});
