import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralTooltip } from '../tooltip/tooltip.directive';
import {
  NeuralBreadcrumb,
  NeuralBreadcrumbItemComponent,
  NeuralBreadcrumbSeparatorTemplate,
} from './breadcrumb.component';
import type {
  NeuralBreadcrumbItem,
  NeuralBreadcrumbSelect,
} from './breadcrumb.types';

const ITEMS: readonly NeuralBreadcrumbItem[] = [
  { key: 'home', label: 'Home', iconClass: 'nt-home', routerLink: '/' },
  { key: 'docs', label: 'Docs', routerLink: '/docs' },
  { key: 'components', label: 'Components', disabled: true },
  { key: 'breadcrumb', label: 'Breadcrumb' },
];

@Component({
  imports: [NeuralBreadcrumb],
  template: `
    <neural-breadcrumb
      ariaLabel="Page trail"
      [items]="items"
      [maxItems]="maxItems"
      [unstyled]="unstyled"
      [breadcrumbClass]="breadcrumbClass"
      [classes]="classes"
      (itemSelect)="selections.push($event)"
    />
  `,
})
class DataHost {
  items: readonly NeuralBreadcrumbItem[] = ITEMS;
  readonly selections: NeuralBreadcrumbSelect[] = [];
  maxItems = 0;
  unstyled = false;
  breadcrumbClass = '';
  classes = {};
}

@Component({
  imports: [
    NeuralBreadcrumb,
    NeuralBreadcrumbItemComponent,
    NeuralBreadcrumbSeparatorTemplate,
  ],
  template: `
    <neural-breadcrumb>
      <neural-breadcrumb-item key="home" label="Home" routerLink="/" />
      <neural-breadcrumb-item key="current" label="Current" />
      <ng-template neuralBreadcrumbSeparator>
        <span class="custom-separator">/</span>
      </ng-template>
    </neural-breadcrumb>
  `,
})
class ProjectedHost {}

@Component({ template: 'Docs' })
class DocsHost {}

describe('Breadcrumb', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideNeuralNg(),
        provideRouter([{ path: 'docs', component: DocsHost }]),
      ],
    }),
  );

  it('renders nav/list semantics, links, icons, disabled and current states', () => {
    const fixture = TestBed.createComponent(DataHost);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    const home = fixture.nativeElement.querySelector(
      '[data-key="home"]',
    ) as HTMLAnchorElement;
    const disabled = fixture.nativeElement.querySelector(
      '[data-key="components"]',
    ) as HTMLElement;
    const current = fixture.nativeElement.querySelector(
      '[data-key="breadcrumb"]',
    ) as HTMLElement;

    expect(nav.getAttribute('aria-label')).toBe('Page trail');
    expect(nav.querySelector('ol')).toBeTruthy();
    expect(home.getAttribute('href')).toBe('/');
    expect(home.querySelector('i')?.classList).toContain('nt-home');
    expect(disabled.getAttribute('aria-disabled')).toBe('true');
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(
      nav.querySelectorAll('.neural-breadcrumb-separator-root'),
    ).toHaveLength(3);
  });

  it('emits selection and removes visual classes in unstyled mode', () => {
    const fixture = TestBed.createComponent(DataHost);
    fixture.componentInstance.unstyled = true;
    fixture.detectChanges();
    const home = fixture.nativeElement.querySelector(
      '[data-key="home"]',
    ) as HTMLAnchorElement;
    home.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fixture.componentInstance.selections[0]?.key).toBe('home');
    expect(
      fixture.nativeElement
        .querySelector('nav')
        .classList.contains('neural-breadcrumb-base'),
    ).toBe(false);
  });

  it('collapses middle items into an accessible Menu', () => {
    const fixture = TestBed.createComponent(DataHost);
    fixture.componentInstance.maxItems = 2;
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        'button[aria-label="More breadcrumb items"]',
      ),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelectorAll('.neural-breadcrumb-item-root'),
    ).toHaveLength(2);
    const tooltipNode = fixture.debugElement.queryAllNodes((node) =>
      node.providerTokens.includes(NeuralTooltip),
    )[0];
    const tooltip = tooltipNode.injector.get(NeuralTooltip);
    expect(tooltip.showDelay()).toBe(100);
  });

  it('supports projected items and a custom separator template', () => {
    const fixture = TestBed.createComponent(ProjectedHost);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('.neural-breadcrumb-item-root'),
    ).toHaveLength(2);
    expect(
      fixture.nativeElement.querySelector('.custom-separator')?.textContent,
    ).toBe('/');
  });

  it('honors an explicit current item instead of assuming the last item', () => {
    const fixture = TestBed.createComponent(DataHost);
    fixture.componentInstance.items = [
      { key: 'docs', label: 'Docs', current: true },
      { key: 'child', label: 'Child' },
    ];
    fixture.detectChanges();

    expect(
      fixture.nativeElement
        .querySelector('[data-key="docs"]')
        .getAttribute('aria-current'),
    ).toBe('page');
    expect(
      fixture.nativeElement
        .querySelector('[data-key="child"]')
        .getAttribute('aria-current'),
    ).toBeNull();
  });

  it('preserves native href metadata', () => {
    const fixture = TestBed.createComponent(DataHost);
    fixture.componentInstance.items = [
      {
        key: 'external',
        label: 'External',
        href: '#external',
        target: '_blank',
        rel: 'noopener',
      },
    ];
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector(
      '[data-key="external"]',
    ) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('#external');
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener');
  });

  it('forwards the complete RouterLink contract', async () => {
    const fixture = TestBed.createComponent(DataHost);
    fixture.componentInstance.items = [
      {
        key: 'route',
        label: 'Route',
        routerLink: '/docs',
        queryParams: { view: 'api' },
        fragment: 'inputs',
        replaceUrl: true,
        state: { origin: 'breadcrumb' },
      },
    ];
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector(
      '[data-key="route"]',
    ) as HTMLAnchorElement;

    expect(link.getAttribute('href')).toBe('/docs?view=api#inputs');
    link.click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/docs?view=api#inputs');
  });

  it('keeps maxItems below two expanded and preserves exactly maxItems edges', () => {
    const expandedFixture = TestBed.createComponent(DataHost);
    expandedFixture.componentInstance.maxItems = 1;
    expandedFixture.detectChanges();
    expect(
      expandedFixture.nativeElement.querySelectorAll(
        '.neural-breadcrumb-item-root',
      ),
    ).toHaveLength(ITEMS.length);
    expandedFixture.destroy();

    const collapsedFixture = TestBed.createComponent(DataHost);
    collapsedFixture.componentInstance.maxItems = 3;
    collapsedFixture.detectChanges();
    expect(
      collapsedFixture.nativeElement.querySelectorAll(
        '.neural-breadcrumb-item-root',
      ),
    ).toHaveLength(3);
    expect(
      collapsedFixture.nativeElement.querySelector('button[aria-label]'),
    ).toBeTruthy();
  });

  it('merges root and typed consumer classes without removing theme classes', () => {
    const fixture = TestBed.createComponent(DataHost);
    fixture.componentInstance.breadcrumbClass = 'consumer-root';
    fixture.componentInstance.classes = { link: 'consumer-link' };
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;

    expect(nav.classList).toContain('neural-breadcrumb-base');
    expect(nav.classList).toContain('consumer-root');
    expect(link.classList).toContain('neural-breadcrumb-link-base');
    expect(link.classList).toContain('consumer-link');
  });
});
