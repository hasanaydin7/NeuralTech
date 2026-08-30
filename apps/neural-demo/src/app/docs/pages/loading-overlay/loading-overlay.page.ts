import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewEncapsulation,
  inject,
  signal,
  type WritableSignal,
} from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';
import {
  LoadingIndicatorDirective,
  LoadingOverlayComponent,
  type NeuralLoadingOverlayClasses,
} from '@neural-ng/core/loading-overlay';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-loading-overlay-page',
  imports: [
    NeuralButton,
    LoadingIndicatorDirective,
    LoadingOverlayComponent,
    CodeExample,
  ],
  templateUrl: './loading-overlay.page.html',
  styleUrls: ['./loading-overlay.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingOverlayPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  readonly containerLoading = signal(false);
  readonly viewportLoading = signal(false);
  readonly customLoading = signal(false);
  readonly backgroundLoading = signal(false);
  readonly headlessLoading = signal(true);
  readonly lastEvent = signal('Waiting');
  readonly headlessClasses: NeuralLoadingOverlayClasses = {
    root: 'docs-headless-loader',
    content: 'docs-headless-loader__content',
    backdrop: 'docs-headless-loader__backdrop',
    panel: 'docs-headless-loader__panel',
    indicator: 'docs-headless-loader__indicator',
    label: 'docs-headless-loader__label',
  };

  readonly importCode = `import {
  LoadingIndicatorDirective,
  LoadingOverlayComponent,
} from '@neural-ng/core/loading-overlay';`;
  readonly containerCode = `<neural-loading-overlay
  [active]="loading()"
  label="Loading products"
>
  <product-list />
</neural-loading-overlay>`;
  readonly viewportCode = `<neural-loading-overlay
  [active]="saving()"
  scope="viewport"
  label="Saving changes"
  lockScroll
/>`;
  readonly customCode = `<neural-loading-overlay
  [active]="thinking()"
  label="AI is thinking"
>
  <workspace-view />

  <ng-template neuralLoadingIndicator>
    <div class="ai-loader">NN</div>
  </ng-template>
</neural-loading-overlay>`;
  readonly timingCode = `<neural-loading-overlay
  [active]="loading()"
  [delay]="150"
  [minimumDuration]="300"
  (shown)="onShown()"
  (hidden)="onHidden()"
/>`;
  readonly headlessCode = `<neural-loading-overlay
  [active]="loading()"
  unstyled
  overlayClass="my-loader"
  [classes]="{
    backdrop: 'my-backdrop',
    panel: 'my-panel',
    indicator: 'my-indicator',
    label: 'my-label'
  }"
>
  <app-content />
</neural-loading-overlay>`;

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const timer of this.timers) clearTimeout(timer);
    });
  }

  loadContainer(): void {
    this.runFor(this.containerLoading, 1400);
  }

  loadViewport(): void {
    this.runFor(this.viewportLoading, 1400);
  }

  loadCustom(): void {
    this.runFor(this.customLoading, 1400);
  }

  loadInBackground(): void {
    this.runFor(this.backgroundLoading, 1400);
  }

  toggleHeadless(): void {
    this.headlessLoading.update((value) => !value);
  }

  markShown(): void {
    this.lastEvent.set('shown');
  }

  markHidden(): void {
    this.lastEvent.set('hidden');
  }

  private runFor(target: WritableSignal<boolean>, duration: number): void {
    target.set(true);
    const timer = setTimeout(() => {
      target.set(false);
      this.timers.delete(timer);
    }, duration);
    this.timers.add(timer);
  }
}
