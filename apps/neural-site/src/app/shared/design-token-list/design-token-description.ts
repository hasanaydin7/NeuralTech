const COMPONENT_PREFIXES = [
  'loading-overlay',
  'confirm-dialog',
  'auto-complete',
  'multi-select',
  'progress-spinner',
  'progress-bar',
  'virtual-scroller',
  'input-number',
  'input-mask',
  'input-otp',
  'file-upload',
  'date-picker',
  'meter-group',
  'panel-menu',
  'tree-select',
  'data-view',
  'breadcrumb',
  'accordion',
  'checkbox',
  'textarea',
  'skeleton',
  'sidebar',
  'popover',
  'paginator',
  'toolbar',
  'divider',
  'message',
  'editor',
  'dialog',
  'drawer',
  'avatar',
  'button',
  'select',
  'slider',
  'switch',
  'radio',
  'input',
  'field',
  'badge',
  'toast',
  'table',
  'tabs',
  'tab',
  'menu',
  'card',
  'tree',
  'tag',
] as const;

const STATE_LABELS: Readonly<Record<string, string>> = {
  active: 'Active',
  checked: 'Checked',
  disabled: 'Disabled',
  expanded: 'Expanded',
  focus: 'Focused',
  hover: 'Hovered',
  invalid: 'Invalid',
  readonly: 'Readonly',
  selected: 'Selected',
};

const PROPERTY_DESCRIPTIONS: Readonly<
  Record<string, (subject: string) => string>
> = {
  'focus-ring-offset': (subject) => `${subject} focus ring offset.`,
  'focus-ring': (subject) => `${subject} keyboard focus ring.`,
  'border-color': (subject) => `${subject} border color.`,
  'backdrop-filter': (subject) => `${subject} backdrop filter effect.`,
  'font-family': (subject) => `${subject} font family.`,
  'font-size': (subject) => `${subject} font size.`,
  'font-weight': (subject) => `${subject} font weight.`,
  font: (subject) => `${subject} font shorthand.`,
  'line-height': (subject) => `${subject} line height.`,
  'min-height': (subject) => `${subject} minimum block size.`,
  'max-height': (subject) => `${subject} maximum block size.`,
  'min-width': (subject) => `${subject} minimum inline size.`,
  'max-width': (subject) => `${subject} maximum inline size.`,
  'writing-mode': (subject) => `${subject} CSS writing mode.`,
  'text-align': (subject) => `${subject} text alignment.`,
  'caret-color': (subject) => `${subject} text caret color.`,
  'enter-distance': (subject) => `${subject} enter animation travel distance.`,
  'enter-duration': (subject) => `${subject} enter animation duration.`,
  'enter-easing': (subject) => `${subject} enter animation easing curve.`,
  'enter-scale': (subject) => `${subject} enter animation starting scale.`,
  'leave-duration': (subject) => `${subject} leave animation duration.`,
  'leave-easing': (subject) => `${subject} leave animation easing curve.`,
  border: (subject) => `${subject} border shorthand.`,
  background: (subject) => `${subject} background surface.`,
  color: (subject) => `${subject} foreground color.`,
  shadow: (subject) => `${subject} box shadow.`,
  radius: (subject) => `${subject} corner radius.`,
  padding: (subject) => `${subject} internal spacing.`,
  'margin-block': (subject) => `${subject} logical block-axis margin.`,
  'margin-inline': (subject) => `${subject} logical inline-axis margin.`,
  margin: (subject) => `${subject} outer spacing.`,
  gap: (subject) => `Spacing between ${lowerFirst(subject)} items.`,
  width: (subject) => `${subject} inline size.`,
  height: (subject) => `${subject} block size.`,
  size: (subject) => `${subject} width and height.`,
  opacity: (subject) => `${subject} opacity.`,
  transition: (subject) => `${subject} CSS transition.`,
  duration: (subject) => `${subject} animation duration.`,
  easing: (subject) => `${subject} animation easing curve.`,
  offset: (subject) => `${subject} positional offset.`,
  inset: (subject) => `${subject} logical inset from its containing edge.`,
  'z-index': (subject) => `${subject} stacking order.`,
  overlap: (subject) => `${subject} overlap distance.`,
  ring: (subject) => `${subject} outline ring.`,
  fit: (subject) => `${subject} object-fit behavior.`,
  position: (subject) => `${subject} object position.`,
  justify: (subject) => `${subject} main-axis alignment.`,
  align: (subject) => `${subject} cross-axis alignment.`,
  content: (subject) => `${subject} generated CSS content.`,
  cursor: (subject) => `${subject} pointer cursor.`,
  backdrop: (subject) => `${subject} backdrop color.`,
  filter: (subject) => `${subject} CSS filter effect.`,
  accent: (subject) => `${subject} accent color.`,
  outline: (subject) => `${subject} outline.`,
};

const PROPERTIES = Object.keys(PROPERTY_DESCRIPTIONS).sort(
  (a, b) => b.length - a.length,
);

const EXACT_DESCRIPTIONS: Readonly<Record<string, string>> = {
  '--neural-sidebar-layout-min-height':
    'Minimum block size of the complete Sidebar application shell.',
  '--neural-sidebar-layout-background':
    'Background behind the Sidebar panel and main application region.',
  '--neural-sidebar-main-background':
    'Background surface of content marked with neuralSidebarMain.',
  '--neural-sidebar-backdrop':
    'Backdrop color shown while an overlay Sidebar is open.',
  '--neural-sidebar-backdrop-filter':
    'Backdrop filter applied behind an open overlay Sidebar.',
  '--neural-sidebar-header-padding':
    'Internal spacing of the projected Sidebar header section.',
  '--neural-sidebar-content-padding':
    'Internal spacing of the independently scrollable Sidebar content.',
  '--neural-sidebar-footer-padding':
    'Internal spacing of the projected Sidebar footer section.',
  '--neural-sidebar-floating-margin':
    'Outer spacing around the floating Sidebar variant.',
  '--neural-sidebar-inset-margin':
    'Outer spacing around the inset Sidebar variant.',
  '--neural-sidebar-nested-flyout-offset':
    'Logical inline gap between adjacent nested flyout panels in a collapsed icon rail.',
  '--neural-sidebar-nested-flyout-width':
    'Inline size of second-level and deeper flyout panels in a collapsed icon rail.',
  '--neural-menu-group-label-transform':
    'Text transformation applied to Menu category headings.',
  '--neural-menu-group-label-letter-spacing':
    'Letter spacing applied to Menu category headings.',
  '--neural-panel-menu-item-padding-block':
    'Logical block-axis padding inside each PanelMenu item.',
  '--neural-panel-menu-item-padding-inline':
    'Base logical inline-axis padding inside each PanelMenu item.',
  '--neural-panel-menu-level-indent':
    'Additional logical inline indentation applied for each nested PanelMenu level.',
  '--neural-password-strength-weak':
    'Indicator color used for a weak password score.',
  '--neural-password-strength-medium':
    'Indicator color used for a medium password score.',
  '--neural-password-strength-strong':
    'Indicator color used for a strong password score.',
  '--neural-progress-spinner-dasharray':
    'Stroke dash pattern that controls the visible spinner arc length.',
  '--neural-progress-spinner-linecap':
    'Stroke line-cap style applied to spinner arcs.',
  '--neural-switch-thumb-translate':
    'Logical travel distance of the Switch thumb in its checked state.',
  '--neural-table-selected-indicator':
    'Color of the inset indicator on the first cell of a selected Table row.',
  '--neural-tree-node-padding-block':
    'Logical block-axis padding inside each Tree node.',
  '--neural-tree-node-padding-inline':
    'Logical inline-end padding inside each Tree node.',
  '--neural-tree-node-background-partial':
    'Background surface of a partially selected Tree node.',
  '--neural-tree-indent':
    'Logical inline indentation added for each nested Tree level.',
  '--neural-tree-compact-indent':
    'Nested Tree indentation used by compact mode.',
  '--neural-avatar-current-size':
    'Resolved avatar width and height after applying the selected size preset.',
  '--neural-data-view-grid-min':
    'Minimum item width used by the responsive grid layout.',
  '--neural-data-view-list-divider':
    'Border drawn between adjacent items in list layout.',
  '--neural-date-picker-day-color-outside':
    'Foreground color for days that belong to an adjacent month.',
  '--neural-divider-edge-size':
    'Minimum line length retained on each side of centered divider content.',
  '--neural-editor-placeholder-opacity':
    'Opacity of the editor placeholder when the document is empty.',
  '--neural-file-upload-file-name-weight':
    'Font weight of each uploaded file name.',
  '--neural-meter-group-item-color':
    'Color assigned to the current meter segment; an item color can override it.',
  '--neural-meter-group-color-1':
    'First fallback color in the automatic meter item palette.',
  '--neural-meter-group-color-2':
    'Second fallback color in the automatic meter item palette.',
  '--neural-meter-group-color-3':
    'Third fallback color in the automatic meter item palette.',
  '--neural-meter-group-color-4':
    'Fourth fallback color in the automatic meter item palette.',
  '--neural-meter-group-color-5':
    'Fifth fallback color in the automatic meter item palette.',
  '--neural-meter-group-color-6':
    'Sixth fallback color in the automatic meter item palette.',
  '--neural-textarea-auto-min-block-size':
    'Minimum logical height retained while auto resize is active.',
  '--neural-textarea-auto-max-block-size':
    'Maximum logical height before an auto-resizing textarea starts scrolling.',
  '--neural-toolbar-separator-length':
    'Block-axis length of a separator in a horizontal toolbar.',
  '--neural-progress-spinner-color-1':
    'First color in the multicolor spinner cycle.',
  '--neural-progress-spinner-color-2':
    'Second color in the multicolor spinner cycle.',
  '--neural-progress-spinner-color-3':
    'Third color in the multicolor spinner cycle.',
  '--neural-progress-spinner-color-4':
    'Fourth color in the multicolor spinner cycle.',
  '--neural-progress-spinner-color-5':
    'Fifth color in the multicolor spinner cycle.',
  '--neural-progress-spinner-color-duration':
    'Duration of one complete multicolor cycle.',
  '--neural-progress-spinner-dynamic-stroke-duration':
    'Duration of one arc growth and contraction cycle.',
  '--neural-progress-spinner-dual-scale':
    'Scale of the inner ring relative to the outer ring.',
  '--neural-progress-spinner-dual-track-opacity':
    'Opacity of the inner circular track in dual mode.',
  '--neural-progress-spinner-dual-indicator-opacity':
    'Opacity of the animated inner arc in dual mode.',
  '--neural-field-required-content':
    'Generated marker appended to labels for required fields.',
};

export function describeDesignToken(token: string): string {
  const exact = EXACT_DESCRIPTIONS[token];
  if (exact) return exact;
  const normalized = token.replace(/^--neural-/, '');
  const component = COMPONENT_PREFIXES.find(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}-`),
  );
  let remainder = component
    ? normalized.slice(component.length).replace(/^-/, '')
    : normalized;
  const states: string[] = [];
  let foundState = true;
  while (foundState) {
    foundState = false;
    for (const state of Object.keys(STATE_LABELS)) {
      if (remainder === state || remainder.endsWith(`-${state}`)) {
        states.unshift(STATE_LABELS[state] ?? titleCase(state));
        remainder = remainder.slice(
          0,
          -(state.length + (remainder === state ? 0 : 1)),
        );
        foundState = true;
        break;
      }
    }
  }
  const property = PROPERTIES.find(
    (candidate) =>
      remainder === candidate || remainder.endsWith(`-${candidate}`),
  );
  if (!property)
    return `${titleCase(remainder || component || 'component')} visual token.`;
  const subjectKey = remainder
    .slice(0, -(property.length + (remainder === property ? 0 : 1)))
    .replace(/-$/, '');
  const formattedSubject = subjectKey
    ? formatSubject(subjectKey)
    : defaultSubject(component);
  const subject = [
    ...states,
    states.length > 0 ? lowerFirst(formattedSubject) : formattedSubject,
  ].join(' ');
  return (
    PROPERTY_DESCRIPTIONS[property]?.(subject) ?? `${subject} ${property}.`
  );
}

function defaultSubject(component: string | undefined): string {
  if (component === 'input' || component?.startsWith('input-'))
    return 'Control';
  if (component === 'select' || component === 'multi-select') return 'Trigger';
  if (component === 'toast') return 'Toast stack';
  if (component === 'field') return 'Field';
  return 'Component';
}

function formatSubject(value: string): string {
  const parts = value.split('-').map((part) => {
    if (part === 'ai') return 'AI';
    if (part === 'ssr') return 'SSR';
    if (part === 'sm') return 'small';
    if (part === 'md') return 'medium';
    if (part === 'lg') return 'large';
    if (part === 'xl') return 'extra-large';
    if (part === 'xs') return 'extra-small';
    return part;
  });
  const severityIndex = parts.findIndex((part) =>
    [
      'primary',
      'secondary',
      'neutral',
      'info',
      'success',
      'warning',
      'error',
    ].includes(part),
  );
  if (severityIndex >= 0) parts.splice(severityIndex + 1, 0, 'severity');
  return titleCase(parts.join(' '));
}

function titleCase(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Component';
}

function lowerFirst(value: string): string {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : 'component';
}
