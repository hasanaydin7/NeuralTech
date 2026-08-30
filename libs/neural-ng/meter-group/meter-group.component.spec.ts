import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralMeterGroup } from './meter-group.component';
import type {
  NeuralMeterGroupClasses,
  NeuralMeterItem,
} from './meter-group.types';

const items: readonly NeuralMeterItem[] = [
  { label: 'Apps', value: 24, iconClass: 'nt nt-apps' },
  { label: 'Media', value: 36, color: '#7c3aed', valueText: '36 GB' },
  { label: 'System', value: 18 },
];

@Component({
  imports: [NeuralMeterGroup],
  template: `
    <neural-meter-group
      [items]="items"
      orientation="vertical"
      labelPosition="start"
      labelOrientation="vertical"
      ariaLabel="Storage usage"
      meterGroupClass="consumer-root"
      [unstyled]="unstyled"
      [classes]="classes"
    />
  `,
})
class MeterGroupHost {
  items = items;
  unstyled = false;
  classes: NeuralMeterGroupClasses = {
    root: 'slot-root',
    meters: 'slot-meters',
    meter: 'slot-meter',
    labels: 'slot-labels',
    labelItem: 'slot-label-item',
    marker: 'slot-marker',
    icon: 'slot-icon',
    label: 'slot-label',
    value: 'slot-value',
  };
}

describe('NeuralMeterGroup', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideNeuralNg()],
    }),
  );

  it('renders an accessible meter for every visible label', () => {
    const fixture = TestBed.createComponent(NeuralMeterGroup);
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    const meters = fixture.nativeElement.querySelectorAll(
      '[role="meter"]',
    ) as NodeListOf<HTMLElement>;
    const labels = fixture.nativeElement.querySelectorAll(
      '.neural-meter-group-label-root',
    ) as NodeListOf<HTMLElement>;

    expect(meters).toHaveLength(3);
    expect(labels).toHaveLength(3);
    expect(meters[0].getAttribute('aria-labelledby')).toBe(labels[0].id);
    expect(meters[0].getAttribute('aria-valuemin')).toBe('0');
    expect(meters[0].getAttribute('aria-valuemax')).toBe('100');
    expect(meters[0].getAttribute('aria-valuenow')).toBe('24');
    expect(meters[1].getAttribute('aria-valuetext')).toBe('36 GB');
  });

  it('normalizes invalid bounds and clamps values', () => {
    const fixture = TestBed.createComponent(NeuralMeterGroup);
    fixture.componentRef.setInput('min', 10);
    fixture.componentRef.setInput('max', 10);
    fixture.componentRef.setInput('items', [
      { label: 'Low', value: Number.NaN },
      { label: 'High', value: 500 },
    ]);
    fixture.detectChanges();
    const meters = fixture.nativeElement.querySelectorAll(
      '[role="meter"]',
    ) as NodeListOf<HTMLElement>;

    expect(meters[0].getAttribute('aria-valuemin')).toBe('10');
    expect(meters[0].getAttribute('aria-valuemax')).toBe('110');
    expect(meters[0].getAttribute('aria-valuenow')).toBe('10');
    expect(meters[1].getAttribute('aria-valuenow')).toBe('110');
  });

  it('clips visual capacity without corrupting meter values', () => {
    const fixture = TestBed.createComponent(NeuralMeterGroup);
    fixture.componentRef.setInput('items', [
      { label: 'First', value: 80 },
      { label: 'Second', value: 50 },
      { label: 'Third', value: 20 },
    ]);
    fixture.detectChanges();
    const meters = fixture.nativeElement.querySelectorAll(
      '[role="meter"]',
    ) as NodeListOf<HTMLElement>;

    expect(meters[0].style.inlineSize).toBe('80%');
    expect(meters[1].style.inlineSize).toBe('20%');
    expect(meters[2].style.inlineSize).toBe('0%');
    expect(meters[1].getAttribute('aria-valuenow')).toBe('50');
  });

  it('uses direct accessible names when labels are hidden', () => {
    const fixture = TestBed.createComponent(NeuralMeterGroup);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('showLabels', false);
    fixture.detectChanges();
    const meter = fixture.nativeElement.querySelector(
      '[role="meter"]',
    ) as HTMLElement;

    expect(meter.getAttribute('aria-label')).toBe('Apps');
    expect(meter.getAttribute('aria-labelledby')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.neural-meter-group-labels-root'),
    ).toBeNull();
  });

  it('supports vertical layout, icons, colors, and value formatting', () => {
    const fixture = TestBed.createComponent(MeterGroupHost);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-meter-group-root',
    ) as HTMLElement;
    const meters = fixture.nativeElement.querySelectorAll(
      '[role="meter"]',
    ) as NodeListOf<HTMLElement>;
    const icon = fixture.nativeElement.querySelector(
      '.neural-meter-group-icon-root',
    ) as HTMLElement;

    expect(root.dataset['orientation']).toBe('vertical');
    expect(root.dataset['labelPosition']).toBe('start');
    expect(root.getAttribute('aria-label')).toBe('Storage usage');
    expect(meters[0].style.blockSize).toBe('24%');
    expect(
      meters[1].style.getPropertyValue('--neural-meter-group-item-color'),
    ).toBe('#7c3aed');
    expect(icon.classList).toContain('nt-apps');
  });

  it('formats visible values with a consumer function', () => {
    const fixture = TestBed.createComponent(NeuralMeterGroup);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput(
      'valueFormatter',
      (value: number) => `${value} GB`,
    );
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.neural-meter-group-value-root')
        .textContent,
    ).toContain('24 GB');
  });

  it('preserves semantics, structure, and consumer slots when unstyled', () => {
    const fixture = TestBed.createComponent(MeterGroupHost);
    fixture.componentInstance.unstyled = true;
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-meter-group-root',
    ) as HTMLElement;
    const meter = fixture.nativeElement.querySelector(
      '.neural-meter-group-meter-root',
    ) as HTMLElement;
    const labels = fixture.nativeElement.querySelector(
      '.neural-meter-group-labels-root',
    ) as HTMLElement;

    expect(root.getAttribute('role')).toBe('group');
    expect(root.classList).toContain('neural-meter-group-vertical-root');
    expect(root.classList).toContain('consumer-root');
    expect(root.classList).not.toContain('neural-meter-group-base');
    expect(root.classList).not.toContain('neural-meter-group-vertical-base');
    expect(meter.getAttribute('role')).toBe('meter');
    expect(meter.classList).toContain('slot-meter');
    expect(meter.classList).not.toContain('neural-meter-group-meter-base');
    expect(labels.classList).toContain('slot-labels');
    expect(labels.classList).not.toContain('neural-meter-group-labels-base');
  });
});
