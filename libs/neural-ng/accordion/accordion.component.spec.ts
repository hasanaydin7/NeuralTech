import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '../src/neural-ng.config';
import {
  AccordionComponent,
  AccordionContentComponent,
  AccordionHeaderComponent,
  AccordionPanelComponent,
} from './accordion.component';
import type {
  NeuralAccordionClasses,
  NeuralAccordionModelValue,
  NeuralAccordionPanelChange,
} from './accordion.types';

const ACCORDION_IMPORTS = [
  AccordionComponent,
  AccordionPanelComponent,
  AccordionHeaderComponent,
  AccordionContentComponent,
];

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  locked?: boolean;
}

@Component({
  imports: [AccordionComponent],
  template: `
    <neural-accordion
      accordionId="faq"
      [items]="items"
      itemLabel="question"
      itemValue="id"
      itemContent="answer"
      itemDisabled="locked"
      [(value)]="value"
      [multiple]="multiple()"
      [collapsible]="collapsible()"
      [unstyled]="unstyled()"
      [classes]="classes"
      (panelChange)="events.push($event)"
    />
  `,
})
class DataAccordionHost {
  readonly value = signal<NeuralAccordionModelValue>(null);
  readonly multiple = signal(false);
  readonly collapsible = signal(true);
  readonly unstyled = signal(false);
  readonly items: readonly FaqItem[] = [
    { id: 'signals', question: 'Why Signals?', answer: 'Deterministic state.' },
    {
      id: 'ssr',
      question: 'Does SSR work?',
      answer: 'Yes.',
      locked: true,
    },
    { id: 'headless', question: 'Is it headless?', answer: 'Completely.' },
  ];
  readonly events: NeuralAccordionPanelChange[] = [];
  readonly classes: NeuralAccordionClasses = {
    root: 'slot-root',
    panel: 'slot-panel',
    expandedPanel: 'slot-expanded',
    disabledPanel: 'slot-disabled',
    header: 'slot-header',
    trigger: 'slot-trigger',
    label: 'slot-label',
    icon: 'slot-icon',
    content: 'slot-content',
    contentInner: 'slot-content-inner',
  };
}

@Component({
  imports: ACCORDION_IMPORTS,
  template: `
    <neural-accordion
      accordionId="project"
      [(value)]="value"
      (panelChange)="events.push($event)"
    >
      <neural-accordion-panel value="overview" panelClass="local-panel">
        <neural-accordion-header
          headerClass="local-header"
          triggerClass="local-trigger"
        >
          Overview
        </neural-accordion-header>
        <neural-accordion-content contentClass="local-content">
          Project overview
        </neural-accordion-content>
      </neural-accordion-panel>
      <neural-accordion-panel value="billing" disabled>
        <neural-accordion-header>Billing</neural-accordion-header>
        <neural-accordion-content>Billing details</neural-accordion-content>
      </neural-accordion-panel>
      <neural-accordion-panel value="team">
        <neural-accordion-header>Team</neural-accordion-header>
        <neural-accordion-content>Team members</neural-accordion-content>
      </neural-accordion-panel>
    </neural-accordion>
  `,
})
class ProjectedAccordionHost {
  readonly value = signal<NeuralAccordionModelValue>(null);
  readonly events: NeuralAccordionPanelChange[] = [];
}

describe('Accordion', () => {
  async function createDataHost(
    providers: ReturnType<typeof provideNeuralNg>[] = [],
  ) {
    await TestBed.configureTestingModule({
      imports: [DataAccordionHost],
      providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(DataAccordionHost);
    fixture.detectChanges();
    return fixture;
  }

  it('renders data items with complete button and region relationships', async () => {
    const fixture = await createDataHost();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    const regions = fixture.nativeElement.querySelectorAll(
      '[role="region"]',
    ) as NodeListOf<HTMLElement>;

    expect(buttons).toHaveLength(3);
    expect(buttons[0].id).toBe('faq-trigger-0');
    expect(buttons[0].getAttribute('aria-controls')).toBe('faq-content-0');
    expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
    expect(regions[0].getAttribute('aria-labelledby')).toBe('faq-trigger-0');
    expect(regions[0].getAttribute('aria-hidden')).toBe('true');
    expect(regions[0].hasAttribute('inert')).toBe(true);
    expect(
      regions[0].firstElementChild?.classList.contains(
        'neural-accordion-content-clip-root',
      ),
    ).toBe(true);
    expect(buttons[1].disabled).toBe(true);
    expect(regions[0].textContent).toContain('Deterministic state.');
  });

  it('updates the model and emits detailed pointer changes', async () => {
    const fixture = await createDataHost();
    const first = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;

    first.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('signals');
    expect(first.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.componentInstance.events[0]).toMatchObject({
      panelValue: 'signals',
      expanded: true,
      value: 'signals',
      previousValue: null,
      source: 'pointer',
    });

    first.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBeNull();
  });

  it('supports multiple values and prevents collapse when configured', async () => {
    const fixture = await createDataHost();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();

    buttons[0].click();
    buttons[2].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual(['signals', 'headless']);

    fixture.componentInstance.multiple.set(false);
    fixture.componentInstance.collapsible.set(false);
    fixture.componentInstance.value.set('signals');
    fixture.detectChanges();
    buttons[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('signals');
  });

  it('navigates headers with arrows, Home and End while skipping disabled', async () => {
    const fixture = await createDataHost();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;

    buttons[0].focus();
    buttons[0].dispatchEvent(keydown('ArrowDown'));
    expect(document.activeElement).toBe(buttons[2]);
    buttons[2].dispatchEvent(keydown('ArrowDown'));
    expect(document.activeElement).toBe(buttons[0]);
    buttons[0].dispatchEvent(keydown('End'));
    expect(document.activeElement).toBe(buttons[2]);
    buttons[2].dispatchEvent(keydown('Home'));
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('supports projected composition and local section classes', async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectedAccordionHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProjectedAccordionHost);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;

    expect(buttons[0].id).toBe('project-trigger-0');
    expect(buttons[0].classList).toContain('local-trigger');
    expect(fixture.nativeElement.querySelector('h3').classList).toContain(
      'local-header',
    );
    expect(fixture.nativeElement.querySelector('section').classList).toContain(
      'local-panel',
    );
    expect(
      fixture.nativeElement.querySelector('[role="region"]').classList,
    ).toContain('local-content');
    expect(
      fixture.nativeElement
        .querySelector('[role="region"]')
        .firstElementChild.classList,
    ).toContain('neural-accordion-content-clip-root');

    buttons[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('overview');
    expect(
      fixture.nativeElement
        .querySelector('[role="region"]')
        .getAttribute('aria-hidden'),
    ).toBe('false');
  });

  it('retains structural and typed consumer classes in unstyled mode', async () => {
    const fixture = await createDataHost();
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('.neural-accordion-root');
    const panel = fixture.nativeElement.querySelector(
      '.neural-accordion-panel-root',
    );
    const trigger = fixture.nativeElement.querySelector('button');
    expect(root.classList).toContain('slot-root');
    expect(root.classList).not.toContain('neural-accordion-base');
    expect(panel.classList).toContain('slot-panel');
    expect(panel.classList).not.toContain('neural-accordion-panel-base');
    expect(trigger.classList).toContain('slot-trigger');
    expect(trigger.classList).not.toContain('neural-accordion-trigger-base');
  });

  it('inherits global unstyled mode', async () => {
    const fixture = await createDataHost([provideNeuralNg({ unstyled: true })]);
    expect(
      fixture.nativeElement.querySelector('.neural-accordion-base'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.neural-accordion-trigger-base'),
    ).toBeNull();
  });
});

function keydown(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
}
