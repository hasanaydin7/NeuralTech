import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralPassword, scorePassword } from './password.component';
import type { NeuralPasswordStrengthChange } from './password.types';

@Component({
  imports: [NeuralPassword],
  template: `<neural-password
    passwordId="account-password"
    autocomplete="new-password"
    placeholder="Create a password"
    [(value)]="password"
    [(visible)]="visible"
    showFeedback
    fluid
    [unstyled]="unstyled()"
    (strengthChange)="strengthEvents.push($event)"
    (touch)="touches.update((count) => count + 1)"
  />`,
})
class Host {
  readonly password = signal('');
  readonly visible = signal(false);
  readonly unstyled = signal(false);
  readonly touches = signal(0);
  readonly strengthEvents: NeuralPasswordStrengthChange[] = [];
}

@Component({
  imports: [FormField, FormsModule, NeuralPassword, ReactiveFormsModule],
  template: `
    <neural-password [formControl]="reactivePassword" />
    <neural-password name="templatePassword" [(ngModel)]="templatePassword" />
    <neural-password [formField]="passwordForm.password" />
  `,
})
class FormsHost {
  readonly reactivePassword = new FormControl('reactive', {
    nonNullable: true,
  });
  templatePassword = 'template';
  readonly model = signal({ password: 'signal' });
  readonly passwordForm = form(this.model);
}

describe('NeuralPassword', () => {
  async function createHost(globalUnstyled = false) {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideNeuralNg({ unstyled: globalUnstyled })],
    }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture;
  }

  it('keeps native password semantics and toggles visibility accessibly', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    const toggle = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;

    expect(input.type).toBe('password');
    expect(input.autocomplete).toBe('new-password');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(toggle.querySelector('i')?.classList).toContain('nt-eye');

    toggle.click();
    fixture.detectChanges();
    expect(input.type).toBe('text');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.querySelector('i')?.classList).toContain('nt-eye-off');
    expect(fixture.componentInstance.visible()).toBe(true);
  });

  it('updates the value and exposes deterministic strength feedback', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    input.value = 'Neural!2026Strong';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.password()).toBe('Neural!2026Strong');
    expect(scorePassword('Neural!2026Strong')).toBe(4);
    expect(
      fixture.nativeElement.querySelector('[data-strength]').dataset.strength,
    ).toBe('strong');
    expect(
      fixture.nativeElement.querySelector('[role="progressbar"]'),
    ).not.toBeNull();
    const events = fixture.componentInstance.strengthEvents;
    expect(events[events.length - 1]?.strength).toBe('strong');
  });

  it('emits touch on blur and keeps only structural hooks when unstyled', async () => {
    const fixture = await createHost(true);
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.touches()).toBe(1);
    expect(
      fixture.nativeElement
        .querySelector('.neural-password-root')
        .classList.contains('neural-password-base'),
    ).toBe(false);
  });

  it('binds Reactive, template-driven, and Signal Forms through one value model', async () => {
    await TestBed.configureTestingModule({
      imports: [FormsHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(FormsHost);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.reactivePassword.setValue('reactive-next');
    fixture.componentInstance.templatePassword = 'template-next';
    fixture.componentInstance.model.set({ password: 'signal-next' });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const values = Array.from(
      fixture.nativeElement.querySelectorAll('input'),
      (element) => (element as HTMLInputElement).value,
    );
    expect(values).toEqual(['reactive-next', 'template-next', 'signal-next']);
  });
});
