import { Component, ViewChild, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { FieldComponent } from '../field/field.component';
import { neuralTr } from '../locales/tr';
import { NeuralLocaleService } from '../src/neural-locale';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralInputNumber } from './input-number.component';

@Component({
  imports: [NeuralInputNumber],
  template: `
    <neural-input-number
      #control
      inputId="quantity"
      name="quantity"
      ariaLabel="Quantity"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [mode]="mode()"
      [currency]="currency()"
      [showButtons]="showButtons()"
      [unstyled]="unstyled()"
      [prefix]="prefix()"
      [suffix]="suffix()"
      [autocomplete]="autocomplete()"
      [inputMode]="inputMode()"
      [decrementIconClass]="decrementIconClass()"
      [incrementIconClass]="incrementIconClass()"
      [(value)]="value"
      (valueCommit)="commits.push($event)"
    />
  `,
})
class InputNumberTestHost {
  @ViewChild('control', { static: true }) control!: NeuralInputNumber;
  readonly value = signal<number | null>(1234.5);
  readonly min = signal<number | undefined>(undefined);
  readonly max = signal<number | undefined>(undefined);
  readonly step = signal(1);
  readonly mode = signal<'decimal' | 'currency'>('decimal');
  readonly currency = signal('TRY');
  readonly showButtons = signal(true);
  readonly unstyled = signal(false);
  readonly prefix = signal('');
  readonly suffix = signal('');
  readonly autocomplete = signal('off');
  readonly inputMode = signal('decimal');
  readonly decrementIconClass = signal('');
  readonly incrementIconClass = signal('');
  readonly commits: unknown[] = [];
}

@Component({
  imports: [FieldComponent, NeuralInputNumber],
  template: `
    <neural-field
      controlId="price"
      required
      disabled
      invalid
      fluid
      describedBy="price-help"
    >
      <neural-input-number />
    </neural-field>
  `,
})
class InputNumberFieldHost {}

@Component({
  imports: [FormField, FormsModule, NeuralInputNumber, ReactiveFormsModule],
  template: `
    <neural-input-number [formControl]="reactiveValue" />
    <neural-input-number name="templateValue" [(ngModel)]="templateValue" />
    <neural-input-number [formField]="numberForm.amount" />
  `,
})
class InputNumberFormsHost {
  readonly reactiveValue = new FormControl<number | null>(12.5);
  templateValue: number | null = 25.5;
  readonly model = signal<{ amount: number | null }>({ amount: 50.5 });
  readonly numberForm = form(this.model);
}

describe('NeuralInputNumber', () => {
  async function createHost(
    providers: ReturnType<typeof provideNeuralNg>[] = [],
  ) {
    await TestBed.configureTestingModule({
      imports: [InputNumberTestHost],
      providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(InputNumberTestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('uses an accessible spinbutton with labelled native controls', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    const buttons = fixture.nativeElement.querySelectorAll('button');

    expect(input.type).toBe('text');
    expect(input.getAttribute('role')).toBe('spinbutton');
    expect(input.inputMode).toBe('decimal');
    expect(input.id).toBe('quantity');
    expect(input.name).toBe('quantity');
    expect(input.getAttribute('aria-label')).toBe('Quantity');
    expect(input.getAttribute('aria-valuenow')).toBe('1234.5');
    expect(buttons[0].getAttribute('aria-label')).toBe('Decrease value');
    expect(buttons[1].getAttribute('aria-label')).toBe('Increase value');
  });

  it('formats and parses with the active locale', async () => {
    const fixture = await createHost([provideNeuralNg({ locale: neuralTr })]);
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.value).toBe('1.234,5');
    input.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    input.value = '1.234,75';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe(1234.75);
  });

  it('switches formatting at runtime through the locale signal', async () => {
    const fixture = await createHost();
    const locale = TestBed.inject(NeuralLocaleService);
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.value).toBe('1,234.5');
    locale.use(neuralTr);
    fixture.detectChanges();
    expect(input.value).toBe('1.234,5');
  });

  it('steps decimal values without floating point drift', async () => {
    const fixture = await createHost();
    fixture.componentInstance.value.set(0.2);
    fixture.componentInstance.step.set(0.1);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe(0.3);
    expect(fixture.componentInstance.commits).toEqual([
      { value: 0.3, previousValue: 0.2, source: 'keyboard' },
    ]);
  });

  it('clamps values on blur and supports bounded Home and End', async () => {
    const fixture = await createHost();
    fixture.componentInstance.min.set(0);
    fixture.componentInstance.max.set(10);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    input.dispatchEvent(new FocusEvent('focus'));
    input.value = '25';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(10);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(0);
  });

  it('rejects letters without changing the draft or numeric model', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    input.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(input.value).toBe('1234.5');

    input.value = '1234.5jj';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe(1234.5);
    expect(input.value).toBe('1234.5');
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('allows partial numeric editing and validates it on commit', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    input.dispatchEvent(new FocusEvent('focus'));
    input.value = '-';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(input.value).toBe('-');
    expect(input.getAttribute('aria-invalid')).toBeNull();

    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.componentInstance.value()).toBe(1234.5);
  });

  it('formats currency without storing a formatted string', async () => {
    const fixture = await createHost([provideNeuralNg({ locale: neuralTr })]);
    fixture.componentInstance.mode.set('currency');
    fixture.componentInstance.currency.set('TRY');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.value).toContain('₺');
    expect(fixture.componentInstance.value()).toBe(1234.5);
  });

  it('keeps structural and consumer classes in unstyled mode', async () => {
    const fixture = await createHost();
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-input-number-root',
    ) as HTMLElement;

    expect(root.classList).toContain('neural-input-number-root');
    expect(root.classList).not.toContain('neural-input-number-base');
  });

  it('inherits id, state, description, and fluid layout from Field', async () => {
    await TestBed.configureTestingModule({
      imports: [InputNumberFieldHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(InputNumberFieldHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    expect(input.id).toBe('price');
    expect(input.disabled).toBe(true);
    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('price-help');
    expect(
      fixture.nativeElement
        .querySelector('.neural-input-number-root')
        .classList.contains('neural-input-number-fluid-base'),
    ).toBe(true);
  });

  it('supports prefix, suffix, local input hints, custom icons, and bounded buttons', async () => {
    const fixture = await createHost();
    const host = fixture.componentInstance;
    host.value.set(100);
    host.min.set(0);
    host.max.set(100);
    host.prefix.set('~');
    host.suffix.set(' kg');
    host.autocomplete.set('off');
    host.inputMode.set('numeric');
    host.decrementIconClass.set('nt nt-minus');
    host.incrementIconClass.set('nt nt-plus');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(input.value).toBe('~100 kg');
    expect(input.inputMode).toBe('numeric');
    expect(buttons[0].querySelector('.nt-minus')).not.toBeNull();
    expect(buttons[1].querySelector('.nt-plus')).not.toBeNull();
    expect(buttons[1].disabled).toBe(true);
  });

  it('binds Reactive, template-driven, and Signal Forms through one numeric model', async () => {
    await TestBed.configureTestingModule({
      imports: [InputNumberFormsHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(InputNumberFormsHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const values = Array.from(
      fixture.nativeElement.querySelectorAll('input'),
      (input) => (input as HTMLInputElement).value,
    );
    expect(values).toEqual(['12.5', '25.5', '50.5']);
  });
});
