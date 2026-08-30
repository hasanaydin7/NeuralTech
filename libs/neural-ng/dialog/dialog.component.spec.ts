import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '../src/neural-ng.config';
import {
  NeuralDialog,
  NeuralDialogBody,
  NeuralDialogFooter,
  NeuralDialogHeader,
  NeuralDialogInitialFocus,
} from './dialog.component';
import type { NeuralDialogClasses, NeuralDialogClose } from './dialog.types';

@Component({
  imports: [
    NeuralDialog,
    NeuralDialogBody,
    NeuralDialogFooter,
    NeuralDialogHeader,
    NeuralDialogInitialFocus,
  ],
  template: `
    <button id="opener" type="button" (click)="dialog.show()">Open</button>
    <neural-dialog
      #dialog
      ariaLabelledby="test-dialog-title"
      ariaDescribedby="test-dialog-description"
      dialogClass="consumer-root"
      [classes]="classes"
      [unstyled]="unstyled"
      [closeOnEscape]="closeOnEscape"
      [dismissibleBackdrop]="dismissibleBackdrop"
      [full]="full"
      [showFullScreenButton]="showFullScreenButton"
      (fullChange)="fullChanges.push($event)"
      (closed)="closes.push($event)"
    >
      <neural-dialog-header headerClass="local-header">
        <h2 id="test-dialog-title">Account</h2>
      </neural-dialog-header>
      <neural-dialog-body bodyClass="local-body">
        <p id="test-dialog-description">Edit the account.</p>
        <input neuralDialogInitialFocus aria-label="Account name" />
      </neural-dialog-body>
      <neural-dialog-footer footerClass="local-footer">
        <button type="button" (click)="dialog.close('api', 'saved')">
          Save
        </button>
      </neural-dialog-footer>
    </neural-dialog>
  `,
})
class DialogTestHost {
  readonly dialog = viewChild.required(NeuralDialog);

  unstyled = false;
  closeOnEscape = true;
  dismissibleBackdrop = true;
  full = false;
  showFullScreenButton = false;
  fullChanges: boolean[] = [];
  closes: NeuralDialogClose[] = [];
  classes: NeuralDialogClasses = {
    root: 'slot-root',
    header: 'slot-header',
    body: 'slot-body',
    footer: 'slot-footer',
    closeButton: 'slot-close',
    closeIcon: 'slot-close-icon',
  };
}

describe('Dialog', () => {
  beforeAll(() => installDialogTestApi());

  it('renders native accessible composition and typed classes', async () => {
    await TestBed.configureTestingModule({
      imports: [DialogTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(DialogTestHost);
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector(
      'dialog',
    ) as HTMLDialogElement;
    expect(dialog.getAttribute('aria-labelledby')).toBe('test-dialog-title');
    expect(dialog.getAttribute('aria-describedby')).toBe(
      'test-dialog-description',
    );
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.classList).toContain('neural-dialog-root');
    expect(dialog.classList).toContain('neural-dialog-base');
    expect(dialog.classList).toContain('consumer-root');
    expect(dialog.classList).toContain('slot-root');
    expect(fixture.nativeElement.querySelector('header').classList).toContain(
      'slot-header',
    );
    expect(fixture.nativeElement.querySelector('header').classList).toContain(
      'local-header',
    );
    expect(fixture.nativeElement.querySelector('footer').classList).toContain(
      'slot-footer',
    );
    expect(
      fixture.nativeElement.querySelector('.neural-dialog-close-root')
        .classList,
    ).toContain('slot-close');
    expect(
      fixture.nativeElement.querySelector('.neural-dialog-close-icon-root')
        .classList,
    ).toContain('slot-close-icon');
  });

  it('opens natively, focuses the initial control, reports close details, and restores focus', async () => {
    await TestBed.configureTestingModule({
      imports: [DialogTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(DialogTestHost);
    fixture.detectChanges();

    const opener = fixture.nativeElement.querySelector(
      '#opener',
    ) as HTMLButtonElement;
    opener.focus();
    opener.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = fixture.nativeElement.querySelector(
      'dialog',
    ) as HTMLDialogElement;
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    expect(dialog.open).toBe(true);
    expect(input).toBe(document.activeElement);

    const save = fixture.nativeElement.querySelector(
      'footer button',
    ) as HTMLButtonElement;
    save.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(dialog.open).toBe(false);
    expect(fixture.componentInstance.closes.slice(-1)[0]).toMatchObject({
      reason: 'api',
      returnValue: 'saved',
    });
    expect(opener).toBe(document.activeElement);
  });

  it('reports close-button, Escape, and backdrop reasons', async () => {
    await TestBed.configureTestingModule({
      imports: [DialogTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(DialogTestHost);
    fixture.detectChanges();
    const component = fixture.componentInstance.dialog();
    const dialog = fixture.nativeElement.querySelector(
      'dialog',
    ) as HTMLDialogElement;

    component.show();
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        '.neural-dialog-close-root',
      ) as HTMLButtonElement
    ).click();
    expect(fixture.componentInstance.closes.slice(-1)[0]?.reason).toBe(
      'close-button',
    );

    component.show();
    fixture.detectChanges();
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(fixture.componentInstance.closes.slice(-1)[0]?.reason).toBe(
      'escape',
    );

    component.show();
    fixture.detectChanges();
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      right: 500,
      top: 100,
      bottom: 400,
      width: 400,
      height: 300,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    });
    dialog.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        clientX: 10,
        clientY: 10,
      }),
    );
    expect(fixture.componentInstance.closes.slice(-1)[0]?.reason).toBe(
      'backdrop',
    );
  });

  it('keeps the dialog open when Escape or backdrop dismissal is disabled', async () => {
    await TestBed.configureTestingModule({
      imports: [DialogTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(DialogTestHost);
    fixture.componentInstance.closeOnEscape = false;
    fixture.componentInstance.dismissibleBackdrop = false;
    fixture.detectChanges();
    const component = fixture.componentInstance.dialog();
    const dialog = fixture.nativeElement.querySelector(
      'dialog',
    ) as HTMLDialogElement;

    component.show();
    fixture.detectChanges();
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    dialog.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        clientX: -10,
        clientY: -10,
      }),
    );

    expect(dialog.open).toBe(true);
    expect(fixture.componentInstance.closes).toHaveLength(0);
  });

  it('retains structural and consumer hooks while removing visual classes in unstyled mode', async () => {
    await TestBed.configureTestingModule({
      imports: [DialogTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(DialogTestHost);
    fixture.componentInstance.unstyled = true;
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector(
      'dialog',
    ) as HTMLDialogElement;
    expect(dialog.classList).toContain('neural-dialog-root');
    expect(dialog.classList).toContain('consumer-root');
    expect(dialog.classList).not.toContain('neural-dialog-base');
    expect(
      fixture.nativeElement.querySelector('header').classList,
    ).not.toContain('neural-dialog-header-base');
    expect(
      fixture.nativeElement.querySelector('.neural-dialog-close-root')
        .classList,
    ).not.toContain('neural-dialog-close-base');
  });

  it('applies the viewport-filling visual contract when full is enabled', async () => {
    await TestBed.configureTestingModule({
      imports: [DialogTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(DialogTestHost);
    fixture.componentInstance.full = true;
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector(
      'dialog',
    ) as HTMLDialogElement;
    expect(dialog.classList).toContain('neural-dialog-full-base');
    expect(fixture.componentInstance.dialog().effectiveFull()).toBe(true);
  });

  it('toggles full screen from the optional localized header action', async () => {
    await TestBed.configureTestingModule({
      imports: [DialogTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(DialogTestHost);
    fixture.componentInstance.showFullScreenButton = true;
    fixture.detectChanges();

    const toggle = fixture.nativeElement.querySelector(
      '.neural-dialog-full-screen-root',
    ) as HTMLButtonElement;
    const dialog = fixture.nativeElement.querySelector(
      'dialog',
    ) as HTMLDialogElement;
    expect(toggle.getAttribute('aria-label')).toBe('Enter full screen');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    toggle.click();
    fixture.detectChanges();
    expect(dialog.classList).toContain('neural-dialog-full-base');
    expect(toggle.getAttribute('aria-label')).toBe('Exit full screen');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(fixture.componentInstance.fullChanges).toEqual([true]);

    toggle.click();
    fixture.detectChanges();
    expect(dialog.classList).not.toContain('neural-dialog-full-base');
    expect(fixture.componentInstance.fullChanges).toEqual([true, false]);
  });

  it('inherits global unstyled mode and localizes the close label', async () => {
    await TestBed.configureTestingModule({
      imports: [DialogTestHost],
      providers: [
        provideNeuralNg({
          unstyled: true,
          locale: {
            code: 'tr-TR',
            direction: 'ltr',
            messages: { common: { close: 'Kapat' } },
          },
        }),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(DialogTestHost);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.neural-dialog-base'),
    ).toBeNull();
    expect(
      fixture.nativeElement
        .querySelector('.neural-dialog-close-root')
        .getAttribute('aria-label'),
    ).toBe('Kapat');
  });
});

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
}
