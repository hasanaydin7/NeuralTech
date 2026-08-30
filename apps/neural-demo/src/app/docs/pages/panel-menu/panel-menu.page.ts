import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { NeuralMessageService } from '@neural-ng/core/message';
import {
  PanelMenuComponent,
  PanelMenuItemComponent,
  PanelMenuSeparatorComponent,
  type NeuralPanelMenuClasses,
  type NeuralPanelMenuEntry,
  type NeuralPanelMenuSelect,
} from '@neural-ng/core/panel-menu';
import { ToastComponent } from '@neural-ng/core/toast';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-panel-menu-page',
  imports: [
    CodeExample,
    PanelMenuComponent,
    PanelMenuItemComponent,
    PanelMenuSeparatorComponent,
    ToastComponent,
  ],
  templateUrl: './panel-menu.page.html',
  styleUrls: ['./panel-menu.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelMenuPage {
  private readonly messages = inject(NeuralMessageService);
  readonly expandedKeys = signal<readonly string[]>(['workspace']);
  readonly multipleKeys = signal<readonly string[]>(['workspace', 'cloud']);
  readonly projectedKeys = signal<readonly string[]>(['account']);
  readonly headlessKeys = signal<readonly string[]>(['runtime']);
  readonly lastSelection = signal('none');
  readonly lastToggle = signal('none');
  readonly items: readonly NeuralPanelMenuEntry[] = [
    {
      key: 'workspace',
      label: 'Workspace',
      iconClass: 'nt nt-folders',
      badge: 3,
      items: [
        {
          key: 'documents',
          label: 'Documents',
          iconClass: 'nt nt-file-text',
          shortcut: '⌘ D',
        },
        {
          key: 'media',
          label: 'Media',
          iconClass: 'nt nt-photo',
          items: [
            { key: 'images', label: 'Images', badge: 12 },
            { key: 'video', label: 'Video', disabled: true },
          ],
        },
      ],
    },
    {
      key: 'cloud',
      label: 'Cloud',
      iconClass: 'nt nt-cloud',
      items: [
        { key: 'deployments', label: 'Deployments' },
        { key: 'activity', label: 'Activity', shortcut: '⌘ A' },
      ],
    },
    { separator: true },
    {
      key: 'settings',
      label: 'Settings',
      iconClass: 'nt nt-settings',
      items: [
        { key: 'profile', label: 'Profile', iconClass: 'nt nt-user' },
        { key: 'security', label: 'Security', iconClass: 'nt nt-shield' },
      ],
    },
  ];
  readonly headlessClasses: NeuralPanelMenuClasses = {
    root: 'docs-headless-panel-menu',
    item: 'docs-headless-panel-menu__item',
    expandedItem: 'docs-headless-panel-menu__item--open',
    disabledItem: 'docs-headless-panel-menu__item--disabled',
    icon: 'docs-headless-panel-menu__icon',
    label: 'docs-headless-panel-menu__label',
    meta: 'docs-headless-panel-menu__meta',
    indicator: 'docs-headless-panel-menu__indicator',
    group: 'docs-headless-panel-menu__group',
    groupInner: 'docs-headless-panel-menu__group-inner',
    separator: 'docs-headless-panel-menu__separator',
  };
  readonly importCode = `import {
  PanelMenuComponent,
  type NeuralPanelMenuEntry,
} from '@neural-ng/core/panel-menu';`;
  readonly dataCode = `<neural-panel-menu
  ariaLabel="Workspace navigation"
  [items]="items"
  [(expandedKeys)]="expandedKeys"
  (itemSelect)="run($event)"
/>`;
  readonly projectedCode = `<neural-panel-menu ariaLabel="Account">
  <neural-panel-menu-item
    key="account"
    label="Account"
    iconClass="nt nt-user"
  >
    <neural-panel-menu-item key="profile" label="Profile" />
    <neural-panel-menu-separator />
    <neural-panel-menu-item key="billing" label="Billing" disabled />
  </neural-panel-menu-item>
</neural-panel-menu>`;

  select(event: NeuralPanelMenuSelect): void {
    this.lastSelection.set(event.key);
    this.messages.notify({
      channel: 'panel-menu-docs',
      severity: 'info',
      title: 'PanelMenu selection',
      message: `${event.item.label} selected from the inline hierarchy.`,
    });
  }
}
