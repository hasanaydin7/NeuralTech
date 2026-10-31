import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuralButton } from './button.component';
import { NeuralButtonGroup } from './button-group.component';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralMenu } from '../menu/menu.component';
import { NeuralMenuTrigger } from '../menu/menu-trigger.directive';

@Component({
  imports: [NeuralButton, NeuralMenu, NeuralMenuTrigger],
  template: `
    <neural-button
      label="Actions"
      [loading]="loading()"
      [disabled]="disabled()"
      [neuralMenuTriggerFor]="menu"
    />
    <neural-menu
      #menu="neuralMenu"
      popup
      ariaLabel="Actions menu"
      [items]="items"
      [(open)]="open"
    />
  `,
})
class ButtonMenuHost {
  readonly loading = signal(false);
  readonly disabled = signal(false);
  readonly open = signal(false);
  readonly items = [{ key: 'save', label: 'Save' }];
}

@Component({
  imports: [NeuralButton],
  template: `<form (submit)="submit($event)" (reset)="resets = resets + 1">
    <input name="title" value="Initial" aria-label="Title" />
    <neural-button
      [type]="type()"
      [loading]="loading()"
      [disabled]="disabled()"
      label="Action"
      (clicked)="clicks = clicks + 1"
    />
  </form>`,
})
class NativeFormHost {
  readonly type = signal<'button' | 'submit' | 'reset'>('button');
  readonly loading = signal(false);
  readonly disabled = signal(false);
  clicks = 0;
  submits = 0;
  resets = 0;
  submit(event: Event) {
    event.preventDefault();
    this.submits++;
  }
}

describe('Button family acceptance: native forms', () => {
  for (const type of ['button', 'submit', 'reset'] as const) {
    it(`${type} delegates the native form default action exactly once`, async () => {
      await TestBed.configureTestingModule({
        imports: [NativeFormHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(NativeFormHost);
      fixture.componentInstance.type.set(type);
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector(
        'input',
      ) as HTMLInputElement;
      const button = fixture.nativeElement.querySelector(
        'button',
      ) as HTMLButtonElement;
      input.value = 'Edited';
      button.click();
      expect(fixture.componentInstance.clicks).toBe(1);
      expect(fixture.componentInstance.submits).toBe(type === 'submit' ? 1 : 0);
      expect(fixture.componentInstance.resets).toBe(type === 'reset' ? 1 : 0);
      expect(input.value).toBe(type === 'reset' ? 'Initial' : 'Edited');
    });
  }
  for (const type of ['submit', 'reset'] as const) {
    for (const state of ['disabled', 'loading'] as const) {
      it(`${state} blocks ${type}, parent activation and clicked output`, async () => {
        await TestBed.configureTestingModule({
          imports: [NativeFormHost],
        }).compileComponents();
        const fixture = TestBed.createComponent(NativeFormHost);
        fixture.componentInstance.type.set(type);
        fixture.componentInstance[state].set(true);
        fixture.detectChanges();
        const input = fixture.nativeElement.querySelector(
          'input',
        ) as HTMLInputElement;
        const button = fixture.nativeElement.querySelector(
          'button',
        ) as HTMLButtonElement;
        input.value = 'Edited';
        let parentClicks = 0;
        fixture.nativeElement.addEventListener('click', () => parentClicks++);
        button.click();
        expect(fixture.componentInstance.clicks).toBe(0);
        expect(fixture.componentInstance.submits).toBe(0);
        expect(fixture.componentInstance.resets).toBe(0);
        expect(parentClicks).toBe(0);
        expect(input.value).toBe('Edited');
        fixture.componentInstance[state].set(false);
        fixture.detectChanges();
        button.click();
        expect(fixture.componentInstance.clicks).toBe(1);
      });
    }
  }
});

describe('ButtonGroup acceptance', () => {
  for (const orientation of ['horizontal', 'vertical'] as const) {
    for (const unstyled of [false, true]) {
      it(`${orientation}, unstyled=${unstyled}: keeps group semantics and typed override`, async () => {
        await TestBed.configureTestingModule({
          imports: [NeuralButtonGroup],
        }).compileComponents();
        const fixture = TestBed.createComponent(NeuralButtonGroup);
        fixture.componentRef.setInput('orientation', orientation);
        fixture.componentRef.setInput('unstyled', unstyled);
        fixture.componentRef.setInput('ariaLabel', 'Editor actions');
        fixture.componentRef.setInput('classes', { root: 'consumer-group' });
        fixture.detectChanges();
        const root = fixture.nativeElement.querySelector(
          '[role="group"]',
        ) as HTMLElement;
        expect(root.getAttribute('aria-label')).toBe('Editor actions');
        expect(root.getAttribute('data-orientation')).toBe(orientation);
        expect(
          root.classList.contains(`neural-button-group-${orientation}-root`),
        ).toBe(true);
        expect(root.classList.contains('consumer-group')).toBe(true);
        expect(root.classList.contains('neural-button-group-base')).toBe(
          !unstyled,
        );
      });
    }
  }
  it('inherits global unstyled without erasing structural hooks', async () => {
    await TestBed.configureTestingModule({
      imports: [NeuralButtonGroup],
      providers: [provideNeuralNg({ unstyled: true })],
    }).compileComponents();
    const fixture = TestBed.createComponent(NeuralButtonGroup);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '[role="group"]',
    ) as HTMLElement;
    expect(root.classList.contains('neural-button-group-root')).toBe(true);
    expect(root.classList.contains('neural-button-group-base')).toBe(false);
  });
});

describe('Button family acceptance: instance lifecycle', () => {
  it('managed ARIA and loading state do not leak into a recreated instance', async () => {
    await TestBed.configureTestingModule({
      imports: [NeuralButton],
    }).compileComponents();
    const first = TestBed.createComponent(NeuralButton);
    first.componentInstance.setManagedAria(true, 'popup-one');
    first.componentRef.setInput('loading', true);
    first.detectChanges();
    const firstButton = first.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;
    expect(firstButton.getAttribute('aria-controls')).toBe('popup-one');
    expect(firstButton.getAttribute('aria-expanded')).toBe('true');
    first.destroy();
    const second = TestBed.createComponent(NeuralButton);
    second.detectChanges();
    const secondButton = second.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;
    expect(secondButton.hasAttribute('aria-controls')).toBe(false);
    expect(secondButton.hasAttribute('aria-expanded')).toBe(false);
    expect(secondButton.hasAttribute('aria-busy')).toBe(false);
    expect(secondButton.disabled).toBe(false);
  });
});

describe('Button family acceptance: managed semantics and events', () => {
  it('uses consumer ARIA until a menu takes ownership, then follows managed state', async () => {
    await TestBed.configureTestingModule({
      imports: [NeuralButton],
    }).compileComponents();
    const fixture = TestBed.createComponent(NeuralButton);
    fixture.componentRef.setInput('ariaExpanded', 'false');
    fixture.componentRef.setInput('ariaControls', 'consumer-panel');
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe('consumer-panel');

    fixture.componentInstance.setManagedAria(true, 'managed-menu');
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.getAttribute('aria-controls')).toBe('managed-menu');
    fixture.componentRef.setInput('ariaControls', 'changed-consumer-panel');
    fixture.componentInstance.setManagedAria(false, 'managed-menu');
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe('managed-menu');
  });

  it('forwards title and keyboard shortcut to the native action and removes stale values', async () => {
    await TestBed.configureTestingModule({
      imports: [NeuralButton],
    }).compileComponents();
    const fixture = TestBed.createComponent(NeuralButton);
    fixture.componentRef.setInput('title', 'Save document');
    fixture.componentRef.setInput('ariaKeyShortcuts', 'Control+s');
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;
    expect(button.getAttribute('title')).toBe('Save document');
    expect(button.getAttribute('aria-keyshortcuts')).toBe('Control+s');
    fixture.componentRef.setInput('title', '');
    fixture.componentRef.setInput('ariaKeyShortcuts', null);
    fixture.detectChanges();
    expect(button.hasAttribute('title')).toBe(false);
    expect(button.hasAttribute('aria-keyshortcuts')).toBe(false);
  });

  for (const [nativeName, outputName] of [
    ['click', 'clicked'],
    ['keydown', 'keyDown'],
    ['pointerdown', 'pointerDown'],
    ['pointermove', 'pointerMove'],
    ['pointerup', 'pointerUp'],
    ['pointercancel', 'pointerCancel'],
  ] as const) {
    it(`${outputName} preserves the original native event exactly once`, async () => {
      await TestBed.configureTestingModule({
        imports: [NeuralButton],
      }).compileComponents();
      const fixture = TestBed.createComponent(NeuralButton);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector(
        'button',
      ) as HTMLButtonElement;
      const received: Event[] = [];
      fixture.componentInstance[outputName].subscribe((event) =>
        received.push(event),
      );
      const event =
        nativeName === 'click'
          ? new MouseEvent(nativeName, { bubbles: true })
          : nativeName === 'keydown'
            ? new KeyboardEvent(nativeName, { key: 'Enter', bubbles: true })
            : new PointerEvent(nativeName, { pointerId: 7, bubbles: true });
      button.dispatchEvent(event);
      expect(received).toEqual([event]);
      expect(received[0]).toBe(event);
      expect(received[0].target).toBe(button);
    });
  }
});

describe('Button family acceptance: menu trigger suppression', () => {
  for (const state of ['loading', 'disabled'] as const) {
    for (const key of ['ArrowDown', 'ArrowUp', 'Enter', ' ']) {
      it(`${state} prevents menu opening with ${JSON.stringify(key)} and recovers`, async () => {
        await TestBed.configureTestingModule({
          imports: [ButtonMenuHost],
        }).compileComponents();
        const fixture = TestBed.createComponent(ButtonMenuHost);
        fixture.componentInstance[state].set(true);
        fixture.detectChanges();
        const button = fixture.nativeElement.querySelector(
          'button',
        ) as HTMLButtonElement;
        const tab = new KeyboardEvent('keydown', {
          key: 'Tab',
          bubbles: true,
          cancelable: true,
        });
        button.dispatchEvent(tab);
        expect(tab.defaultPrevented).toBe(false);
        // Also protect programmatic host activation that bypasses native click.
        fixture.nativeElement
          .querySelector('neural-button')
          .dispatchEvent(
            new MouseEvent('click', { bubbles: true, cancelable: true }),
          );
        expect(fixture.componentInstance.open()).toBe(false);
        button.dispatchEvent(
          new KeyboardEvent('keydown', {
            key,
            bubbles: true,
            cancelable: true,
          }),
        );
        fixture.detectChanges();
        expect(fixture.componentInstance.open()).toBe(false);
        expect(button.getAttribute('aria-expanded')).toBe('false');
        fixture.componentInstance[state].set(false);
        fixture.detectChanges();
        button.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'ArrowDown',
            bubbles: true,
            cancelable: true,
          }),
        );
        fixture.detectChanges();
        expect(fixture.componentInstance.open()).toBe(true);
        expect(button.getAttribute('aria-expanded')).toBe('true');
      });
    }
  }
});

describe('Button family acceptance: loading content identity', () => {
  for (const position of ['start', 'end'] as const) {
    it(`retains the ${position} icon and empty-content shape while busy`, async () => {
      await TestBed.configureTestingModule({
        imports: [NeuralButton],
      }).compileComponents();
      const fixture = TestBed.createComponent(NeuralButton);
      fixture.componentRef.setInput('icon', 'nt nt-settings');
      fixture.componentRef.setInput('iconPosition', position);
      fixture.componentRef.setInput('ariaLabel', 'Settings');
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector(
        'button',
      ) as HTMLButtonElement;
      const icon = button.querySelector('.neural-btn-icon') as HTMLElement;
      const content = button.querySelector(
        '.neural-btn-content',
      ) as HTMLElement;
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      expect(button.querySelector('.neural-btn-icon')).toBe(icon);
      expect(button.querySelector('.neural-btn-content')).toBe(content);
      expect(icon.hidden).toBe(true);
      expect(content.hidden).toBe(true);
      expect(content.childNodes.length).toBe(0);
      expect(button.getAttribute('aria-label')).toBe('Loading');
      expect(
        button.querySelector('.neural-btn-loading-label')?.textContent,
      ).toBe('Loading');
      fixture.componentRef.setInput('loading', false);
      fixture.detectChanges();
      expect(icon.hidden).toBe(false);
      expect(content.hidden).toBe(false);
      expect(button.getAttribute('aria-label')).toBe('Settings');
      expect(button.querySelector('.neural-btn-spinner')).toBeNull();
    });
  }
});
