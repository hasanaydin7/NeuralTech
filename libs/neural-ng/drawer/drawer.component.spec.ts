import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '../src/neural-ng.config';
import {
  NeuralDrawer,
  NeuralDrawerBody,
  NeuralDrawerFooter,
  NeuralDrawerHeader,
  NeuralDrawerInitialFocus,
} from './drawer.component';
import type { NeuralDrawerClasses, NeuralDrawerClose } from './drawer.types';

@Component({
  imports: [
    NeuralDrawer,
    NeuralDrawerBody,
    NeuralDrawerFooter,
    NeuralDrawerHeader,
    NeuralDrawerInitialFocus,
  ],
  template: `
    <button id="opener" type="button" (click)="drawer.show()">Open</button>
    <neural-drawer
      #drawer
      position="start"
      ariaLabelledby="drawer-title"
      ariaDescribedby="drawer-description"
      drawerClass="consumer-root"
      [classes]="classes"
      [unstyled]="unstyled"
      [modal]="modal()"
      [closeOnEscape]="closeOnEscape"
      [dismissibleBackdrop]="dismissibleBackdrop"
      (closed)="closes.push($event)"
    >
      <neural-drawer-header headerClass="local-header">
        <h2 id="drawer-title">Navigation</h2>
      </neural-drawer-header>
      <neural-drawer-body bodyClass="local-body">
        <p id="drawer-description">Workspace navigation</p>
        <button neuralDrawerInitialFocus type="button">First action</button>
      </neural-drawer-body>
      <neural-drawer-footer footerClass="local-footer">
        <button type="button" (click)="drawer.close('api', 'saved')">
          Save
        </button>
      </neural-drawer-footer>
    </neural-drawer>
  `,
})
class DrawerTestHost {
  readonly drawer = viewChild.required(NeuralDrawer);
  unstyled = false;
  readonly modal = signal(true);
  closeOnEscape = true;
  dismissibleBackdrop = true;
  closes: NeuralDrawerClose[] = [];
  classes: NeuralDrawerClasses = {
    root: 'slot-root',
    header: 'slot-header',
    body: 'slot-body',
    footer: 'slot-footer',
    closeButton: 'slot-close',
    closeIcon: 'slot-icon',
  };
}

describe('NeuralDrawer', () => {
  beforeAll(() => installDialogTestApi());

  async function createHost(
    providers: ReturnType<typeof provideNeuralNg>[] = [],
  ) {
    await TestBed.configureTestingModule({
      imports: [DrawerTestHost],
      providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(DrawerTestHost);
    fixture.detectChanges();
    return fixture;
  }

  it('renders native dialog semantics, logical placement, Neural Icon, and typed classes', async () => {
    const fixture = await createHost();
    const drawer = fixture.nativeElement.querySelector(
      'dialog',
    ) as HTMLDialogElement;
    expect(drawer.dataset['position']).toBe('start');
    expect(drawer.getAttribute('aria-labelledby')).toBe('drawer-title');
    expect(drawer.getAttribute('aria-describedby')).toBe('drawer-description');
    expect(drawer.getAttribute('aria-modal')).toBe('true');
    expect(drawer.classList).toContain('neural-drawer-base');
    expect(drawer.classList).toContain('consumer-root');
    expect(drawer.classList).toContain('slot-root');
    expect(fixture.nativeElement.querySelector('header').classList).toContain(
      'slot-header',
    );
    const icon = fixture.nativeElement.querySelector(
      '.neural-drawer-close-icon-root',
    ) as HTMLElement;
    expect(icon.classList).toContain('nt');
    expect(icon.classList).toContain('nt-x');
    expect(icon.classList).toContain('slot-icon');
  });

  it('opens, moves initial focus, reports the close reason, and restores the opener', async () => {
    const fixture = await createHost();
    const opener = fixture.nativeElement.querySelector(
      '#opener',
    ) as HTMLButtonElement;
    opener.focus();
    opener.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const drawer = fixture.nativeElement.querySelector(
      'dialog',
    ) as HTMLDialogElement;
    const initial = fixture.nativeElement.querySelector(
      '[neuralDrawerInitialFocus]',
    ) as HTMLButtonElement;
    expect(drawer.open).toBe(true);
    expect(document.activeElement).toBe(initial);

    fixture.componentInstance.drawer().close('api', 'saved');
    fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve));
    expect(latest(fixture.componentInstance.closes)).toMatchObject({
      reason: 'api',
      returnValue: 'saved',
    });
    expect(document.activeElement).toBe(opener);
  });

  it('supports Escape, backdrop and close-button policies', async () => {
    const fixture = await createHost();
    const component = fixture.componentInstance.drawer();
    const drawer = fixture.nativeElement.querySelector(
      'dialog',
    ) as HTMLDialogElement;

    component.show();
    fixture.detectChanges();
    await fixture.whenStable();
    drawer.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(latest(fixture.componentInstance.closes)?.reason).toBe('escape');

    component.show();
    fixture.detectChanges();
    await fixture.whenStable();
    vi.spyOn(drawer, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      right: 500,
      top: 0,
      bottom: 700,
      width: 400,
      height: 700,
      x: 100,
      y: 0,
      toJSON: () => ({}),
    });
    drawer.dispatchEvent(
      new MouseEvent('click', { bubbles: true, clientX: 10, clientY: 10 }),
    );
    expect(latest(fixture.componentInstance.closes)?.reason).toBe('backdrop');

    component.show();
    fixture.detectChanges();
    await fixture.whenStable();
    (
      fixture.nativeElement.querySelector(
        '.neural-drawer-close-root',
      ) as HTMLButtonElement
    ).click();
    expect(latest(fixture.componentInstance.closes)?.reason).toBe(
      'close-button',
    );
  });

  it('uses the non-modal Popover top layer without opening a modal dialog', async () => {
    const fixture = await createHost();
    fixture.componentInstance.modal.set(false);
    fixture.detectChanges();
    const component = fixture.componentInstance.drawer();
    const drawer = fixture.nativeElement.querySelector(
      'dialog',
    ) as HTMLDialogElement;

    component.show();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.modal()).toBe(false);
    expect(drawer.getAttribute('popover')).toBe('manual');
    expect(drawer.open).toBe(false);
    expect(drawer.dataset['neuralPopoverOpen']).toBe('true');
    expect(drawer.getAttribute('aria-modal')).toBeNull();

    component.close('api', 'done');
    expect(drawer.dataset['neuralPopoverOpen']).toBeUndefined();
    expect(latest(fixture.componentInstance.closes)).toMatchObject({
      reason: 'api',
      returnValue: 'done',
    });
  });

  it('keeps structural hooks in local and global unstyled mode', async () => {
    const fixture = await createHost([provideNeuralNg({ unstyled: true })]);
    const drawer = fixture.nativeElement.querySelector(
      'dialog',
    ) as HTMLDialogElement;
    expect(drawer.classList).toContain('neural-drawer-root');
    expect(drawer.classList).not.toContain('neural-drawer-base');
    expect(
      fixture.nativeElement.querySelector('.neural-drawer-header-root')
        .classList,
    ).not.toContain('neural-drawer-header-base');
  });
});

function latest<T>(values: readonly T[]): T | undefined {
  return values[values.length - 1];
}

function installDialogTestApi(): void {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value(this: HTMLDialogElement): void {
        this.setAttribute('open', '');
      },
    },
    show: {
      configurable: true,
      value(this: HTMLDialogElement): void {
        this.setAttribute('open', '');
      },
    },
    close: {
      configurable: true,
      value(this: HTMLDialogElement, returnValue = ''): void {
        Object.defineProperty(this, 'returnValue', {
          configurable: true,
          writable: true,
          value: returnValue,
        });
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
      },
    },
  });
  Object.defineProperties(HTMLElement.prototype, {
    showPopover: {
      configurable: true,
      value(): void {
        // Browser API stub for the test environment.
      },
    },
    hidePopover: {
      configurable: true,
      value(): void {
        // Browser API stub for the test environment.
      },
    },
  });
}
