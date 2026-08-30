import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import {
  NeuralAvatar,
  NeuralAvatarGroup,
  type NeuralAvatarClasses,
  type NeuralAvatarGroupClasses,
} from '@neural-ng/core/avatar';
import { NeuralBadgeDirective } from '@neural-ng/core/badge';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-avatar-page',
  imports: [NeuralAvatar, NeuralAvatarGroup, NeuralBadgeDirective, CodeView],
  templateUrl: './avatar.page.html',
  styleUrls: ['./avatar.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarPage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;

  readonly lastImageEvent = signal('Waiting for the broken image fallback');

  readonly avatarClasses: NeuralAvatarClasses = {
    root: 'docs-headless-avatar',
    fallback: 'docs-headless-avatar__fallback',
    initials: 'docs-headless-avatar__initials',
  };

  readonly groupClasses: NeuralAvatarGroupClasses = {
    root: 'docs-headless-avatar-group',
    overflow: 'docs-headless-avatar-group__overflow',
  };

  readonly importCode = `import { NeuralAvatar } from '@neural-ng/core/avatar';`;

  readonly imageCode = `
    <neural-avatar src="/avatar-ada.svg" srcSet="/avatar-ada.svg 1x" sizes="64px" name="Ada Lovelace" size="extra-large"
          loading="eager" fetchPriority="high" />
    <neural-avatar name="Grace Hopper" size="extra-large" />
    <neural-avatar initials="MH" ariaLabel="Margaret Hamilton" size="extra-large" shape="rounded" />
    <neural-avatar iconClass="nt nt-user" ariaLabel="Account" size="extra-large" />
    <neural-avatar ariaLabel="Neural AI" size="extra-large" shape="square">
      <i class="nt nt-sparkles" aria-hidden="true"></i>
    </neural-avatar>`;

  readonly sizeCode = `
    <neural-avatar name="Extra Small" size="extra-small" />
    <neural-avatar name="Small Avatar" size="small" />
    <neural-avatar name="Medium Avatar" />
    <neural-avatar name="Large Avatar" size="large" shape="rounded" />
    <neural-avatar name="Extra Large" size="extra-large" shape="square" />
  `;

  readonly statusCode = `
    <neural-avatar name="Ada Lovelace" size="large" neuralBadgeDot neuralBadgePosition="bottom-end"
      neuralBadgeSeverity="success" neuralBadgeAriaLabel="Online" />
    <neural-avatar name="Grace Hopper" size="large" [neuralBadge]="5" neuralBadgePosition="top-end"
      neuralBadgeSeverity="error" neuralBadgeAriaLabel="5 unread notifications" />
  `;

  readonly groupCode = `
    import { Component } from '@angular/core';
    import { NeuralAvatar, NeuralAvatarGroup } from '@neural-ng/core/avatar';

    @Component({
      selector: 'neural-avatar-example',
      imports: [NeuralAvatar, NeuralAvatarGroup],
      template: \`
        <neural-avatar-group [max]="3" ariaLabel="NeuralNg project team" overflowLabel="{count} more teammates">
            <neural-avatar src="/avatar-ada.svg" name="Ada Lovelace" loading="eager" />
            <neural-avatar name="Grace Hopper" />
            <neural-avatar name="Margaret Hamilton" />
            <neural-avatar name="Radia Perlman" />
            <neural-avatar name="Annie Easley" />
            <neural-avatar name="Katherine Johnson" />
        </neural-avatar-group>
      \`
    })
    export class AvatarExampleComponent {}
  `;

  readonly headlessCode = `
    import { Component } from '@angular/core';
    import { 
      NeuralAvatar,
      NeuralAvatarGroup,
      type NeuralAvatarClasses,
      type NeuralAvatarGroupClasses
    } from '@neural-ng/core/avatar';

    @Component({
      selector: 'neural-avatar-example',
      imports: [NeuralAvatar, NeuralAvatarGroup],
      template: \`
        <neural-avatar name="Neural Technology" unstyled avatarClass="docs-headless-avatar--custom"
            [classes]="avatarClasses" />
        <neural-avatar-group [max]="2" ariaLabel="Headless team" overflowLabel="{count} hidden identities"
          unstyled [classes]="groupClasses">
          <neural-avatar name="Ada Lovelace" unstyled />
          <neural-avatar name="Grace Hopper" unstyled />
          <neural-avatar name="Margaret Hamilton" unstyled />
        </neural-avatar-group>
      \`,
      styles: \`
        .docs-headless-avatar--custom {
          border-radius: 1rem;
        }
      \`
    })
    export class AvatarExampleComponent {
      readonly avatarClasses: NeuralAvatarClasses = {
        root: 'docs-headless-avatar',
        fallback: 'docs-headless-avatar__fallback',
        initials: 'docs-headless-avatar__initials',
      };
      
      readonly groupClasses: NeuralAvatarGroupClasses = {
        root: 'docs-headless-avatar-group',
        overflow: 'docs-headless-avatar-group__overflow',
      };
    }
  `;

  readonly imageRecoveryCode = `
  import { Component } from '@angular/core';
  import { NeuralAvatar } from '@neural-ng/core/avatar';

  @Component({
    selector: 'neural-avatar-example',
    imports: [NeuralAvatar],
    template: \`
	    <neural-avatar src="/missing-avatar.webp" name="Radia Perlman" size="large" loading="eager"
              (imageError)="markImageError()" />
    \`
  })
  export class AvatarExampleComponent {
    readonly lastImageEvent = signal('Waiting for the broken image fallback');

    markImageError(): void {
      this.lastImageEvent.set('imageError emitted; initials fallback is active');
	  }	
  }`;

  markImageError(): void {
    this.lastImageEvent.set('imageError emitted; initials fallback is active');
  }
}
