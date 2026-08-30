import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';
import {
  NeuralCard,
  NeuralCardBody,
  NeuralCardFooter,
  NeuralCardHeader,
  type NeuralCardClasses,
} from '@neural-ng/core/card';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-card-page',
  imports: [
    NeuralButton,
    NeuralCardBody,
    NeuralCard,
    NeuralCardFooter,
    NeuralCardHeader,
    CodeExample,
  ],
  templateUrl: './card.page.html',
  styleUrls: ['./card.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardPage {
  readonly headlessClasses: NeuralCardClasses = {
    root: 'docs-headless-card',
    header: 'docs-headless-card__header',
    body: 'docs-headless-card__body',
    footer: 'docs-headless-card__footer',
  };
  readonly importCode = `import {
  NeuralCard,
  NeuralCardHeader,
  NeuralCardBody,
  NeuralCardFooter,
} from '@neural-ng/core/card';`;
  readonly basicCode = `<neural-card ariaLabelledby="project-title">
  <neural-card-header>
    <h2 id="project-title">Neural workspace</h2>
  </neural-card-header>
  <neural-card-body>Project details</neural-card-body>
  <neural-card-footer>Actions</neural-card-footer>
</neural-card>`;
}
