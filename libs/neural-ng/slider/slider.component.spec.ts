import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralSlider } from './slider.component';

@Component({
  imports: [NeuralSlider],
  template: `<neural-slider
    min="10"
    max="50"
    step="5"
    [(value)]="value"
    showValue
    [unstyled]="unstyled()"
    (touch)="touches.update(v => v + 1)"
  />`,
})
class Host {
  readonly value = signal(20);
  readonly unstyled = signal(false);
  readonly touches = signal(0);
}

@Component({
  imports: [FormField, FormsModule, ReactiveFormsModule, NeuralSlider],
  template: `<neural-slider [formControl]="reactive" /><neural-slider
      name="template"
      [(ngModel)]="template"
    /><neural-slider [formField]="sliderForm.level" />`,
})
class FormsHost {
  readonly reactive = new FormControl(10, { nonNullable: true });
  template = 20;
  readonly state = signal({ level: 30 });
  readonly sliderForm = form(this.state);
}

describe('NeuralSlider', () => {
  async function createHost(globalUnstyled = false) {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideNeuralNg({ unstyled: globalUnstyled })],
    }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }
  it('uses native range semantics and updates its number model', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    expect(input.type).toBe('range');
    expect(input.min).toBe('10');
    expect(input.max).toBe('50');
    expect(input.step).toBe('5');
    input.value = '35';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(35);
    expect(
      fixture.nativeElement.querySelector('output').textContent.trim(),
    ).toBe('35');
    input.dispatchEvent(new FocusEvent('blur'));
    expect(fixture.componentInstance.touches()).toBe(1);
  });
  it('keeps structural hooks in global unstyled mode', async () => {
    const fixture = await createHost(true);
    const input = fixture.nativeElement.querySelector('input');
    expect(input.classList.contains('neural-slider-input-root')).toBe(true);
    expect(input.classList.contains('neural-slider-input-base')).toBe(false);
  });
  it('binds all three Angular Forms APIs', async () => {
    await TestBed.configureTestingModule({
      imports: [FormsHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(FormsHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.reactive.setValue(40);
    fixture.componentInstance.template = 50;
    fixture.componentInstance.state.set({ level: 60 });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(
      Array.from(fixture.nativeElement.querySelectorAll('input'), (item) =>
        Number((item as HTMLInputElement).value),
      ),
    ).toEqual([40, 50, 60]);
  });

  it('renders two distinctly described native thumbs in range mode', async () => {
    await TestBed.configureTestingModule({
      providers: [provideNeuralNg()],
    }).compileComponents();
    const fixture = TestBed.createComponent(NeuralSlider);
    fixture.componentRef.setInput('range', true);
    fixture.componentRef.setInput('value', [20, 80]);
    fixture.componentRef.setInput('rangeStartAriaLabel', 'Minimum budget');
    fixture.componentRef.setInput('rangeEndAriaLabel', 'Maximum budget');
    fixture.componentRef.setInput('rangeStartAriaValueText', 'Twenty euros');
    fixture.componentRef.setInput('rangeEndAriaValueText', 'Eighty euros');
    fixture.detectChanges();
    const inputs = Array.from(
      fixture.nativeElement.querySelectorAll('input'),
    ) as HTMLInputElement[];

    expect(inputs).toHaveLength(2);
    expect(inputs[0]?.getAttribute('aria-label')).toBe('Minimum budget');
    expect(inputs[1]?.getAttribute('aria-label')).toBe('Maximum budget');
    expect(inputs[0]?.getAttribute('aria-valuetext')).toBe('Twenty euros');
    expect(inputs[1]?.getAttribute('aria-valuetext')).toBe('Eighty euros');
  });

  it('maps range track clicks from the logical start in RTL', async () => {
    await TestBed.configureTestingModule({
      providers: [provideNeuralNg()],
    }).compileComponents();
    const fixture = TestBed.createComponent(NeuralSlider);
    fixture.componentRef.setInput('range', true);
    fixture.componentRef.setInput('value', [20, 80]);
    fixture.detectChanges();
    const range = fixture.nativeElement.querySelector(
      '.neural-slider-range-root',
    ) as HTMLElement;
    range.dir = 'rtl';
    range.getBoundingClientRect = () =>
      ({
        left: 0,
        right: 100,
        top: 0,
        bottom: 20,
        width: 100,
        height: 20,
      }) as DOMRect;

    range.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        button: 0,
        clientX: 90,
        clientY: 10,
        isPrimary: true,
      }),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.rangeValue()).toEqual([10, 80]);
  });

  it('keeps the generated numeric range label readable in RTL', async () => {
    await TestBed.configureTestingModule({
      providers: [provideNeuralNg()],
    }).compileComponents();
    const fixture = TestBed.createComponent(NeuralSlider);
    fixture.componentRef.setInput('range', true);
    fixture.componentRef.setInput('value', [16, 68]);
    fixture.componentRef.setInput('showValue', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const output = fixture.nativeElement.querySelector('output');

    expect(output.getAttribute('dir')).toBe('ltr');
    expect(output.textContent.trim()).toBe('16 \u2013 68');
  });
});
