import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';
import {
  CheckboxComponent,
  TriStateCheckboxComponent,
  type NeuralTriStateCheckboxValue,
} from '@neural-ng/core/checkbox';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import { NeuralMessageService } from '@neural-ng/core/message';
import { RadioGroupComponent } from '@neural-ng/core/radio';
import { SwitchComponent } from '@neural-ng/core/switch';
import { ToastComponent } from '@neural-ng/core/toast';
import { EditorComponent, type NeuralEditorDocument } from '@neural-ng/editor';

@Component({
  selector: 'app-root',
  imports: [
    NeuralButton,
    CheckboxComponent,
    EditorComponent,
    RadioGroupComponent,
    SwitchComponent,
    ToastComponent,
    TriStateCheckboxComponent,
  ],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly messages = inject(NeuralMessageService);
  readonly colorMode = inject(NeuralColorModeService);

  readonly notifications = signal(true);
  readonly inheritedPermission = signal<NeuralTriStateCheckboxValue>(null);
  readonly compactMode = signal(false);
  readonly plan = signal<string | null>('starter');
  readonly document = signal<NeuralEditorDocument>({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Neural Starter is ready.' }],
      },
    ],
  });

  readonly plans = [
    { label: 'Starter', value: 'starter' },
    { label: 'Team', value: 'team' },
    { label: 'Enterprise', value: 'enterprise' },
  ];

  showToast(): void {
    this.messages.notify({
      severity: 'success',
      title: 'Installed',
      message:
        'Core, Icons, Editor, Theme Compiler and MCP Server are connected.',
      duration: 5000,
    });
  }

  toggleMode(): void {
    this.colorMode.set(
      this.colorMode.resolvedMode() === 'dark' ? 'light' : 'dark',
    );
  }
}
