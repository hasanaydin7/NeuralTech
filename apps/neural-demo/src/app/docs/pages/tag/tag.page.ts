import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  signal,
} from '@angular/core';
import {
  NeuralTag,
  type NeuralTagClasses,
  type NeuralTagRemove,
} from '@neural-ng/core/tag';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-tag-page',
  imports: [CodeExample, NeuralTag],
  templateUrl: './tag.page.html',
  styleUrls: ['./tag.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagPage {
  readonly filters = signal(['Angular', 'Signals', 'Accessibility']);
  readonly lastRemoved = signal('None');
  readonly headlessClasses: NeuralTagClasses = {
    root: 'docs-headless-tag',
    icon: 'docs-headless-tag__icon',
    label: 'docs-headless-tag__label',
    content: 'docs-headless-tag__content',
    removeButton: 'docs-headless-tag__remove',
    removeIcon: 'docs-headless-tag__remove-icon',
  };
  readonly importCode = `import {
  NeuralTag,
  type NeuralTagRemove,
} from '@neural-ng/core/tag';`;
  readonly basicCode = `<neural-tag value="Neutral" />
<neural-tag value="Primary" severity="primary" />
<neural-tag value="Secondary" severity="secondary" />
<neural-tag value="Information" severity="info" />
<neural-tag value="Approved" severity="success" />
<neural-tag value="In progress" severity="warning" />
<neural-tag value="Rejected" severity="error" />`;
  readonly removableCode = `<neural-tag
  [value]="filter"
  removable
  (removed)="removeFilter($event)"
/>`;
  readonly headlessCode = `<neural-tag
  value="Headless"
  removable
  unstyled
  [classes]="{
    root: 'my-tag',
    label: 'my-tag__label',
    removeButton: 'my-tag__remove'
  }"
/>`;

  removeFilter(event: NeuralTagRemove): void {
    if (event.value === null) return;
    this.filters.update((filters) =>
      filters.filter((filter) => filter !== event.value),
    );
    this.lastRemoved.set(event.value);
  }
}
