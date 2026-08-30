import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import {
  NeuralBreadcrumb,
  NeuralBreadcrumbItemComponent,
  NeuralBreadcrumbSeparatorTemplate,
  type NeuralBreadcrumbClasses,
  type NeuralBreadcrumbItem,
  type NeuralBreadcrumbSelect,
} from '@neural-ng/core/breadcrumb';
import { NeuralMessageService } from '@neural-ng/core/message';
import { ToastComponent } from '@neural-ng/core/toast';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-breadcrumb-page',
  imports: [
    NeuralBreadcrumb,
    NeuralBreadcrumbItemComponent,
    NeuralBreadcrumbSeparatorTemplate,
    CodeView,
    ToastComponent,
  ],
  templateUrl: './breadcrumb.page.html',
  styleUrls: ['./breadcrumb.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbPage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  private readonly messages = inject(NeuralMessageService);
  readonly lastSelection = signal('none');
  readonly items: readonly NeuralBreadcrumbItem[] = [
    { key: 'home', label: 'Home', iconClass: 'nt-home', routerLink: '/' },
    {
      key: 'docs',
      label: 'Documentation',
      routerLink: '/docs/getting-started/installation',
    },
    { key: 'components', label: 'Components', disabled: true },
    { key: 'navigation', label: 'Navigation' },
    { key: 'breadcrumb', label: 'Breadcrumb' },
  ];

  readonly headlessClasses: NeuralBreadcrumbClasses = {
    root: 'docs-headless-breadcrumb',
    list: 'docs-headless-breadcrumb__list',
    item: 'docs-headless-breadcrumb__item',
    link: 'docs-headless-breadcrumb__link',
    current: 'docs-headless-breadcrumb__current',
    disabled: 'docs-headless-breadcrumb__disabled',
    icon: 'docs-headless-breadcrumb__icon',
    label: 'docs-headless-breadcrumb__label',
    separator: 'docs-headless-breadcrumb__separator',
    overflowItem: 'docs-headless-breadcrumb__overflow',
    overflowTrigger: 'docs-headless-breadcrumb__trigger',
  };

  readonly importCode = `
    import { NeuralBreadcrumb } from '@neural-ng/core/breadcrumb';
  `;

  readonly basicCode = `
    import { Component } from '@angular/core';
    import { NeuralBreadcrumb, type NeuralBreadcrumbSelect } from '@neural-ng/core/breadcrumb';

    @Component({
      selector: 'neural-bread-crumb-example',
      imports: [NeuralBreadcrumb],
      template: \`
    	<neural-breadcrumb ariaLabel="Component documentation" [items]="items" (itemSelect)="select($event)" />
      \`
    })
    export class BreadCrumbExampleComponent {

    	readonly items: readonly NeuralBreadcrumbItem[] = [
    		{ key: 'home', label: 'Home', iconClass: 'nt-home', routerLink: '/'},
    		{ key: 'docs', label: 'Documentation', routerLink: '/docs/getting-started/installation'},
    		{ key: 'components', label: 'Components', disabled: true},
    		{ key: 'navigation', label: 'Navigation' },
    		{ key: 'breadcrumb', label: 'Breadcrumb' },
    	];

    	select(event: NeuralBreadcrumbSelect): void {
    		this.lastSelection.set(event.key);
    		this.messages.notify({
    		channel: 'breadcrumb-docs',
    		severity: 'info',
    		title: 'Breadcrumb',
    		message: \`\${event.item.label} selected.\`,
    		});
    	}
    }
  `;

  readonly overflowCode = `
    import { Component } from '@angular/core';
    import { NeuralBreadcrumb, type NeuralBreadcrumbSelect } from '@neural-ng/core/breadcrumb';

    @Component({
      selector: 'neural-bread-crumb-example',
      imports: [NeuralBreadcrumb],
      template: \`
    	<neural-breadcrumb ariaLabel="Collapsed page trail" [items]="items" [maxItems]="3" overflowLabel="More locations"
            (itemSelect)="select($event)" />
      \`
    })
    export class BreadCrumbExampleComponent {

    	readonly items: readonly NeuralBreadcrumbItem[] = [
    		{ key: 'home', label: 'Home', iconClass: 'nt-home', routerLink: '/'},
    		{ key: 'docs', label: 'Documentation', routerLink: '/docs/getting-started/installation'},
    		{ key: 'components', label: 'Components', disabled: true},
    		{ key: 'navigation', label: 'Navigation' },
    		{ key: 'breadcrumb', label: 'Breadcrumb' },
    	];

    	select(event: NeuralBreadcrumbSelect): void {
    		this.lastSelection.set(event.key);
    		this.messages.notify({
    		channel: 'breadcrumb-docs',
    		severity: 'info',
    		title: 'Breadcrumb',
    		message: \`\${event.item.label} selected.\`,
    		});
    	}
    }
  `;

  readonly seperatorCode = `
    import { Component } from '@angular/core';
    import { 
      NeuralBreadcrumb,
      NeuralBreadcrumbItemComponent,
      NeuralBreadcrumbSeparatorTemplate,
      type NeuralBreadcrumbItem,
      type NeuralBreadcrumbSelect
    } from '@neural-ng/core/breadcrumb';

    @Component({
      selector: 'neural-bread-crumb-example',
      imports: [
        NeuralBreadcrumb,
        NeuralBreadcrumbItemComponent,
        NeuralBreadcrumbSeparatorTemplate,
      ],
      template: \`
      <neural-breadcrumb ariaLabel="Projected page trail">
            <neural-breadcrumb-item key="home" label="Home" iconClass="nt-home" routerLink="/" />
            <neural-breadcrumb-item key="guides" label="Guides" routerLink="/docs/guides/localization" />
            <neural-breadcrumb-item key="localization" label="Localization" />
            <ng-template neuralBreadcrumbSeparator>
          <span class="nt nt-slash"></span>
            </ng-template>
        </neural-breadcrumb>
      \`
    })
    export class BreadCrumbExampleComponent {}
  `;

  readonly headlessCode = `
    import { Component } from '@angular/core';
    import { NeuralBreadcrumb, type NeuralBreadcrumbClasses } from '@neural-ng/core/breadcrumb';

    @Component({
      selector: 'neural-bread-crumb-example',
      imports: [NeuralBreadcrumb],
      template: \`
      <neural-breadcrumb ariaLabel="Headless page trail" unstyled [items]="items"
            [classes]="headlessClasses" />
      \`,
      styles: \`
      .docs-headless-breadcrumb {
        width: 100%;
        padding: 0.75rem;
        color: #e0e7ff;
        background: #312e81;
        border-radius: 0.25rem;
      }
      
      .docs-headless-breadcrumb__list {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      
      .docs-headless-breadcrumb__item,
      .docs-headless-breadcrumb__link {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
      }
      
      .docs-headless-breadcrumb__link {
        padding: 0.35rem;
        color: #c7d2fe;
        text-decoration: none;
      }
      
      .docs-headless-breadcrumb__current {
        color: #ffffff;
        font-weight: 800;
      }
      
      .docs-headless-breadcrumb__disabled {
        opacity: 0.5;
      }
      
      .docs-headless-breadcrumb__separator {
        color: #818cf8;
      }
      \`
    })
    export class BreadCrumbExampleComponent {
      
      readonly items: readonly NeuralBreadcrumbItem[] = [
        { key: 'home', label: 'Home', iconClass: 'nt-home', routerLink: '/'},
        { key: 'docs', label: 'Documentation', routerLink: '/docs/getting-started/installation'},
        { key: 'components', label: 'Components', disabled: true},
        { key: 'navigation', label: 'Navigation' }
      ];
      
      readonly headlessClasses: NeuralBreadcrumbClasses = {
        root: 'docs-headless-breadcrumb',
        list: 'docs-headless-breadcrumb__list',
        item: 'docs-headless-breadcrumb__item',
        link: 'docs-headless-breadcrumb__link',
        current: 'docs-headless-breadcrumb__current',
        disabled: 'docs-headless-breadcrumb__disabled',
        icon: 'docs-headless-breadcrumb__icon',
        label: 'docs-headless-breadcrumb__label',
        separator: 'docs-headless-breadcrumb__separator',
        overflowItem: 'docs-headless-breadcrumb__overflow',
        overflowTrigger: 'docs-headless-breadcrumb__trigger',
      };
    }
  `;

  select(event: NeuralBreadcrumbSelect): void {
    this.lastSelection.set(event.key);
    this.messages.notify({
      channel: 'breadcrumb-docs',
      severity: 'info',
      title: 'Breadcrumb',
      message: `${event.item.label} selected.`,
    });
  }
}
