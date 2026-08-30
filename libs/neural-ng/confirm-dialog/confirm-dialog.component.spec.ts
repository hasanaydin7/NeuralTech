import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuralConfirmDialog } from './confirm-dialog.component';
import { NeuralConfirmationService } from './confirmation.service';

@Component({
  imports: [NeuralConfirmDialog],
  template: `
    <button id="opener" type="button">Open</button>
    <neural-confirm-dialog
      [key]="key()"
      [unstyled]="unstyled()"
      [classes]="{ message: 'consumer-message' }"
      (closed)="lastReason.set($event.reason)"
    />
  `,
})
class HostComponent {
  readonly dialog = viewChild.required(NeuralConfirmDialog);
  readonly key = signal('default');
  readonly unstyled = signal(false);
  readonly lastReason = signal('none');
}

describe('NeuralConfirmDialog', () => {
  beforeAll(() => installDialogTestApi());

  it('renders service content, focuses accept, and settles the reference', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const service = TestBed.inject(NeuralConfirmationService);
    fixture.detectChanges();
    const opener = fixture.nativeElement.querySelector(
      '#opener',
    ) as HTMLButtonElement;
    opener.focus();
    const ref = service.confirm({
      header: 'Delete',
      message: 'Cannot be undone.',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = fixture.nativeElement.querySelector(
      'dialog',
    ) as HTMLDialogElement;
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute('aria-labelledby')).toContain(
      'confirm-dialog-title',
    );
    expect(fixture.nativeElement.querySelector('h2').textContent).toContain(
      'Delete',
    );
    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('.neural-confirm-dialog-accept-root'),
    );

    (document.activeElement as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(ref.result()).toBe('accepted');
    expect(fixture.componentInstance.lastReason()).toBe('accept');
  });

  it('keeps structural and consumer classes in unstyled mode', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const service = TestBed.inject(NeuralConfirmationService);
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    service.confirm({ message: 'Headless confirmation' });
    fixture.detectChanges();
    await fixture.whenStable();

    const message = fixture.nativeElement.querySelector(
      '.neural-confirm-dialog-message-root',
    ) as HTMLElement;
    expect(message.classList).toContain('consumer-message');
    expect(message.classList).not.toContain(
      'neural-confirm-dialog-message-base',
    );
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
        this.returnValue = returnValue;
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
      },
    },
  });
}
