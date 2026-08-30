# Migrate Editor from Core

Editor moved from the `@neural-ng/core/editor` secondary entry point to the
standalone `@neural-ng/editor` package.

## 1. Install

```bash
npm install @neural-ng/editor
```

Remove direct application dependencies on Tiptap, ProseMirror, Floating UI,
Yjs, and `@tiptap/y-tiptap` when they were installed only for NeuralNg Editor.
Keep a collaboration transport package only when the application creates a
realtime provider.

## 2. Change imports

```diff
-import { EditorComponent } from '@neural-ng/core/editor';
+import { EditorComponent } from '@neural-ng/editor';
```

The public Editor component, template directives, controller, serializers,
structured-operation types, AI review types, collaboration contracts, comments,
and snapshot helpers are exported from the new package root. Internal default
renderer components and raw Tiptap/ProseMirror helpers are not public exports.

## 3. Move Editor theme tokens

```css
@import '@neural-ng/core/themes/neutral.css';
@import '@neural-ng/editor/themes/neutral.css';
```

Use matching Core and Editor files for Glass or Futuristic.

## 4. Use character-specific constraints

The component-enforced character limit is `maxCharacters`. The old
`minLength` and `maxLength` aliases were removed because Angular Signal Forms
reserves length constraints for the structured control value. Minimum character
validation belongs to the application or form schema.

```diff
-<neural-editor [maxLength]="5000" />
+<neural-editor [maxCharacters]="5000" />
```

No document JSON migration is required. `NeuralEditorDocument` and the public
controller/operation contracts remain unchanged.
