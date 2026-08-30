import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuralInput } from '../input/input.component';
import { provideNeuralNg } from '../src/neural-ng.config';
import {
  NeuralField,
  NeuralFieldControl,
  NeuralFieldError,
  NeuralFieldHint,
  NeuralFieldLabel,
} from './field.component';

@Component({
  imports: [
    NeuralField,
    NeuralFieldControl,
    NeuralFieldError,
    NeuralFieldHint,
    NeuralFieldLabel,
    NeuralInput,
  ],
  template: `
    <p id="external-note">External context.</p>
    <neural-field
      class="consumer-field"
      controlId=" work email "
      describedBy="external-note"
      [fluid]="fluid()"
      [invalid]="invalid()"
      [required]="required()"
      [pending]="pending()"
      [unstyled]="unstyled()"
    >
      <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -->
      <label neuralFieldLabel class="consumer-label">Work email</label>
      <input neuralInput class="consumer-control" type="email" />
      <small neuralFieldHint>Use a work address.</small>
      @if (showError()) {
        <small neuralFieldError [live]="errorLive()">
          Enter a valid email address.
        </small>
      }
    </neural-field>

    <neural-field
      controlId="native-bio"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [required]="required()"
    >
      <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -->
      <label neuralFieldLabel>Biography</label>
      <textarea neuralFieldControl></textarea>
    </neural-field>
  `,
})
class FieldTestHost {
  readonly fluid = signal(false);
  readonly invalid = signal(false);
  readonly required = signal(false);
  readonly pending = signal(false);
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly unstyled = signal(false);
  readonly showError = signal(false);
  readonly errorLive = signal<'off' | 'polite' | 'assertive'>('polite');
}

describe('NeuralField', () => {
  async function createHost(
    providers: ReturnType<typeof provideNeuralNg>[] = [],
  ) {
    await TestBed.configureTestingModule({
      imports: [FieldTestHost],
      providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(FieldTestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('connects its label, control, and hint with deterministic ids', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    const label = fixture.nativeElement.querySelector(
      'label',
    ) as HTMLLabelElement;
    const hint = fixture.nativeElement.querySelector(
      '[neuralFieldHint]',
    ) as HTMLElement;

    expect(input.id).toBe('work-email');
    expect(label.htmlFor).toBe('work-email');
    expect(input.labels?.[0]).toBe(label);
    expect(hint.id).toBe('work-email-hint');
    expect(input.getAttribute('aria-describedby')).toBe(
      'external-note work-email-hint',
    );
  });

  it('reactively adds and removes accessible validation feedback', async () => {
    const fixture = await createHost();
    const host = fixture.nativeElement.querySelector(
      'neural-field',
    ) as HTMLElement;
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    fixture.componentInstance.invalid.set(true);
    fixture.componentInstance.required.set(true);
    fixture.componentInstance.pending.set(true);
    fixture.componentInstance.showError.set(true);
    fixture.componentInstance.errorLive.set('assertive');
    fixture.detectChanges();
    await fixture.whenStable();

    const error = fixture.nativeElement.querySelector(
      '[neuralFieldError]',
    ) as HTMLElement;
    expect(error.id).toBe('work-email-error');
    expect(error.getAttribute('aria-live')).toBe('assertive');
    expect(input.getAttribute('aria-describedby')).toBe(
      'external-note work-email-hint work-email-error',
    );
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-busy')).toBe('true');
    expect(input.required).toBe(true);
    expect(host.dataset['invalid']).toBe('true');
    expect(host.classList).toContain('neural-field--pending');

    fixture.componentInstance.showError.set(false);
    fixture.componentInstance.invalid.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(input.getAttribute('aria-describedby')).toBe(
      'external-note work-email-hint',
    );
    expect(input.hasAttribute('aria-invalid')).toBe(false);
  });

  it('propagates fluid styling and keeps consumer classes', async () => {
    const fixture = await createHost();
    fixture.componentInstance.fluid.set(true);
    fixture.detectChanges();
    const field = fixture.nativeElement.querySelector(
      'neural-field',
    ) as HTMLElement;
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(field.classList).toContain('consumer-field');
    expect(field.classList).toContain('neural-field-fluid-base');
    expect(input.classList).toContain('consumer-control');
    expect(input.classList).toContain('neural-input-fluid-base');
  });

  it('supports native controls through neuralFieldControl', async () => {
    const fixture = await createHost();
    fixture.componentInstance.disabled.set(true);
    fixture.componentInstance.readonly.set(true);
    fixture.componentInstance.required.set(true);
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;

    expect(textarea.id).toBe('native-bio');
    expect(textarea.disabled).toBe(true);
    expect(textarea.readOnly).toBe(true);
    expect(textarea.required).toBe(true);
    expect(textarea.labels?.[0]?.textContent).toContain('Biography');
  });

  it('removes only visual classes in local unstyled mode', async () => {
    const fixture = await createHost();
    fixture.componentInstance.unstyled.set(true);
    fixture.componentInstance.invalid.set(true);
    fixture.detectChanges();
    const field = fixture.nativeElement.querySelector(
      'neural-field',
    ) as HTMLElement;
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    const label = fixture.nativeElement.querySelector(
      'label',
    ) as HTMLLabelElement;

    expect(field.classList).toContain('neural-field-root');
    expect(field.classList).toContain('neural-field--invalid');
    expect(field.classList).not.toContain('neural-field-base');
    expect(input.classList).toContain('neural-input-root');
    expect(input.classList).not.toContain('neural-input-base');
    expect(label.classList).toContain('consumer-label');
    expect(label.classList).not.toContain('neural-field-label-base');
  });

  it('inherits global unstyled mode across the composition', async () => {
    const fixture = await createHost([provideNeuralNg({ unstyled: true })]);
    const field = fixture.nativeElement.querySelector(
      'neural-field',
    ) as HTMLElement;
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(field.classList).not.toContain('neural-field-base');
    expect(input.classList).not.toContain('neural-input-base');
  });
});
