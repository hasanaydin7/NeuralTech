import {
  DestroyRef,
  Directive,
  ElementRef,
  Renderer2,
  booleanAttribute,
  effect,
  inject,
  input,
} from '@angular/core';
import { PopoverComponent } from './popover.component';
import type {
  NeuralPopoverFocusOnOpen,
  NeuralPopoverPosition,
} from './popover.types';

@Directive({
  selector: '[neuralPopoverTriggerFor]',
  standalone: true,
  host: {
    '(click)': 'handleClick($event)',
    '(keydown.escape)': 'handleEscape($event)',
  },
})
export class PopoverTriggerDirective {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private registeredPopover: PopoverComponent | undefined;

  readonly neuralPopoverTriggerFor = input.required<PopoverComponent>();
  readonly popoverPosition = input<NeuralPopoverPosition | undefined>();
  readonly popoverOffset = input<number | undefined>();
  readonly popoverViewportPadding = input<number | undefined>();
  readonly popoverFocusOnOpen = input<NeuralPopoverFocusOnOpen | undefined>();
  readonly popoverDisabled = input(false, { transform: booleanAttribute });

  constructor() {
    effect(() => {
      const popover = this.neuralPopoverTriggerFor();
      const trigger = this.element.nativeElement;
      if (this.registeredPopover !== popover) {
        this.registeredPopover?.unregisterTrigger(trigger);
        this.registeredPopover = popover;
        popover.registerTrigger(trigger);
      }
      this.renderer.setAttribute(
        trigger,
        'aria-controls',
        popover.normalizedId(),
      );
      this.renderer.setAttribute(
        trigger,
        'aria-expanded',
        popover.isTriggerOpen(trigger) ? 'true' : 'false',
      );
      if (this.popoverDisabled()) {
        this.renderer.setAttribute(trigger, 'aria-disabled', 'true');
      } else {
        this.renderer.removeAttribute(trigger, 'aria-disabled');
      }
    });

    inject(DestroyRef).onDestroy(() => {
      this.registeredPopover?.unregisterTrigger(this.element.nativeElement);
    });
  }

  handleClick(event: MouseEvent): void {
    if (this.popoverDisabled()) return;
    this.neuralPopoverTriggerFor().toggleFor(
      this.element.nativeElement,
      {
        position: this.popoverPosition(),
        offset: this.popoverOffset(),
        viewportPadding: this.popoverViewportPadding(),
        focusOnOpen: this.popoverFocusOnOpen(),
      },
      event,
    );
  }

  handleEscape(event: Event): void {
    const popover = this.neuralPopoverTriggerFor();
    if (!popover.isTriggerOpen(this.element.nativeElement)) return;
    event.preventDefault();
    event.stopPropagation();
    popover.hide('escape', true, event);
  }
}
