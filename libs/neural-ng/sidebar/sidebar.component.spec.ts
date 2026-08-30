import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuralMenu, type NeuralMenuEntry } from '../menu';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralPanelMenu, type NeuralPanelMenuEntry } from '../panel-menu';
import {
  NeuralSidebar,
  NeuralSidebarContent,
  NeuralSidebarFooter,
  NeuralSidebarHeader,
  NeuralSidebarInitialFocus,
  NeuralSidebarLabel,
  NeuralSidebarLayout,
  NeuralSidebarMain,
  NeuralSidebarTrigger,
} from './sidebar.component';
import type {
  NeuralSidebarClasses,
  NeuralSidebarHoverChange,
  NeuralSidebarStateChange,
} from './sidebar.types';

@Component({
  imports: [
    NeuralSidebar,
    NeuralSidebarContent,
    NeuralSidebarFooter,
    NeuralSidebarHeader,
    NeuralSidebarInitialFocus,
    NeuralSidebarLabel,
    NeuralSidebarLayout,
    NeuralSidebarMain,
    NeuralSidebarTrigger,
    NeuralMenu,
    NeuralPanelMenu,
  ],
  template: `
    <button
      id="external"
      type="button"
      [neuralSidebarTrigger]="'workspace-nav'"
    >
      Toggle navigation
    </button>
    <neural-sidebar-layout [unstyled]="unstyled">
      <neural-sidebar
        #sidebar
        id="workspace-nav"
        [(open)]="open"
        [responsive]="false"
        [overlay]="overlay()"
        [showBackdrop]="showBackdrop()"
        [blockScroll]="blockScroll()"
        [openOnHover]="openOnHover()"
        [hoverOpenDelay]="0"
        [hoverCloseDelay]="0"
        variant="floating"
        [collapseMode]="collapseMode()"
        ariaLabel="Workspace navigation"
        sidebarClass="consumer-panel"
        [classes]="classes"
        [unstyled]="unstyled"
        (stateChange)="changes.push($event)"
        (hoverChange)="hoverChanges.push($event)"
      >
        <neural-sidebar-header headerClass="local-header">
          <span neuralSidebarLabel>NeuralNg</span>
        </neural-sidebar-header>
        <neural-sidebar-content contentClass="local-content">
          <neural-panel-menu [items]="navigation" />
          <neural-menu ariaLabel="Quick navigation" [items]="quickNavigation" />
          <button id="first-action" type="button">Dashboard</button>
          <button id="last-action" neuralSidebarInitialFocus type="button">
            Settings
          </button>
        </neural-sidebar-content>
        <neural-sidebar-footer footerClass="local-footer"
          >Account</neural-sidebar-footer
        >
      </neural-sidebar>
      <main neuralSidebarMain>Content</main>
    </neural-sidebar-layout>
  `,
})
class SidebarTestHost {
  readonly sidebar = viewChild.required(NeuralSidebar);
  readonly open = signal(true);
  readonly overlay = signal(false);
  readonly showBackdrop = signal(true);
  readonly blockScroll = signal(true);
  readonly openOnHover = signal(false);
  readonly collapseMode = signal<'none' | 'icon' | 'offcanvas'>('icon');
  readonly navigation: readonly NeuralPanelMenuEntry[] = [
    {
      key: 'workspace',
      label: 'Workspace',
      iconClass: 'nt nt-layout-grid',
      items: [
        { key: 'overview', label: 'Overview' },
        {
          key: 'media',
          label: 'Media',
          items: [{ key: 'images', label: 'Images' }],
        },
      ],
    },
    {
      key: 'cloud',
      label: 'Cloud',
      iconClass: 'nt nt-cloud',
      items: [{ key: 'deployments', label: 'Deployments' }],
    },
  ];
  readonly quickNavigation: readonly NeuralMenuEntry[] = [
    {
      key: 'search',
      label: 'Search',
      iconClass: 'nt nt-search',
      shortcut: 'Ctrl K',
    },
    { separator: true },
    {
      key: 'account',
      label: 'Account',
      items: [{ key: 'profile', label: 'Profile', iconClass: 'nt nt-user' }],
    },
  ];
  unstyled = false;
  changes: NeuralSidebarStateChange[] = [];
  hoverChanges: NeuralSidebarHoverChange[] = [];
  classes: NeuralSidebarClasses = {
    root: 'slot-layout',
    backdrop: 'slot-backdrop',
    panel: 'slot-panel',
    header: 'slot-header',
    content: 'slot-content',
    footer: 'slot-footer',
  };
}

describe('NeuralSidebar', () => {
  async function createHost(
    providers: ReturnType<typeof provideNeuralNg>[] = [],
  ) {
    await TestBed.configureTestingModule({
      imports: [SidebarTestHost],
      providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(SidebarTestHost);
    fixture.detectChanges();
    return fixture;
  }

  it('renders an application shell with logical placement and typed classes', async () => {
    const fixture = await createHost();
    const panel = fixture.nativeElement.querySelector('aside') as HTMLElement;
    expect(panel.id).toBe('workspace-nav');
    expect(
      fixture.nativeElement.querySelectorAll('#workspace-nav'),
    ).toHaveLength(1);
    expect(panel.getAttribute('aria-label')).toBe('Workspace navigation');
    expect(panel.dataset['side']).toBe('start');
    expect(panel.dataset['variant']).toBe('floating');
    expect(panel.dataset['mode']).toBe('icon');
    expect(panel.classList).toContain('neural-sidebar-panel-base');
    expect(panel.classList).toContain('consumer-panel');
    expect(panel.classList).toContain('slot-panel');
    expect(fixture.nativeElement.querySelector('header').classList).toContain(
      'slot-header',
    );
    expect(fixture.nativeElement.querySelector('footer').classList).toContain(
      'slot-footer',
    );
    expect(
      fixture.nativeElement.querySelector('[neuralSidebarMain]').classList,
    ).toContain('neural-sidebar-main-root');
  });

  it('connects an external trigger to the controlled open model', async () => {
    const fixture = await createHost();
    const trigger = fixture.nativeElement.querySelector(
      '#external',
    ) as HTMLButtonElement;
    expect(trigger.getAttribute('aria-controls')).toBe('workspace-nav');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.dataset['sidebarOpen']).toBe('true');

    trigger.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.dataset['sidebarOpen']).toBe('false');
    expect(
      (fixture.nativeElement.querySelector('aside') as HTMLElement).dataset[
        'open'
      ],
    ).toBe('false');
    expect(latest(fixture.componentInstance.changes)).toMatchObject({
      open: false,
      mode: 'icon',
      reason: 'trigger',
    });
  });

  it('dismisses an overlay with backdrop and Escape', async () => {
    const fixture = await createHost();
    fixture.componentInstance.overlay.set(true);
    fixture.detectChanges();
    const backdrop = fixture.nativeElement.querySelector(
      '.neural-sidebar-backdrop-root',
    ) as HTMLButtonElement;
    expect(backdrop).toBeTruthy();
    expect(document.body.style.overflow).toBe('hidden');
    backdrop.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(document.body.style.overflow).toBe('');
    expect(latest(fixture.componentInstance.changes)?.reason).toBe('backdrop');

    fixture.componentInstance.sidebar().show();
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('aside') as HTMLElement;
    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(latest(fixture.componentInstance.changes)?.reason).toBe('escape');
  });

  it('keeps structural hooks in local and global unstyled modes', async () => {
    const fixture = await createHost([provideNeuralNg({ unstyled: true })]);
    const panel = fixture.nativeElement.querySelector('aside') as HTMLElement;
    expect(panel.classList).toContain('neural-sidebar-panel-root');
    expect(panel.classList).not.toContain('neural-sidebar-panel-base');
    expect(
      fixture.nativeElement.querySelector('.neural-sidebar-content-root')
        .classList,
    ).not.toContain('neural-sidebar-content-base');
    expect(
      fixture.nativeElement.querySelector('[neuralSidebarMain]').classList,
    ).not.toContain('neural-sidebar-main-base');
  });

  it('exposes clean icon-rail labels and honors the preferred overlay focus target', async () => {
    const fixture = await createHost();
    expect(
      fixture.nativeElement.querySelector('[neuralSidebarLabel]').classList,
    ).toContain('neural-sidebar-label-root');

    fixture.componentInstance.overlay.set(true);
    fixture.componentInstance.sidebar().close();
    fixture.detectChanges();
    fixture.componentInstance.sidebar().show();
    fixture.detectChanges();
    await Promise.resolve();

    expect(document.activeElement?.id).toBe('last-action');
  });

  it('can keep document scrolling available for non-blocking overlays', async () => {
    const fixture = await createHost();
    fixture.componentInstance.overlay.set(true);
    fixture.componentInstance.blockScroll.set(false);
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('');
  });

  it('can render an overlay without a visual backdrop', async () => {
    const fixture = await createHost();
    fixture.componentInstance.overlay.set(true);
    fixture.componentInstance.showBackdrop.set(false);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.neural-sidebar-backdrop-root'),
    ).toBeNull();
    expect(
      (fixture.nativeElement.querySelector('aside') as HTMLElement).dataset[
        'open'
      ],
    ).toBe('true');
  });

  it('opens child navigation as an accessible flyout in collapsed icon mode', async () => {
    const fixture = await createHost();
    fixture.componentInstance.sidebar().close();
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('aside') as HTMLElement;
    const rootItem = fixture.nativeElement.querySelector(
      '.neural-panel-menu-item-root[aria-level="1"]',
    ) as HTMLButtonElement;

    expect(panel.dataset['iconMenu']).toBe('flyout');
    rootItem.click();
    fixture.detectChanges();
    expect(rootItem.getAttribute('aria-expanded')).toBe('true');
    expect(
      fixture.nativeElement
        .querySelector('.neural-panel-menu-group-root')
        .getAttribute('aria-hidden'),
    ).toBe('false');

    rootItem.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();
    expect(rootItem.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(rootItem);
  });

  it('composes an inline NeuralMenu with the collapsed icon rail', async () => {
    const fixture = await createHost();
    fixture.componentInstance.sidebar().close();
    fixture.detectChanges();

    const menu = fixture.nativeElement.querySelector(
      '.neural-menu-root',
    ) as HTMLElement;
    const item = menu.querySelector('[data-key="search"]') as HTMLElement;

    expect(menu.classList).toContain('neural-menu-base');
    expect(item.getAttribute('data-label')).toBe('Search');
    expect(item.querySelector('.neural-menu-label-root')).not.toBeNull();
  });

  it('keeps nested collapsed-rail groups as cascading flyouts', async () => {
    const fixture = await createHost();
    fixture.componentInstance.sidebar().close();
    fixture.detectChanges();
    const rootItem = fixture.nativeElement.querySelector(
      '[data-key="workspace"]',
    ) as HTMLButtonElement;
    rootItem.click();
    fixture.detectChanges();

    const nestedItem = fixture.nativeElement.querySelector(
      '[data-key="media"]',
    ) as HTMLButtonElement;
    nestedItem.dispatchEvent(
      new PointerEvent('pointerover', {
        bubbles: true,
        pointerType: 'mouse',
      }),
    );
    fixture.detectChanges();

    const nestedGroupId = nestedItem.getAttribute('aria-controls');
    const nestedGroup = fixture.nativeElement.querySelector(
      `[id="${nestedGroupId}"]`,
    ) as HTMLElement | null;
    expect(nestedItem.getAttribute('aria-expanded')).toBe('true');
    expect(nestedGroup?.classList).toContain(
      'neural-panel-menu-group-expanded-root',
    );
    expect(nestedGroup?.getAttribute('aria-hidden')).toBe('false');
    expect(nestedGroup?.querySelector('[data-key="images"]')).not.toBeNull();

    const otherRoot = fixture.nativeElement.querySelector(
      '[data-key="cloud"]',
    ) as HTMLButtonElement;
    otherRoot.click();
    fixture.detectChanges();
    expect(rootItem.getAttribute('aria-expanded')).toBe('false');

    rootItem.click();
    fixture.detectChanges();
    expect(nestedItem.getAttribute('aria-expanded')).toBe('false');
    expect(nestedGroup?.getAttribute('aria-hidden')).toBe('true');
  });

  it('temporarily expands a collapsed icon rail on hover without mutating open', async () => {
    const fixture = await createHost();
    fixture.componentInstance.open.set(false);
    fixture.componentInstance.openOnHover.set(true);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('aside') as HTMLElement;
    expect(panel.dataset['openOnHover']).toBe('true');

    panel.dispatchEvent(new PointerEvent('pointerenter'));
    fixture.detectChanges();
    expect(panel.dataset['open']).toBe('true');
    expect(panel.dataset['hoverExpanded']).toBe('true');
    expect(fixture.componentInstance.open()).toBe(false);
    expect(latest(fixture.componentInstance.hoverChanges)?.expanded).toBe(true);

    const rootItem = fixture.nativeElement.querySelector(
      '[data-key="workspace"]',
    ) as HTMLButtonElement;
    const group = fixture.nativeElement.querySelector(
      '.neural-panel-menu-group-root',
    ) as HTMLElement;
    rootItem.click();
    fixture.detectChanges();
    expect(rootItem.getAttribute('aria-expanded')).toBe('true');

    panel.dispatchEvent(new PointerEvent('pointerleave'));
    fixture.detectChanges();
    expect(panel.dataset['open']).toBe('false');
    expect(panel.dataset['hoverExpanded']).toBe('false');
    expect(rootItem.getAttribute('aria-expanded')).toBe('false');
    expect(group.getAttribute('aria-hidden')).toBe('true');
    expect(group.hasAttribute('inert')).toBe(true);
    expect(latest(fixture.componentInstance.hoverChanges)?.expanded).toBe(
      false,
    );
  });

  it('keeps collapseMode none visibly open for a stable desktop shell', async () => {
    const fixture = await createHost();
    fixture.componentInstance.collapseMode.set('none');
    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('aside') as HTMLElement;
    expect(panel.dataset['open']).toBe('true');
    expect(panel.getAttribute('aria-hidden')).toBeNull();
  });
});

function latest<T>(values: readonly T[]): T | undefined {
  return values[values.length - 1];
}
