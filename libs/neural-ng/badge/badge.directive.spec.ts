import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralBadgeDirective } from './badge.directive';
import type { NeuralBadgePosition, NeuralBadgeSeverity } from './badge.types';

@Component({
  imports: [NeuralBadgeDirective],
  template: `
    <button
      class="anchor"
      [neuralBadge]="value()"
      [neuralBadgePosition]="position()"
      [neuralBadgeSeverity]="severity()"
      [neuralBadgeMax]="max()"
      [neuralBadgeAriaLabel]="ariaLabel()"
      [neuralBadgeUnstyled]="unstyled()"
    >
      <span class="content">Inbox</span>
    </button>
  `,
})
class BadgeDirectiveHost {
  readonly value = signal<string | number | null>(128);
  readonly position = signal<NeuralBadgePosition>('top-end');
  readonly severity = signal<NeuralBadgeSeverity>('error');
  readonly max = signal<number | null>(99);
  readonly ariaLabel = signal<string | null>('128 unread notifications');
  readonly unstyled = signal(false);
}

describe('NeuralBadgeDirective', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideNeuralNg()],
    }),
  );

  it('attaches the real Badge component to an arbitrary anchor', () => {
    const fixture = TestBed.createComponent(BadgeDirectiveHost);
    fixture.detectChanges();
    const anchor = fixture.nativeElement.querySelector(
      '.anchor',
    ) as HTMLElement;
    const badgeHost = anchor.querySelector('neural-badge') as HTMLElement;
    const badge = badgeHost.querySelector('.neural-badge-root') as HTMLElement;

    expect(anchor.classList).toContain('neural-badge-anchor');
    expect(badgeHost.classList).toContain('neural-badge-anchor-badge-top-end');
    expect(badgeHost.classList).toContain('neural-badge-anchor-badge-overlay');
    expect(badge.textContent?.trim()).toBe('99+');
    expect(badge.dataset['severity']).toBe('error');
    expect(badge.getAttribute('aria-label')).toBe('128 unread notifications');
  });

  it('moves inline start and end badges into logical DOM order', () => {
    const fixture = TestBed.createComponent(BadgeDirectiveHost);
    fixture.componentInstance.position.set('start');
    fixture.detectChanges();
    const anchor = fixture.nativeElement.querySelector(
      '.anchor',
    ) as HTMLElement;
    let badgeHost = anchor.querySelector('neural-badge') as HTMLElement;
    const content = anchor.querySelector('.content') as HTMLElement;

    expect(
      badgeHost.compareDocumentPosition(content) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    fixture.componentInstance.position.set('end');
    fixture.detectChanges();
    fixture.detectChanges();
    badgeHost = anchor.querySelector('neural-badge') as HTMLElement;
    expect(
      content.compareDocumentPosition(badgeHost) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('removes null values but keeps zero visible', () => {
    const fixture = TestBed.createComponent(BadgeDirectiveHost);
    fixture.componentInstance.value.set(null);
    fixture.detectChanges();
    const anchor = fixture.nativeElement.querySelector(
      '.anchor',
    ) as HTMLElement;

    expect(anchor.querySelector('neural-badge')).toBeNull();

    fixture.componentInstance.value.set(0);
    fixture.detectChanges();
    fixture.detectChanges();
    const badge = anchor.querySelector('.neural-badge-root') as HTMLElement;
    expect(badge.hidden).toBe(false);
    expect(badge.textContent?.trim()).toBe('0');
  });

  it('preserves structural hooks in unstyled mode', () => {
    const fixture = TestBed.createComponent(BadgeDirectiveHost);
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector(
      '.neural-badge-root',
    ) as HTMLElement;

    expect(badge.classList).toContain('neural-badge-root');
    expect(badge.classList).not.toContain('neural-badge-base');
  });
});
