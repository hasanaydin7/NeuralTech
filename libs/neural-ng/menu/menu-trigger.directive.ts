import {
  Directive,
  ElementRef,
  Renderer2,
  effect,
  inject,
  input,
} from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';
import { NeuralMenu } from './menu.component';
import type { NeuralMenuPosition } from './menu.types';

@Directive({
  selector: '[neuralMenuTriggerFor]',
  standalone: true,
  host: {
    '(click)': 'handleClick($event)',
    '(keydown)': 'handleKeydown($event)',
  },
})
export class NeuralMenuTrigger {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly neuralButton = inject(NeuralButton, {
    optional: true,
    self: true,
  });

  readonly neuralMenuTriggerFor = input.required<NeuralMenu>();
  readonly menuPosition = input<NeuralMenuPosition>('bottom-start');

  constructor() {
    effect(() => {
      const menu = this.neuralMenuTriggerFor();
      const trigger = this.triggerElement();
      this.renderer.setAttribute(trigger, 'aria-haspopup', 'menu');
      this.renderer.setAttribute(trigger, 'aria-controls', menu.normalizedId());
      this.renderer.setAttribute(
        trigger,
        'aria-expanded',
        menu.isTriggerOpen(trigger) ? 'true' : 'false',
      );
      this.neuralButton?.setManagedAria(
        menu.isTriggerOpen(trigger),
        menu.normalizedId(),
      );
    });
  }

  handleClick(event?: MouseEvent): void {
    if (this.activationBlocked()) {
      event?.preventDefault();
      return;
    }
    this.neuralMenuTriggerFor().toggleFor(
      this.triggerElement(),
      this.menuPosition(),
    );
  }

  handleKeydown(event: KeyboardEvent): void {
    // Loading buttons remain focusable. Their native keydown bubbles even when
    // Button suppresses click, so the trigger must guard its own activation path.
    if (!['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) return;
    if (this.activationBlocked()) {
      event.preventDefault();
      return;
    }
    const menu = this.neuralMenuTriggerFor();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        menu.showFor(this.triggerElement(), this.menuPosition(), 'first');
        return;
      case 'ArrowUp':
        event.preventDefault();
        menu.showFor(this.triggerElement(), this.menuPosition(), 'last');
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        menu.toggleFor(this.triggerElement(), this.menuPosition());
    }
  }

  private activationBlocked(): boolean {
    return (
      !!this.neuralButton?.disabled() ||
      !!this.neuralButton?.loading() ||
      this.triggerElement().matches(':disabled, [aria-disabled="true"]')
    );
  }

  private triggerElement(): HTMLElement {
    const host = this.element.nativeElement;
    return host.matches('neural-button')
      ? (host.querySelector('button') ?? host)
      : host;
  }
}

/** @deprecated Import and use `NeuralMenuTrigger` instead. */
export { NeuralMenuTrigger as MenuTriggerDirective };
