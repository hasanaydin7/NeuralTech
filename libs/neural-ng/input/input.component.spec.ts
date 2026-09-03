import { Component, ViewChild, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralInputGroup } from './input-group.component';
import { NeuralInput } from './input.component';

@Component({
  imports: [NeuralInput],
  template: `
    <label for="email">Email</label>
    <input
      #control="neuralInput"
      neuralInput
      id="email"
      name="email"
      type="email"
      class="consumer-class"
      placeholder="name@example.com"
      size="24"
      [fluid]="fluid()"
      [unstyled]="unstyled()"
      [inputSize]="inputSize()"
      [variant]="variant()"
      [classes]="{ root: 'typed-input' }"
      [disabled]="disabled()"
      [readOnly]="readonly()"
      [attr.aria-invalid]="invalid()"
      aria-describedby="email-help"
    />
    <span id="email-help">Use a work address.</span>
  `,
})
class InputTestHost {
  @ViewChild('control', { static: true }) control!: NeuralInput;
  readonly fluid = signal(false);
  readonly unstyled = signal(false);
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly invalid = signal(false);
  readonly inputSize = signal<'small' | 'medium' | 'large'>('medium');
  readonly variant = signal<'outlined' | 'filled'>('outlined');
}

@Component({
  imports: [NeuralInput, ReactiveFormsModule],
  template: `<input neuralInput type="text" [formControl]="control" />`,
})
class ReactiveInputTestHost {
  readonly control = new FormControl('Signals', { nonNullable: true });
}

@Component({
  imports: [FormsModule, NeuralInput],
  template: `<input neuralInput type="text" [(ngModel)]="value" />`,
})
class TemplateInputTestHost {
  value = 'Angular';
}

@Component({
  imports: [NeuralInput, NeuralInputGroup],
  template: `
    <neural-input-group
      startIcon="nt nt-search"
      endIcon="nt nt-user"
      fluid
      inputGroupClass="consumer-group"
      iconClass="consumer-icon"
      [classes]="{
        root: 'typed-group',
        startIcon: 'typed-start',
        endIcon: 'typed-end',
      }"
    >
      <input neuralInput aria-label="Search users" />
    </neural-input-group>
  `,
})
class InputIconTestHost {}

describe('NeuralInput', () => {
  async function createHost(
    providers: ReturnType<typeof provideNeuralNg>[] = [],
  ) {
    await TestBed.configureTestingModule({
      imports: [InputTestHost],
      providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(InputTestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('enhances a native input without replacing its semantics', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.type).toBe('email');
    expect(input.name).toBe('email');
    expect(input.size).toBe(24);
    expect(input.labels?.[0]?.textContent).toBe('Email');
    expect(input.getAttribute('aria-describedby')).toBe('email-help');
    expect(input.classList).toContain('consumer-class');
    expect(input.classList).toContain('neural-input-root');
    expect(input.classList).toContain('neural-input-base');
    expect(input.classList).toContain('typed-input');
  });

  it('supports visual sizes without consuming the native size attribute', async () => {
    const fixture = await createHost();
    fixture.componentInstance.inputSize.set('small');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.size).toBe(24);
    expect(input.dataset['size']).toBe('small');
    expect(input.classList).toContain('neural-input-small-base');

    fixture.componentInstance.inputSize.set('large');
    fixture.detectChanges();
    expect(input.dataset['size']).toBe('large');
    expect(input.classList).toContain('neural-input-large-base');
    expect(input.classList).not.toContain('neural-input-small-base');
  });

  it('applies the filled visual variant without changing native semantics', async () => {
    const fixture = await createHost();
    fixture.componentInstance.variant.set('filled');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.dataset['variant']).toBe('filled');
    expect(input.classList).toContain('neural-input-filled-base');
    expect(input.type).toBe('email');
  });

  it('reflects native states and the fluid visual option', async () => {
    const fixture = await createHost();
    fixture.componentInstance.fluid.set(true);
    fixture.componentInstance.disabled.set(true);
    fixture.componentInstance.readonly.set(true);
    fixture.componentInstance.invalid.set(true);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.disabled).toBe(true);
    expect(input.readOnly).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.classList).toContain('neural-input-fluid-base');
  });

  it('keeps structural and consumer classes in local unstyled mode', async () => {
    const fixture = await createHost();
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.classList).toContain('neural-input-root');
    expect(input.classList).toContain('consumer-class');
    expect(input.classList).not.toContain('neural-input-base');
    expect(input.dataset['size']).toBe('medium');
    expect(input.dataset['variant']).toBe('outlined');
  });

  it('inherits global unstyled mode', async () => {
    const fixture = await createHost([provideNeuralNg({ unstyled: true })]);
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.classList).toContain('neural-input-root');
    expect(input.classList).not.toContain('neural-input-base');
  });

  it('exposes native focus and select methods', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    input.value = 'select me';
    const select = vi.spyOn(input, 'select');

    fixture.componentInstance.control.focus();
    expect(document.activeElement).toBe(input);
    fixture.componentInstance.control.select();
    expect(select).toHaveBeenCalledOnce();
  });

  it('works directly with Reactive Forms', async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveInputTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(ReactiveInputTestHost);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.value).toBe('Signals');
    fixture.componentInstance.control.setValue('Signal Forms');
    fixture.detectChanges();
    expect(input.value).toBe('Signal Forms');

    input.value = 'NeuralNg';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.control.value).toBe('NeuralNg');
  });

  it('works directly with template-driven Forms', async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateInputTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(TemplateInputTestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.value).toBe('Angular');
    input.value = 'NeuralNg';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.value).toBe('NeuralNg');
  });

  it('composes start and end icons without replacing the native input', async () => {
    await TestBed.configureTestingModule({
      imports: [InputIconTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(InputIconTestHost);
    fixture.detectChanges();

    const group = fixture.nativeElement.querySelector(
      '.neural-input-group-root',
    ) as HTMLElement;
    const input = group.querySelector('input') as HTMLInputElement;
    const icons = group.querySelectorAll('i');

    expect(group.classList).toContain('neural-input-group-base');
    expect(group.classList).toContain('neural-input-group-fluid-base');
    expect(group.classList).toContain('consumer-group');
    expect(group.classList).toContain('typed-group');
    expect(input.classList).toContain('neural-input-root');
    expect(input.getAttribute('aria-label')).toBe('Search users');
    expect(icons).toHaveLength(2);
    expect(icons[0]?.classList).toContain('nt-search');
    expect(icons[0]?.classList).toContain('consumer-icon');
    expect(icons[0]?.classList).toContain('typed-start');
    expect(icons[1]?.classList).toContain('nt-user');
    expect(icons[1]?.classList).toContain('typed-end');
    expect(icons[0]?.getAttribute('aria-hidden')).toBe('true');
  });
});
