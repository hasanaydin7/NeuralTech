import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '../src/neural-ng.config';
import {
  NeuralTab,
  NeuralTabList,
  NeuralTabPanel,
  NeuralTabPanels,
  NeuralTabs,
} from './tabs.component';
import type {
  NeuralTabsActivationMode,
  NeuralTabsClasses,
  NeuralTabsOrientation,
  NeuralTabValue,
} from './tabs.types';

const TABS_IMPORTS = [
  NeuralTabs,
  NeuralTabList,
  NeuralTab,
  NeuralTabPanels,
  NeuralTabPanel,
];

@Component({
  imports: TABS_IMPORTS,
  template: `
    <neural-tabs
      tabsId="account-tabs"
      [(value)]="value"
      [orientation]="orientation()"
      [activationMode]="activationMode()"
      [classes]="classes"
      [unstyled]="unstyled()"
    >
      <neural-tab-list ariaLabel="Account sections" listClass="local-list">
        <neural-tab
          value="profile"
          iconClass="nt-user demo-icon-color"
          tabClass="local-tab"
        >
          Profile
        </neural-tab>
        @if (showSecurity()) {
          <neural-tab value="security">
            <i class="projected-icon" aria-hidden="true"></i>
            Security
          </neural-tab>
        }
        <neural-tab value="billing" [disabled]="billingDisabled()">
          Billing
        </neural-tab>
      </neural-tab-list>

      <neural-tab-panels panelsClass="local-panels">
        <neural-tab-panel value="profile" panelClass="local-panel">
          Profile panel
        </neural-tab-panel>
        @if (showSecurity()) {
          <neural-tab-panel value="security" [focusable]="false">
            Security panel
          </neural-tab-panel>
        }
        <neural-tab-panel value="billing">Billing panel</neural-tab-panel>
      </neural-tab-panels>
    </neural-tabs>
  `,
})
class TabsTestHost {
  readonly value = signal<NeuralTabValue | null>(null);
  readonly orientation = signal<NeuralTabsOrientation>('horizontal');
  readonly activationMode = signal<NeuralTabsActivationMode>('automatic');
  readonly showSecurity = signal(true);
  readonly billingDisabled = signal(true);
  readonly unstyled = signal(false);
  classes: NeuralTabsClasses = {
    root: 'slot-root',
    list: 'slot-list',
    tab: 'slot-tab',
    activeTab: 'slot-active',
    disabledTab: 'slot-disabled',
    panels: 'slot-panels',
    panel: 'slot-panel',
  };
}

@Component({
  imports: TABS_IMPORTS,
  template: `
    <neural-tabs tabsId="dynamic-tabs" [(value)]="value">
      <neural-tab-list ariaLabel="Dynamic sections">
        @for (item of items(); track item.value) {
          <neural-tab [value]="item.value">{{ item.label }}</neural-tab>
        }
      </neural-tab-list>
      <neural-tab-panels>
        @for (item of items(); track item.value) {
          <neural-tab-panel [value]="item.value">
            {{ item.label }} panel
          </neural-tab-panel>
        }
      </neural-tab-panels>
    </neural-tabs>
  `,
})
class DynamicTabsTestHost {
  readonly value = signal<NeuralTabValue | null>('brand');
  readonly items = signal([
    { value: 'brand', label: 'Brand' },
    { value: 'feel', label: 'Feel' },
    { value: 'preview', label: 'Preview' },
    { value: 'export', label: 'Export' },
  ]);
}

@Component({
  imports: TABS_IMPORTS,
  template: `
    <neural-tabs>
      <neural-tab-list ariaLabel="Invalid example">
        <neural-tab value="duplicate">First</neural-tab>
        <neural-tab value="duplicate">Second</neural-tab>
        <neural-tab value="missing">Missing panel</neural-tab>
      </neural-tab-list>
      <neural-tab-panels>
        <neural-tab-panel value="duplicate">First panel</neural-tab-panel>
        <neural-tab-panel value="orphan">Orphan panel</neural-tab-panel>
      </neural-tab-panels>
    </neural-tabs>
  `,
})
class InvalidTabsTestHost {}

describe('Tabs composition', () => {
  it('supports tabs and panels rendered from dynamic collections', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await TestBed.configureTestingModule({
      imports: [DynamicTabsTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(DynamicTabsTestHost);

    expect(() => fixture.detectChanges()).not.toThrow();
    await fixture.whenStable();
    fixture.detectChanges();

    const tabs = fixture.nativeElement.querySelectorAll(
      '[role="tab"]',
    ) as NodeListOf<HTMLButtonElement>;
    const panels = fixture.nativeElement.querySelectorAll(
      '[role="tabpanel"]',
    ) as NodeListOf<HTMLElement>;

    expect([...tabs].map((tab) => tab.textContent?.trim())).toEqual([
      'Brand',
      'Feel',
      'Preview',
      'Export',
    ]);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(panels[0].hidden).toBe(false);
    expect(
      warn.mock.calls.some((call) =>
        call.some((value) =>
          String(value).includes('[NeuralNg Tabs] Invalid composition'),
        ),
      ),
    ).toBe(false);
    warn.mockRestore();
  });

  async function createHost(
    providers: ReturnType<typeof provideNeuralNg>[] = [],
  ) {
    await TestBed.configureTestingModule({
      imports: [TabsTestHost],
      providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(TabsTestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('selects the first enabled tab and connects complete ARIA semantics', async () => {
    const fixture = await createHost();
    const tabs = fixture.nativeElement.querySelectorAll(
      '[role="tab"]',
    ) as NodeListOf<HTMLButtonElement>;
    const panels = fixture.nativeElement.querySelectorAll(
      '[role="tabpanel"]',
    ) as NodeListOf<HTMLElement>;

    expect(fixture.componentInstance.value()).toBe('profile');
    expect(tabs).toHaveLength(3);
    expect(tabs[0].id).toBe('account-tabs-tab-0');
    expect(tabs[0].getAttribute('aria-controls')).toBe('account-tabs-panel-0');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].tabIndex).toBe(0);
    expect(tabs[1].tabIndex).toBe(-1);
    expect(tabs[2].disabled).toBe(true);
    expect(tabs[2].getAttribute('aria-disabled')).toBe('true');
    expect(panels[0].getAttribute('aria-labelledby')).toBe(
      'account-tabs-tab-0',
    );
    expect(panels[0].hidden).toBe(false);
    expect(panels[1].hidden).toBe(true);
    expect(panels[0].tabIndex).toBe(0);
  });

  it('changes the model and visible panel on click', async () => {
    const fixture = await createHost();
    const security = fixture.nativeElement.querySelectorAll(
      '[role="tab"]',
    )[1] as HTMLButtonElement;

    security.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('security');
    expect(security.getAttribute('aria-selected')).toBe('true');
    expect(
      fixture.nativeElement.querySelector('#account-tabs-panel-1').hidden,
    ).toBe(false);
    expect(
      fixture.nativeElement.querySelector('#account-tabs-panel-0').hidden,
    ).toBe(true);
  });

  it('uses automatic arrow navigation, skips disabled tabs and wraps', async () => {
    const fixture = await createHost();
    const tabs = fixture.nativeElement.querySelectorAll(
      '[role="tab"]',
    ) as NodeListOf<HTMLButtonElement>;

    tabs[0].focus();
    tabs[0].dispatchEvent(keydown('ArrowRight'));
    fixture.detectChanges();
    expect(document.activeElement).toBe(tabs[1]);
    expect(fixture.componentInstance.value()).toBe('security');

    tabs[1].dispatchEvent(keydown('ArrowRight'));
    fixture.detectChanges();
    expect(document.activeElement).toBe(tabs[0]);
    expect(fixture.componentInstance.value()).toBe('profile');

    tabs[0].dispatchEvent(keydown('End'));
    fixture.detectChanges();
    expect(document.activeElement).toBe(tabs[1]);
  });

  it('separates focus and selection in manual activation mode', async () => {
    const fixture = await createHost();
    fixture.componentInstance.activationMode.set('manual');
    fixture.detectChanges();
    const tabs = fixture.nativeElement.querySelectorAll(
      '[role="tab"]',
    ) as NodeListOf<HTMLButtonElement>;

    tabs[0].focus();
    tabs[0].dispatchEvent(keydown('ArrowRight'));
    fixture.detectChanges();
    expect(document.activeElement).toBe(tabs[1]);
    expect(fixture.componentInstance.value()).toBe('profile');
    expect(tabs[1].tabIndex).toBe(0);

    tabs[1].dispatchEvent(keydown('Enter'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('security');
  });

  it('uses up and down arrows for vertical orientation', async () => {
    const fixture = await createHost();
    fixture.componentInstance.orientation.set('vertical');
    fixture.detectChanges();
    const list = fixture.nativeElement.querySelector('[role="tablist"]');
    const tabs = fixture.nativeElement.querySelectorAll(
      '[role="tab"]',
    ) as NodeListOf<HTMLButtonElement>;

    expect(list.getAttribute('aria-orientation')).toBe('vertical');
    tabs[0].focus();
    tabs[0].dispatchEvent(keydown('ArrowDown'));
    fixture.detectChanges();
    expect(document.activeElement).toBe(tabs[1]);
    tabs[1].dispatchEvent(keydown('ArrowUp'));
    fixture.detectChanges();
    expect(document.activeElement).toBe(tabs[0]);
  });

  it('reverses horizontal arrow movement in RTL', async () => {
    const fixture = await createHost();
    fixture.nativeElement.setAttribute('dir', 'rtl');
    fixture.detectChanges();
    const tabs = fixture.nativeElement.querySelectorAll(
      '[role="tab"]',
    ) as NodeListOf<HTMLButtonElement>;

    tabs[0].focus();
    tabs[0].dispatchEvent(keydown('ArrowLeft'));
    fixture.detectChanges();

    expect(document.activeElement).toBe(tabs[1]);
    expect(fixture.componentInstance.value()).toBe('security');
  });

  it('uses aria-labelledby instead of a competing aria-label', async () => {
    const fixture = await createHost();
    const list = fixture.nativeElement.querySelector('[role="tablist"]');
    expect(list.getAttribute('aria-label')).toBe('Account sections');
    expect(list.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('supports generated and projected icons without forcing an icon', async () => {
    const fixture = await createHost();
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]');
    const generatedIcon = tabs[0].querySelector('.neural-tab-icon');

    expect(generatedIcon?.classList).toContain('nt');
    expect(generatedIcon?.classList).toContain('nt-user');
    expect(generatedIcon?.classList).toContain('demo-icon-color');
    expect(generatedIcon?.getAttribute('aria-hidden')).toBe('true');
    expect(tabs[1].querySelector('.projected-icon')).not.toBeNull();
    expect(tabs[1].querySelector('.neural-tab-icon')).toBeNull();
    expect(tabs[2].querySelector('.neural-tab-icon')).toBeNull();
  });

  it('merges typed slots and removes only visual classes when unstyled', async () => {
    const fixture = await createHost();
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.neural-tabs-root');
    const list = fixture.nativeElement.querySelector('[role="tablist"]');
    const active = fixture.nativeElement.querySelector(
      '[aria-selected="true"]',
    );

    expect(root.classList).toContain('slot-root');
    expect(root.classList).not.toContain('neural-tabs-base');
    expect(list.classList).toContain('slot-list');
    expect(list.classList).toContain('local-list');
    expect(list.classList).not.toContain('neural-tab-list-base');
    expect(active.classList).toContain('slot-tab');
    expect(active.classList).toContain('slot-active');
    expect(active.classList).not.toContain('neural-tab-base');
    expect(active.classList).not.toContain('neural-tab-active-base');
  });

  it('inherits global unstyled mode', async () => {
    const fixture = await createHost([provideNeuralNg({ unstyled: true })]);
    expect(fixture.nativeElement.querySelector('.neural-tabs-base')).toBeNull();
    expect(fixture.nativeElement.querySelector('.neural-tab-base')).toBeNull();
  });

  it('falls back when the selected tab is removed dynamically', async () => {
    const fixture = await createHost();
    fixture.componentInstance.value.set('security');
    fixture.detectChanges();
    fixture.componentInstance.showSecurity.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('profile');
    expect(
      fixture.nativeElement.querySelector('[aria-selected="true"]').textContent,
    ).toContain('Profile');
  });

  it('falls back when the selected tab becomes disabled dynamically', async () => {
    const fixture = await createHost();
    fixture.componentInstance.billingDisabled.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.value.set('billing');
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('billing');

    fixture.componentInstance.billingDisabled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('profile');
    expect(
      fixture.nativeElement.querySelector('[aria-selected="true"]').textContent,
    ).toContain('Profile');
  });

  it('warns once per invalid composition signature in development', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await TestBed.configureTestingModule({
      imports: [InvalidTabsTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(InvalidTabsTestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const warning = warn.mock.calls.flat().join(' ');
    expect(warning).toContain('duplicate tab value "duplicate"');
    expect(warning).toContain('tab "missing" has no matching panel');
    expect(warning).toContain('panel "orphan" has no matching tab');

    const callCount = warn.mock.calls.length;
    fixture.detectChanges();
    expect(warn).toHaveBeenCalledTimes(callCount);
    warn.mockRestore();
  });
});

function keydown(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
}
