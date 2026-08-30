import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import {
  NeuralAvatar,
  NeuralAvatarGroup,
  type NeuralAvatarClasses,
  type NeuralAvatarGroupClasses,
} from '@neural-ng/core/avatar';
import { NeuralBadgeDirective } from '@neural-ng/core/badge';
import {
  NeuralTab,
  NeuralTabList,
  NeuralTabPanel,
  NeuralTabPanels,
  NeuralTabs,
  type NeuralTabsClasses,
  type NeuralTabValue,
} from '@neural-ng/core/tabs';
import { filter } from 'rxjs';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';

type AvatarDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-avatar-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    NeuralBadgeDirective,
    CodeView,
    NeuralAvatar,
    NeuralAvatarGroup,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './avatar.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly imageEvent = signal('Waiting for the native image error event.');
  readonly selectedView = signal<AvatarDocView>(resolveView(this.router.url));
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly avatarClasses: NeuralAvatarClasses = {
    root: 'size-14 rounded-2xl border border-violet-300/35 bg-slate-950 text-violet-100 shadow-[0_12px_35px_rgba(76,29,149,.28)]',
    fallback:
      'grid size-full place-items-center bg-gradient-to-br from-violet-500/35 to-cyan-400/20',
    initials: 'text-sm font-black tracking-wide',
    image: 'size-full object-cover',
    icon: 'text-xl text-cyan-300',
    content: 'grid size-full place-items-center',
  };
  readonly groupClasses: NeuralAvatarGroupClasses = {
    root: 'inline-flex items-center [&_.neural-avatar-host:not(:first-child)]:-ms-3',
    overflow:
      '-ms-3 grid size-10 place-items-center rounded-full border-2 border-slate-950 bg-violet-400 text-xs font-black text-slate-950',
  };
  readonly pageLinks: Record<
    AvatarDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Fallback priority', 'fallbacks'],
      ['Sizes and shapes', 'sizes'],
      ['Responsive image', 'responsive-image'],
      ['Error recovery', 'error-recovery'],
      ['Badges', 'badges'],
      ['AvatarGroup', 'group'],
      ['Unstyled', 'unstyled'],
      ['Boundaries', 'boundaries'],
    ],
    accessibility: [
      ['Image alternatives', 'image-alternatives'],
      ['Fallback semantics', 'fallback-semantics'],
      ['Groups', 'group-semantics'],
      ['Badges', 'badge-semantics'],
      ['RTL', 'rtl'],
    ],
    api: [
      ['Avatar inputs', 'avatar-inputs'],
      ['Avatar outputs', 'avatar-outputs'],
      ['AvatarGroup inputs', 'group-inputs'],
      ['Class slots', 'class-slots'],
    ],
    tokens: [
      ['Avatar tokens', 'avatar-tokens'],
      ['Group tokens', 'group-tokens'],
    ],
  };

  readonly importCode = `import {
  NeuralAvatar,
  NeuralAvatarGroup,
} from '@neural-ng/core/avatar';

@Component({ imports: [NeuralAvatar, NeuralAvatarGroup] })`;
  readonly fallbackCode = `<neural-avatar src="/avatar-ada.svg" name="Ada Lovelace" size="extra-large" />
<neural-avatar name="Grace Hopper" size="extra-large" />
<neural-avatar initials="MH" ariaLabel="Margaret Hamilton" size="extra-large" />
<neural-avatar iconClass="nt nt-user" ariaLabel="Account" size="extra-large" />
<neural-avatar ariaLabel="Neural AI" size="extra-large"><strong>AI</strong></neural-avatar>`;
  readonly sizesCode = `<neural-avatar name="Extra Small" size="extra-small" />
<neural-avatar name="Small Avatar" size="small" />
<neural-avatar name="Medium Avatar" size="medium" />
<neural-avatar name="Large Avatar" size="large" shape="rounded" />
<neural-avatar name="Extra Large" size="extra-large" shape="square" />`;
  readonly responsiveCode = `<neural-avatar
  src="/users/ada.webp"
  srcSet="/users/ada.webp 1x, /users/ada@2x.webp 2x"
  sizes="64px"
  name="Ada Lovelace"
  imageFit="cover"
  loading="lazy"
  decoding="async"
  fetchPriority="auto"
  referrerPolicy="no-referrer"
  (imageLoaded)="loaded($event)"
  (imageError)="failed($event)"
/>`;
  readonly badgeCode = `import { NeuralBadgeDirective } from '@neural-ng/core/badge';

<neural-avatar name="Ada Lovelace" neuralBadgeDot
  neuralBadgePosition="bottom-end" neuralBadgeSeverity="success"
  neuralBadgeAriaLabel="Online" />

<neural-avatar name="Grace Hopper" [neuralBadge]="5"
  neuralBadgePosition="top-end" neuralBadgeSeverity="error"
  neuralBadgeAriaLabel="5 unread notifications" />`;
  readonly groupCode = `<neural-avatar-group
  [max]="3"
  ariaLabel="Project team"
  overflowLabel="{count} more teammates"
>
  <neural-avatar name="Ada Lovelace" />
  <neural-avatar name="Grace Hopper" />
  <neural-avatar name="Margaret Hamilton" />
  <neural-avatar name="Radia Perlman" />
</neural-avatar-group>`;
  readonly unstyledCode = `<neural-avatar name="Neural Technology" unstyled [classes]="avatarClasses" />

<neural-avatar-group [max]="2" unstyled [classes]="groupClasses">
  <neural-avatar name="Ada Lovelace" unstyled [classes]="avatarClasses" />
  <neural-avatar name="Grace Hopper" unstyled [classes]="avatarClasses" />
  <neural-avatar name="Margaret Hamilton" unstyled [classes]="avatarClasses" />
</neural-avatar-group>`;
  readonly avatarInputs = [
    [
      'src',
      'string | null',
      'null',
      'Image source; blank values use fallback.',
    ],
    ['srcSet', 'string | null', 'null', 'Native responsive srcset.'],
    ['sizes', 'string | null', 'null', 'Native responsive sizes hint.'],
    [
      'alt',
      'string | null',
      'name',
      'Native image alternative; empty marks decorative.',
    ],
    [
      'name',
      'string | null',
      'null',
      'Fallback initials and accessible identity.',
    ],
    ['initials', 'string | null', 'derived', 'Explicit fallback initials.'],
    [
      'ariaLabel',
      'string | null',
      'name/alt',
      'Fallback accessible name override.',
    ],
    [
      'iconClass',
      'string | null',
      'null',
      'Optional class-based fallback icon.',
    ],
    [
      'size',
      'extra-small | small | medium | large | extra-large',
      "'medium'",
      'Preset dimensions and type scale.',
    ],
    [
      'shape',
      'circle | rounded | square',
      "'circle'",
      'Avatar corner treatment.',
    ],
    [
      'imageFit',
      'cover | contain',
      "'cover'",
      'Native object-fit token value.',
    ],
    ['loading', 'eager | lazy', "'lazy'", 'Native image loading strategy.'],
    ['decoding', 'sync | async | auto', "'async'", 'Native decoding hint.'],
    [
      'fetchPriority',
      'high | low | auto',
      "'auto'",
      'Native fetch priority hint.',
    ],
    ['referrerPolicy', 'string | null', 'null', 'Native referrer policy.'],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['avatarClass', 'string', "''", 'Additive root class.'],
    ['classes', 'NeuralAvatarClasses', '{}', 'Typed additive visual slots.'],
  ] as const;
  readonly avatarOutputs = [
    [
      'imageLoaded',
      'Event',
      'Native image load event after state becomes loaded.',
    ],
    [
      'imageError',
      'Event',
      'Native image error before fallback becomes visible.',
    ],
  ] as const;
  readonly groupInputs = [
    ['max', 'number | null', 'null', 'Maximum visible projected avatars.'],
    [
      'ariaLabel',
      'string | null',
      'null',
      'Names the optional group landmark.',
    ],
    [
      'overflowLabel',
      'string',
      "'{count} more avatars'",
      'Localized overflow accessible label.',
    ],
    ['unstyled', 'boolean', 'false', 'Removes group visual classes.'],
    ['groupClass', 'string', "''", 'Additive group root class.'],
    ['classes', 'NeuralAvatarGroupClasses', '{}', 'Typed group slots.'],
  ] as const;
  readonly avatarSlots = [
    'root',
    'image',
    'fallback',
    'initials',
    'icon',
    'content',
  ] as const;
  readonly groupSlots = ['root', 'overflow'] as const;
  readonly avatarTokens = [
    '--neural-avatar-current-size',
    '--neural-avatar-color',
    '--neural-avatar-background',
    '--neural-avatar-border',
    '--neural-avatar-shadow',
    '--neural-avatar-font-family',
    '--neural-avatar-font-size',
    '--neural-avatar-font-weight',
    '--neural-avatar-extra-small-size',
    '--neural-avatar-small-size',
    '--neural-avatar-medium-size',
    '--neural-avatar-large-size',
    '--neural-avatar-extra-large-size',
    '--neural-avatar-extra-small-font-size',
    '--neural-avatar-small-font-size',
    '--neural-avatar-medium-font-size',
    '--neural-avatar-large-font-size',
    '--neural-avatar-extra-large-font-size',
    '--neural-avatar-circle-radius',
    '--neural-avatar-rounded-radius',
    '--neural-avatar-square-radius',
    '--neural-avatar-image-fit',
    '--neural-avatar-image-position',
    '--neural-avatar-fallback-color',
    '--neural-avatar-fallback-background',
    '--neural-avatar-icon-size',
  ] as const;
  readonly groupTokens = [
    '--neural-avatar-group-overlap',
    '--neural-avatar-group-ring-color',
    '--neural-avatar-group-avatar-ring',
    '--neural-avatar-group-overflow-size',
    '--neural-avatar-group-overflow-color',
    '--neural-avatar-group-overflow-background',
    '--neural-avatar-group-overflow-border',
    '--neural-avatar-group-overflow-radius',
    '--neural-avatar-group-overflow-ring',
    '--neural-avatar-group-overflow-font-size',
    '--neural-avatar-group-overflow-font-weight',
  ] as const;

  constructor() {
    const subscription = this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) =>
        this.selectedView.set(resolveView(event.urlAfterRedirects)),
      );
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  markImageError(): void {
    this.imageEvent.set('imageError emitted; initials fallback is active.');
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/avatar${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveView(url: string): AvatarDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is AvatarDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
