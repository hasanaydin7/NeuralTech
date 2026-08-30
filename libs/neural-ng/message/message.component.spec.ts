import { TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralMessage } from './message.component';

describe('NeuralMessage', () => {
  it('renders an inline accessible message with stable defaults', async () => {
    await TestBed.configureTestingModule({
      imports: [NeuralMessage],
    }).compileComponents();
    const fixture = TestBed.createComponent(NeuralMessage);
    fixture.componentRef.setInput('message', 'Changes saved.');
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(root.getAttribute('role')).toBe('status');
    expect(root.getAttribute('aria-live')).toBe('polite');
    expect(root.classList).toContain('neural-message-info-base');
    expect(root.textContent).toContain('Changes saved.');
  });

  it('uses assertive alert semantics for errors', async () => {
    await TestBed.configureTestingModule({
      imports: [NeuralMessage],
    }).compileComponents();
    const fixture = TestBed.createComponent(NeuralMessage);
    fixture.componentRef.setInput('severity', 'error');
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(root.getAttribute('role')).toBe('alert');
    expect(root.getAttribute('aria-live')).toBe('assertive');
  });

  it('supports variants, sizes and custom icons', async () => {
    await TestBed.configureTestingModule({
      imports: [NeuralMessage],
    }).compileComponents();
    const fixture = TestBed.createComponent(NeuralMessage);
    fixture.componentRef.setInput('variant', 'outlined');
    fixture.componentRef.setInput('size', 'large');
    fixture.componentRef.setInput('iconClass', 'nt nt-lock text-violet-500');
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('section') as HTMLElement;
    const icon = fixture.nativeElement.querySelector('i') as HTMLElement;
    expect(root.classList).toContain('neural-message-outlined-base');
    expect(root.classList).toContain('neural-message-large-base');
    expect(icon.classList).toContain('nt-lock');
    expect(icon.classList).toContain('text-violet-500');
  });

  it('closes through visible model and emits closed once', async () => {
    await TestBed.configureTestingModule({
      imports: [NeuralMessage],
    }).compileComponents();
    const fixture = TestBed.createComponent(NeuralMessage);
    fixture.componentRef.setInput('closable', true);
    let closeCount = 0;
    fixture.componentInstance.closed.subscribe(() => closeCount++);
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector('button') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.visible()).toBe(false);
    expect(closeCount).toBe(1);
    expect(fixture.nativeElement.querySelector('section')).toBeNull();
  });

  it('keeps structural hooks and removes visual classes in global unstyled mode', async () => {
    await TestBed.configureTestingModule({
      imports: [NeuralMessage],
      providers: [provideNeuralNg({ unstyled: true })],
    }).compileComponents();
    const fixture = TestBed.createComponent(NeuralMessage);
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(root.classList).toContain('neural-message-root');
    expect(root.classList).not.toContain('neural-message-base');
    expect(root.classList).not.toContain('neural-message-info-base');
  });
});
