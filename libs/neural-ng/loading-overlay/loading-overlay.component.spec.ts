import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '../src/neural-ng.config';
import {
  NeuralLoadingIndicator,
  NeuralLoadingOverlay,
} from './loading-overlay.component';
import type { NeuralLoadingOverlayClasses } from './loading-overlay.types';

@Component({
  imports: [NeuralLoadingOverlay],
  template: `
    <button id="opener" type="button">Start</button>
    <neural-loading-overlay
      [active]="active"
      [scope]="scope"
      [delay]="delay"
      [minimumDuration]="minimumDuration"
      [blockInteraction]="blockInteraction"
      [unstyled]="unstyled"
      label="Loading products"
      overlayClass="consumer-root"
      [classes]="classes"
    >
      <button id="content-action" type="button">Product action</button>
    </neural-loading-overlay>
  `,
})
class LoadingOverlayHost {
  active = false;
  scope: 'container' | 'viewport' = 'container';
  delay = 0;
  minimumDuration = 0;
  blockInteraction = true;
  unstyled = false;
  classes: NeuralLoadingOverlayClasses = {
    root: 'slot-root',
    content: 'slot-content',
    backdrop: 'slot-backdrop',
    panel: 'slot-panel',
    indicator: 'slot-indicator',
    label: 'slot-label',
  };
}

@Component({
  imports: [NeuralLoadingIndicator, NeuralLoadingOverlay],
  template: `
    <neural-loading-overlay
      active
      [delay]="0"
      [minimumDuration]="0"
      label="AI is thinking"
    >
      <div>Workspace</div>
      <ng-template neuralLoadingIndicator>
        <strong class="custom-indicator">NN</strong>
      </ng-template>
    </neural-loading-overlay>
  `,
})
class CustomIndicatorHost {}

describe('NeuralLoadingOverlay', () => {
  beforeAll(() => installDialogTestApi());

  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideNeuralNg()],
    }),
  );

  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.style.overflow = '';
  });

  it('keeps inactive content available without rendering an overlay', () => {
    const fixture = TestBed.createComponent(LoadingOverlayHost);
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector(
      '.neural-loading-overlay-content-root',
    ) as HTMLElement;

    expect(content.getAttribute('aria-busy')).toBeNull();
    expect(content.hasAttribute('inert')).toBe(false);
    expect(
      fixture.nativeElement.querySelector('.neural-loading-overlay-layer-root'),
    ).toBeNull();
  });

  it('blocks container content and renders the default ProgressSpinner', () => {
    const fixture = TestBed.createComponent(LoadingOverlayHost);
    fixture.componentInstance.active = true;
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-loading-overlay-root',
    ) as HTMLElement;
    const content = fixture.nativeElement.querySelector(
      '.neural-loading-overlay-content-root',
    ) as HTMLElement;
    const panel = fixture.nativeElement.querySelector(
      '.neural-loading-overlay-panel-root',
    ) as HTMLElement;

    expect(root.dataset['active']).toBe('true');
    expect(root.dataset['visible']).toBe('true');
    expect(root.classList).toContain('consumer-root');
    expect(root.classList).toContain('slot-root');
    expect(content.getAttribute('aria-busy')).toBe('true');
    expect(content.hasAttribute('inert')).toBe(true);
    expect(panel.getAttribute('tabindex')).toBe('-1');
    expect(panel.querySelector('neural-progress-spinner')).not.toBeNull();
    expect(
      panel.querySelector('[role="progressbar"]')?.getAttribute('aria-label'),
    ).toBe('Loading products');
    expect(panel.textContent).toContain('Loading products');
  });

  it('allows non-blocking overlays without making content inert', () => {
    const fixture = TestBed.createComponent(LoadingOverlayHost);
    fixture.componentInstance.active = true;
    fixture.componentInstance.blockInteraction = false;
    fixture.detectChanges();
    const content = fixture.nativeElement.querySelector(
      '.neural-loading-overlay-content-root',
    ) as HTMLElement;
    const layer = fixture.nativeElement.querySelector(
      '.neural-loading-overlay-layer-root',
    ) as HTMLElement;

    expect(content.getAttribute('aria-busy')).toBe('true');
    expect(content.hasAttribute('inert')).toBe(false);
    expect(layer.dataset['blockInteraction']).toBe('false');
  });

  it('renders a custom indicator as a polite status', () => {
    const fixture = TestBed.createComponent(CustomIndicatorHost);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector(
      '.neural-loading-overlay-panel-root',
    ) as HTMLElement;

    expect(panel.getAttribute('role')).toBe('status');
    expect(panel.getAttribute('aria-live')).toBe('polite');
    expect(panel.getAttribute('aria-label')).toBe('AI is thinking');
    expect(panel.querySelector('.custom-indicator')?.textContent).toBe('NN');
    expect(panel.querySelector('neural-progress-spinner')).toBeNull();
  });

  it('honors delay and minimum visible duration', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(NeuralLoadingOverlay);
    fixture.componentRef.setInput('delay', 100);
    fixture.componentRef.setInput('minimumDuration', 300);
    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.neural-loading-overlay-layer-root'),
    ).toBeNull();
    await vi.advanceTimersByTimeAsync(100);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.neural-loading-overlay-layer-root'),
    ).not.toBeNull();

    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(299);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.neural-loading-overlay-layer-root'),
    ).not.toBeNull();
    await vi.runAllTimersAsync();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.neural-loading-overlay-layer-root'),
    ).toBeNull();
  });

  it('uses a modal viewport overlay, locks scroll, and restores focus', async () => {
    vi.useFakeTimers();
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const fixture = TestBed.createComponent(NeuralLoadingOverlay);
    fixture.componentRef.setInput('scope', 'viewport');
    fixture.componentRef.setInput('active', true);
    fixture.componentRef.setInput('delay', 0);
    fixture.componentRef.setInput('minimumDuration', 0);
    fixture.componentRef.setInput('label', 'Loading products');
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector(
      '.neural-loading-overlay-viewport-root',
    ) as HTMLDialogElement;

    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute('aria-label')).toBe('Loading products');
    expect(document.documentElement.style.overflow).toBe('hidden');

    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();
    await vi.runAllTimersAsync();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector(
        '.neural-loading-overlay-viewport-root',
      ),
    ).toBeNull();
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('keeps structural and consumer hooks in unstyled mode', () => {
    const fixture = TestBed.createComponent(LoadingOverlayHost);
    fixture.componentInstance.active = true;
    fixture.componentInstance.unstyled = true;
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-loading-overlay-root',
    ) as HTMLElement;
    const backdrop = fixture.nativeElement.querySelector(
      '.neural-loading-overlay-backdrop-root',
    ) as HTMLElement;
    const panel = fixture.nativeElement.querySelector(
      '.neural-loading-overlay-panel-root',
    ) as HTMLElement;

    expect(root.classList).toContain('slot-root');
    expect(root.classList).not.toContain('neural-loading-overlay-base');
    expect(backdrop.classList).toContain('slot-backdrop');
    expect(backdrop.classList).not.toContain(
      'neural-loading-overlay-backdrop-base',
    );
    expect(panel.classList).toContain('slot-panel');
    expect(panel.classList).not.toContain('neural-loading-overlay-panel-base');
  });
});

function installDialogTestApi(): void {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value(this: HTMLDialogElement): void {
        this.setAttribute('open', '');
      },
    },
    show: {
      configurable: true,
      value(this: HTMLDialogElement): void {
        this.setAttribute('open', '');
      },
    },
    close: {
      configurable: true,
      value(this: HTMLDialogElement): void {
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
      },
    },
  });
}
