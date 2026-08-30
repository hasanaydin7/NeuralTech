import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NeuralButton } from '@neural-ng/core/button';
import { NeuralCheckbox } from '@neural-ng/core/checkbox';
import {
  NeuralCard,
  NeuralCardBody,
  NeuralCardHeader,
} from '@neural-ng/core/card';
import {
  FieldComponent,
  FieldHintDirective,
  FieldLabelDirective,
} from '@neural-ng/core/field';
import { NeuralInput } from '@neural-ng/core/input';
import { RadioGroupComponent } from '@neural-ng/core/radio';
import { SelectComponent } from '@neural-ng/core/select';
import { NeuralSwitch } from '@neural-ng/core/switch';
import { NeuralTextarea } from '@neural-ng/core/textarea';

@Component({
  selector: 'app-landing-page',
  imports: [
    RouterLink,
    NeuralButton,
    NeuralCheckbox,
    NeuralCard,
    NeuralCardHeader,
    NeuralCardBody,
    FieldComponent,
    FieldHintDirective,
    FieldLabelDirective,
    NeuralInput,
    RadioGroupComponent,
    SelectComponent,
    NeuralSwitch,
    NeuralTextarea,
  ],
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {
  readonly lastInteraction = signal('Ready for your first component.');
  readonly architecture = signal<unknown | null>('signals');
  readonly updatesEnabled = signal(true);
  readonly preferredRuntime = signal<string | null>('browser');
  readonly telemetryEnabled = signal(false);
  readonly architectureOptions = [
    { label: 'Signals', value: 'signals' },
    { label: 'Standalone', value: 'standalone' },
    { label: 'SSR + hydration', value: 'ssr' },
  ] as const;
  readonly runtimeOptions = [
    { label: 'Browser', value: 'browser' },
    { label: 'SSR', value: 'ssr' },
  ] as const;

  tryButton(): void {
    this.lastInteraction.set(
      'Signal output received — no EventEmitter needed.',
    );
  }
}
