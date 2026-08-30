import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { provideNeuralNg } from '../src/neural-ng.config';
import {
  NeuralInputMask,
  formatNeuralMask,
  unmaskNeuralValue,
} from './input-mask.component';
import type { NeuralInputMaskCompleteEvent } from './input-mask.types';

@Component({
  imports: [NeuralInputMask],
  template: `
    <neural-input-mask
      inputMaskId="phone"
      mask="(999) 999-9999"
      inputMode="tel"
      [(value)]="phone"
      [unmask]="unmask()"
      [clearIncomplete]="clearIncomplete()"
      [unstyled]="unstyled()"
      (complete)="completed.push($event)"
      (incomplete)="incompleted.push($event)"
      (touch)="touches.update((count) => count + 1)"
    />
  `,
})
class Host {
  readonly phone = signal('');
  readonly unmask = signal(false);
  readonly clearIncomplete = signal(false);
  readonly unstyled = signal(false);
  readonly touches = signal(0);
  readonly completed: NeuralInputMaskCompleteEvent[] = [];
  readonly incompleted: NeuralInputMaskCompleteEvent[] = [];
}

@Component({
  imports: [FormField, FormsModule, NeuralInputMask, ReactiveFormsModule],
  template: `
    <neural-input-mask mask="999-999" [formControl]="reactiveValue" />
    <neural-input-mask
      mask="999-999"
      name="templateValue"
      [(ngModel)]="templateValue"
    />
    <neural-input-mask mask="999-999" [formField]="maskForm.code" />
  `,
})
class FormsHost {
  readonly reactiveValue = new FormControl('123-456', { nonNullable: true });
  templateValue = '234-567';
  readonly model = signal({ code: '345-678' });
  readonly maskForm = form(this.model);
}

describe('NeuralInputMask', () => {
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

  it('formats and unmasks values with escaped, numeric, letter, and mixed slots', () => {
    expect(formatNeuralMask('5551234567', '(999) 999-9999')).toBe(
      '(555) 123-4567',
    );
    expect(formatNeuralMask('AB12', 'aa-**-99')).toBe('AB-12-__');
    expect(formatNeuralMask('12', '\\9-99')).toBe('9-12');
    expect(unmaskNeuralValue('(555) 123-4567', '(999) 999-9999')).toBe(
      '5551234567',
    );
  });

  it('shows slots on focus and distributes a pasted value from the caret', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    const component = fixture.debugElement.query(By.directive(NeuralInputMask))
      .componentInstance as NeuralInputMask;

    input.focus();
    fixture.detectChanges();
    expect(input.value).toBe('(___) ___-____');
    input.setSelectionRange(1, 1);
    component.handlePaste({
      clipboardData: { getData: () => '555 123 4567' },
      preventDefault: () => undefined,
    } as unknown as ClipboardEvent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(input.value).toBe('(555) 123-4567');
    expect(fixture.componentInstance.phone()).toBe('(555) 123-4567');
    const events = fixture.componentInstance.completed;
    expect(events[events.length - 1]?.rawValue).toBe('5551234567');
  });

  it('returns raw model values when unmask is enabled', async () => {
    const fixture = await createHost();
    fixture.componentInstance.unmask.set(true);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    const component = fixture.debugElement.query(By.directive(NeuralInputMask))
      .componentInstance as NeuralInputMask;
    input.focus();
    input.setSelectionRange(1, 1);
    component.handlePaste({
      clipboardData: { getData: () => '5551234567' },
      preventDefault: () => undefined,
    } as unknown as ClipboardEvent);
    fixture.detectChanges();

    expect(fixture.componentInstance.phone()).toBe('5551234567');
    expect(input.value).toBe('(555) 123-4567');
  });

  it('deletes one logical slot per key press without jumping across literals', async () => {
    const fixture = await createHost();
    fixture.componentInstance.phone.set('(058) 6');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    const component = fixture.debugElement.query(By.directive(NeuralInputMask))
      .componentInstance as NeuralInputMask;
    input.focus();
    fixture.detectChanges();
    input.setSelectionRange(7, 7);

    component.handleKeydown({
      key: 'Backspace',
      preventDefault: () => undefined,
    } as KeyboardEvent);
    component.handleBeforeInput({
      inputType: 'deleteContentBackward',
      preventDefault: () => undefined,
    } as InputEvent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.phone()).toBe('(058) ');
    expect(input.selectionStart).toBe(6);

    input.setSelectionRange(6, 6);
    component.handleKeydown({
      key: 'Backspace',
      preventDefault: () => undefined,
    } as KeyboardEvent);
    component.handleBeforeInput({
      inputType: 'deleteContentBackward',
      preventDefault: () => undefined,
    } as InputEvent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.phone()).toBe('(05');
    expect(input.selectionStart).toBe(3);
  });

  it('restores the middle caret after rendering and inserts into the cleared slot', async () => {
    const fixture = await createHost();
    fixture.componentInstance.phone.set('(123) 456-7890');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    const component = fixture.debugElement.query(By.directive(NeuralInputMask))
      .componentInstance as NeuralInputMask;
    input.focus();
    input.setSelectionRange(8, 8);

    component.handleKeydown({
      key: 'Backspace',
      preventDefault: () => undefined,
    } as KeyboardEvent);
    component.handleBeforeInput({
      inputType: 'deleteContentBackward',
      preventDefault: () => undefined,
    } as InputEvent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(input.selectionStart).toBe(7);

    component.handleBeforeInput({
      inputType: 'insertText',
      data: '9',
      preventDefault: () => undefined,
    } as InputEvent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.phone()).toBe('(123) 496-7890');
    expect(input.value).toBe('(123) 496-7890');
    expect(input.selectionStart).toBe(8);
  });

  it('emits incomplete on blur or clears an incomplete value by policy', async () => {
    const fixture = await createHost();
    fixture.componentInstance.phone.set('(555) 12');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;

    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.incompleted).toHaveLength(1);
    expect(fixture.componentInstance.touches()).toBe(1);

    fixture.componentInstance.clearIncomplete.set(true);
    fixture.detectChanges();
    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.phone()).toBe('');
  });

  it('keeps structural hooks while global unstyled removes visual classes', async () => {
    const fixture = await createHost(true);
    const root = fixture.nativeElement.querySelector('.neural-input-mask-root');
    const input = fixture.nativeElement.querySelector(
      '.neural-input-mask-input-root',
    );
    expect(root.classList.contains('neural-input-mask-base')).toBe(false);
    expect(input.classList.contains('neural-input-mask-input-base')).toBe(
      false,
    );
  });

  it('binds Reactive, template-driven, and Signal Forms through one model', async () => {
    await TestBed.configureTestingModule({
      imports: [FormsHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(FormsHost);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.reactiveValue.setValue('456-789');
    fixture.componentInstance.templateValue = '567-890';
    fixture.componentInstance.model.set({ code: '678-901' });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const values = Array.from(
      fixture.nativeElement.querySelectorAll('input'),
      (input) => (input as HTMLInputElement).value,
    );
    expect(values).toEqual(['456-789', '567-890', '678-901']);
  });
});
