import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralBadge } from './badge.component';
import type {
  NeuralBadgeClasses,
  NeuralBadgeSeverity,
  NeuralBadgeSize,
} from './badge.types';

@Component({
  imports: [NeuralBadge],
  template: `
    <neural-badge
      [value]="value"
      [max]="max"
      [severity]="severity"
      [size]="size"
      [rounded]="rounded"
      [dot]="dot"
      [badgeHidden]="isBadgeHidden"
      [ariaLabel]="ariaLabel"
      [unstyled]="unstyled"
      [classes]="classes"
    >
      <i class="nt nt-check"></i>
      Verified
    </neural-badge>
  `,
})
class BadgeHost {
  value: string | number | null = 8;
  max: number | null = null;
  severity: NeuralBadgeSeverity = 'info';
  size: NeuralBadgeSize = 'medium';
  rounded = true;
  dot = false;
  isBadgeHidden = false;
  ariaLabel: string | null = null;
  unstyled = false;
  classes: NeuralBadgeClasses = {
    root: 'slot-root',
    value: 'slot-value',
    content: 'slot-content',
  };
}

describe('NeuralBadge', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideNeuralNg()],
    }),
  );

  it('renders values, severity, size, rounded state, and typed classes', () => {
    const fixture = TestBed.createComponent(BadgeHost);
    fixture.componentInstance.size = 'large';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector(
      '.neural-badge-root',
    ) as HTMLElement;

    expect(badge.textContent?.trim()).toBe('8');
    expect(badge.dataset['severity']).toBe('info');
    expect(badge.dataset['size']).toBe('large');
    expect(badge.classList).toContain('neural-badge-info-base');
    expect(badge.classList).toContain('neural-badge-large-base');
    expect(badge.classList).toContain('neural-badge-rounded-base');
    expect(badge.classList).toContain('slot-root');
    expect(badge.querySelector('.slot-value')).toBeTruthy();
  });

  it('supports primary and secondary severities', () => {
    const fixture = TestBed.createComponent(BadgeHost);
    fixture.componentInstance.severity = 'primary';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector(
      '.neural-badge-root',
    ) as HTMLElement;
    expect(badge.classList).toContain('neural-badge-primary-base');

    const secondaryFixture = TestBed.createComponent(BadgeHost);
    secondaryFixture.componentInstance.severity = 'secondary';
    secondaryFixture.detectChanges();
    const secondaryBadge = secondaryFixture.nativeElement.querySelector(
      '.neural-badge-root',
    ) as HTMLElement;
    expect(secondaryBadge.classList).toContain('neural-badge-secondary-base');
  });

  it('caps numeric display while preserving the real accessible value', () => {
    const fixture = TestBed.createComponent(BadgeHost);
    fixture.componentInstance.value = 128;
    fixture.componentInstance.max = 99;
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector(
      '.neural-badge-root',
    ) as HTMLElement;

    expect(badge.textContent?.trim()).toBe('99+');
    expect(badge.getAttribute('aria-label')).toBe('128');
  });

  it('keeps zero and negative values visible and hides only explicitly', () => {
    const fixture = TestBed.createComponent(BadgeHost);
    fixture.componentInstance.value = 0;
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector(
      '.neural-badge-root',
    ) as HTMLElement;
    expect(badge.hidden).toBe(false);
    expect(badge.textContent?.trim()).toBe('0');

    const hiddenFixture = TestBed.createComponent(BadgeHost);
    hiddenFixture.componentInstance.value = -2;
    hiddenFixture.componentInstance.isBadgeHidden = true;
    hiddenFixture.detectChanges();
    const hiddenBadge = hiddenFixture.nativeElement.querySelector(
      '.neural-badge-root',
    ) as HTMLElement;
    expect(hiddenBadge.hidden).toBe(true);
  });

  it('renders projected content only when value is absent', () => {
    const fixture = TestBed.createComponent(BadgeHost);
    fixture.componentInstance.value = null;
    fixture.detectChanges();

    const content = fixture.nativeElement.querySelector(
      '.neural-badge-content-root',
    ) as HTMLElement;
    expect(content.textContent).toContain('Verified');
    expect(content.querySelector('.nt-check')).toBeTruthy();
  });

  it('renders labelled dot badges without visual content', () => {
    const fixture = TestBed.createComponent(BadgeHost);
    fixture.componentInstance.dot = true;
    fixture.componentInstance.ariaLabel = 'New notifications';
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector(
      '.neural-badge-root',
    ) as HTMLElement;

    expect(badge.classList).toContain('neural-badge-dot-base');
    expect(badge.getAttribute('aria-label')).toBe('New notifications');
    expect(badge.textContent?.trim()).toBe('');
  });

  it('removes visual classes locally', () => {
    const fixture = TestBed.createComponent(BadgeHost);
    fixture.componentInstance.unstyled = true;
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector(
      '.neural-badge-root',
    ) as HTMLElement;
    expect(badge.classList).toContain('neural-badge-root');
    expect(badge.classList).not.toContain('neural-badge-base');
    expect(badge.classList).toContain('slot-root');
  });
});
