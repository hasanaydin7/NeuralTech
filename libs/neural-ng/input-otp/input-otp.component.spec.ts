import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { provideNeuralNg } from '../src/neural-ng.config';
import { provideNeuralLocale } from '../src/neural-locale';
import { NeuralInputOtp } from './input-otp.component';
import type { NeuralInputOtpCompleteEvent } from './input-otp.types';

@Component({
  imports: [NeuralInputOtp],
  template: `
    <neural-input-otp
      inputOtpId="verification-code"
      [length]="4"
      separator="-"
      [(value)]="code"
      [unstyled]="unstyled()"
      (complete)="completed.push($event)"
      (touch)="touches.update((count) => count + 1)"
    />
  `,
})
class Host {
  readonly code = signal('');
  readonly unstyled = signal(false);
  readonly touches = signal(0);
  readonly completed: NeuralInputOtpCompleteEvent[] = [];
}

@Component({
  imports: [FormField, FormsModule, NeuralInputOtp, ReactiveFormsModule],
  template: `
    <neural-input-otp [formControl]="reactiveCode" />
    <neural-input-otp name="templateCode" [(ngModel)]="templateCode" />
    <neural-input-otp [formField]="otpForm.code" />
  `,
})
class FormsHost {
  readonly reactiveCode = new FormControl('123456', { nonNullable: true });
  templateCode = '234567';
  readonly model = signal({ code: '345678' });
  readonly otpForm = form(this.model);
}

describe('NeuralInputOtp', () => {
  async function createHost(globalUnstyled = false) {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideNeuralNg({ unstyled: globalUnstyled })],
    }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders one accessible native input per character', async () => {
    const fixture = await createHost();
    const group = fixture.nativeElement.querySelector('[role="group"]');
    const inputs = fixture.nativeElement.querySelectorAll(
      'input:not([type="hidden"])',
    ) as NodeListOf<HTMLInputElement>;

    expect(group.getAttribute('aria-label')).toBe('One-time verification code');
    expect(inputs).toHaveLength(4);
    expect(inputs[0]?.inputMode).toBe('numeric');
    expect(inputs[0]?.autocomplete).toBe('one-time-code');
    expect(inputs[1]?.autocomplete).toBe('off');
    expect(inputs[0]?.getAttribute('aria-label')).toBe('Character 1 of 4');
    expect(
      fixture.nativeElement.querySelectorAll('[aria-hidden="true"]'),
    ).toHaveLength(3);
  });

  it('sanitizes numeric entry, advances, and emits complete once filled', async () => {
    const fixture = await createHost();
    const inputs = fixture.nativeElement.querySelectorAll(
      'input:not([type="hidden"])',
    ) as NodeListOf<HTMLInputElement>;

    const firstInput = requireInput(inputs, 0);
    firstInput.value = 'a1';
    firstInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.code()).toBe('1');

    const component = fixture.debugElement.children[0]
      .componentInstance as NeuralInputOtp;
    let prevented = false;
    component.handlePaste(
      {
        clipboardData: { getData: () => '2 3-4' },
        preventDefault: () => (prevented = true),
      } as unknown as ClipboardEvent,
      1,
    );
    fixture.detectChanges();

    expect(prevented).toBe(true);
    expect(fixture.componentInstance.code()).toBe('1234');
    const events = fixture.componentInstance.completed;
    expect(events[events.length - 1]?.value).toBe('1234');
  });

  it('preserves later cells when a middle character is deleted', async () => {
    const fixture = await createHost();
    fixture.componentInstance.code.set('1234');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const inputs = fixture.nativeElement.querySelectorAll(
      'input:not([type="hidden"])',
    ) as NodeListOf<HTMLInputElement>;
    requireInput(inputs, 1).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Delete' }),
    );
    fixture.detectChanges();

    expect(Array.from(inputs, (input) => input.value)).toEqual([
      '1',
      '',
      '3',
      '4',
    ]);
    expect(fixture.componentInstance.code()).toBe('134');
  });

  it('emits touch only when focus leaves the complete group', async () => {
    const fixture = await createHost();
    const group = fixture.nativeElement.querySelector(
      '.neural-input-otp-group-root',
    ) as HTMLElement;
    const inputs = fixture.nativeElement.querySelectorAll(
      'input:not([type="hidden"])',
    ) as NodeListOf<HTMLInputElement>;

    group.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: inputs[1] }),
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.touches()).toBe(0);

    group.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: null }),
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.touches()).toBe(1);
  });

  it('keeps structural hooks while global unstyled removes visual classes', async () => {
    const fixture = await createHost(true);
    const root = fixture.nativeElement.querySelector('.neural-input-otp-root');
    const input = fixture.nativeElement.querySelector(
      '.neural-input-otp-input-root',
    );
    expect(root.classList.contains('neural-input-otp-base')).toBe(false);
    expect(input.classList.contains('neural-input-otp-input-base')).toBe(false);
  });

  it('moves through cells in the visual direction for RTL locales', async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideNeuralLocale({ code: 'ar', direction: 'rtl' })],
    }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    const inputs = fixture.nativeElement.querySelectorAll(
      'input:not([type="hidden"])',
    ) as NodeListOf<HTMLInputElement>;

    const secondInput = requireInput(inputs, 1);
    const thirdInput = requireInput(inputs, 2);
    secondInput.focus();
    secondInput.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    );
    expect(document.activeElement).toBe(thirdInput);

    thirdInput.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    expect(document.activeElement).toBe(secondInput);
  });

  it('binds Reactive, template-driven, and Signal Forms through one model', async () => {
    await TestBed.configureTestingModule({
      imports: [FormsHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(FormsHost);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.reactiveCode.setValue('456789');
    fixture.componentInstance.templateCode = '567890';
    fixture.componentInstance.model.set({ code: '678901' });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const groups = fixture.nativeElement.querySelectorAll(
      '[role="group"]',
    ) as NodeListOf<HTMLElement>;
    const values = Array.from(groups, (group) =>
      Array.from(
        group.querySelectorAll('input:not([type="hidden"])'),
        (input) => (input as HTMLInputElement).value,
      ).join(''),
    );
    expect(values).toEqual(['456789', '567890', '678901']);
  });
});

function requireInput(
  inputs: NodeListOf<HTMLInputElement>,
  index: number,
): HTMLInputElement {
  const input = inputs.item(index);
  if (!input) throw new Error(`Expected OTP input at index ${index}.`);
  return input;
}
