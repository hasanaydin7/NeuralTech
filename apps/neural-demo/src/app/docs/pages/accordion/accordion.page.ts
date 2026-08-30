import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import {
  AccordionComponent,
  AccordionContentComponent,
  AccordionHeaderComponent,
  AccordionPanelComponent,
  NeuralAccordionPanelChange,
  type NeuralAccordionClasses,
  type NeuralAccordionModelValue,
} from '@neural-ng/core/accordion';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import { CodeView } from '../../../shared/code-view';

interface Faq {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'app-accordion-page',
  imports: [
    AccordionComponent,
    AccordionContentComponent,
    AccordionHeaderComponent,
    AccordionPanelComponent,
    CodeView
  ],
  templateUrl: './accordion.page.html',
  styleUrls: ['./accordion.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionPage {

  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;

  readonly openFaq = signal<NeuralAccordionModelValue>('signals');
  readonly openSections = signal<NeuralAccordionModelValue>(['architecture']);
  readonly headlessValue = signal<NeuralAccordionModelValue>('semantic');
  readonly lastEvent = signal('none');
  readonly faqs: readonly Faq[] = [
    {
      id: 'signals',
      question: 'Why does Accordion use Signals?',
      answer:
        'The value model stays deterministic for templates, forms, and generated code.',
    },
    {
      id: 'headless',
      question: 'Can every visual class be removed?',
      answer:
        'Yes. Local and application-wide unstyled modes retain structure and behavior.',
    },
    {
      id: 'future',
      question: 'Is lazy content included in alpha?',
      answer: 'A true template-based lazy contract is planned after alpha.',
      disabled: true,
    },
  ];

  readonly headlessClasses: NeuralAccordionClasses = {
    root: 'docs-headless-accordion',
    panel: 'docs-headless-accordion__panel',
    expandedPanel: 'docs-headless-accordion__panel--open',
    header: 'docs-headless-accordion__header',
    trigger: 'docs-headless-accordion__trigger',
    label: 'docs-headless-accordion__label',
    icon: 'docs-headless-accordion__icon',
    content: 'docs-headless-accordion__content',
    contentInner: 'docs-headless-accordion__content-inner',
  };

  changePanel(event:NeuralAccordionPanelChange){
    return this.lastEvent.set(event.panelValue + ':' + (event.expanded ? 'open' : 'closed'))
  }

  readonly importCode = `import {
  AccordionComponent,
  AccordionPanelComponent,
  AccordionHeaderComponent,
  AccordionContentComponent,
} from '@neural-ng/core/accordion';`;


  readonly dataCode = `
    import { Component } from '@angular/core';
    import {
      AccordionComponent,
      NeuralAccordionPanelChange,
      type NeuralAccordionModelValue,
    } from '@neural-ng/core/accordion';

    interface Faq {
      readonly id: string;
      readonly question: string;
      readonly answer: string;
      readonly disabled?: boolean;
    }

    @Component({
      selector: 'neural-accordion-example',
      imports: [AccordionComponent],
      template: \`
    	<neural-accordion accordionId="docs-faq" [items]="faqs" itemLabel="question" itemValue="id" itemContent="answer"
    			itemDisabled="disabled" [(value)]="openFaq" (panelChange)="changePanel($event)" />
      \`
    })
    export class AccordionExampleComponent {
    	readonly openFaq = signal<NeuralAccordionModelValue>('signals');
    	readonly lastEvent = signal('none');
    	readonly faqs: readonly Faq[] = [
    		{
    		  id: 'signals',
    		  question: 'Why does Accordion use Signals?',
    		  answer: 'The value model stays deterministic for templates, forms, and generated code.',
    		},
    		{
    		  id: 'headless',
    		  question: 'Can every visual class be removed?',
    		  answer: 'Yes. Local and application-wide unstyled modes retain structure and behavior.',
    		},
    		{
    		  id: 'future',
    		  question: 'Is lazy content included in alpha?',
    		  answer: 'A true template-based lazy contract is planned after alpha.',
    		  disabled: true,
    		},
    	];

    	changePanel(event:NeuralAccordionPanelChange){
    		return this.lastEvent.set(event.panelValue + ':' + (event.expanded ? 'open' : 'closed'))
    	}
    }
  `;

  readonly compositionCode = `
    import { Component } from '@angular/core';
    import {
      AccordionComponent,
      AccordionContentComponent,
      AccordionHeaderComponent,
      AccordionPanelComponent,
      type NeuralAccordionModelValue,
    } from '@neural-ng/core/accordion';

    @Component({
      selector: 'neural-accordion-example',
      imports: [AccordionComponent],
      template: \`
    	  <neural-accordion accordionId="docs-architecture" multiple [(value)]="openSections">
          <neural-accordion-panel value="architecture">
          <neural-accordion-header>Architecture</neural-accordion-header>
            <neural-accordion-content>
              Standalone entry points, Signals state, and SSR-safe deterministic IDs.
            </neural-accordion-content>
          </neural-accordion-panel>
          <neural-accordion-panel value="accessibility">
            <neural-accordion-header>Accessibility</neural-accordion-header>
            <neural-accordion-content>
              Native buttons connect to inert collapsed regions through aria-controls and aria-labelledby.
            </neural-accordion-content>
          </neural-accordion-panel>
          <neural-accordion-panel value="tokens">
            <neural-accordion-header>Design tokens</neural-accordion-header>
            <neural-accordion-content>
              Semantic component tokens inherit light and dark values from the active theme.
            </neural-accordion-content>
          </neural-accordion-panel>
        </neural-accordion>
      \`
    })
    export class AccordionExampleComponent {
    	readonly openSections = signal<NeuralAccordionModelValue>(['architecture']);
    }
  `;

  readonly headlessCode = `
    import { Component } from '@angular/core';
    import {
      AccordionComponent,
      AccordionContentComponent,
      AccordionHeaderComponent,
      AccordionPanelComponent,
      type NeuralAccordionClasses,
      type NeuralAccordionModelValue
    } from '@neural-ng/core/accordion';

    @Component({
      selector: 'neural-accordion-example',
      imports: [AccordionComponent],
      template: \`
    	<neural-accordion accordionId="docs-headless-accordion" unstyled [classes]="headlessClasses"
            [(value)]="headlessValue">
            <neural-accordion-panel value="semantic">
              <neural-accordion-header>Semantic core</neural-accordion-header>
              <neural-accordion-content>
                NeuralNg keeps the behavior; this page supplies every visible style.
              </neural-accordion-content>
            </neural-accordion-panel>
            <neural-accordion-panel value="classes">
              <neural-accordion-header>Consumer classes</neural-accordion-header>
              <neural-accordion-content>
                Typed slots make generated class ownership explicit.
              </neural-accordion-content>
            </neural-accordion-panel>
        </neural-accordion>
      \`,
      styles: \`
	      .docs-headless-accordion {
	      	display: grid;
	      	gap: 0.375rem;
	      }

	      .docs-headless-accordion__panel {
	      	overflow: hidden;
	      	color: #e0f2fe;
	      	background: #082f49;
	      	border: 1px solid #0e7490;
	      	border-radius: 0.875rem;
	      }

	      .docs-headless-accordion__panel--open {
	      	border-color: #22d3ee;
	      	box-shadow: 0 0 0 1px rgb(34 211 238 / 0.18);
	      }

	      .docs-headless-accordion__header {
	      	margin: 0;
	      }

	      .docs-headless-accordion__trigger {
	      	display: flex;
	      	align-items: center;
	      	justify-content: space-between;
	      	width: 100%;
	      	padding: 0.625rem 0.875rem;
	      	color: inherit;
	      	background: transparent;
	      	border: 0;
	      	font: inherit;
	      	font-size: 0.875rem;
	      	font-weight: 700;
	      }

	      .docs-headless-accordion__icon {
	      	width: 0.6rem;
	      	height: 0.6rem;
	      	border: solid #67e8f9;
	      	border-width: 0 2px 2px 0;
	      	transform: rotate(45deg);
	      }

	      [data-expanded='true']
	      > .docs-headless-accordion__header
	      .docs-headless-accordion__icon {
	      	transform: rotate(-135deg);
	      }

	      .docs-headless-accordion__content-inner {
	      	padding: 0.125rem 0.875rem 0.75rem;
	      	color: #bae6fd;
	      	font-size: 0.875rem;
	      	line-height: 1.5;
	      }
        \`
    })
    export class AccordionExampleComponent {

    	readonly headlessValue = signal<NeuralAccordionModelValue>('semantic');

    	readonly headlessClasses: NeuralAccordionClasses = {
    		root: 'docs-headless-accordion',
    		panel: 'docs-headless-accordion__panel',
    		expandedPanel: 'docs-headless-accordion__panel--open',
    		header: 'docs-headless-accordion__header',
    		trigger: 'docs-headless-accordion__trigger',
    		label: 'docs-headless-accordion__label',
    		icon: 'docs-headless-accordion__icon',
    		content: 'docs-headless-accordion__content',
    		contentInner: 'docs-headless-accordion__content-inner',
    	};
    }
  `;

}
