import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '../src/neural-ng.config';
import {
  NeuralCard,
  NeuralCardBody,
  NeuralCardFooter,
  NeuralCardHeader,
} from './card.component';
import type { NeuralCardClasses } from './card.types';

@Component({
  imports: [NeuralCard, NeuralCardHeader, NeuralCardBody, NeuralCardFooter],
  template: `
    <neural-card
      role="region"
      ariaLabelledby="card-title"
      cardClass="consumer-root"
      [classes]="classes"
      [unstyled]="unstyled"
    >
      <neural-card-header headerClass="local-header">
        <h2 id="card-title">Account</h2>
      </neural-card-header>
      <neural-card-body bodyClass="local-body">
        <p>Projected content</p>
      </neural-card-body>
      <neural-card-footer footerClass="local-footer">
        <button type="button">Save</button>
      </neural-card-footer>
    </neural-card>
  `,
})
class CardTestHost {
  unstyled = false;
  classes: NeuralCardClasses = {
    root: 'slot-root',
    header: 'slot-header',
    body: 'slot-body',
    footer: 'slot-footer',
  };
}

describe('Card composition', () => {
  it('defaults to an unnamed native article without an explicit role', async () => {
    await TestBed.configureTestingModule({
      imports: [NeuralCard],
    }).compileComponents();
    const fixture = TestBed.createComponent(NeuralCard);
    fixture.componentRef.setInput('ariaLabel', '   ');
    fixture.componentRef.setInput('ariaLabelledby', '   ');
    fixture.detectChanges();

    const article = fixture.nativeElement.querySelector(
      'article',
    ) as HTMLElement;
    expect(article.getAttribute('role')).toBeNull();
    expect(article.getAttribute('aria-label')).toBeNull();
    expect(article.getAttribute('aria-labelledby')).toBeNull();
    expect(article.classList.contains('neural-card-root')).toBe(true);
    expect(article.classList.contains('neural-card-base')).toBe(true);
  });

  it('renders native article, header and footer semantics', async () => {
    await TestBed.configureTestingModule({
      imports: [CardTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(CardTestHost);
    fixture.detectChanges();

    const article = fixture.nativeElement.querySelector(
      'article',
    ) as HTMLElement;
    expect(article.getAttribute('role')).toBe('region');
    expect(article.getAttribute('aria-labelledby')).toBe('card-title');
    expect(fixture.nativeElement.querySelector('header h2')?.textContent).toBe(
      'Account',
    );
    expect(
      fixture.nativeElement.querySelector('footer button')?.textContent,
    ).toBe('Save');
    expect(
      fixture.nativeElement.querySelector('.neural-card-body-root p')
        ?.textContent,
    ).toBe('Projected content');
  });

  it('merges root and typed slot classes on the native elements', async () => {
    await TestBed.configureTestingModule({
      imports: [CardTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(CardTestHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('article').className).toContain(
      'consumer-root',
    );
    expect(fixture.nativeElement.querySelector('article').className).toContain(
      'slot-root',
    );
    const header = fixture.nativeElement.querySelector('header') as HTMLElement;
    const body = fixture.nativeElement.querySelector(
      '.neural-card-body-root',
    ) as HTMLElement;
    const footer = fixture.nativeElement.querySelector('footer') as HTMLElement;
    expect(header.classList.contains('slot-header')).toBe(true);
    expect(header.classList.contains('local-header')).toBe(true);
    expect(body.classList.contains('slot-body')).toBe(true);
    expect(body.classList.contains('local-body')).toBe(true);
    expect(footer.classList.contains('slot-footer')).toBe(true);
    expect(footer.classList.contains('local-footer')).toBe(true);
  });

  it('keeps structure while removing all visual classes when unstyled', async () => {
    await TestBed.configureTestingModule({
      imports: [CardTestHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(CardTestHost);
    fixture.componentInstance.unstyled = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('article').className).toContain(
      'neural-card-root',
    );
    expect(
      fixture.nativeElement.querySelector('article').className,
    ).not.toContain('neural-card-base');
    expect(
      fixture.nativeElement.querySelector('header').className,
    ).not.toContain('neural-card-header-base');
    expect(
      fixture.nativeElement.querySelector('.neural-card-body-root').className,
    ).not.toContain('neural-card-body-base');
    expect(
      fixture.nativeElement.querySelector('footer').className,
    ).not.toContain('neural-card-footer-base');
  });

  it('inherits application-wide unstyled mode', async () => {
    await TestBed.configureTestingModule({
      imports: [CardTestHost],
      providers: [provideNeuralNg({ unstyled: true })],
    }).compileComponents();
    const fixture = TestBed.createComponent(CardTestHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.neural-card-base')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.neural-card-header-base'),
    ).toBeNull();
  });
});
