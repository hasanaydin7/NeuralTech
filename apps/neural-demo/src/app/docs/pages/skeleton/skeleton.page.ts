import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import {
  SkeletonComponent,
  type NeuralSkeletonClasses,
} from '@neural-ng/core/skeleton';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-skeleton-page',
  imports: [SkeletonComponent, CodeExample],
  templateUrl: './skeleton.page.html',
  styleUrls: ['./skeleton.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonPage {
  readonly headlessClasses: NeuralSkeletonClasses = {
    root: 'docs-headless-skeleton',
    effect: 'docs-headless-skeleton__effect',
  };

  readonly importCode = `import {
  SkeletonComponent,
  type NeuralSkeletonClasses,
} from '@neural-ng/core/skeleton';`;
  readonly basicCode = `<neural-skeleton />
<neural-skeleton width="72%" />
<neural-skeleton width="45%" />`;
  readonly shapesCode = `<neural-skeleton shape="circle" size="3rem" />
<neural-skeleton shape="rounded" width="10rem" height="4rem" />
<neural-skeleton
  shape="rectangle"
  width="10rem"
  height="4rem"
  borderRadius="0"
/>`;
  readonly animationCode = `<neural-skeleton animation="pulse" />
<neural-skeleton animation="wave" />
<neural-skeleton animation="none" />`;
  readonly compositionCode = `<article [attr.aria-busy]="loading()">
  <div class="profile">
    <neural-skeleton shape="circle" size="3rem" animation="wave" />
    <div>
      <neural-skeleton width="9rem" />
      <neural-skeleton width="6rem" height="0.75rem" />
    </div>
  </div>
  <neural-skeleton shape="rectangle" height="9rem" animation="wave" />
</article>`;
  readonly headlessCode = `<neural-skeleton
  unstyled
  width="16rem"
  height="4rem"
  skeletonClass="my-skeleton"
  [classes]="{ effect: 'my-skeleton-effect' }"
/>`;
}
