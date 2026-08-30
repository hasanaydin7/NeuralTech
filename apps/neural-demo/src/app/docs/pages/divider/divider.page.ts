import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import {
  NeuralDivider,
  type NeuralDividerClasses,
} from '@neural-ng/core/divider';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-divider-page',
  imports: [NeuralDivider, CodeExample],
  templateUrl: './divider.page.html',
  styleUrls: ['./divider.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DividerPage {
  readonly headlessClasses: NeuralDividerClasses = {
    root: 'docs-headless-divider',
    before: 'docs-headless-divider__line',
    content: 'docs-headless-divider__content',
    after: 'docs-headless-divider__line',
  };

  readonly importCode = `import {
  NeuralDivider,
  type NeuralDividerClasses,
} from '@neural-ng/core/divider';`;
  readonly basicCode = `<p>First content region</p>
<neural-divider />
<p>Second content region</p>`;
  readonly contentCode = `<neural-divider label="OR" />
<neural-divider align="start" type="dashed">
  <strong>Advanced</strong>
</neural-divider>`;
  readonly verticalCode = `<div class="actions">
  <button type="button">Save</button>
  <neural-divider
    orientation="vertical"
    ariaLabel="Primary and secondary actions"
  />
  <button type="button">Cancel</button>
</div>`;
  readonly headlessCode = `<neural-divider
  label="HEADLESS"
  type="dotted"
  unstyled
  dividerClass="my-divider"
  [classes]="{
    before: 'my-line',
    content: 'my-label',
    after: 'my-line'
  }"
/>`;
}
