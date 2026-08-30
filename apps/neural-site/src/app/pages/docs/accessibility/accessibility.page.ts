import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NeuralButton } from '@neural-ng/core/button';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-accessibility-page',
  imports: [SiteOnThisPage, CodeView, NeuralButton],
  templateUrl: './accessibility.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessibilityPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly pageLinks = [
    ['Responsibility boundary', 'boundary'],
    ['Native semantics', 'semantics'],
    ['Names and descriptions', 'names'],
    ['Keyboard contracts', 'keyboard'],
    ['Focus and overlays', 'focus'],
    ['States and feedback', 'states'],
    ['Motion and contrast', 'visual'],
    ['RTL and localization', 'rtl'],
    ['Testing', 'testing'],
    ['SSR and hydration', 'ssr'],
  ] as const;

  readonly keyboardPatterns = [
    ['Button', 'Enter, Space', 'Native button activation'],
    ['Tabs', 'Arrow keys, Home, End', 'Automatic or manual activation'],
    [
      'Combobox',
      'Up, Down, Enter, Escape',
      'Active option via aria-activedescendant',
    ],
    ['Tree', 'Arrow keys, Home, End, typeahead', 'Roving treeitem focus'],
    [
      'Dialog and Drawer',
      'Tab, Shift+Tab, Escape',
      'Focus containment and restoration',
    ],
    [
      'DatePicker',
      'Arrow keys, Home, End, Page Up/Down',
      'Grid navigation across dates',
    ],
    ['Toolbar', 'Orientation arrows, Home, End', 'Roving action focus'],
  ] as const;

  readonly semanticsCode = `<neural-button label="Save changes" />

<neural-button
  icon="nt nt-settings"
  ariaLabel="Open settings"
  rounded
/>

<neural-button
  label="Saving changes"
  [loading]="true"
  loadingLabel="Saving changes"
/>`;

  readonly fieldCode = `<neural-field
  controlId="account-email"
  required
  [invalid]="email.touched() && email.invalid()"
>
  <label neuralFieldLabel>Email</label>
  <input neuralInput type="email" autocomplete="email" [formField]="email" />
  <small neuralFieldHint>Use your work address.</small>

  @if (email.touched() && email.invalid()) {
    <small neuralFieldError>Enter a valid email address.</small>
  }
</neural-field>`;

  readonly overlayCode = `<neural-dialog #review ariaLabelledby="review-title">
  <neural-dialog-header>
    <h2 id="review-title">Review release</h2>
  </neural-dialog-header>
  <neural-dialog-body>
    <input neuralInput neuralDialogInitialFocus aria-label="Release name" />
  </neural-dialog-body>
</neural-dialog>

<neural-button label="Open review" (clicked)="review.open()" />`;

  readonly testCode = `import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('button example has no detectable violations', async ({ page }) => {
  await page.goto('/docs/components/button');
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();

  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations).toEqual([]);
});`;

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
