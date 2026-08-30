import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import type { NeuralEditorMessages } from '@neural-ng/core';
import type { NeuralEditorAiReviewTemplateContext } from './editor-ai-review-template.directive';
import type {
  NeuralEditorAiReviewState,
  NeuralEditorController,
} from './editor.types';

@Component({
  selector: 'neural-editor-ai-review',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <section
      #panel
      [hidden]="!state()"
      [class]="reviewClass()"
      [style.position]="strategy()"
      role="dialog"
      aria-modal="false"
      [attr.aria-label]="messages().aiReview"
      [attr.aria-controls]="editorId() || null"
      (keydown.escape)="controller().rejectAiProposal()"
    >
      @if (state(); as review) {
        @if (reviewTemplate(); as customReview) {
          <ng-container
            [ngTemplateOutlet]="customReview"
            [ngTemplateOutletContext]="templateContext()"
          />
        } @else {
          <div [class]="summaryClass()">
            <strong>{{
              review.proposal.summary || messages().aiProposal
            }}</strong>
            <span [class]="progressClass()" aria-live="polite">
              {{ progressLabel() }}
            </span>
          </div>

          <div [class]="actionsClass()">
            <button
              type="button"
              [class]="buttonClass()"
              [disabled]="review.operationCount <= 1"
              (click)="controller().selectPreviousAiChange()"
            >
              {{ messages().aiPrevious }}
            </button>
            <button
              type="button"
              [class]="buttonClass()"
              [disabled]="review.operationCount <= 1"
              (click)="controller().selectNextAiChange()"
            >
              {{ messages().aiNext }}
            </button>
            <button
              type="button"
              [class]="buttonClass()"
              (click)="controller().rejectAiProposal()"
            >
              {{ messages().aiReject }}
            </button>
            <button
              type="button"
              [class]="buttonClass()"
              (click)="controller().acceptAiProposal()"
            >
              {{ messages().aiAccept }}
            </button>
          </div>
        }
      }
    </section>
  `,
  styles: `
    :where(.neural-editor-ai-review-root) {
      box-sizing: border-box;
      z-index: var(--neural-editor-ai-review-z-index, 1100);
      inset-inline-start: 50%;
      bottom: var(--neural-editor-ai-review-offset, 1rem);
      width: min(
        var(--neural-editor-ai-review-width, 42rem),
        calc(100vw - 1rem)
      );
      transform: translateX(-50%);
    }
    :where(.neural-editor-ai-review-root[hidden]) {
      display: none !important;
    }
    :where(.neural-editor-ai-review-base) {
      display: flex;
      gap: var(--neural-editor-ai-review-gap, 0.75rem);
      align-items: center;
      justify-content: space-between;
      padding: var(--neural-editor-ai-review-padding, 0.75rem);
      color: var(--neural-editor-ai-review-color, inherit);
      background: var(--neural-editor-ai-review-background, Canvas);
      border: var(--neural-editor-ai-review-border, 1px solid currentColor);
      border-radius: var(--neural-editor-ai-review-radius, 0.75rem);
      box-shadow: var(
        --neural-editor-ai-review-shadow,
        0 1rem 3rem rgb(0 0 0 / 0.24)
      );
    }
    :where(.neural-editor-ai-review-summary-root) {
      min-width: 0;
    }
    :where(.neural-editor-ai-review-summary-base) {
      display: grid;
      gap: 0.2rem;
    }
    :where(.neural-editor-ai-review-progress-base) {
      color: var(--neural-editor-ai-review-muted-color, inherit);
      font-size: var(--neural-editor-ai-review-progress-font-size, 0.8125rem);
    }
    :where(.neural-editor-ai-review-actions-root) {
      display: flex;
      flex: 0 0 auto;
      gap: var(--neural-editor-ai-review-action-gap, 0.375rem);
      align-items: center;
    }
    :where(.neural-editor-ai-review-button-root) {
      box-sizing: border-box;
    }
    :where(.neural-editor-ai-review-button-base) {
      min-height: var(--neural-editor-ai-review-button-height, 2rem);
      padding: var(--neural-editor-ai-review-button-padding, 0.35rem 0.65rem);
      color: var(--neural-editor-ai-review-button-color, inherit);
      background: var(--neural-editor-ai-review-button-background, transparent);
      border: var(
        --neural-editor-ai-review-button-border,
        1px solid currentColor
      );
      border-radius: var(--neural-editor-ai-review-button-radius, 0.375rem);
      font: inherit;
      white-space: nowrap;
      cursor: pointer;
    }
    :where(.neural-editor-ai-review-button-base:disabled) {
      cursor: default;
      opacity: 0.5;
    }
    :where(.neural-editor-ai-review-button-base:focus-visible) {
      outline: var(--neural-editor-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-editor-focus-ring-offset, 2px);
    }
    @media (max-width: 40rem) {
      :where(.neural-editor-ai-review-root) {
        inset-inline: 0.5rem;
        bottom: 0.5rem;
        width: auto;
        transform: none;
      }
      :where(.neural-editor-ai-review-base) {
        display: grid;
      }
      :where(.neural-editor-ai-review-actions-root) {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    ngSkipHydration: 'true',
  },
})
export class EditorAiReviewComponent {
  readonly controller = input.required<NeuralEditorController>();
  readonly messages = input.required<NeuralEditorMessages>();
  readonly state = input<NeuralEditorAiReviewState | null>(null);
  readonly editorId = input('');
  readonly appendTarget = input.required<() => HTMLElement>();
  readonly strategy = input<'absolute' | 'fixed'>('fixed');
  readonly reviewTemplate =
    input<TemplateRef<NeuralEditorAiReviewTemplateContext> | null>(null);
  readonly reviewClass = input('');
  readonly summaryClass = input('');
  readonly progressClass = input('');
  readonly actionsClass = input('');
  readonly buttonClass = input('');

  private readonly destroyRef = inject(DestroyRef);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  readonly progressLabel = computed(() => {
    const state = this.state();
    if (!state) return '';
    return this.messages()
      .aiChangeProgress.replace(
        '{current}',
        String(state.activeOperationIndex + 1),
      )
      .replace('{total}', String(state.operationCount));
  });

  readonly templateContext = computed<NeuralEditorAiReviewTemplateContext>(
    () => ({
      $implicit: this.state,
      review: this.state,
      controller: this.controller(),
      previous: () => this.controller().selectPreviousAiChange(),
      next: () => this.controller().selectNextAiChange(),
      accept: () => this.controller().acceptAiProposal(),
      reject: () => this.controller().rejectAiProposal(),
    }),
  );

  constructor() {
    afterNextRender({
      write: () => {
        const panel = this.panel()?.nativeElement;
        if (!panel) return;

        const target = this.appendTarget()();
        if (panel.parentNode !== target) {
          target.appendChild(panel);
        }
      },
    });

    this.destroyRef.onDestroy(() => {
      const panel = this.panel()?.nativeElement;
      panel?.parentNode?.removeChild(panel);
    });
  }
}
