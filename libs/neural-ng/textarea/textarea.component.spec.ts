import { Component, ViewChild, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FieldComponent,
  FieldErrorDirective,
  FieldHintDirective,
} from '../field/field.component';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralTextarea } from './textarea.component';
import type { NeuralTextareaResizeMode } from './textarea.types';

@Component({
  imports: [NeuralTextarea],
  template: `
    <label for="message">Message</label>
    <textarea
      #control="neuralTextarea"
      neuralTextarea
      id="message"
      name="message"
      rows="5"
      maxlength="240"
      class="consumer-class"
      placeholder="Write a message"
      [fluid]="fluid()"
      [unstyled]="unstyled()"
      [autoResize]="autoResize()"
      [resizeMode]="resizeMode()"
      [classes]="{ root: 'typed-textarea' }"
      [disabled]="disabled()"
      [readOnly]="readonly()"
      [attr.aria-invalid]="invalid()"
      aria-describedby="message-help"
    ></textarea>
    <span id="message-help">Maximum 240 characters.</span>
  `,
})
class TextareaTestHost {
  @ViewChild('control', { static: true }) control!: NeuralTextarea;
  readonly fluid = signal(false);
  readonly unstyled = signal(false);
  readonly autoResize = signal(false);
  readonly resizeMode = signal<NeuralTextareaResizeMode>('vertical');
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly invalid = signal(false);
}

@Component({
  imports: [
    FieldComponent,
    FieldErrorDirective,
    FieldHintDirective,
    NeuralTextarea,
  ],
  template: `
    <neural-field
      controlId="biography"
      describedBy="external"
      required
      invalid
      readonly
      fluid
    >
      <textarea neuralTextarea></textarea>
      <small neuralFieldHint>Describe your work.</small>
      <small neuralFieldError>Biography is required.</small>
    </neural-field>
  `,
})
class TextareaFieldHost {}

describe('NeuralTextarea', () => {
  async function createHost(
    providers: ReturnType<typeof provideNeuralNg>[] = [],
  ) {
    await TestBed.configureTestingModule({
      imports: [TextareaTestHost],
      providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(TextareaTestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('enhances a native textarea without replacing its semantics', async () => {
    const fixture = await createHost();
    const textarea = fixture.nativeElement.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;

    expect(textarea.name).toBe('message');
    expect(Number(textarea.rows)).toBe(5);
    expect(Number(textarea.maxLength)).toBe(240);
    expect(textarea.labels?.[0]?.textContent).toBe('Message');
    expect(textarea.getAttribute('aria-describedby')).toBe('message-help');
    expect(textarea.classList).toContain('consumer-class');
    expect(textarea.classList).toContain('neural-textarea-root');
    expect(textarea.classList).toContain('neural-textarea-base');
    expect(textarea.classList).toContain('typed-textarea');
  });

  it('switches resize modes without JavaScript measurement', async () => {
    const fixture = await createHost();
    const textarea = fixture.nativeElement.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;

    expect(textarea.dataset['resizeMode']).toBe('vertical');
    expect(textarea.classList).toContain(
      'neural-textarea-resize-vertical-base',
    );

    fixture.componentInstance.resizeMode.set('none');
    fixture.detectChanges();
    expect(textarea.dataset['resizeMode']).toBe('none');
    expect(textarea.classList).toContain('neural-textarea-resize-none-base');
  });

  it('uses native field-sizing for optional auto resize', async () => {
    const fixture = await createHost();
    fixture.componentInstance.autoResize.set(true);
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;

    expect(textarea.dataset['autoResize']).toBe('true');
    expect(textarea.dataset['resizeMode']).toBe('none');
    expect(textarea.classList).toContain('neural-textarea-auto-resize-base');
    expect(textarea.classList).not.toContain(
      'neural-textarea-resize-vertical-base',
    );
  });

  it('reflects native state and fluid presentation', async () => {
    const fixture = await createHost();
    fixture.componentInstance.fluid.set(true);
    fixture.componentInstance.disabled.set(true);
    fixture.componentInstance.readonly.set(true);
    fixture.componentInstance.invalid.set(true);
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;

    expect(textarea.disabled).toBe(true);
    expect(textarea.readOnly).toBe(true);
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(textarea.classList).toContain('neural-textarea-fluid-base');
  });

  it('keeps structural and consumer classes in local unstyled mode', async () => {
    const fixture = await createHost();
    fixture.componentInstance.unstyled.set(true);
    fixture.componentInstance.autoResize.set(true);
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;

    expect(textarea.classList).toContain('neural-textarea-root');
    expect(textarea.classList).toContain('consumer-class');
    expect(textarea.classList).not.toContain('neural-textarea-base');
    expect(textarea.classList).not.toContain(
      'neural-textarea-auto-resize-base',
    );
    expect(textarea.dataset['autoResize']).toBe('true');
  });

  it('inherits global unstyled mode', async () => {
    const fixture = await createHost([provideNeuralNg({ unstyled: true })]);
    const textarea = fixture.nativeElement.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;

    expect(textarea.classList).toContain('neural-textarea-root');
    expect(textarea.classList).not.toContain('neural-textarea-base');
  });

  it('inherits accessible native state and layout from Field', async () => {
    await TestBed.configureTestingModule({
      imports: [TextareaFieldHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(TextareaFieldHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;

    expect(textarea.id).toBe('biography');
    expect(textarea.required).toBe(true);
    expect(textarea.readOnly).toBe(true);
    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(textarea.getAttribute('aria-describedby')).toBe(
      'external biography-hint biography-error',
    );
    expect(textarea.classList).toContain('neural-textarea-fluid-base');
  });

  it('exposes native focus and select methods', async () => {
    const fixture = await createHost();
    const textarea = fixture.nativeElement.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;
    textarea.value = 'select me';
    const select = vi.spyOn(textarea, 'select');

    fixture.componentInstance.control.focus();
    expect(document.activeElement).toBe(textarea);
    fixture.componentInstance.control.select();
    expect(select).toHaveBeenCalledOnce();
  });
});
