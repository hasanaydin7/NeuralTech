import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralButton } from './button.component';

@Component({
  imports: [NeuralButton],
  template: `
    <neural-button label="Test Button" icon="nt nt-check" iconPosition="end" />
    <neural-button [label]="boundLabel" [icon]="boundIcon" size="small" />
  `,
})
class ButtonConsumerFixture {
  boundLabel = 'Bound Button';
  boundIcon = 'nt nt-sparkles';
}

describe('NeuralButton', () => {
  let fixture: ComponentFixture<NeuralButton>;
  let button: HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuralButton, ButtonConsumerFixture],
    }).compileComponents();

    fixture = TestBed.createComponent(NeuralButton);
    fixture.detectChanges();
    button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  });

  it('exposes stable public API defaults', () => {
    expect(fixture.componentInstance.type()).toBe('button');
    expect(fixture.componentInstance.disabled()).toBe(false);
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.loadingLabel()).toBe('Loading');
    expect(fixture.componentInstance.ariaLabel()).toBeNull();
    expect(fixture.componentInstance.label()).toBeNull();
    expect(fixture.componentInstance.icon()).toBeNull();
    expect(fixture.componentInstance.iconPosition()).toBe('start');
    expect(fixture.componentInstance.size()).toBe('medium');
    expect(fixture.componentInstance.iconSize()).toBeNull();
    expect(fixture.componentInstance.severity()).toBe('neutral');
    expect(button.classList).toContain('neural-btn-neutral-base');
    expect(fixture.componentInstance.outlined()).toBe(false);
    expect(fixture.componentInstance.raised()).toBe(false);
    expect(fixture.componentInstance.text()).toBe(false);
    expect(fixture.componentInstance.rounded()).toBe(false);
    expect(fixture.componentInstance.badge()).toBeNull();
    expect(fixture.componentInstance.badgePosition()).toBe('end');
    expect(fixture.componentInstance.badgeSeverity()).toBe('neutral');
    expect(fixture.componentInstance.badgeSize()).toBe('small');
    expect(fixture.componentInstance.badgeMax()).toBeNull();
    expect(fixture.componentInstance.badgeAriaLabel()).toBeNull();
    expect(fixture.componentInstance.badgeClass()).toBe('');
    expect(fixture.componentInstance.buttonClass()).toBe('');
    expect(fixture.componentInstance.unstyled()).toBe(false);
  });

  it('renders a native, keyboard-focusable button with a safe default type', () => {
    expect(button.type).toBe('button');
    expect(button.tabIndex).toBe(0);
    expect(button.hasAttribute('role')).toBe(false);
    expect(button.classList.contains('neural-btn-root')).toBe(true);
    expect(button.classList.contains('neural-btn-base')).toBe(true);
  });

  it('applies consumer classes with the structural and component classes', () => {
    fixture.componentRef.setInput('buttonClass', 'consumer-one consumer-two');
    fixture.componentRef.setInput('classes', {
      root: 'typed-root',
      icon: 'typed-icon',
    });
    fixture.componentRef.setInput('icon', 'nt nt-check');
    fixture.detectChanges();

    expect(button.classList.contains('neural-btn-root')).toBe(true);
    expect(button.classList.contains('neural-btn-base')).toBe(true);
    expect(button.classList.contains('consumer-one')).toBe(true);
    expect(button.classList.contains('consumer-two')).toBe(true);
    expect(button.classList.contains('typed-root')).toBe(true);
    expect(button.querySelector('i')?.classList).toContain('typed-icon');
  });

  it('supports literal and bound label and icon inputs', () => {
    const consumerFixture = TestBed.createComponent(ButtonConsumerFixture);
    consumerFixture.detectChanges();
    const buttons = consumerFixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;

    expect(buttons[0]?.textContent?.trim()).toBe('Test Button');
    expect(buttons[0]?.querySelector('i')).not.toBeNull();
    expect(buttons[0]?.querySelector('i')?.classList).toContain('nt-check');
    expect(buttons[0]?.lastElementChild?.classList).toContain(
      'neural-btn-icon',
    );

    expect(buttons[1]?.textContent?.trim()).toBe('Bound Button');
    expect(buttons[1]?.querySelector('i')?.classList).toContain('nt-sparkles');
    expect(buttons[1]?.classList).toContain('neural-btn-small-base');
  });

  it('exposes an empty projected-content hook for automatic square icon buttons', () => {
    fixture.componentRef.setInput('icon', 'nt nt-settings');
    fixture.componentRef.setInput('ariaLabel', 'Open settings');
    fixture.detectChanges();

    const content = button.querySelector('.neural-btn-content');
    expect(button.querySelector('.neural-btn-icon')).not.toBeNull();
    expect(content).not.toBeNull();
    expect(content?.matches(':empty')).toBe(true);

    fixture.componentRef.setInput('label', '   ');
    fixture.detectChanges();
    expect(button.querySelector('.neural-btn-label')).toBeNull();
    expect(button.querySelector('.neural-btn-content')?.matches(':empty')).toBe(
      true,
    );
  });

  it('applies compact and large size hooks without changing the default API', () => {
    expect(button.classList).not.toContain('neural-btn-small-base');
    expect(button.classList).not.toContain('neural-btn-large-base');

    fixture.componentRef.setInput('size', 'small');
    fixture.detectChanges();
    expect(button.classList).toContain('neural-btn-small-base');

    fixture.componentRef.setInput('size', 'large');
    fixture.detectChanges();
    expect(button.classList).not.toContain('neural-btn-small-base');
    expect(button.classList).toContain('neural-btn-large-base');
  });

  it('inherits icon size from the button and supports an explicit override', () => {
    fixture.componentRef.setInput('icon', 'nt nt-check');
    fixture.componentRef.setInput('size', 'small');
    fixture.detectChanges();

    let icon = button.querySelector('.neural-btn-icon') as HTMLElement;
    expect(icon.classList).toContain('neural-btn-icon-small-base');

    fixture.componentRef.setInput('iconSize', 'large');
    fixture.detectChanges();
    icon = button.querySelector('.neural-btn-icon') as HTMLElement;
    expect(icon.classList).not.toContain('neural-btn-icon-small-base');
    expect(icon.classList).toContain('neural-btn-icon-large-base');

    fixture.componentRef.setInput('unstyled', true);
    fixture.detectChanges();
    icon = button.querySelector('.neural-btn-icon') as HTMLElement;
    expect(icon.classList).not.toContain('neural-btn-icon-large-base');
  });

  it('applies primary and secondary severity classes to the native button', () => {
    fixture.componentRef.setInput('severity', 'primary');
    fixture.detectChanges();
    expect(button.dataset['severity']).toBe('primary');
    expect(button.classList).toContain('neural-btn-primary-base');

    fixture.componentRef.setInput('severity', 'secondary');
    fixture.detectChanges();
    expect(button.dataset['severity']).toBe('secondary');
    expect(button.classList).toContain('neural-btn-secondary-base');
  });

  it('composes outlined, raised, text, and rounded visual hooks', () => {
    fixture.componentRef.setInput('severity', 'primary');
    fixture.componentRef.setInput('outlined', true);
    fixture.componentRef.setInput('raised', true);
    fixture.componentRef.setInput('rounded', true);
    fixture.detectChanges();

    expect(button.dataset['variant']).toBe('outlined');
    expect(button.dataset['raised']).toBe('true');
    expect(button.dataset['rounded']).toBe('true');
    expect(button.classList).toContain('neural-btn-outlined-base');
    expect(button.classList).toContain('neural-btn-raised-base');
    expect(button.classList).toContain('neural-btn-rounded-base');

    fixture.componentRef.setInput('text', true);
    fixture.detectChanges();

    expect(button.dataset['variant']).toBe('text');
    expect(button.classList).toContain('neural-btn-text-base');
    expect(button.classList).not.toContain('neural-btn-outlined-base');
  });

  it('removes variant visual hooks in unstyled mode', () => {
    fixture.componentRef.setInput('outlined', true);
    fixture.componentRef.setInput('raised', true);
    fixture.componentRef.setInput('rounded', true);
    fixture.componentRef.setInput('unstyled', true);
    fixture.detectChanges();

    expect(button.classList).not.toContain('neural-btn-outlined-base');
    expect(button.classList).not.toContain('neural-btn-raised-base');
    expect(button.classList).not.toContain('neural-btn-rounded-base');
  });

  it('updates the native button type through the signal input', () => {
    fixture.componentRef.setInput('type', 'submit');
    fixture.detectChanges();

    expect(button.type).toBe('submit');
  });

  it('emits the original MouseEvent when activated', () => {
    let emittedEvent: MouseEvent | undefined;
    fixture.componentInstance.clicked.subscribe((event) => {
      emittedEvent = event;
    });

    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    button.dispatchEvent(event);

    expect(emittedEvent).toBe(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('removes only the visual component class when unstyled', () => {
    fixture.componentRef.setInput('unstyled', true);
    fixture.componentRef.setInput('buttonClass', 'consumer-button');
    fixture.detectChanges();

    expect(button.classList.contains('neural-btn-root')).toBe(true);
    expect(button.classList.contains('neural-btn-base')).toBe(false);
    expect(button.classList.contains('consumer-button')).toBe(true);
  });

  it('uses native disabled semantics when disabled', () => {
    let clickCount = 0;
    fixture.componentInstance.clicked.subscribe(() => clickCount++);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBe('true');

    button.click();
    expect(clickCount).toBe(0);
  });

  it('exposes an accessible loading state without removing focusability', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('loadingLabel', 'Saving');
    fixture.detectChanges();

    expect(button.disabled).toBe(false);
    expect(button.tabIndex).toBe(0);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(
      button.querySelector('.neural-btn-spinner')?.getAttribute('aria-hidden'),
    ).toBe('true');
    expect(
      button.querySelector('.neural-btn-loading-label')?.textContent?.trim(),
    ).toBe('Saving');
  });

  it('prevents activation while loading', () => {
    let clickCount = 0;
    fixture.componentRef.setInput('loading', true);
    fixture.componentInstance.clicked.subscribe(() => clickCount++);
    fixture.detectChanges();

    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    button.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(clickCount).toBe(0);
  });

  it('restores the interactive state when loading finishes', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();

    expect(button.disabled).toBe(false);
    expect(button.hasAttribute('aria-disabled')).toBe(false);
    expect(button.hasAttribute('aria-busy')).toBe(false);
    expect(button.querySelector('.neural-btn-spinner')).toBeNull();
    expect(button.querySelector('.neural-btn-loading-label')).toBeNull();
  });

  it('forwards an explicit accessible label to the native button', () => {
    fixture.componentRef.setInput('ariaLabel', 'Close dialog');
    fixture.detectChanges();

    expect(button.getAttribute('aria-label')).toBe('Close dialog');
  });

  it('uses the visible loading label as the accessible name while loading', () => {
    fixture.componentRef.setInput('ariaLabel', 'Save changes');
    fixture.componentRef.setInput('loadingLabel', 'Saving');
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    expect(button.getAttribute('aria-label')).toBe('Saving');
  });

  it('renders zero and numeric badges at the logical end by default', () => {
    fixture.componentRef.setInput('badge', 0);
    fixture.componentRef.setInput('badgeSeverity', 'info');
    fixture.detectChanges();

    const badgeHost = button.querySelector('neural-badge') as HTMLElement;
    const badge = badgeHost.querySelector('.neural-badge-root') as HTMLElement;
    expect(badgeHost.classList).toContain('neural-btn-badge-end');
    expect(badge.textContent?.trim()).toBe('0');
    expect(badge.dataset['severity']).toBe('info');
    expect(badge.dataset['size']).toBe('small');
  });

  it('renders capped badges before projected content when positioned at start', () => {
    fixture.componentRef.setInput('badge', 128);
    fixture.componentRef.setInput('badgeMax', 99);
    fixture.componentRef.setInput('badgePosition', 'start');
    fixture.componentRef.setInput('badgeClass', 'consumer-badge');
    fixture.detectChanges();

    const badgeHost = button.querySelector('neural-badge') as HTMLElement;
    const badge = badgeHost.querySelector('.neural-badge-root') as HTMLElement;
    expect(badgeHost.classList).toContain('neural-btn-badge-start');
    expect(badge.textContent?.trim()).toBe('99+');
    expect(badge.getAttribute('aria-label')).toBe('128');
    expect(badge.classList).toContain('consumer-badge');
  });

  it('removes the nested Badge visual layer when Button is unstyled', () => {
    fixture.componentRef.setInput('badge', 'New');
    fixture.componentRef.setInput('unstyled', true);
    fixture.detectChanges();

    const badge = button.querySelector('.neural-badge-root') as HTMLElement;
    expect(badge.classList).toContain('neural-badge-root');
    expect(badge.classList).not.toContain('neural-badge-base');
  });

  it('replaces the badge together with normal content while loading', () => {
    fixture.componentRef.setInput('badge', 4);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    expect(button.querySelector('neural-badge')).toBeNull();
    expect(button.querySelector('.neural-btn-loading-label')).toBeTruthy();
  });

  it('maps every corner position to a logical overlay class', () => {
    fixture.componentRef.setInput('badge', 7);

    for (const position of [
      'top-start',
      'top-end',
      'bottom-start',
      'bottom-end',
    ] as const) {
      fixture.componentRef.setInput('badgePosition', position);
      fixture.detectChanges();
      const badgeHost = button.querySelector('neural-badge') as HTMLElement;

      expect(badgeHost.classList).toContain('neural-btn-badge-overlay');
      expect(badgeHost.classList).toContain(`neural-btn-badge-${position}`);
    }
  });
});

describe('NeuralButton global configuration', () => {
  it('inherits global unstyled mode', () => {
    TestBed.configureTestingModule({
      imports: [NeuralButton],
      providers: [provideNeuralNg({ unstyled: true })],
    });
    const fixture = TestBed.createComponent(NeuralButton);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;

    expect(button.classList).toContain('neural-btn-root');
    expect(button.classList).not.toContain('neural-btn-base');
  });
});
