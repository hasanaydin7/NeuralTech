import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralButton } from '../button';
import {
  NeuralMenu,
  NeuralMenuGroup,
  NeuralMenuItem,
  NeuralMenuSeparatorItem,
} from './menu.component';
import { NeuralMenuTrigger } from './menu-trigger.directive';
import type {
  NeuralMenuClasses,
  NeuralMenuEntry,
  NeuralMenuSelect,
} from './menu.types';

const ITEMS: readonly NeuralMenuEntry[] = [
  {
    key: 'profile',
    label: 'Profile',
    iconClass: 'nt-user',
    shortcut: 'Ctrl P',
  },
  { key: 'notifications', label: 'Notifications', badge: 4 },
  { separator: true },
  { key: 'locked', label: 'Locked', disabled: true },
  { key: 'docs', label: 'Documentation', href: '/docs' },
];

@Component({
  imports: [NeuralMenu],
  template: `
    <neural-menu
      menuId="actions"
      ariaLabel="Actions"
      [items]="items"
      [unstyled]="unstyled()"
      [classes]="classes"
      (itemSelect)="selections.push($event)"
    />
  `,
})
class DataMenuHost {
  readonly items = ITEMS;
  readonly unstyled = signal(false);
  readonly selections: NeuralMenuSelect[] = [];
  readonly classes: NeuralMenuClasses = {
    root: 'slot-root',
    list: 'slot-list',
    item: 'slot-item',
    disabledItem: 'slot-disabled',
    icon: 'slot-icon',
    label: 'slot-label',
    meta: 'slot-meta',
    badge: 'slot-badge',
    shortcut: 'slot-shortcut',
    separator: 'slot-separator',
  };
}

@Component({
  imports: [
    NeuralMenu,
    NeuralMenuItem,
    NeuralMenuSeparatorItem,
    NeuralMenuTrigger,
    NeuralButton,
  ],
  template: `
    <neural-button label="Account" [neuralMenuTriggerFor]="popupMenu" />
    <neural-menu
      #popupMenu="neuralMenu"
      menuId="account-menu"
      ariaLabel="Account actions"
      popup
      [(open)]="open"
      (itemSelect)="selections.push($event)"
    >
      <neural-menu-item key="profile" label="Profile" iconClass="nt-user" />
      <neural-menu-separator />
      <neural-menu-item key="logout" label="Log out" />
    </neural-menu>
  `,
})
class PopupMenuHost {
  readonly open = signal(false);
  readonly selections: NeuralMenuSelect[] = [];
}

@Component({ template: 'Destination' })
class DestinationHost {}

@Component({
  imports: [NeuralMenu],
  template: `<neural-menu
    [items]="items"
    (itemSelect)="selections.push($event)"
  />`,
})
class RouterMenuHost {
  readonly selections: NeuralMenuSelect[] = [];
  readonly items: readonly NeuralMenuEntry[] = [
    {
      key: 'destination',
      label: 'Destination',
      routerLink: ['/destination', 42],
      queryParams: { source: 'menu' },
      fragment: 'details',
      state: { origin: 'test' },
    },
  ];
}

@Component({
  imports: [NeuralMenu, NeuralMenuGroup, NeuralMenuItem],
  template: `
    <neural-menu menuId="grouped-data" [items]="items" />
    <neural-menu menuId="grouped-projected">
      <neural-menu-group key="projects" label="Projects">
        <neural-menu-item key="overview" label="Overview" />
        <neural-menu-item key="activity" label="Activity" />
      </neural-menu-group>
    </neural-menu>
  `,
})
class GroupedMenuHost {
  readonly items: readonly NeuralMenuEntry[] = [
    {
      key: 'workspace',
      label: 'Workspace',
      items: [
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'members', label: 'Members' },
      ],
    },
    {
      key: 'account',
      label: 'Account',
      items: [{ key: 'profile', label: 'Profile' }],
    },
  ];
}

describe('Menu', () => {
  async function createDataHost(
    providers: ReturnType<typeof provideNeuralNg>[] = [],
  ) {
    await TestBed.configureTestingModule({
      imports: [DataMenuHost],
      providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(DataMenuHost);
    fixture.detectChanges();
    return fixture;
  }

  it('renders data and projected category groups without adding focus targets', async () => {
    await TestBed.configureTestingModule({
      imports: [GroupedMenuHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(GroupedMenuHost);
    fixture.detectChanges();

    const dataMenu = fixture.nativeElement.querySelector('#grouped-data');
    const projectedMenu =
      fixture.nativeElement.querySelector('#grouped-projected');
    expect(dataMenu.querySelectorAll('[role="group"]')).toHaveLength(2);
    expect(dataMenu.querySelectorAll('[role="menuitem"]')).toHaveLength(3);
    expect(
      dataMenu.querySelector('[role="group"]').getAttribute('aria-labelledby'),
    ).toBe('grouped-data-group-workspace');
    expect(dataMenu.textContent).toContain('Workspace');
    expect(projectedMenu.querySelectorAll('[role="group"]')).toHaveLength(1);
    expect(projectedMenu.querySelectorAll('[role="menuitem"]')).toHaveLength(2);

    const items = dataMenu.querySelectorAll(
      '[role="menuitem"]',
    ) as NodeListOf<HTMLElement>;
    items[0]?.focus();
    items[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    expect(document.activeElement).toBe(items[1]);
    items[1]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    expect(document.activeElement).toBe(items[2]);
  });

  it('renders accessible data items, metadata, links, and separators', async () => {
    const fixture = await createDataHost();
    const menu = fixture.nativeElement.querySelector(
      '[role="menu"]',
    ) as HTMLElement;
    const profile = fixture.nativeElement.querySelector(
      '[data-key="profile"]',
    ) as HTMLButtonElement;
    const locked = fixture.nativeElement.querySelector(
      '[data-key="locked"]',
    ) as HTMLButtonElement;
    const docs = fixture.nativeElement.querySelector(
      '[data-key="docs"]',
    ) as HTMLAnchorElement;

    expect(menu.getAttribute('aria-label')).toBe('Actions');
    expect(menu.id).toBe('actions');
    expect(profile.classList).toContain('slot-item');
    expect(profile.querySelector('i')?.classList).toContain('nt');
    expect(profile.querySelector('i')?.classList).toContain('nt-user');
    expect(locked.disabled).toBe(true);
    expect(locked.getAttribute('aria-disabled')).toBe('true');
    expect(docs.getAttribute('href')).toBe('/docs');
    expect(
      fixture.nativeElement.querySelector('[role="separator"]'),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('.slot-badge').textContent,
    ).toContain('4');
    expect(
      fixture.nativeElement.querySelector('.slot-shortcut').textContent,
    ).toContain('Ctrl P');
  });

  it('uses Angular RouterLink for data-driven SPA navigation', async () => {
    await TestBed.configureTestingModule({
      imports: [RouterMenuHost],
      providers: [
        provideRouter([
          { path: 'destination/:id', component: DestinationHost },
        ]),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(RouterMenuHost);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector(
      '[data-key="destination"]',
    ) as HTMLAnchorElement;

    expect(link.getAttribute('href')).toBe(
      '/destination/42?source=menu#details',
    );
    link.click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe(
      '/destination/42?source=menu#details',
    );
    expect(fixture.componentInstance.selections).toHaveLength(1);
  });

  it('emits itemSelect while disabled items remain inert', async () => {
    const fixture = await createDataHost();
    const profile = fixture.nativeElement.querySelector(
      '[data-key="profile"]',
    ) as HTMLButtonElement;
    const locked = fixture.nativeElement.querySelector(
      '[data-key="locked"]',
    ) as HTMLButtonElement;

    profile.dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 1 }),
    );
    locked.click();
    expect(fixture.componentInstance.selections).toHaveLength(1);
    expect(fixture.componentInstance.selections[0]).toMatchObject({
      key: 'profile',
      source: 'pointer',
    });
  });

  it('supports arrow, edge, and typeahead keyboard focus', async () => {
    const fixture = await createDataHost();
    const profile = fixture.nativeElement.querySelector(
      '[data-key="profile"]',
    ) as HTMLButtonElement;
    const notifications = fixture.nativeElement.querySelector(
      '[data-key="notifications"]',
    ) as HTMLButtonElement;
    const docs = fixture.nativeElement.querySelector(
      '[data-key="docs"]',
    ) as HTMLAnchorElement;

    profile.focus();
    profile.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    expect(document.activeElement).toBe(notifications);

    notifications.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
    );
    expect(document.activeElement).toBe(docs);

    docs.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'p', bubbles: true }),
    );
    expect(document.activeElement).toBe(profile);
  });

  it('retains structural hooks and consumer slots in unstyled mode', async () => {
    const fixture = await createDataHost();
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector(
      '[role="menu"]',
    ) as HTMLElement;
    const item = fixture.nativeElement.querySelector(
      '[data-key="profile"]',
    ) as HTMLElement;
    expect(root.classList).toContain('neural-menu-root');
    expect(root.classList).toContain('slot-root');
    expect(root.classList).not.toContain('neural-menu-base');
    expect(item.classList).toContain('neural-menu-item-root');
    expect(item.classList).not.toContain('neural-menu-item-base');
  });

  it('honors global unstyled configuration', async () => {
    const fixture = await createDataHost([provideNeuralNg({ unstyled: true })]);
    expect(
      fixture.nativeElement
        .querySelector('[role="menu"]')
        .classList.contains('neural-menu-base'),
    ).toBe(false);
  });

  it('connects a popup trigger, manages focus, and restores it on Escape', async () => {
    await TestBed.configureTestingModule({
      imports: [PopupMenuHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(PopupMenuHost);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      'neural-button button',
    ) as HTMLButtonElement;
    const menu = fixture.nativeElement.querySelector(
      '[role="menu"]',
    ) as HTMLElement;

    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(menu.hidden).toBe(false);
    expect(document.activeElement?.getAttribute('data-key')).toBe('profile');

    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(fixture.componentInstance.open()).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('selects projected popup items and closes after selection', async () => {
    await TestBed.configureTestingModule({
      imports: [PopupMenuHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(PopupMenuHost);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      'neural-button button',
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    const profile = fixture.nativeElement.querySelector(
      '[data-key="profile"]',
    ) as HTMLButtonElement;
    profile.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selections[0]?.key).toBe('profile');
    expect(fixture.componentInstance.open()).toBe(false);
  });
});
