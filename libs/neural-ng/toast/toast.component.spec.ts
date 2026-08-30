import { Component, type EnvironmentProviders } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '../src/neural-ng.config';
import { provideNeuralMessages } from '../message/message.providers';
import { NeuralMessageService } from '../message/message.service';
import { ToastComponent } from './toast.component';
import { provideNeuralToast } from './toast.providers';
import { NeuralToastTemplateDirective } from './toast-template.directive';
import type { NeuralToastPosition } from './toast.types';

describe('ToastComponent', () => {
  function createToast(
    defaultDuration: number | null = null,
    providers: EnvironmentProviders[] = [],
  ) {
    TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [provideNeuralMessages({ defaultDuration }), ...providers],
    });

    const service = TestBed.inject(NeuralMessageService);
    const fixture = TestBed.createComponent(ToastComponent);
    return { fixture, service };
  }

  it('uses global and top-end defaults with no required inputs', () => {
    const { fixture, service } = createToast();
    service.notify({ severity: 'success', message: 'Saved.' });
    fixture.detectChanges();

    const outlet = fixture.nativeElement.querySelector(
      '.neural-toast-root',
    ) as HTMLElement;

    expect(outlet.dataset['channel']).toBe('global');
    expect(outlet.dataset['position']).toBe('top-end');
    expect(outlet.classList).toContain('neural-toast-position-top-end');
    expect(fixture.nativeElement.textContent).toContain('Saved.');
    expect(fixture.componentInstance.icon()).toBe(true);
    expect(fixture.componentInstance.iconClass()).toBe('');
    expect(
      fixture.nativeElement.querySelector('.neural-toast-icon').classList,
    ).toContain('nt-circle-check');
  });

  it('selects a default Neural icon class for every severity', () => {
    const { fixture, service } = createToast();
    const expected = {
      primary: 'nt-settings',
      secondary: 'nt-bell',
      neutral: 'nt-bell',
      info: 'nt-info-circle',
      success: 'nt-circle-check',
      warning: 'nt-alert-triangle',
      error: 'nt-circle-times',
    } as const;

    for (const [severity, iconClass] of Object.entries(expected)) {
      service.clear();
      service.notify({
        severity: severity as keyof typeof expected,
        message: severity,
      });
      fixture.detectChanges();
      const icon = fixture.nativeElement.querySelector(
        `[data-severity="${severity}"] .neural-toast-icon`,
      ) as HTMLElement;
      expect(icon.classList).toContain('nt');
      expect(icon.classList).toContain(iconClass);
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('supports custom Neural and third-party icon classes', () => {
    const { fixture, service } = createToast();
    service.notify({ severity: 'info', message: 'Custom icon' });

    fixture.componentRef.setInput('iconClass', 'nt-user custom-icon');
    fixture.detectChanges();
    let icon = fixture.nativeElement.querySelector(
      '.neural-toast-icon',
    ) as HTMLElement;
    expect(icon.classList).toContain('nt');
    expect(icon.classList).toContain('nt-user');
    expect(icon.classList).toContain('custom-icon');
    expect(icon.classList).not.toContain('nt-info-circle');

    fixture.componentRef.setInput('iconClass', 'pi pi-user');
    fixture.detectChanges();
    icon = fixture.nativeElement.querySelector('.neural-toast-icon');
    expect(icon.classList).toContain('pi');
    expect(icon.classList).toContain('pi-user');
    expect(icon.classList).not.toContain('nt');
  });

  it('removes the icon and collapses the message grid when icon is false', () => {
    const { fixture, service } = createToast();
    fixture.componentRef.setInput('icon', false);
    service.notify({ message: 'No icon' });
    fixture.detectChanges();

    const message = fixture.nativeElement.querySelector(
      '.neural-toast-message-root',
    ) as HTMLElement;
    expect(
      fixture.nativeElement.querySelector('.neural-toast-icon'),
    ).toBeNull();
    expect(message.classList).toContain('neural-toast-message-without-icon');
    expect(message.textContent).toContain('No icon');
  });

  it.each<NeuralToastPosition>([
    'top-start',
    'top-center',
    'top-end',
    'middle-start',
    'middle-center',
    'middle-end',
    'bottom-start',
    'bottom-center',
    'bottom-end',
  ])('supports the %s position', (position) => {
    const { fixture } = createToast();
    fixture.componentRef.setInput('position', position);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.neural-toast-root').classList,
    ).toContain(`neural-toast-position-${position}`);
  });

  it('renders only its normalized channel', () => {
    const { fixture, service } = createToast();
    fixture.componentRef.setInput('channel', ' feature ');
    service.notify({ message: 'Global message' });
    service.notify({ message: 'Feature message', channel: 'feature' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Global message');
    expect(fixture.nativeElement.textContent).toContain('Feature message');
  });

  it('merges consumer classes and removes visual classes when unstyled', () => {
    const { fixture, service } = createToast();
    fixture.componentRef.setInput('toastClass', 'custom-outlet');
    fixture.componentRef.setInput('messageClass', 'custom-message');
    fixture.componentRef.setInput('unstyled', true);
    service.notify({ message: 'Headless message' });
    fixture.detectChanges();

    const outlet = fixture.nativeElement.querySelector('.neural-toast-root');
    const message = fixture.nativeElement.querySelector(
      '.neural-toast-message-root',
    );
    const close = fixture.nativeElement.querySelector(
      '.neural-toast-close-root',
    );

    expect(outlet.classList).toContain('custom-outlet');
    expect(message.classList).toContain('custom-message');
    expect(message.classList).not.toContain('neural-toast-message-base');
    expect(close.classList).not.toContain('neural-toast-close-base');
  });

  it('announces important and regular messages through stable live regions', () => {
    const { fixture, service } = createToast();
    service.notify({ severity: 'info', message: 'Information' });
    service.notify({ severity: 'error', message: 'Failure' });
    fixture.detectChanges();

    const status = fixture.nativeElement.querySelector('[role="status"]');
    const alert = fixture.nativeElement.querySelector('[role="alert"]');

    expect(status.textContent).toContain('Information');
    expect(alert.textContent).toContain('Failure');
    expect(
      fixture.nativeElement.querySelectorAll('[role="status"]'),
    ).toHaveLength(1);
    expect(
      fixture.nativeElement.querySelectorAll('[role="alert"]'),
    ).toHaveLength(1);
  });

  it('uses global Toast defaults and lets local inputs override them', () => {
    const { fixture, service } = createToast(null, [
      provideNeuralToast({
        channel: 'feature',
        position: 'middle-center',
        ariaLabel: 'Global notifications',
        closeLabel: 'Dismiss',
        showProgress: true,
      }),
    ]);
    fixture.componentRef.setInput('position', 'bottom-start');
    service.notify({
      message: 'Configured',
      channel: 'feature',
      duration: 1000,
    });
    fixture.detectChanges();

    const outlet = fixture.nativeElement.querySelector('.neural-toast-root');
    expect(outlet.dataset['channel']).toBe('feature');
    expect(outlet.dataset['position']).toBe('bottom-start');
    expect(outlet.getAttribute('aria-label')).toBe('Global notifications');
    expect(
      fixture.nativeElement.querySelector('.neural-toast-progress'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement
        .querySelector('.neural-toast-close-root')
        .getAttribute('aria-label'),
    ).toContain('Dismiss');
  });

  it('inherits global unstyled mode', () => {
    const { fixture, service } = createToast(null, [
      provideNeuralNg({ unstyled: true }),
    ]);
    service.notify({ message: 'Globally headless' });
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.neural-toast-message-root')
        .classList,
    ).not.toContain('neural-toast-message-base');
    expect(
      fixture.nativeElement.querySelector('.neural-toast-item').className,
    ).not.toContain('neural-toast-enter');
  });

  it('dismisses a message as user interaction', () => {
    const { fixture, service } = createToast();
    const ref = service.notify({ message: 'Dismiss me' });
    fixture.detectChanges();

    const closeButton = fixture.nativeElement.querySelector(
      '.neural-toast-close-root',
    ) as HTMLButtonElement;
    closeButton.click();
    fixture.detectChanges();

    expect(ref.closed()).toBe(true);
    expect(ref.closeReason()).toBe('user');
    expect(service.messages()).toHaveLength(0);
  });

  it('dismisses a finite message with the timeout reason', async () => {
    vi.useFakeTimers();

    try {
      const { fixture, service } = createToast(1000);
      const ref = service.notify({ message: 'Finite message' });
      fixture.detectChanges();
      await fixture.whenStable();

      await vi.advanceTimersByTimeAsync(1000);

      expect(ref.closed()).toBe(true);
      expect(ref.closeReason()).toBe('timeout');
      expect(service.messages()).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('pauses and resumes finite timers during pointer interaction', async () => {
    vi.useFakeTimers();

    try {
      const { fixture, service } = createToast(1000);
      const ref = service.notify({ message: 'Interactive message' });
      fixture.detectChanges();
      await fixture.whenStable();
      const outlet = fixture.nativeElement.querySelector(
        '.neural-toast-root',
      ) as HTMLElement;

      await vi.advanceTimersByTimeAsync(400);
      outlet.dispatchEvent(new Event('pointerenter'));
      await vi.advanceTimersByTimeAsync(2000);
      expect(ref.closed()).toBe(false);

      outlet.dispatchEvent(new Event('pointerleave'));
      await vi.advanceTimersByTimeAsync(600);

      expect(ref.closed()).toBe(true);
      expect(ref.closeReason()).toBe('timeout');
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects an empty channel', () => {
    const { fixture } = createToast();

    expect(() => fixture.componentRef.setInput('channel', '   ')).toThrowError(
      'NeuralNg toast: channel cannot be empty.',
    );
  });

  it('validates runtime inputs and provider configuration', () => {
    const { fixture } = createToast();

    expect(() =>
      fixture.componentRef.setInput('position', 'sideways'),
    ).toThrowError('NeuralNg toast: invalid position "sideways".');
    expect(() =>
      fixture.componentRef.setInput('swipeThreshold', 0),
    ).toThrowError('NeuralNg toast: swipeThreshold must be positive.');
    expect(() => provideNeuralToast({ ariaLabel: '  ' })).toThrowError(
      'NeuralNg toast: ariaLabel cannot be empty.',
    );
    expect(() => provideNeuralToast({ closeLabel: '' })).toThrowError(
      'NeuralNg toast: closeLabel cannot be empty.',
    );
  });

  it('warns about persistent non-dismissible messages in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, service } = createToast();
    service.notify({
      message: 'API-only close',
      duration: null,
      dismissible: false,
    });
    fixture.detectChanges();

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('persistent non-dismissible'),
    );
    warn.mockRestore();
  });

  it('dismisses a dismissible message after a touch swipe', () => {
    const { fixture, service } = createToast();
    const ref = service.notify({ message: 'Swipe me' });
    fixture.detectChanges();
    const message = fixture.nativeElement.querySelector(
      '.neural-toast-message-root',
    ) as HTMLElement;

    message.dispatchEvent(pointerEvent('pointerdown', 0));
    message.dispatchEvent(pointerEvent('pointermove', 90));
    message.dispatchEvent(pointerEvent('pointerup', 90));
    fixture.detectChanges();

    expect(ref.closeReason()).toBe('user');
  });

  it('does not swipe-dismiss a non-dismissible message', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, service } = createToast();
    const ref = service.notify({
      message: 'Stay',
      duration: null,
      dismissible: false,
    });
    fixture.detectChanges();
    const message = fixture.nativeElement.querySelector(
      '.neural-toast-message-root',
    ) as HTMLElement;

    message.dispatchEvent(pointerEvent('pointerdown', 0));
    message.dispatchEvent(pointerEvent('pointermove', 100));
    message.dispatchEvent(pointerEvent('pointerup', 100));

    expect(ref.closed()).toBe(false);
    warn.mockRestore();
  });
});

@Component({
  imports: [ToastComponent, NeuralToastTemplateDirective],
  template: `
    <neural-toast>
      <ng-template
        neuralToastTemplate
        let-message
        let-dismiss="dismiss"
        let-paused="paused"
      >
        <span class="custom-template"
          >{{ message.message }} / {{ paused }}</span
        >
        <button class="custom-dismiss" type="button" (click)="dismiss()">
          Done
        </button>
      </ng-template>
    </neural-toast>
  `,
})
class CustomToastHost {}

describe('NeuralToastTemplateDirective', () => {
  it('provides a type-safe custom message and dismiss context', () => {
    TestBed.configureTestingModule({
      imports: [CustomToastHost],
      providers: [provideNeuralMessages({ defaultDuration: null })],
    });
    const service = TestBed.inject(NeuralMessageService);
    const ref = service.notify({ message: 'Custom content' });
    const fixture = TestBed.createComponent(CustomToastHost);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.custom-template').textContent,
    ).toContain('Custom content / false');
    expect(
      fixture.nativeElement.querySelector('.neural-toast-icon'),
    ).toBeNull();
    fixture.nativeElement.querySelector('.custom-dismiss').click();
    expect(ref.closeReason()).toBe('user');
  });
});

function pointerEvent(type: string, clientX: number): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    pointerId: { value: 1 },
    pointerType: { value: 'touch' },
    button: { value: 0 },
    clientX: { value: clientX },
    clientY: { value: 0 },
  });
  return event;
}
