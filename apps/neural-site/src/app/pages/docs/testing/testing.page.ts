import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-testing-page',
  imports: [SiteOnThisPage, CodeView],
  templateUrl: './testing.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestingPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly pageLinks = [
    ['Testing philosophy', 'philosophy'],
    ['Component setup', 'setup'],
    ['Signals and events', 'signals'],
    ['Forms', 'forms'],
    ['Keyboard behavior', 'keyboard'],
    ['Overlays', 'overlays'],
    ['Async states', 'async'],
    ['Accessibility', 'accessibility'],
    ['SSR', 'ssr'],
    ['Stable selectors', 'selectors'],
  ] as const;

  readonly setupCode = `import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuralButton } from '@neural-ng/core/button';

@Component({
  imports: [NeuralButton],
  template: \`
    <neural-button label="Save" (clicked)="saved.set(true)" />
  \`,
})
class Host {
  readonly saved = signal(false);
}

it('runs the consumer action', async () => {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();

  const button = fixture.nativeElement.querySelector('button');
  button.click();

  expect(fixture.componentInstance.saved()).toBe(true);
});`;

  readonly formsCode = `@Component({
  imports: [ReactiveFormsModule, NeuralInput],
  template: \`<input neuralInput [formControl]="email" />\`,
})
class Host {
  readonly email = new FormControl('', { nonNullable: true });
}

it('keeps the form model in sync', () => {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const input = fixture.nativeElement.querySelector('input');

  input.value = 'agent@neural.dev';
  input.dispatchEvent(new Event('input'));

  expect(fixture.componentInstance.email.value).toBe('agent@neural.dev');
});`;

  readonly keyboardCode = `const trigger = fixture.nativeElement.querySelector('[role="combobox"]');
trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
fixture.detectChanges();

expect(trigger.getAttribute('aria-expanded')).toBe('true');
expect(document.querySelector('[role="listbox"]')).not.toBeNull();`;

  readonly overlayCode = `import { ComponentFixture, TestBed } from '@angular/core/testing';

let fixture: ComponentFixture<SelectHost>;

afterEach(() => fixture?.destroy());

it('opens an accessible listbox', () => {
  fixture = TestBed.createComponent(SelectHost);
  fixture.detectChanges();

  fixture.nativeElement.querySelector('[role="combobox"]').click();
  fixture.detectChanges();

  const panel = document.body.querySelector('[role="listbox"]');
  expect(panel).not.toBeNull();
});`;

  readonly axeCode = `import AxeBuilder from '@axe-core/playwright';

test('checkout has no detectable accessibility violations', async ({ page }) => {
  await page.goto('/checkout');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});`;

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
