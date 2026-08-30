import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  signal,
} from '@angular/core';
import type { NeuralEditorMessages } from '@neural-ng/core';
import type {
  NeuralEditorCollaborationPresence,
  NeuralEditorCollaborationStatus,
  NeuralEditorCommentThread,
  NeuralEditorController,
  NeuralEditorSnapshot,
  NeuralEditorTrackedChange,
} from './editor.types';

@Component({
  selector: 'neural-editor-collaboration-panel',
  standalone: true,
  template: `
    <section
      [class]="panelClass()"
      [attr.aria-label]="messages().collaborationPanel"
    >
      <header [class]="barClass()">
        <span [class]="statusClass()" aria-live="polite">
          {{ statusLabel() }}
        </span>

        @if (presence().length) {
          <ul
            [class]="presenceListClass()"
            [attr.aria-label]="messages().presence"
          >
            @for (entry of presence(); track entry.clientId) {
              <li
                [class]="presenceItemClass()"
                [title]="entry.user.name"
                [style.--neural-editor-presence-color]="entry.user.color"
              >
                @if (entry.user.avatarUrl) {
                  <img [src]="entry.user.avatarUrl" alt="" />
                } @else {
                  <span aria-hidden="true">{{
                    initials(entry.user.name)
                  }}</span>
                }
                <span class="neural-editor-visually-hidden">
                  {{ entry.user.name
                  }}{{ entry.local ? ' (' + messages().you + ')' : '' }}
                </span>
              </li>
            }
          </ul>
        }
      </header>

      @if (commentsEnabled()) {
        <section [class]="sectionClass()">
          <h3 [class]="sectionTitleClass()">{{ messages().comments }}</h3>
          <div class="neural-editor-collaboration-compose">
            <input
              type="text"
              [class]="inputClass()"
              [value]="commentText()"
              [placeholder]="messages().commentPlaceholder"
              [disabled]="disabled()"
              (input)="setCommentText($event)"
              (keydown.enter)="addComment()"
            />
            <button
              type="button"
              [class]="buttonClass()"
              [disabled]="disabled() || !commentText().trim()"
              (click)="addComment()"
            >
              {{ messages().addComment }}
            </button>
          </div>

          @if (!comments().length) {
            <p class="neural-editor-collaboration-empty">
              {{ messages().noComments }}
            </p>
          }
          @for (thread of comments(); track thread.id) {
            <article
              [class]="threadClass()"
              [attr.data-active]="
                controller().activeCommentId() === thread.id ? 'true' : null
              "
              [attr.data-resolved]="thread.resolved ? 'true' : null"
            >
              <button
                type="button"
                class="neural-editor-comment-select"
                (click)="controller().selectComment(thread.id)"
              >
                {{
                  thread.resolved
                    ? messages().resolvedComment
                    : messages().openComment
                }}
              </button>
              @for (message of thread.messages; track message.id) {
                <div [class]="messageClass()">
                  <strong>{{ message.user.name }}</strong>
                  <span>{{ message.text }}</span>
                </div>
              }
              <div class="neural-editor-collaboration-actions">
                <button
                  type="button"
                  [class]="buttonClass()"
                  [disabled]="disabled()"
                  (click)="toggleResolved(thread)"
                >
                  {{
                    thread.resolved
                      ? messages().reopenComment
                      : messages().resolveComment
                  }}
                </button>
                <button
                  type="button"
                  [class]="buttonClass()"
                  [disabled]="disabled()"
                  (click)="controller().deleteComment(thread.id)"
                >
                  {{ messages().deleteComment }}
                </button>
              </div>
            </article>
          }
        </section>
      }

      @if (trackedChangesEnabled()) {
        <section [class]="sectionClass()">
          <h3 [class]="sectionTitleClass()">{{ messages().trackedChanges }}</h3>
          @if (!trackedChanges().length) {
            <p class="neural-editor-collaboration-empty">
              {{ messages().noTrackedChanges }}
            </p>
          }
          @for (change of trackedChanges(); track change.id) {
            <article [class]="trackedChangeClass()">
              <strong>
                {{
                  change.kind === 'insertion'
                    ? messages().insertion
                    : messages().deletion
                }}
              </strong>
              <span>{{ change.userName }}</span>
              <q>{{ change.text }}</q>
              <div class="neural-editor-collaboration-actions">
                <button
                  type="button"
                  [class]="buttonClass()"
                  [disabled]="disabled()"
                  (click)="controller().acceptTrackedChange(change.id)"
                >
                  {{ messages().acceptChange }}
                </button>
                <button
                  type="button"
                  [class]="buttonClass()"
                  [disabled]="disabled()"
                  (click)="controller().rejectTrackedChange(change.id)"
                >
                  {{ messages().rejectChange }}
                </button>
              </div>
            </article>
          }
          @if (trackedChanges().length) {
            <div class="neural-editor-collaboration-actions">
              <button
                type="button"
                [class]="buttonClass()"
                (click)="controller().acceptAllTrackedChanges()"
              >
                {{ messages().acceptAllChanges }}
              </button>
              <button
                type="button"
                [class]="buttonClass()"
                (click)="controller().rejectAllTrackedChanges()"
              >
                {{ messages().rejectAllChanges }}
              </button>
            </div>
          }
        </section>
      }

      @if (snapshotsEnabled()) {
        <section [class]="sectionClass()">
          <h3 [class]="sectionTitleClass()">{{ messages().versionHistory }}</h3>
          <div class="neural-editor-collaboration-compose">
            <input
              type="text"
              [class]="inputClass()"
              [value]="snapshotLabel()"
              [placeholder]="messages().snapshotLabelPlaceholder"
              [disabled]="disabled()"
              (input)="setSnapshotLabel($event)"
              (keydown.enter)="createSnapshot()"
            />
            <button
              type="button"
              [class]="buttonClass()"
              [disabled]="disabled()"
              (click)="createSnapshot()"
            >
              {{ messages().createSnapshot }}
            </button>
          </div>
          @if (!snapshots().length) {
            <p class="neural-editor-collaboration-empty">
              {{ messages().noSnapshots }}
            </p>
          }
          @for (snapshot of snapshots(); track snapshot.id) {
            <article [class]="snapshotClass()">
              <strong>{{
                snapshot.label || messages().untitledSnapshot
              }}</strong>
              <time [attr.datetime]="snapshot.createdAt">{{
                snapshot.createdAt
              }}</time>
              <div class="neural-editor-collaboration-actions">
                <button
                  type="button"
                  [class]="buttonClass()"
                  [disabled]="disabled()"
                  (click)="controller().restoreSnapshot(snapshot.id)"
                >
                  {{ messages().restoreSnapshot }}
                </button>
                <button
                  type="button"
                  [class]="buttonClass()"
                  [disabled]="disabled()"
                  (click)="controller().deleteSnapshot(snapshot.id)"
                >
                  {{ messages().deleteSnapshot }}
                </button>
              </div>
            </article>
          }
        </section>
      }
    </section>
  `,
  styles: `
    :where(.neural-editor-collaboration-panel-root) {
      min-width: 0;
    }
    :where(.neural-editor-collaboration-panel-base) {
      display: grid;
      gap: var(--neural-editor-collaboration-gap, 0.75rem);
      padding: var(--neural-editor-collaboration-padding, 0.75rem);
      border-block-start: var(
        --neural-editor-collaboration-border,
        1px solid currentColor
      );
    }
    :where(.neural-editor-collaboration-bar-base) {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      justify-content: space-between;
    }
    :where(.neural-editor-presence-list-base) {
      display: flex;
      padding: 0;
      margin: 0;
      list-style: none;
    }
    :where(.neural-editor-presence-item-base) {
      display: grid;
      width: 1.75rem;
      height: 1.75rem;
      margin-inline-start: -0.35rem;
      overflow: hidden;
      place-items: center;
      color: white;
      background: var(--neural-editor-presence-color, #2563eb);
      border: 2px solid var(--neural-editor-background, Canvas);
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 700;
    }
    :where(.neural-editor-presence-item-base img) {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    :where(.neural-editor-collaboration-section-base) {
      display: grid;
      gap: 0.5rem;
    }
    :where(.neural-editor-collaboration-section-title-base) {
      margin: 0;
      font-size: 0.875rem;
    }
    :where(.neural-editor-collaboration-compose) {
      display: flex;
      gap: 0.5rem;
    }
    :where(.neural-editor-collaboration-input-base) {
      min-width: 0;
      flex: 1 1 auto;
      padding: 0.45rem 0.6rem;
      border: var(
        --neural-editor-collaboration-input-border,
        1px solid currentColor
      );
      border-radius: 0.4rem;
      background: transparent;
      color: inherit;
      font: inherit;
    }
    :where(.neural-editor-collaboration-button-base) {
      padding: 0.4rem 0.6rem;
      color: inherit;
      background: var(
        --neural-editor-collaboration-button-background,
        transparent
      );
      border: var(
        --neural-editor-collaboration-button-border,
        1px solid currentColor
      );
      border-radius: 0.4rem;
      font: inherit;
      cursor: pointer;
    }
    :where(.neural-editor-comment-thread-base),
    :where(.neural-editor-tracked-change-base),
    :where(.neural-editor-snapshot-item-base) {
      display: grid;
      gap: 0.35rem;
      padding: 0.6rem;
      border: var(
        --neural-editor-collaboration-item-border,
        1px solid currentColor
      );
      border-radius: 0.5rem;
    }
    :where(.neural-editor-comment-thread-base[data-resolved='true']) {
      opacity: 0.65;
    }
    :where(.neural-editor-comment-message-base) {
      display: grid;
      gap: 0.1rem;
    }
    :where(.neural-editor-collaboration-actions) {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
    :where(.neural-editor-comment-select) {
      padding: 0;
      color: inherit;
      background: transparent;
      border: 0;
      text-align: start;
      cursor: pointer;
    }
    @media (max-width: 40rem) {
      :where(.neural-editor-collaboration-bar-base),
      :where(.neural-editor-collaboration-compose) {
        align-items: stretch;
        flex-direction: column;
      }
      :where(.neural-editor-presence-list-base) {
        margin-inline-start: 0.35rem;
      }
      :where(.neural-editor-collaboration-button-base) {
        min-height: 2.5rem;
      }
    }
    :where(.neural-editor-visually-hidden) {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EditorCollaborationPanelComponent {
  readonly controller = input.required<NeuralEditorController>();
  readonly messages = input.required<NeuralEditorMessages>();
  readonly status = input.required<NeuralEditorCollaborationStatus>();
  readonly presence =
    input.required<readonly NeuralEditorCollaborationPresence[]>();
  readonly comments = input.required<readonly NeuralEditorCommentThread[]>();
  readonly trackedChanges =
    input.required<readonly NeuralEditorTrackedChange[]>();
  readonly snapshots = input.required<readonly NeuralEditorSnapshot[]>();
  readonly commentsEnabled = input(false);
  readonly trackedChangesEnabled = input(false);
  readonly snapshotsEnabled = input(false);
  readonly disabled = input(false);
  readonly panelClass = input('');
  readonly barClass = input('');
  readonly statusClass = input('');
  readonly presenceListClass = input('');
  readonly presenceItemClass = input('');
  readonly sectionClass = input('');
  readonly sectionTitleClass = input('');
  readonly inputClass = input('');
  readonly buttonClass = input('');
  readonly threadClass = input('');
  readonly messageClass = input('');
  readonly trackedChangeClass = input('');
  readonly snapshotClass = input('');

  protected readonly commentText = signal('');
  protected readonly snapshotLabel = signal('');
  protected readonly statusLabel = computed(() => {
    const messages = this.messages();
    switch (this.status()) {
      case 'connecting':
        return messages.collaborationConnecting;
      case 'connected':
        return messages.collaborationConnected;
      case 'synced':
        return messages.collaborationSynced;
      case 'disconnected':
        return messages.collaborationDisconnected;
      case 'error':
        return messages.collaborationError;
      default:
        return messages.collaborationDisabled;
    }
  });

  protected setCommentText(event: Event): void {
    this.commentText.set((event.target as HTMLInputElement).value);
  }

  protected setSnapshotLabel(event: Event): void {
    this.snapshotLabel.set((event.target as HTMLInputElement).value);
  }

  protected addComment(): void {
    const value = this.commentText().trim();
    if (!value) return;
    const thread = this.controller().addComment(value);
    if (thread) this.commentText.set('');
  }

  protected createSnapshot(): void {
    const snapshot = this.controller().createSnapshot(this.snapshotLabel());
    if (snapshot) this.snapshotLabel.set('');
  }

  protected toggleResolved(thread: NeuralEditorCommentThread): void {
    if (thread.resolved) this.controller().reopenComment(thread.id);
    else this.controller().resolveComment(thread.id);
  }

  protected initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => Array.from(part)[0] ?? '')
      .join('')
      .toLocaleUpperCase();
  }
}
