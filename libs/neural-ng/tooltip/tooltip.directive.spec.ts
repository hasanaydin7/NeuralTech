import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralTooltip } from './tooltip.directive';
import type { NeuralTooltipClasses } from './tooltip.types';

@Component({
  imports: [NeuralTooltip],
  template: `
    <button
      aria-describedby="persistent-description"
      [neuralTooltip]="text"
      [tooltipDisabled]="disabled"
      [showDelay]="0"
      [hideDelay]="0"
      [unstyled]="unstyled"
      tooltipClass="consumer-tooltip"
      [classes]="classes"
    >
      Account
    </button>
  `,
})
class TooltipTestHost {
  text = 'Account settings';
  disabled = false;
  unstyled = false;
  classes: NeuralTooltipClasses = {
    root: 'slot-root',
    content: 'slot-content',
    arrow: 'slot-arrow',
  };
}

@Component({
  imports: [NeuralTooltip],
  template: `<span neuralTooltip="Nested action" [showDelay]="0">
    <button type="button">Nested</button>
  </span>`,
})
class NestedTriggerHost {}

describe('NeuralTooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    document.querySelectorAll('neural-tooltip-renderer').forEach((node) => {
      node.remove();
    });
  });

  it('renders accessible text, classes, and preserves described-by tokens', async () => {
    await TestBed.configureTestingModule({
      imports: [TooltipTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(TooltipTestHost);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;

    trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    vi.runAllTimers();
    fixture.detectChanges();

    const tooltip = document.querySelector(
      'neural-tooltip-renderer',
    ) as HTMLElement;
    expect(tooltip).toBeTruthy();
    expect(tooltip.getAttribute('role')).toBe('tooltip');
    expect(tooltip.textContent?.trim()).toBe('Account settings');
    expect(tooltip.classList).toContain('neural-tooltip-base');
    expect(tooltip.classList).toContain('consumer-tooltip');
    expect(tooltip.classList).toContain('slot-root');
    expect(tooltip.querySelector('.slot-content')).toBeTruthy();
    expect(tooltip.querySelector('.slot-arrow')).toBeTruthy();
    expect(trigger.getAttribute('aria-describedby')).toContain(
      'persistent-description',
    );
    expect(trigger.getAttribute('aria-describedby')).toContain(tooltip.id);

    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();
    expect(document.querySelector('neural-tooltip-renderer')).toBeNull();
    expect(trigger.getAttribute('aria-describedby')).toBe(
      'persistent-description',
    );
  });

  it('supports local unstyled mode and disabled state', async () => {
    await TestBed.configureTestingModule({
      imports: [TooltipTestHost],
      providers: [provideNeuralNg()],
    }).compileComponents();
    const fixture = TestBed.createComponent(TooltipTestHost);
    fixture.componentInstance.unstyled = true;
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;

    trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    vi.runAllTimers();
    fixture.detectChanges();
    const tooltip = document.querySelector(
      'neural-tooltip-renderer',
    ) as HTMLElement;
    expect(tooltip.classList).toContain('neural-tooltip-root');
    expect(tooltip.classList).not.toContain('neural-tooltip-base');
    expect(tooltip.classList).toContain('consumer-tooltip');

    trigger.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    vi.runAllTimers();
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    vi.runAllTimers();
    expect(document.querySelector('neural-tooltip-renderer')).toBeNull();
  });

  it('keeps the overlay positioned throughout its leave animation', async () => {
    await TestBed.configureTestingModule({
      imports: [TooltipTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(TooltipTestHost);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;

    trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    vi.advanceTimersByTime(0);
    fixture.detectChanges();
    const tooltip = document.querySelector(
      'neural-tooltip-renderer',
    ) as HTMLElement;
    const positionedStyle = tooltip.style.cssText;
    expect(positionedStyle).not.toBe('');

    trigger.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    vi.advanceTimersByTime(0);
    fixture.detectChanges();

    expect(document.body.contains(tooltip)).toBe(true);
    expect(tooltip.style.cssText).toBe(positionedStyle);

    vi.advanceTimersByTime(100);
    expect(document.body.contains(tooltip)).toBe(false);
  });

  it('dismisses immediately when its trigger activates', async () => {
    await TestBed.configureTestingModule({
      imports: [TooltipTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(TooltipTestHost);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;

    trigger.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
    vi.runAllTimers();
    expect(document.querySelector('neural-tooltip-renderer')).toBeTruthy();

    trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(document.querySelector('neural-tooltip-renderer')).toBeNull();
    expect(trigger.getAttribute('aria-describedby')).toBe(
      'persistent-description',
    );
  });

  it('honors application-wide unstyled mode', async () => {
    await TestBed.configureTestingModule({
      imports: [TooltipTestHost],
      providers: [provideNeuralNg({ unstyled: true })],
    }).compileComponents();
    const fixture = TestBed.createComponent(TooltipTestHost);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;
    trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    vi.runAllTimers();
    fixture.detectChanges();

    const tooltip = document.querySelector(
      'neural-tooltip-renderer',
    ) as HTMLElement;
    expect(tooltip.classList).toContain('neural-tooltip-root');
    expect(tooltip.classList).not.toContain('neural-tooltip-base');
  });

  it('anchors custom component hosts to their interactive descendant', async () => {
    await TestBed.configureTestingModule({
      imports: [NestedTriggerHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(NestedTriggerHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('span') as HTMLElement;
    const button = host.querySelector('button') as HTMLButtonElement;

    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    vi.runAllTimers();
    fixture.detectChanges();

    const tooltip = document.querySelector(
      'neural-tooltip-renderer',
    ) as HTMLElement;
    expect(tooltip).toBeTruthy();
    expect(button.getAttribute('aria-describedby')).toContain(tooltip.id);
    expect(host.hasAttribute('aria-describedby')).toBe(false);
  });

  it('supports imperative visibility without pointer or focus ownership', async () => {
    await TestBed.configureTestingModule({
      imports: [TooltipTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(TooltipTestHost);
    fixture.detectChanges();
    const directive = fixture.debugElement
      .query(By.directive(NeuralTooltip))
      .injector.get(NeuralTooltip);

    directive.show();
    vi.runAllTimers();
    fixture.detectChanges();
    expect(directive.visible()).toBe(true);

    directive.hide(true);
    expect(directive.visible()).toBe(false);
  });
});
