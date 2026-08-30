import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralDivider } from './divider.component';
import type { NeuralDividerClasses } from './divider.types';

@Component({
  imports: [NeuralDivider],
  template: `
    <neural-divider
      orientation="vertical"
      align="start"
      type="dashed"
      [label]="label"
      ariaLabel="Workspace sections"
      dividerClass="consumer-root"
      [unstyled]="unstyled"
      [classes]="classes"
    >
      <strong>OR</strong>
    </neural-divider>
  `,
})
class DividerHost {
  unstyled = false;
  label: string | null = null;
  classes: NeuralDividerClasses = {
    root: 'slot-root',
    before: 'slot-before',
    content: 'slot-content',
    after: 'slot-after',
  };
}

describe('NeuralDivider', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideNeuralNg()],
    }),
  );

  it('renders a semantic horizontal solid separator by default', () => {
    const fixture = TestBed.createComponent(NeuralDivider);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-divider-root',
    ) as HTMLElement;

    expect(root.getAttribute('role')).toBe('separator');
    expect(root.getAttribute('aria-orientation')).toBe('horizontal');
    expect(root.dataset['align']).toBe('center');
    expect(root.dataset['type']).toBe('solid');
    expect(root.classList).toContain('neural-divider-horizontal-root');
    expect(
      root.querySelector('.neural-divider-before-root')?.classList,
    ).toContain('neural-divider-solid-base');
  });

  it('supports vertical orientation, alignment, type, and projected content', () => {
    const fixture = TestBed.createComponent(DividerHost);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-divider-root',
    ) as HTMLElement;

    expect(root.getAttribute('aria-orientation')).toBe('vertical');
    expect(root.getAttribute('aria-label')).toBe('Workspace sections');
    expect(root.dataset['align']).toBe('start');
    expect(root.classList).toContain('neural-divider-vertical-root');
    expect(root.querySelector('.slot-before')?.classList).toContain(
      'neural-divider-dashed-base',
    );
    expect(root.querySelector('.slot-content')?.textContent).toContain('OR');
  });

  it('prefers label input over projected content', () => {
    const fixture = TestBed.createComponent(DividerHost);
    fixture.componentInstance.label = 'Next';
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.neural-divider-content-root')
        .textContent,
    ).toContain('Next');
    expect(
      fixture.nativeElement.querySelector('.neural-divider-content-root')
        .textContent,
    ).not.toContain('OR');
  });

  it('allows aria-labelledby to own the accessible name', () => {
    const fixture = TestBed.createComponent(NeuralDivider);
    fixture.componentRef.setInput('ariaLabel', 'Ignored');
    fixture.componentRef.setInput('ariaLabelledBy', 'section-title');
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-divider-root',
    ) as HTMLElement;

    expect(root.getAttribute('aria-label')).toBeNull();
    expect(root.getAttribute('aria-labelledby')).toBe('section-title');
  });

  it('retains structural orientation and consumer slots in unstyled mode', () => {
    const fixture = TestBed.createComponent(DividerHost);
    fixture.componentInstance.unstyled = true;
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-divider-root',
    ) as HTMLElement;
    const before = fixture.nativeElement.querySelector(
      '.neural-divider-before-root',
    ) as HTMLElement;
    const content = fixture.nativeElement.querySelector(
      '.neural-divider-content-root',
    ) as HTMLElement;

    expect(root.classList).toContain('neural-divider-vertical-root');
    expect(root.classList).toContain('consumer-root');
    expect(root.classList).toContain('slot-root');
    expect(root.classList).not.toContain('neural-divider-base');
    expect(root.classList).not.toContain('neural-divider-vertical-base');
    expect(before.classList).toContain('slot-before');
    expect(before.classList).not.toContain('neural-divider-line-base');
    expect(before.classList).not.toContain('neural-divider-dashed-base');
    expect(content.classList).toContain('slot-content');
    expect(content.classList).not.toContain('neural-divider-content-base');
  });
});
