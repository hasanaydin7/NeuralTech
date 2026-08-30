import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  NeuralToolbar,
  NeuralToolbarCenter,
  NeuralToolbarEnd,
  NeuralToolbarSeparator,
  NeuralToolbarStart,
} from './toolbar.component';

@Component({
  imports: [
    NeuralToolbar,
    NeuralToolbarCenter,
    NeuralToolbarEnd,
    NeuralToolbarSeparator,
    NeuralToolbarStart,
  ],
  template: `
    <neural-toolbar
      ariaLabel="Editor actions"
      [orientation]="orientation()"
      [unstyled]="unstyled()"
      [classes]="{ root: 'consumer-toolbar', separator: 'consumer-separator' }"
    >
      <neural-toolbar-start>
        <button type="button">Undo</button>
        <button type="button" disabled>Unavailable</button>
        <button type="button">Redo</button>
      </neural-toolbar-start>
      <neural-toolbar-separator />
      <neural-toolbar-center
        ><button type="button">Align</button></neural-toolbar-center
      >
      <neural-toolbar-end
        ><button type="button">Publish</button></neural-toolbar-end
      >
    </neural-toolbar>
  `,
})
class HostComponent {
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly unstyled = signal(false);
}

describe('NeuralToolbar', () => {
  it('renders accessible slots, classes and separator orientation', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const toolbar = fixture.nativeElement.querySelector(
      '[role="toolbar"]',
    ) as HTMLElement;
    const separator = fixture.nativeElement.querySelector(
      '[role="separator"]',
    ) as HTMLElement;
    expect(toolbar.getAttribute('aria-label')).toBe('Editor actions');
    expect(toolbar.classList).toContain('neural-toolbar-base');
    expect(toolbar.classList).toContain('consumer-toolbar');
    expect(separator.getAttribute('aria-orientation')).toBe('vertical');
    expect(separator.classList).toContain('consumer-separator');
  });

  it('uses roving focus with Arrow, Home and End while skipping disabled controls', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    buttons[0].focus();
    buttons[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    expect(document.activeElement).toBe(buttons[2]);
    buttons[2].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
    );
    expect(document.activeElement).toBe(buttons[4]);
    buttons[4].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
    );
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('switches vertical navigation and keeps structural hooks when unstyled', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.orientation.set('vertical');
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const toolbar = fixture.nativeElement.querySelector(
      '[role="toolbar"]',
    ) as HTMLElement;
    const separator = fixture.nativeElement.querySelector(
      '[role="separator"]',
    ) as HTMLElement;
    const section = fixture.nativeElement.querySelector(
      '.neural-toolbar-section-root',
    ) as HTMLElement;
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    expect(toolbar.classList).toContain('neural-toolbar-root');
    expect(toolbar.classList).not.toContain('neural-toolbar-base');
    expect(separator.getAttribute('aria-orientation')).toBe('horizontal');
    expect(section.getAttribute('data-orientation')).toBe('vertical');
    buttons[0].focus();
    buttons[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    expect(document.activeElement).toBe(buttons[2]);
  });
});
