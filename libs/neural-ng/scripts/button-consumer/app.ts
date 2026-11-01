import { APP_ID, Component, signal } from '@angular/core';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
// eslint-disable-next-line @nx/enforce-module-boundaries -- External installed-package consumer.
import { provideNeuralNg } from '@neural-ng/core';
import { NeuralButton, NeuralButtonGroup } from '@neural-ng/core/button';
import { NeuralMenu, NeuralMenuTrigger } from '@neural-ng/core/menu';

@Component({
  selector: 'neural-ssr-consumer',
  imports: [NeuralButton, NeuralButtonGroup, NeuralMenu, NeuralMenuTrigger],
  template: `
    <neural-button label="Save settings" (clicked)="saves.update(increment)" />
    <output id="saves-value">{{ saves() }}</output>
    <section aria-label="Button integration acceptance">
      <neural-button-group ariaLabel="Consumer actions">
        <neural-button label="First action" />
        <neural-button label="Unavailable action" [disabled]="true" />
        <neural-button label="Last action" />
      </neural-button-group>
      <neural-button-group
        ariaLabel="Vertical consumer actions"
        orientation="vertical"
      >
        <neural-button label="Top action" /><neural-button
          label="Bottom action"
        />
      </neural-button-group>
      <neural-button-group
        ariaLabel="Unstyled consumer group"
        [unstyled]="true"
      >
        <neural-button label="Independent first" /><neural-button
          label="Independent last"
        />
      </neural-button-group>
      <neural-button
        label="Toggle menu loading"
        (clicked)="busy.update(toggle)"
      />
      <neural-button
        id="consumer-menu-trigger"
        label="Consumer menu"
        [loading]="busy()"
        [neuralMenuTriggerFor]="consumerMenu"
      />
      <neural-menu
        #consumerMenu="neuralMenu"
        menuId="consumer-actions-menu"
        ariaLabel="Consumer popup"
        popup
        [items]="menuItems"
      />
      <form
        id="consumer-action-form"
        (submit)="submitAction($event)"
        (reset)="resets.update(increment)"
      >
        <label for="consumer-form-title">Action title</label>
        <input id="consumer-form-title" value="Initial" />
        <neural-button label="No submit" />
        <neural-button label="Submit action" type="submit" [loading]="busy()" />
        <neural-button label="Reset action" type="reset" />
      </form>
      <output id="action-submits">{{ submits() }}</output>
      <output id="action-resets">{{ resets() }}</output>
    </section>
    <section
      id="button-matrix"
      data-neural-theme="neutral"
      aria-label="Button visual contract"
      style="padding:24px;background:var(--neural-color-surface);color:var(--neural-color-text);display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:16px"
    >
      @for (severity of buttonSeverities; track severity) {
        @for (variant of buttonVariants; track variant) {
          <div
            [attr.data-case]="severity + '-' + variant"
            style="display:flex;flex-wrap:wrap;gap:8px;align-items:center"
          >
            <h3 style="flex-basis:100%;margin:0">
              {{ severity }} / {{ variant }}
            </h3>
            <neural-button
              label="Normal"
              [severity]="severity"
              [outlined]="variant.includes('outlined')"
              [text]="variant.includes('text')"
              [raised]="variant.includes('raised')"
              [rounded]="variant === 'rounded'"
              [classes]="{ root: 'matrix-normal' }"
            />
            <neural-button
              label="Disabled"
              [severity]="severity"
              [disabled]="true"
              [outlined]="variant.includes('outlined')"
              [text]="variant.includes('text')"
              [raised]="variant.includes('raised')"
              [rounded]="variant === 'rounded'"
            />
            <neural-button
              label="Busy"
              loadingLabel="Working"
              [severity]="severity"
              [loading]="true"
              [outlined]="variant.includes('outlined')"
              [text]="variant.includes('text')"
              [raised]="variant.includes('raised')"
              [rounded]="variant === 'rounded'"
            />
          </div>
        }
      }
    </section>
  `,
})
export class ConsumerApp {
  readonly buttonSeverities = [
    'primary',
    'secondary',
    'neutral',
    'info',
    'success',
    'warning',
    'error',
  ] as const;
  readonly buttonVariants = [
    'solid',
    'outlined',
    'text',
    'raised',
    'outlined-raised',
    'text-raised',
    'rounded',
  ];
  readonly busy = signal(false);
  readonly saves = signal(0);
  readonly submits = signal(0);
  readonly resets = signal(0);
  readonly increment = (value: number) => value + 1;
  readonly toggle = (value: boolean) => !value;
  readonly menuItems = [{ key: 'details', label: 'Inspect details' }];
  submitAction(event: Event): void {
    event.preventDefault();
    this.submits.update(this.increment);
  }
}

export function createProviders() {
  return [
    { provide: APP_ID, useValue: 'button-acceptance' },
    provideNeuralNg(),
    provideClientHydration(withEventReplay()),
  ];
}
