import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NeuralInput, NeuralInputGroup } from '@neural-ng/core/input';

interface ComponentCatalogItem {
  readonly name: string;
  readonly category: string;
  readonly entryPoint: string;
  readonly route: string;
  readonly summary: string;
}

@Component({
  selector: 'app-components-overview-page',
  imports: [NeuralInput, NeuralInputGroup, RouterLink],
  templateUrl: './components-overview.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentsOverviewPage {
  readonly query = signal('');

  readonly components: readonly ComponentCatalogItem[] = [
    this.item(
      'Breadcrumb',
      'Navigation',
      'breadcrumb',
      'Show the current location inside a route hierarchy.',
    ),
    this.item(
      'Menu',
      'Navigation',
      'menu',
      'Present commands, links and nested action groups.',
    ),
    this.item(
      'PanelMenu',
      'Navigation',
      'panel-menu',
      'Navigate expandable hierarchical sections.',
    ),
    this.item(
      'Sidebar',
      'Navigation',
      'sidebar',
      'Compose persistent, collapsible and responsive application navigation.',
    ),
    this.item(
      'Accordion',
      'Content',
      'accordion',
      'Reveal collapsible content panels one section at a time.',
    ),
    this.item(
      'Tabs',
      'Content',
      'tabs',
      'Switch between related panels without leaving the page.',
    ),
    this.item(
      'Card',
      'Content',
      'card',
      'Compose titled content, media and actions on one surface.',
    ),
    this.item(
      'DataView',
      'Data',
      'data-view',
      'Render a collection with list/grid layout and sorting.',
    ),
    this.item(
      'Tree',
      'Data',
      'tree',
      'Explore and select hierarchical data inline.',
    ),
    this.item(
      'TreeSelect',
      'Data',
      'tree-select',
      'Choose hierarchical values from a compact overlay.',
    ),
    this.item(
      'VirtualScroller',
      'Data',
      'virtual-scroller',
      'Window large vertical or horizontal collections.',
    ),
    this.item(
      'Table',
      'Data',
      'table',
      'Present, query, select and edit structured records.',
    ),
    this.item(
      'Paginator',
      'Data',
      'paginator',
      'Navigate a known or remote paged collection.',
    ),
    this.item(
      'Button',
      'Button',
      'button',
      'Trigger a native, accessible application action.',
    ),
    this.item(
      'AutoComplete',
      'Forms',
      'auto-complete',
      'Suggest local or remote values while the user types.',
    ),
    this.item(
      'Checkbox',
      'Forms',
      'checkbox',
      'Choose binary or tri-state independent values.',
    ),
    this.item(
      'Field',
      'Forms',
      'field',
      'Connect labels, hints, errors and control state.',
    ),
    this.item(
      'Input',
      'Forms',
      'input',
      'Apply NeuralNg state and styling to native text input.',
    ),
    this.item(
      'Textarea',
      'Forms',
      'textarea',
      'Capture multi-line text with resizing and counters.',
    ),
    this.item(
      'Radio',
      'Forms',
      'radio',
      'Choose exactly one value from a visible group.',
    ),
    this.item(
      'Slider',
      'Forms',
      'slider',
      'Choose one value or a range on a continuous track.',
    ),
    this.item(
      'Switch',
      'Forms',
      'switch',
      'Toggle an immediately applied boolean setting.',
    ),
    this.item(
      'FileUpload',
      'Forms',
      'file-upload',
      'Select, validate and upload files with progress.',
    ),
    this.item(
      'InputMask',
      'Forms',
      'input-mask',
      'Constrain editable text to a deterministic mask.',
    ),
    this.item(
      'Password',
      'Forms',
      'password',
      'Capture passwords with reveal and strength feedback.',
    ),
    this.item(
      'InputNumber',
      'Forms',
      'input-number',
      'Edit localized numeric, currency or percent values.',
    ),
    this.item(
      'InputOtp',
      'Forms',
      'input-otp',
      'Enter a fixed-length verification code.',
    ),
    this.item(
      'Editor',
      'Forms',
      'editor',
      'Create structured rich text and collaborative content.',
      '@neural-ng/editor',
    ),
    this.item(
      'Select',
      'Forms',
      'select',
      'Choose one value from a local option collection.',
    ),
    this.item(
      'MultiSelect',
      'Forms',
      'multi-select',
      'Choose multiple values with chips and filtering.',
    ),
    this.item(
      'DatePicker',
      'Forms',
      'date-picker',
      'Choose dates, ranges, months, years and time.',
    ),
    this.item(
      'LoadingOverlay',
      'Overlay',
      'loading-overlay',
      'Block a region or viewport while work is pending.',
    ),
    this.item(
      'Popover',
      'Overlay',
      'popover',
      'Show arbitrary interactive content near a trigger.',
    ),
    this.item(
      'Tooltip',
      'Overlay',
      'tooltip',
      'Expose a short non-interactive description on demand.',
    ),
    this.item(
      'Dialog',
      'Overlay',
      'dialog',
      'Request focused modal or non-modal interaction.',
    ),
    this.item(
      'Drawer',
      'Overlay',
      'drawer',
      'Reveal an edge-aligned task or navigation surface.',
    ),
    this.item(
      'ConfirmDialog',
      'Overlay',
      'confirm-dialog',
      'Ask for explicit confirmation through a service.',
    ),
    this.item(
      'Message',
      'Feedback',
      'message',
      'Render persistent contextual feedback inside content.',
    ),
    this.item(
      'Toast',
      'Feedback',
      'toast',
      'Deliver transient global feedback through channels.',
    ),
    this.item(
      'ProgressBar',
      'Feedback',
      'progress-bar',
      'Show determinate or indeterminate linear progress.',
    ),
    this.item(
      'ProgressSpinner',
      'Feedback',
      'progress-spinner',
      'Show compact indeterminate activity.',
    ),
    this.item(
      'Skeleton',
      'Feedback',
      'skeleton',
      'Reserve layout while content is being loaded.',
    ),
    this.item(
      'Avatar',
      'Misc',
      'avatar',
      'Represent a person or entity with image, initials or icon.',
    ),
    this.item(
      'Badge',
      'Misc',
      'badge',
      'Attach a compact count or status to another element.',
    ),
    this.item(
      'Tag',
      'Misc',
      'tag',
      'Display a standalone category, state or removable label.',
    ),
    this.item(
      'Toolbar',
      'Misc',
      'toolbar',
      'Group related actions with keyboard navigation.',
    ),
    this.item(
      'MeterGroup',
      'Misc',
      'meter-group',
      'Compare multiple scalar measurements in one range.',
    ),
    this.item(
      'Divider',
      'Misc',
      'divider',
      'Separate related content with optional labeling.',
    ),
  ];

  readonly filteredComponents = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    if (!query) return this.components;
    return this.components.filter((item) =>
      [item.name, item.category, item.entryPoint, item.summary]
        .join(' ')
        .toLocaleLowerCase()
        .includes(query),
    );
  });

  updateQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  private item(
    name: string,
    category: string,
    slug: string,
    summary: string,
    packageName = `@neural-ng/core/${slug}`,
  ): ComponentCatalogItem {
    return {
      name,
      category,
      entryPoint: packageName,
      route: `/docs/components/${slug}`,
      summary,
    };
  }
}
