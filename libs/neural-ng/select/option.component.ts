import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  booleanAttribute,
  input,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'neural-option',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #content>
      <ng-content />
    </ng-template>
  `,
  host: {
    class: 'neural-option-declaration',
    '[attr.aria-hidden]': 'true',
  },
  styles: `
    :host {
      display: none !important;
    }
  `,
})
export class OptionComponent {
  readonly value = input.required<unknown>();
  readonly label = input.required<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly iconClass = input('');
  readonly content = viewChild.required<TemplateRef<unknown>>('content');
}
