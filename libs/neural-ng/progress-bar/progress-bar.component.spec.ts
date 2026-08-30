import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '../src/neural-ng.config';
import { ProgressBarComponent } from './progress-bar.component';
import type { NeuralProgressBarClasses } from './progress-bar.types';

@Component({
  imports: [ProgressBarComponent],
  template: `
    <neural-progress-bar
      [value]="42"
      severity="error"
      size="large"
      striped
      animated
      [rounded]="false"
      ariaLabel="Upload progress"
      ariaValueText="42 of 100 files"
      progressClass="consumer-root"
      [unstyled]="unstyled"
      [classes]="classes"
    />
  `,
})
class ProgressBarHost {
  unstyled = false;
  classes: NeuralProgressBarClasses = {
    root: 'slot-root',
    track: 'slot-track',
    buffer: 'slot-buffer',
    value: 'slot-value',
    label: 'slot-label',
  };
}

describe('ProgressBarComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideNeuralNg()],
    }),
  );

  it('renders determinate progress with normalized ARIA and label', () => {
    const fixture = TestBed.createComponent(ProgressBarComponent);
    fixture.componentRef.setInput('value', 65);
    fixture.componentRef.setInput('ariaLabel', 'Build progress');
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-progress-bar-root',
    ) as HTMLElement;
    const value = fixture.nativeElement.querySelector(
      '.neural-progress-bar-value-root',
    ) as HTMLElement;

    expect(root.getAttribute('role')).toBe('progressbar');
    expect(root.getAttribute('aria-label')).toBe('Build progress');
    expect(root.getAttribute('aria-valuemin')).toBe('0');
    expect(root.getAttribute('aria-valuemax')).toBe('100');
    expect(root.getAttribute('aria-valuenow')).toBe('65');
    expect(root.getAttribute('aria-valuetext')).toBe('65%');
    expect(value.style.inlineSize).toBe('65%');
    expect(
      fixture.nativeElement
        .querySelector('.neural-progress-bar-label-root')
        .textContent.trim(),
    ).toBe('65%');
  });

  it('clamps custom ranges and repairs invalid max values', () => {
    const fixture = TestBed.createComponent(ProgressBarComponent);
    fixture.componentRef.setInput('min', 10);
    fixture.componentRef.setInput('max', 20);
    fixture.componentRef.setInput('value', 25);
    fixture.detectChanges();
    let root = fixture.nativeElement.querySelector(
      '.neural-progress-bar-root',
    ) as HTMLElement;
    expect(root.getAttribute('aria-valuenow')).toBe('20');
    expect(root.getAttribute('aria-valuetext')).toBe('100%');

    fixture.componentRef.setInput('max', 10);
    fixture.componentRef.setInput('value', 10.5);
    fixture.detectChanges();
    root = fixture.nativeElement.querySelector(
      '.neural-progress-bar-root',
    ) as HTMLElement;
    expect(root.getAttribute('aria-valuemin')).toBe('10');
    expect(root.getAttribute('aria-valuemax')).toBe('11');
    expect(root.getAttribute('aria-valuenow')).toBe('10.5');
    expect(root.getAttribute('aria-valuetext')).toBe('50%');
  });

  it('never renders buffer behind the current value', () => {
    const fixture = TestBed.createComponent(ProgressBarComponent);
    fixture.componentRef.setInput('value', 60);
    fixture.componentRef.setInput('bufferValue', 40);
    fixture.detectChanges();
    let buffer = fixture.nativeElement.querySelector(
      '.neural-progress-bar-buffer-root',
    ) as HTMLElement;
    expect(buffer.style.inlineSize).toBe('60%');

    fixture.componentRef.setInput('bufferValue', 85);
    fixture.detectChanges();
    buffer = fixture.nativeElement.querySelector(
      '.neural-progress-bar-buffer-root',
    ) as HTMLElement;
    expect(buffer.style.inlineSize).toBe('85%');
  });

  it('removes numeric ARIA in indeterminate mode', () => {
    const fixture = TestBed.createComponent(ProgressBarComponent);
    fixture.componentRef.setInput('mode', 'indeterminate');
    fixture.componentRef.setInput('value', 80);
    fixture.componentRef.setInput('bufferValue', 90);
    fixture.componentRef.setInput('label', 'Loading');
    fixture.componentRef.setInput('ariaLabel', 'Loading account');
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-progress-bar-root',
    ) as HTMLElement;

    expect(root.classList).toContain('neural-progress-bar-indeterminate-root');
    expect(root.getAttribute('aria-valuemin')).toBeNull();
    expect(root.getAttribute('aria-valuemax')).toBeNull();
    expect(root.getAttribute('aria-valuenow')).toBeNull();
    expect(root.getAttribute('aria-valuetext')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.neural-progress-bar-buffer-root'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.neural-progress-bar-label-root')
        .textContent,
    ).toContain('Loading');
  });

  it('supports severity, size, stripes, animation, and square tracks', () => {
    const fixture = TestBed.createComponent(ProgressBarHost);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-progress-bar-root',
    ) as HTMLElement;
    const value = fixture.nativeElement.querySelector(
      '.neural-progress-bar-value-root',
    ) as HTMLElement;

    expect(root.dataset['size']).toBe('large');
    expect(root.dataset['severity']).toBe('error');
    expect(root.dataset['rounded']).toBeUndefined();
    expect(root.classList).toContain('neural-progress-bar-large-base');
    expect(root.classList).toContain('consumer-root');
    expect(root.classList).toContain('slot-root');
    expect(value.classList).toContain('neural-progress-bar-error-base');
    expect(value.classList).toContain('neural-progress-bar-striped-base');
    expect(value.classList).toContain('neural-progress-bar-animated-root');
    expect(root.getAttribute('aria-valuetext')).toBe('42 of 100 files');
  });

  it('supports primary and secondary severities', () => {
    const fixture = TestBed.createComponent(ProgressBarComponent);
    fixture.componentRef.setInput('severity', 'primary');
    fixture.detectChanges();
    let value = fixture.nativeElement.querySelector(
      '.neural-progress-bar-value-root',
    ) as HTMLElement;
    expect(value.classList).toContain('neural-progress-bar-primary-base');

    fixture.componentRef.setInput('severity', 'secondary');
    fixture.detectChanges();
    value = fixture.nativeElement.querySelector(
      '.neural-progress-bar-value-root',
    ) as HTMLElement;
    expect(value.classList).toContain('neural-progress-bar-secondary-base');
  });

  it('can hide the visual label without removing accessible value text', () => {
    const fixture = TestBed.createComponent(ProgressBarComponent);
    fixture.componentRef.setInput('value', 32);
    fixture.componentRef.setInput('showValue', false);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-progress-bar-root',
    ) as HTMLElement;

    expect(
      fixture.nativeElement.querySelector('.neural-progress-bar-label-root'),
    ).toBeNull();
    expect(root.getAttribute('aria-valuetext')).toBe('32%');
  });

  it('keeps structural and consumer hooks in unstyled mode', () => {
    const fixture = TestBed.createComponent(ProgressBarHost);
    fixture.componentInstance.unstyled = true;
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-progress-bar-root',
    ) as HTMLElement;
    const track = fixture.nativeElement.querySelector(
      '.neural-progress-bar-track-root',
    ) as HTMLElement;
    const value = fixture.nativeElement.querySelector(
      '.neural-progress-bar-value-root',
    ) as HTMLElement;

    expect(root.classList).toContain('neural-progress-bar-root');
    expect(root.classList).toContain('slot-root');
    expect(root.classList).not.toContain('neural-progress-bar-base');
    expect(track.classList).toContain('slot-track');
    expect(track.classList).not.toContain('neural-progress-bar-track-base');
    expect(value.classList).toContain('slot-value');
    expect(value.classList).not.toContain('neural-progress-bar-value-base');
    expect(value.classList).not.toContain('neural-progress-bar-error-base');
  });
});
