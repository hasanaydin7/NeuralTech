import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralButton } from './button.component';
import { NeuralButtonGroup } from './button-group.component';

@Component({
  imports: [NeuralButton, NeuralButtonGroup],
  template: `
    <neural-button-group ariaLabel="Editor history">
      <neural-button label="Undo" />
      <neural-button label="Redo" />
    </neural-button-group>
  `,
})
class ButtonGroupFixture {}

describe('NeuralButtonGroup', () => {
  it('groups projected buttons with native semantics and horizontal styling', () => {
    const fixture = TestBed.createComponent(ButtonGroupFixture);
    fixture.detectChanges();

    const group = fixture.nativeElement.querySelector(
      '[role="group"]',
    ) as HTMLElement;
    expect(group.getAttribute('aria-label')).toBe('Editor history');
    expect(group.dataset['orientation']).toBe('horizontal');
    expect(group.classList).toContain('neural-button-group-root');
    expect(group.classList).toContain('neural-button-group-base');
    expect(group.querySelectorAll('neural-button')).toHaveLength(2);
  });

  it('supports vertical orientation and consumer classes', () => {
    TestBed.configureTestingModule({ imports: [NeuralButtonGroup] });
    const fixture = TestBed.createComponent(NeuralButtonGroup);
    fixture.componentRef.setInput('orientation', 'vertical');
    fixture.componentRef.setInput('groupClass', 'consumer-group');
    fixture.detectChanges();

    const group = fixture.nativeElement.querySelector(
      '[role="group"]',
    ) as HTMLElement;
    expect(group.classList).toContain('neural-button-group-vertical-root');
    expect(group.classList).toContain('consumer-group');
  });

  it('removes only the visual group layer in local and global unstyled mode', () => {
    TestBed.configureTestingModule({
      imports: [NeuralButtonGroup],
      providers: [provideNeuralNg({ unstyled: true })],
    });
    const fixture = TestBed.createComponent(NeuralButtonGroup);
    fixture.detectChanges();

    const group = fixture.nativeElement.querySelector(
      '[role="group"]',
    ) as HTMLElement;
    expect(group.classList).toContain('neural-button-group-root');
    expect(group.classList).not.toContain('neural-button-group-base');
  });
});
