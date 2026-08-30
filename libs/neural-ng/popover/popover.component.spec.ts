import { Component, PLATFORM_ID, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '../src/neural-ng.config';
import {
  PopoverCloseDirective,
  PopoverComponent,
  PopoverInitialFocusDirective,
} from './popover.component';
import { PopoverTriggerDirective } from './popover-trigger.directive';
import type { NeuralPopoverCloseEvent } from './popover.types';

@Component({
  imports: [
    PopoverCloseDirective,
    PopoverComponent,
    PopoverInitialFocusDirective,
    PopoverTriggerDirective,
  ],
  template: `
    <button
      #trigger
      type="button"
      [neuralPopoverTriggerFor]="panelRef"
      popoverPosition="bottom-end"
    >
      Account
    </button>
    <neural-popover
      #panelRef
      ariaLabel="Account panel"
      [focusOnOpen]="focusOnOpen()"
      [showArrow]="true"
      [unstyled]="unstyled()"
      popoverClass="consumer-root"
      [classes]="{ content: 'consumer-content' }"
      (closed)="closedEvents.push($event)"
    >
      <button neuralPopoverInitialFocus type="button">Profile</button>
      <button neuralPopoverClose type="button">Close</button>
    </neural-popover>
  `,
})
class PopoverHost {
  readonly panel = viewChild.required(PopoverComponent);
  readonly focusOnOpen = signal<'none' | 'first'>('none');
  readonly unstyled = signal(false);
  readonly closedEvents: NeuralPopoverCloseEvent[] = [];
}

describe('PopoverComponent', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  async function createHost(
    providers: ReturnType<typeof provideNeuralNg>[] = [],
  ) {
    TestBed.configureTestingModule({ providers });
    const fixture = TestBed.createComponent(PopoverHost);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('toggles from an accessible trigger and applies the requested position', async () => {
    const fixture = await createHost();
    const trigger = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;
    const root = fixture.nativeElement.querySelector(
      '.neural-popover-root',
    ) as HTMLElement;

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBe(root.id);

    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.panel().open()).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(root.hidden).toBe(false);
    expect(root.dataset['position']).toBe('bottom-end');
    expect(root.getAttribute('aria-label')).toBe('Account panel');
  });

  it('keeps structural classes in unstyled mode and merges consumer classes', async () => {
    const fixture = await createHost();
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement.querySelector(
      '.neural-popover-root',
    ) as HTMLElement;
    const content = fixture.nativeElement.querySelector(
      '.neural-popover-content-root',
    ) as HTMLElement;

    expect(root.classList.contains('neural-popover-base')).toBe(false);
    expect(root.classList.contains('consumer-root')).toBe(true);
    expect(content.classList.contains('neural-popover-content-base')).toBe(
      false,
    );
    expect(content.classList.contains('consumer-content')).toBe(true);
  });

  it('closes on outside pointer interaction without stealing focus', async () => {
    const fixture = await createHost();
    const trigger = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    document.body.dispatchEvent(
      new Event('pointerdown', { bubbles: true, composed: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.panel().open()).toBe(false);
    expect(
      fixture.componentInstance.closedEvents[
        fixture.componentInstance.closedEvents.length - 1
      ]?.reason,
    ).toBe('outside');
  });

  it('closes with Escape and restores focus to the trigger', async () => {
    vi.useFakeTimers();
    const fixture = await createHost();
    const trigger = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    vi.runAllTimers();

    expect(
      fixture.componentInstance.closedEvents[
        fixture.componentInstance.closedEvents.length - 1
      ]?.reason,
    ).toBe('escape');
    expect(document.activeElement).toBe(trigger);
  });

  it('supports explicit initial focus and close directives', async () => {
    const fixture = await createHost();
    fixture.componentInstance.focusOnOpen.set('first');
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;

    buttons[0]?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(document.activeElement).toBe(buttons[1]);

    vi.useFakeTimers();
    buttons[2]?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    vi.runAllTimers();

    expect(
      fixture.componentInstance.closedEvents[
        fixture.componentInstance.closedEvents.length - 1
      ]?.reason,
    ).toBe('close-directive');
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('honors application-wide unstyled mode', async () => {
    const fixture = await createHost([provideNeuralNg({ unstyled: true })]);
    const root = fixture.nativeElement.querySelector(
      '.neural-popover-root',
    ) as HTMLElement;

    expect(root.classList.contains('neural-popover-root')).toBe(true);
    expect(root.classList.contains('neural-popover-base')).toBe(false);
  });

  it('does not open or position a controlled popover on the server', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const fixture = TestBed.createComponent(PopoverHost);
    fixture.detectChanges();
    fixture.componentInstance.panel().open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement.querySelector(
      '.neural-popover-root',
    ) as HTMLElement;
    expect(root.dataset['position']).toBeUndefined();
  });
});
