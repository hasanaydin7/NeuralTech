import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideNeuralNg } from '../src/neural-ng.config';
import {
  NeuralPanelMenu,
  NeuralPanelMenuItem,
  NeuralPanelMenuSeparator,
} from './panel-menu.component';
import type {
  NeuralPanelMenuClasses,
  NeuralPanelMenuEntry,
  NeuralPanelMenuSelect,
  NeuralPanelMenuToggle,
} from './panel-menu.types';

const ITEMS: readonly NeuralPanelMenuEntry[] = [
  {
    key: 'files',
    label: 'Files',
    iconClass: 'nt nt-folder',
    badge: 2,
    items: [
      { key: 'new', label: 'New file', shortcut: '⌘ N' },
      { key: 'locked', label: 'Locked file', disabled: true },
    ],
  },
  { separator: true },
  {
    key: 'settings',
    label: 'Settings',
    items: [{ key: 'profile', label: 'Profile', href: '/profile' }],
  },
];

@Component({
  imports: [NeuralPanelMenu],
  template: `
    <neural-panel-menu
      panelMenuId="workspace"
      ariaLabel="Workspace"
      [items]="items"
      [(expandedKeys)]="expandedKeys"
      [multiple]="multiple()"
      [unstyled]="unstyled()"
      [classes]="classes"
      (itemSelect)="selections.push($event)"
      (itemToggle)="toggles.push($event)"
    />
  `,
})
class DataPanelMenuHost {
  readonly items = ITEMS;
  readonly expandedKeys = signal<readonly string[]>([]);
  readonly multiple = signal(false);
  readonly unstyled = signal(false);
  readonly selections: NeuralPanelMenuSelect[] = [];
  readonly toggles: NeuralPanelMenuToggle[] = [];
  readonly classes: NeuralPanelMenuClasses = {
    root: 'slot-root',
    list: 'slot-list',
    itemContainer: 'slot-container',
    item: 'slot-item',
    expandedItem: 'slot-expanded',
    disabledItem: 'slot-disabled',
    icon: 'slot-icon',
    label: 'slot-label',
    meta: 'slot-meta',
    badge: 'slot-badge',
    shortcut: 'slot-shortcut',
    indicator: 'slot-indicator',
    group: 'slot-group',
    groupInner: 'slot-group-inner',
    separator: 'slot-separator',
  };
}

@Component({
  imports: [NeuralPanelMenu, NeuralPanelMenuItem, NeuralPanelMenuSeparator],
  template: `
    <neural-panel-menu
      panelMenuId="projected"
      ariaLabel="Projected"
      [(expandedKeys)]="expandedKeys"
      (itemSelect)="selections.push($event)"
    >
      <neural-panel-menu-item
        key="account"
        label="Account"
        iconClass="nt nt-user"
      >
        <neural-panel-menu-item key="security" label="Security" />
        <neural-panel-menu-separator />
        <neural-panel-menu-item key="billing" label="Billing" disabled />
      </neural-panel-menu-item>
    </neural-panel-menu>
  `,
})
class ProjectedPanelMenuHost {
  readonly expandedKeys = signal<readonly string[]>([]);
  readonly selections: NeuralPanelMenuSelect[] = [];
}

@Component({ template: 'Destination' })
class RouterDestination {}

@Component({
  imports: [NeuralPanelMenu],
  template: `<neural-panel-menu ariaLabel="Application" [items]="items" />`,
})
class RouterPanelMenuHost {
  readonly items: readonly NeuralPanelMenuEntry[] = [
    {
      key: 'destination',
      label: 'Destination',
      routerLink: ['/destination', 42],
      queryParams: { source: 'panel-menu' },
      fragment: 'details',
    },
  ];
}

describe('PanelMenu', () => {
  async function createDataHost(
    providers: ReturnType<typeof provideNeuralNg>[] = [],
  ) {
    await TestBed.configureTestingModule({
      imports: [DataPanelMenuHost],
      providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(DataPanelMenuHost);
    fixture.detectChanges();
    return fixture;
  }

  it('renders a recursive accessible tree with metadata and visual separators', async () => {
    const fixture = await createDataHost();
    const tree = fixture.nativeElement.querySelector(
      '[role="tree"]',
    ) as HTMLElement;
    const files = fixture.nativeElement.querySelector(
      '[data-key="files"]',
    ) as HTMLButtonElement;
    const group = fixture.nativeElement.querySelector(
      '#workspace-group-files',
    ) as HTMLElement;

    expect(tree.getAttribute('aria-label')).toBe('Workspace');
    expect(files.getAttribute('aria-level')).toBe('1');
    expect(files.getAttribute('aria-expanded')).toBe('false');
    expect(files.getAttribute('aria-controls')).toBe('workspace-group-files');
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-labelledby')).toBe('workspace-item-files');
    expect(group.hasAttribute('inert')).toBe(true);
    const separator = fixture.nativeElement.querySelector(
      '.neural-panel-menu-separator-root',
    ) as HTMLElement;
    expect(separator.getAttribute('role')).toBe('presentation');
    expect(separator.getAttribute('aria-hidden')).toBe('true');
    expect(
      fixture.nativeElement.querySelector('.slot-badge').textContent,
    ).toContain('2');
    expect(
      fixture.nativeElement.querySelector('[data-key="locked"]').disabled,
    ).toBe(true);
  });

  it('controls exclusive root expansion and emits detailed toggles', async () => {
    const fixture = await createDataHost();
    const files = fixture.nativeElement.querySelector(
      '[data-key="files"]',
    ) as HTMLButtonElement;
    const settings = fixture.nativeElement.querySelector(
      '[data-key="settings"]',
    ) as HTMLButtonElement;

    files.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();
    expect(fixture.componentInstance.expandedKeys()).toEqual(['files']);
    expect(fixture.componentInstance.toggles[0]).toMatchObject({
      key: 'files',
      expanded: true,
      previousExpandedKeys: [],
      source: 'pointer',
    });

    settings.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.expandedKeys()).toEqual(['settings']);

    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    files.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.expandedKeys()).toEqual([
      'settings',
      'files',
    ]);
  });

  it('clears every descendant key when its root branch closes', async () => {
    const fixture = await createDataHost();
    fixture.componentInstance.expandedKeys.set(['files', 'new']);
    fixture.detectChanges();
    const files = fixture.nativeElement.querySelector(
      '[data-key="files"]',
    ) as HTMLButtonElement;

    files.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.expandedKeys()).toEqual([]);
  });

  it('emits leaf selection without requiring an event import for binding', async () => {
    const fixture = await createDataHost();
    const files = fixture.nativeElement.querySelector(
      '[data-key="files"]',
    ) as HTMLButtonElement;
    files.click();
    fixture.detectChanges();
    const leaf = fixture.nativeElement.querySelector(
      '[data-key="new"]',
    ) as HTMLButtonElement;
    leaf.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();

    expect(fixture.componentInstance.selections).toHaveLength(1);
    expect(fixture.componentInstance.selections[0]).toMatchObject({
      key: 'new',
      source: 'pointer',
    });
  });

  it('navigates the visible tree and skips disabled items', async () => {
    const fixture = await createDataHost();
    const files = fixture.nativeElement.querySelector(
      '[data-key="files"]',
    ) as HTMLButtonElement;
    files.focus();
    files.dispatchEvent(keydown('ArrowRight'));
    fixture.detectChanges();
    await Promise.resolve();

    const newFile = fixture.nativeElement.querySelector(
      '[data-key="new"]',
    ) as HTMLButtonElement;
    expect(fixture.componentInstance.expandedKeys()).toEqual(['files']);

    files.dispatchEvent(keydown('ArrowDown'));
    expect(document.activeElement).toBe(newFile);
    newFile.dispatchEvent(keydown('ArrowDown'));
    expect((document.activeElement as HTMLElement).dataset['key']).toBe(
      'settings',
    );
    (document.activeElement as HTMLElement).dispatchEvent(keydown('Home'));
    expect(document.activeElement).toBe(files);
  });

  it('supports projected nested items and derives their hierarchy', async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectedPanelMenuHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProjectedPanelMenuHost);
    fixture.detectChanges();
    const account = fixture.nativeElement.querySelector(
      '[data-key="account"]',
    ) as HTMLButtonElement;
    account.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.expandedKeys()).toEqual(['account']);
    const security = fixture.nativeElement.querySelector(
      '[data-key="security"]',
    ) as HTMLButtonElement;
    expect(security.getAttribute('aria-level')).toBe('2');
    security.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selections[0]?.key).toBe('security');
  });

  it('uses Angular RouterLink for SPA leaf navigation', async () => {
    await TestBed.configureTestingModule({
      imports: [RouterPanelMenuHost],
      providers: [
        provideRouter([
          { path: 'destination/:id', component: RouterDestination },
        ]),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(RouterPanelMenuHost);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const link = fixture.nativeElement.querySelector(
      '[data-key="destination"]',
    ) as HTMLAnchorElement;

    expect(link.getAttribute('href')).toContain(
      '/destination/42?source=panel-menu#details',
    );
    link.click();
    await fixture.whenStable();

    expect(router.url).toBe('/destination/42?source=panel-menu#details');
  });

  it('retains structural and consumer classes in local and global unstyled modes', async () => {
    const fixture = await createDataHost();
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.neural-panel-menu-root');
    const item = fixture.nativeElement.querySelector('[data-key="files"]');
    expect(root.classList).toContain('slot-root');
    expect(root.classList).not.toContain('neural-panel-menu-base');
    expect(item.classList).toContain('slot-item');
    expect(item.classList).not.toContain('neural-panel-menu-item-base');

    TestBed.resetTestingModule();
    const globalFixture = await createDataHost([
      provideNeuralNg({ unstyled: true }),
    ]);
    expect(
      globalFixture.nativeElement.querySelector('.neural-panel-menu-base'),
    ).toBeNull();
  });
});

function keydown(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
}
