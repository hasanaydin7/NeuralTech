import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { NeuralMessageService } from '@neural-ng/core/message';
import {
  MenuComponent,
  MenuItemComponent,
  MenuSeparatorComponent,
  MenuTriggerDirective,
  type NeuralMenuClasses,
  type NeuralMenuEntry,
  type NeuralMenuSelect,
} from '@neural-ng/core/menu';
import { ToastComponent } from '@neural-ng/core/toast';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-menu-page',
  imports: [
    CodeExample,
    MenuComponent,
    MenuItemComponent,
    MenuSeparatorComponent,
    MenuTriggerDirective,
    ToastComponent,
  ],
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPage {
  private readonly messages = inject(NeuralMessageService);
  readonly popupOpen = signal(false);
  readonly lastSelection = signal('none');
  readonly items: readonly NeuralMenuEntry[] = [
    {
      key: 'profile',
      label: 'Profile',
      iconClass: 'nt-user',
      shortcut: 'Ctrl P',
    },
    {
      key: 'notifications',
      label: 'Notifications',
      iconClass: 'nt-bell',
      badge: 4,
    },
    { key: 'settings', label: 'Settings', iconClass: 'nt-settings' },
    { separator: true },
    {
      key: 'documentation',
      label: 'Documentation',
      iconClass: 'nt-external-link',
      href: '/docs/getting-started/installation',
    },
    { key: 'locked', label: 'Locked action', disabled: true },
  ];
  readonly headlessClasses: NeuralMenuClasses = {
    root: 'docs-headless-menu',
    list: 'docs-headless-menu__list',
    item: 'docs-headless-menu__item',
    disabledItem: 'docs-headless-menu__item--disabled',
    icon: 'docs-headless-menu__icon',
    label: 'docs-headless-menu__label',
    meta: 'docs-headless-menu__meta',
    badge: 'docs-headless-menu__badge',
    shortcut: 'docs-headless-menu__shortcut',
    separator: 'docs-headless-menu__separator',
  };
  readonly importCode = `import {
  MenuComponent,
  MenuTriggerDirective,
  type NeuralMenuEntry,
} from '@neural-ng/core/menu';`;
  readonly inlineCode = `<neural-menu
  ariaLabel="Workspace actions"
  [items]="items"
  (itemSelect)="run($event)"
/>`;
  readonly popupCode = `<button [neuralMenuTriggerFor]="accountMenu">
  Open account menu
</button>

<neural-menu
  #accountMenu="neuralMenu"
  popup
  [items]="items"
  [(open)]="popupOpen"
  (itemSelect)="run($event)"
/>`;

  select(event: NeuralMenuSelect): void {
    this.lastSelection.set(event.key);
    this.messages.notify({
      channel: 'menu-docs',
      severity: 'info',
      title: 'Menu command',
      message: `${event.item.label} selected by ${event.source}.`,
    });
  }
}
