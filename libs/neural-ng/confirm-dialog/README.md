# NeuralNg ConfirmDialog

ConfirmDialog Beta is a service-driven, native top-layer confirmation dialog for Angular 22+.

```ts
import { NeuralConfirmDialog, NeuralConfirmationService } from '@neural-ng/core/confirm-dialog';
```

```html
<neural-confirm-dialog />
```

```ts
private readonly confirmation = inject(NeuralConfirmationService);

remove(): void {
  const ref = this.confirmation.confirm({
    header: 'Delete workspace?',
    message: 'This action cannot be undone.',
    accept: async () => this.workspace.remove(),
  });
}
```

`confirm()` returns a signal-backed reference with `closed`, `result`, and
`closeReason`. Requests can target independent hosts through `key`. A newer
request with the same key closes the previous reference with `replaced`.

`ConfirmationService` is also exported as a concise alias of
`NeuralConfirmationService`; both names resolve to the same injectable token.

Async `accept` and `reject` actions may return `false` to keep the dialog open.
The component supports locale defaults, native focus restoration, Escape and
backdrop policies, global/local unstyled mode, and typed class slots.

`NeuralConfirmDialog` is the canonical component symbol.
`ConfirmDialogComponent` remains a deprecated compatibility alias.

## Beta boundary

ConfirmDialog Beta includes keyed hosts, replacement semantics, signal-backed
references, accept/reject/dismiss results, explicit close reasons, async action
guards, error output, localized labels, icon and action visibility control,
focus policy, native modal containment, focus restoration, SSR/hydration safety,
typed classes, and global/local unstyled mode. Queuing multiple confirmations
for the same key is intentionally not part of the contract: the latest request
replaces the active one deterministically.
