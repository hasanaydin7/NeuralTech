import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import process from 'node:process';

const execute = promisify(execFile);
const workspaceRoot = process.cwd();
const packageRoot = resolve(
  workspaceRoot,
  process.argv[2] ?? 'dist/libs/neural-ng',
);
const packageJson = await readJson('package.json');

assert(packageJson.name === '@neural-ng/core', 'Unexpected package name.');
assert(
  packageJson.version === '0.1.0-beta.7',
  'Unexpected beta package version.',
);
assert(
  packageJson.peerDependencies?.['@angular/core']?.startsWith('^22.'),
  'Angular core 22 must remain a peer dependency.',
);
assert(
  packageJson.peerDependencies?.['@angular/common']?.startsWith('^22.'),
  'Angular common 22 must remain a peer dependency.',
);

for (const dependency of [
  '@floating-ui/dom',
  '@tiptap/core',
  '@tiptap/pm',
  'yjs',
]) {
  assert(
    !packageJson.peerDependencies?.[dependency],
    `Editor dependency leaked into Core peers: ${dependency}`,
  );
  assert(
    !packageJson.dependencies?.[dependency],
    `Editor dependency leaked into Core dependencies: ${dependency}`,
  );
}
assert(packageJson.license === 'MIT', 'Core package must declare MIT.');

const expectedExports = [
  '.',
  './accordion',
  './appearance',
  './auto-complete',
  './avatar',
  './badge',
  './breadcrumb',
  './button',
  './card',
  './checkbox',
  './color-mode',
  './confirm-dialog',
  './date-picker',
  './data-view',
  './dialog',
  './drawer',
  './divider',
  './field',
  './input',
  './input-number',
  './input-mask',
  './input-otp',
  './i18n',
  './locales/en',
  './locales/tr',
  './locales/de',
  './locales/fr',
  './locales/es',
  './locales/pt-br',
  './locales/ar',
  './locales/zh-cn',
  './loading-overlay',
  './message',
  './meter-group',
  './multi-select',
  './menu',
  './overlay',
  './panel-menu',
  './paginator',
  './password',
  './file-upload',
  './popover',
  './progress-bar',
  './progress-spinner',
  './radio',
  './select',
  './skeleton',
  './sidebar',
  './slider',
  './switch',
  './table',
  './tabs',
  './tag',
  './textarea',
  './tooltip',
  './toast',
  './toolbar',
  './tree',
  './tree-select',
  './virtual-scroller',
  './appearance/README.md',
  './appearance/llms.txt',
  './accordion/README.md',
  './accordion/llms.txt',
  './auto-complete/README.md',
  './auto-complete/llms.txt',
  './avatar/README.md',
  './avatar/llms.txt',
  './badge/README.md',
  './badge/llms.txt',
  './breadcrumb/README.md',
  './breadcrumb/llms.txt',
  './confirm-dialog/README.md',
  './confirm-dialog/llms.txt',
  './date-picker/README.md',
  './date-picker/llms.txt',
  './data-view/README.md',
  './data-view/llms.txt',
  './progress-bar/README.md',
  './progress-bar/llms.txt',
  './progress-spinner/README.md',
  './progress-spinner/llms.txt',
  './loading-overlay/README.md',
  './loading-overlay/llms.txt',
  './divider/README.md',
  './divider/llms.txt',
  './meter-group/README.md',
  './meter-group/llms.txt',
  './multi-select/README.md',
  './multi-select/llms.txt',
  './password/README.md',
  './password/llms.txt',
  './file-upload/README.md',
  './file-upload/llms.txt',
  './input-otp/README.md',
  './input-otp/llms.txt',
  './input-mask/README.md',
  './input-mask/llms.txt',
  './skeleton/README.md',
  './skeleton/llms.txt',
  './sidebar/README.md',
  './sidebar/llms.txt',
  './slider/README.md',
  './slider/llms.txt',
  './table/README.md',
  './table/CHANGELOG.md',
  './table/SIZE.md',
  './table/llms.txt',
  './tabs/README.md',
  './tabs/llms.txt',
  './tag/README.md',
  './tag/llms.txt',
  './field/README.md',
  './field/llms.txt',
  './dialog/README.md',
  './dialog/llms.txt',
  './drawer/README.md',
  './drawer/llms.txt',
  './input/README.md',
  './input/llms.txt',
  './input-number/README.md',
  './input-number/llms.txt',
  './select/README.md',
  './select/llms.txt',
  './checkbox/README.md',
  './checkbox/llms.txt',
  './radio/README.md',
  './radio/llms.txt',
  './switch/README.md',
  './switch/llms.txt',
  './textarea/README.md',
  './textarea/llms.txt',
  './overlay/README.md',
  './overlay/llms.txt',
  './panel-menu/README.md',
  './panel-menu/llms.txt',
  './menu/README.md',
  './menu/llms.txt',
  './tooltip/README.md',
  './tooltip/llms.txt',
  './popover/README.md',
  './popover/llms.txt',
  './toolbar/README.md',
  './toolbar/llms.txt',
  './tree/README.md',
  './tree/llms.txt',
  './tree-select/README.md',
  './virtual-scroller/README.md',
  './virtual-scroller/llms.txt',
  './tree-select/llms.txt',
  './themes/neutral.css',
  './themes/tailwind.css',
  './themes/experimental/glass.css',
  './themes/experimental/mist.css',
  './themes/experimental/futuristic.css',
];

for (const entryPoint of expectedExports) {
  const definition = packageJson.exports?.[entryPoint];
  assert(definition, `Missing package export: ${entryPoint}`);
  for (const target of Object.values(definition)) {
    await access(join(packageRoot, target));
  }
}

const appearanceTypes = await read('types/neural-ng-core-appearance.d.ts');
for (const symbol of [
  'provideNeuralAppearance',
  'NeuralAppearanceService',
  'NEURAL_PRIMARY_PALETTES',
  'NEURAL_SURFACE_PALETTES',
  'NeuralAppearanceOptions',
  'NeuralAppearanceSnapshot',
]) {
  assert(
    appearanceTypes.includes(symbol),
    'Appearance type export is missing: ' + symbol,
  );
}

const tabsTypes = await read('types/neural-ng-core-tabs.d.ts');
for (const symbol of [
  'NeuralTabs',
  'NeuralTabList',
  'NeuralTab',
  'NeuralTabPanels',
  'NeuralTabPanel',
  'TabsComponent',
  'TabListComponent',
  'TabComponent',
  'TabPanelsComponent',
  'TabPanelComponent',
  'NeuralTabsClasses',
  'NeuralTabValue',
]) {
  assert(tabsTypes.includes(symbol), `Tabs type export is missing: ${symbol}`);
}

const accordionTypes = await read('types/neural-ng-core-accordion.d.ts');
for (const symbol of [
  'NeuralAccordion',
  'NeuralAccordionPanel',
  'NeuralAccordionHeader',
  'NeuralAccordionContent',
  'AccordionComponent',
  'AccordionPanelComponent',
  'AccordionHeaderComponent',
  'AccordionContentComponent',
  'NeuralAccordionModelValue',
  'NeuralAccordionPanelChange',
  'NeuralAccordionClasses',
]) {
  assert(
    accordionTypes.includes(symbol),
    `Accordion type export is missing: ${symbol}`,
  );
}

const inputTypes = await read('types/neural-ng-core-input.d.ts');
for (const symbol of ['NeuralInput', 'NeuralInputSize', 'NeuralInputVariant']) {
  assert(
    inputTypes.includes(symbol),
    `Input type export is missing: ${symbol}`,
  );
}

const drawerTypes = await read('types/neural-ng-core-drawer.d.ts');
for (const symbol of [
  'NeuralDrawer',
  'NeuralDrawerHeader',
  'NeuralDrawerBody',
  'NeuralDrawerFooter',
  'NeuralDrawerInitialFocus',
  'DrawerComponent',
  'DrawerHeaderComponent',
  'DrawerBodyComponent',
  'DrawerFooterComponent',
  'DrawerInitialFocusDirective',
  'NeuralDrawerPosition',
  'NeuralDrawerClose',
  'NeuralDrawerClasses',
]) {
  assert(
    drawerTypes.includes(symbol),
    `Drawer type export is missing: ${symbol}`,
  );
}

const confirmDialogTypes = await read(
  'types/neural-ng-core-confirm-dialog.d.ts',
);
for (const symbol of [
  'NeuralConfirmDialog',
  'ConfirmDialogComponent',
  'NeuralConfirmationService',
  'ConfirmationService',
  'NeuralConfirmationInput',
  'NeuralConfirmationRef',
  'NeuralConfirmDialogClasses',
]) {
  assert(
    confirmDialogTypes.includes(symbol),
    `ConfirmDialog type export is missing: ${symbol}`,
  );
}

const toolbarTypes = await read('types/neural-ng-core-toolbar.d.ts');
for (const symbol of [
  'ToolbarComponent',
  'ToolbarStartComponent',
  'ToolbarCenterComponent',
  'ToolbarEndComponent',
  'ToolbarSeparatorComponent',
  'NeuralToolbarClasses',
  'NeuralToolbarFocusChange',
]) {
  assert(
    toolbarTypes.includes(symbol),
    `Toolbar type export is missing: ${symbol}`,
  );
}

const treeTypes = await read('types/neural-ng-core-tree.d.ts');
for (const symbol of [
  'NeuralTree',
  'TreeComponent',
  'NeuralTreeNode',
  'NeuralTreeFlatNode',
  'NeuralTreeNodeEvent',
  'NeuralTreeLazyLoadEvent',
  'NeuralTreeClasses',
  'flattenNeuralTree',
  'filterNeuralTree',
  'mapNeuralTreeOptions',
  'NeuralTreeController',
  'NeuralTreeNodeTemplate',
  'NeuralTreeTogglerTemplate',
  'NeuralTreeIconTemplate',
  'NeuralTreeLoadingTemplate',
  'NeuralTreeEmptyTemplate',
  'NeuralTreeFilterMode',
  'NeuralResolvedTreeState',
]) {
  assert(treeTypes.includes(symbol), `Tree type export is missing: ${symbol}`);
}

const treeSelectTypes = await read('types/neural-ng-core-tree-select.d.ts');
for (const symbol of [
  'NeuralTreeSelect',
  'TreeSelectComponent',
  'NeuralTreeSelectValue',
  'NeuralTreeSelectChange',
  'NeuralTreeSelectClasses',
  'NeuralTreeSelectNodeTemplate',
  'NeuralTreeSelectValueTemplate',
]) {
  assert(
    treeSelectTypes.includes(symbol),
    `TreeSelect type export is missing: ${symbol}`,
  );
}
assert(
  treeSelectTypes.includes('FormValueControl'),
  'TreeSelect declaration omits FormValueControl.',
);
assert(
  !treeSelectTypes.includes('ControlValueAccessor'),
  'TreeSelect declaration leaked a legacy ControlValueAccessor.',
);

const inputNumberTypes = await read('types/neural-ng-core-input-number.d.ts');
for (const symbol of [
  'NeuralInputNumber',
  'InputNumberComponent',
  'NeuralInputNumberClasses',
  'NeuralInputNumberCommit',
]) {
  assert(
    inputNumberTypes.includes(symbol),
    `InputNumber type export is missing: ${symbol}`,
  );
}

const passwordTypes = await read('types/neural-ng-core-password.d.ts');
for (const symbol of [
  'PasswordComponent',
  'NeuralPasswordClasses',
  'NeuralPasswordStrength',
  'NeuralPasswordStrengthChange',
  'scorePassword',
]) {
  assert(
    passwordTypes.includes(symbol),
    `Password type export is missing: ${symbol}`,
  );
}

const fileUploadTypes = await read('types/neural-ng-core-file-upload.d.ts');
for (const symbol of [
  'NeuralFileUpload',
  'FileUploadComponent',
  'NeuralFileUploadValue',
  'NeuralFileUploadClasses',
  'NeuralFileRejectionReason',
  'NeuralFileRejection',
  'NeuralFileSelectionChange',
  'NeuralFilesRejectedEvent',
  'NeuralFileRemoveEvent',
  'NeuralFileClearEvent',
]) {
  assert(
    fileUploadTypes.includes(symbol),
    `FileUpload type export is missing: ${symbol}`,
  );
}

const inputOtpTypes = await read('types/neural-ng-core-input-otp.d.ts');
for (const symbol of [
  'NeuralInputOtp',
  'InputOtpComponent',
  'NeuralInputOtpClasses',
  'NeuralInputOtpCompleteEvent',
  'NeuralInputOtpMode',
]) {
  assert(
    inputOtpTypes.includes(symbol),
    `InputOtp type export is missing: ${symbol}`,
  );
}

const inputMaskTypes = await read('types/neural-ng-core-input-mask.d.ts');
for (const symbol of [
  'NeuralInputMask',
  'InputMaskComponent',
  'NeuralInputMaskClasses',
  'NeuralInputMaskCompleteEvent',
  'NeuralInputMaskSlot',
  'formatNeuralMask',
  'unmaskNeuralValue',
]) {
  assert(
    inputMaskTypes.includes(symbol),
    `InputMask type export is missing: ${symbol}`,
  );
}

const sliderTypes = await read('types/neural-ng-core-slider.d.ts');
for (const symbol of [
  'SliderComponent',
  'NeuralSliderClasses',
  'NeuralSliderEvent',
  'NeuralSliderOrientation',
]) {
  assert(
    sliderTypes.includes(symbol),
    `Slider type export is missing: ${symbol}`,
  );
}

const multiSelectTypes = await read('types/neural-ng-core-multi-select.d.ts');
for (const symbol of [
  'NeuralMultiSelect',
  'MultiSelectComponent',
  'NeuralMultiSelectClasses',
  'NeuralMultiSelectChange',
  'NeuralMultiSelectFilterEvent',
  'NeuralMultiSelectOptionTemplate',
]) {
  assert(
    multiSelectTypes.includes(symbol),
    `MultiSelect type export is missing: ${symbol}`,
  );
}
assert(
  multiSelectTypes.includes('FormValueControl'),
  'MultiSelect declaration omits FormValueControl.',
);
assert(
  !multiSelectTypes.includes('ControlValueAccessor'),
  'MultiSelect declaration leaked a legacy ControlValueAccessor.',
);

const datePickerTypes = await read('types/neural-ng-core-date-picker.d.ts');
for (const symbol of [
  'NeuralDatePicker',
  'DatePickerComponent',
  'NeuralDatePickerValue',
  'NeuralDateRange',
  'NeuralDatePickerChange',
  'NeuralDatePickerViewChange',
  'NeuralDatePickerMonthChange',
  'NeuralDatePickerYearChange',
  'NeuralDatePickerInvalidInput',
  'NeuralDatePickerClasses',
]) {
  assert(
    datePickerTypes.includes(symbol),
    `DatePicker type export is missing: ${symbol}`,
  );
}

const dataViewTypes = await read('types/neural-ng-core-data-view.d.ts');
for (const symbol of [
  'NeuralDataView',
  'DataViewComponent',
  'NeuralDataViewState',
  'NeuralDataViewClasses',
  'NeuralDataViewListItemTemplate',
  'NeuralDataViewGridItemTemplate',
  'NeuralDataViewEmptyTemplate',
  'compareDataViewValues',
]) {
  assert(
    dataViewTypes.includes(symbol),
    `DataView type export is missing: ${symbol}`,
  );
}

const virtualScrollerTypes = await read(
  'types/neural-ng-core-virtual-scroller.d.ts',
);
for (const symbol of [
  'NeuralVirtualScroller',
  'VirtualScrollerComponent',
  'NeuralVirtualScrollerRangeEvent',
  'NeuralVirtualScrollerClasses',
  'NeuralVirtualScrollerItemTemplate',
  'NeuralVirtualScrollerLoadingTemplate',
]) {
  assert(
    virtualScrollerTypes.includes(symbol),
    `VirtualScroller type export is missing: ${symbol}`,
  );
}

const autoCompleteTypes = await read('types/neural-ng-core-auto-complete.d.ts');
for (const symbol of [
  'NeuralAutoComplete',
  'AutoCompleteComponent',
  'NeuralAutoCompleteSearchEvent',
  'NeuralAutoCompleteClasses',
  'NeuralAutoCompleteOptionTemplate',
]) {
  assert(
    autoCompleteTypes.includes(symbol),
    `AutoComplete type export is missing: ${symbol}`,
  );
}
assert(
  autoCompleteTypes.includes('FormValueControl'),
  'AutoComplete declaration omits FormValueControl.',
);
assert(
  !autoCompleteTypes.includes('ControlValueAccessor'),
  'AutoComplete declaration leaked a legacy ControlValueAccessor.',
);

const i18nTypes = await read('types/neural-ng-core-i18n.d.ts');
for (const symbol of [
  'NeuralLocaleService',
  'provideNeuralLocale',
  'NeuralLocale',
]) {
  assert(
    i18nTypes.includes(symbol),
    `Localization type export is missing: ${symbol}`,
  );
}

const rootTypes = await read('types/neural-ng-core.d.ts');
for (const symbol of ['NeuralNgService', 'NeuralDensity', 'NeuralDirection']) {
  assert(
    rootTypes.includes(symbol),
    `Root configuration type export is missing: ${symbol}`,
  );
}

const fieldTypes = await read('types/neural-ng-core-field.d.ts');
for (const symbol of [
  'NeuralField',
  'NeuralFieldControl',
  'NeuralFieldError',
  'NeuralFieldHint',
  'NeuralFieldLabel',
  'FieldComponent',
  'FieldControlDirective',
  'FieldErrorDirective',
  'FieldHintDirective',
  'FieldLabelDirective',
]) {
  assert(
    fieldTypes.includes(symbol),
    `Field type export is missing: ${symbol}`,
  );
}

const dialogTypes = await read('types/neural-ng-core-dialog.d.ts');
for (const symbol of [
  'NeuralDialog',
  'NeuralDialogHeader',
  'NeuralDialogBody',
  'NeuralDialogFooter',
  'NeuralDialogInitialFocus',
  'DialogComponent',
  'DialogHeaderComponent',
  'DialogBodyComponent',
  'DialogFooterComponent',
  'DialogInitialFocusDirective',
  'NeuralDialogClose',
  'NeuralDialogClasses',
]) {
  assert(
    dialogTypes.includes(symbol),
    `Dialog type export is missing: ${symbol}`,
  );
}

const selectTypes = await read('types/neural-ng-core-select.d.ts');
for (const symbol of [
  'NeuralSelect',
  'SelectComponent',
  'OptionComponent',
  'NeuralSelectChange',
  'NeuralSelectAppendTo',
  'NeuralSelectClasses',
]) {
  assert(
    selectTypes.includes(symbol),
    `Select type export is missing: ${symbol}`,
  );
}
assert(
  selectTypes.includes('FormValueControl'),
  'Select declaration omits FormValueControl.',
);
assert(
  !selectTypes.includes('ControlValueAccessor'),
  'Select declaration leaked a legacy ControlValueAccessor.',
);

const checkboxTypes = await read('types/neural-ng-core-checkbox.d.ts');
for (const symbol of [
  'NeuralCheckbox',
  'CheckboxComponent',
  'NeuralTriStateCheckbox',
  'TriStateCheckboxComponent',
  'NeuralCheckboxChange',
  'NeuralCheckboxClasses',
  'NeuralTriStateCheckboxChange',
  'NeuralTriStateCheckboxClasses',
  'NeuralTriStateCheckboxValue',
]) {
  assert(
    checkboxTypes.includes(symbol),
    `Checkbox type export is missing: ${symbol}`,
  );
}

const radioTypes = await read('types/neural-ng-core-radio.d.ts');
for (const symbol of [
  'RadioGroupComponent',
  'RadioComponent',
  'NeuralRadioSelectionChange',
  'NeuralRadioClasses',
]) {
  assert(
    radioTypes.includes(symbol),
    `Radio type export is missing: ${symbol}`,
  );
}
assert(
  radioTypes.includes('FormValueControl'),
  'RadioGroup declaration omits FormValueControl.',
);
assert(
  !radioTypes.includes('ControlValueAccessor'),
  'Radio declaration leaked a legacy ControlValueAccessor.',
);

const switchTypes = await read('types/neural-ng-core-switch.d.ts');
for (const symbol of [
  'NeuralSwitch',
  'SwitchComponent',
  'NeuralSwitchChange',
  'NeuralSwitchClasses',
]) {
  assert(
    switchTypes.includes(symbol),
    `Switch type export is missing: ${symbol}`,
  );
}
assert(
  switchTypes.includes('FormCheckboxControl'),
  'Switch declaration omits FormCheckboxControl.',
);
assert(
  !switchTypes.includes('ControlValueAccessor'),
  'Switch declaration leaked a legacy ControlValueAccessor.',
);

const textareaTypes = await read('types/neural-ng-core-textarea.d.ts');
for (const symbol of ['TextareaComponent', 'NeuralTextareaResizeMode']) {
  assert(
    textareaTypes.includes(symbol),
    `Textarea type export is missing: ${symbol}`,
  );
}

const overlayTypes = await read('types/neural-ng-core-overlay.d.ts');
for (const symbol of [
  'NeuralOverlayPositioner',
  'NeuralOverlayPlacement',
  'NeuralOverlayPositionRef',
]) {
  assert(
    overlayTypes.includes(symbol),
    `Overlay type export is missing: ${symbol}`,
  );
}

const panelMenuTypes = await read('types/neural-ng-core-panel-menu.d.ts');
for (const symbol of [
  'PanelMenuComponent',
  'PanelMenuItemComponent',
  'PanelMenuSeparatorComponent',
  'NeuralPanelMenuEntry',
  'NeuralPanelMenuSelect',
  'NeuralPanelMenuToggle',
  'NeuralPanelMenuClasses',
  'NeuralPanelMenuRouterLink',
]) {
  assert(
    panelMenuTypes.includes(symbol),
    `PanelMenu type export is missing: ${symbol}`,
  );
}

const popoverTypes = await read('types/neural-ng-core-popover.d.ts');
for (const symbol of [
  'PopoverComponent',
  'PopoverTriggerDirective',
  'PopoverCloseDirective',
  'PopoverInitialFocusDirective',
  'NeuralPopoverClasses',
  'NeuralPopoverCloseEvent',
  'NeuralPopoverPosition',
]) {
  assert(
    popoverTypes.includes(symbol),
    `Popover type export is missing: ${symbol}`,
  );
}

const menuTypes = await read('types/neural-ng-core-menu.d.ts');
for (const symbol of [
  'NeuralMenu',
  'NeuralMenuItem',
  'NeuralMenuGroup',
  'NeuralMenuSeparatorItem',
  'NeuralMenuTrigger',
  'MenuComponent',
  'MenuItemComponent',
  'MenuGroupComponent',
  'MenuSeparatorComponent',
  'MenuTriggerDirective',
  'NeuralMenuEntry',
  'NeuralMenuGroupEntry',
  'NeuralMenuGroupItem',
  'NeuralMenuSelect',
  'NeuralMenuClasses',
  'NeuralMenuPosition',
  'NeuralMenuRouterLink',
]) {
  assert(menuTypes.includes(symbol), `Menu type export is missing: ${symbol}`);
}

const messageTypes = await read('types/neural-ng-core-message.d.ts');
for (const symbol of [
  'NeuralMessage',
  'MessageComponent',
  'NeuralMessageRecord',
  'NeuralMessageService',
  'NeuralMessageClasses',
  'NeuralMessageSeverity',
  'NeuralMessageVariant',
]) {
  assert(
    messageTypes.includes(symbol),
    `Message type export is missing: ${symbol}`,
  );
}

const breadcrumbTypes = await read('types/neural-ng-core-breadcrumb.d.ts');
for (const symbol of [
  'BreadcrumbComponent',
  'NeuralBreadcrumb',
  'NeuralBreadcrumbItemComponent',
  'NeuralBreadcrumbSeparatorTemplate',
  'BreadcrumbItemComponent',
  'BreadcrumbSeparatorTemplate',
  'NeuralBreadcrumbItem',
  'NeuralBreadcrumbSelect',
  'NeuralBreadcrumbClasses',
  'NeuralBreadcrumbRouterLink',
]) {
  assert(
    breadcrumbTypes.includes(symbol),
    `Breadcrumb type export is missing: ${symbol}`,
  );
}

const cardTypes = await read('types/neural-ng-core-card.d.ts');
for (const symbol of [
  'NeuralCard',
  'NeuralCardHeader',
  'NeuralCardBody',
  'NeuralCardFooter',
  'CardComponent',
  'CardHeaderComponent',
  'CardBodyComponent',
  'CardFooterComponent',
  'NeuralCardClasses',
  'NeuralCardRole',
]) {
  assert(cardTypes.includes(symbol), `Card type export is missing: ${symbol}`);
}

const badgeTypes = await read('types/neural-ng-core-badge.d.ts');
for (const symbol of [
  'NeuralBadge',
  'NeuralBadgeDirective',
  'BadgeComponent',
  'BadgeDirective',
  'NeuralBadgeAriaLive',
  'NeuralBadgeClasses',
  'NeuralBadgePosition',
  'NeuralBadgeSeverity',
  'NeuralBadgeSize',
]) {
  assert(
    badgeTypes.includes(symbol),
    `Badge type export is missing: ${symbol}`,
  );
}

const avatarTypes = await read('types/neural-ng-core-avatar.d.ts');
for (const symbol of [
  'NeuralAvatar',
  'NeuralAvatarGroup',
  'AvatarComponent',
  'AvatarGroupComponent',
  'NeuralAvatarClasses',
  'NeuralAvatarDecoding',
  'NeuralAvatarFetchPriority',
  'NeuralAvatarGroupClasses',
  'NeuralAvatarImageFit',
  'NeuralAvatarLoading',
  'NeuralAvatarShape',
  'NeuralAvatarSize',
]) {
  assert(
    avatarTypes.includes(symbol),
    `Avatar type export is missing: ${symbol}`,
  );
}

const progressBarTypes = await read('types/neural-ng-core-progress-bar.d.ts');
for (const symbol of [
  'ProgressBarComponent',
  'NeuralProgressBarClasses',
  'NeuralProgressBarMode',
  'NeuralProgressBarSeverity',
  'NeuralProgressBarSize',
]) {
  assert(
    progressBarTypes.includes(symbol),
    `ProgressBar type export is missing: ${symbol}`,
  );
}

const progressSpinnerTypes = await read(
  'types/neural-ng-core-progress-spinner.d.ts',
);
for (const symbol of [
  'ProgressSpinnerComponent',
  'NeuralProgressSpinnerClasses',
  'NeuralProgressSpinnerSeverity',
  'NeuralProgressSpinnerSize',
]) {
  assert(
    progressSpinnerTypes.includes(symbol),
    `ProgressSpinner type export is missing: ${symbol}`,
  );
}

const loadingOverlayTypes = await read(
  'types/neural-ng-core-loading-overlay.d.ts',
);
for (const symbol of [
  'NeuralLoadingIndicator',
  'NeuralLoadingOverlay',
  'LoadingIndicatorDirective',
  'LoadingOverlayComponent',
  'NeuralLoadingOverlayClasses',
  'NeuralLoadingOverlayScope',
]) {
  assert(
    loadingOverlayTypes.includes(symbol),
    `LoadingOverlay type export is missing: ${symbol}`,
  );
}

const skeletonTypes = await read('types/neural-ng-core-skeleton.d.ts');
for (const symbol of [
  'SkeletonComponent',
  'NeuralSkeletonAnimation',
  'NeuralSkeletonClasses',
  'NeuralSkeletonShape',
]) {
  assert(
    skeletonTypes.includes(symbol),
    `Skeleton type export is missing: ${symbol}`,
  );
}

const dividerTypes = await read('types/neural-ng-core-divider.d.ts');
for (const symbol of [
  'NeuralDivider',
  'DividerComponent',
  'NeuralDividerAlign',
  'NeuralDividerClasses',
  'NeuralDividerOrientation',
  'NeuralDividerType',
]) {
  assert(
    dividerTypes.includes(symbol),
    `Divider type export is missing: ${symbol}`,
  );
}

const meterGroupTypes = await read('types/neural-ng-core-meter-group.d.ts');
for (const symbol of [
  'NeuralMeterGroup',
  'MeterGroupComponent',
  'NeuralMeterGroupClasses',
  'NeuralMeterGroupLabelOrientation',
  'NeuralMeterGroupLabelPosition',
  'NeuralMeterGroupOrientation',
  'NeuralMeterItem',
  'NeuralMeterValueFormatter',
]) {
  assert(
    meterGroupTypes.includes(symbol),
    `MeterGroup type export is missing: ${symbol}`,
  );
}

const tableTypes = await read('types/neural-ng-core-table.d.ts');
for (const symbol of [
  'NeuralTable',
  'TableComponent',
  'NeuralTableCellDirective',
  'NeuralTableEditorDirective',
  'NeuralTableExpansionDirective',
  'NeuralTableGroupHeaderDirective',
  'NeuralTableGroupFooterDirective',
  'NeuralTableFilterDirective',
  'NeuralTableFooterDirective',
  'NeuralTableFooterGroupDirective',
  'NeuralTableHeaderGroupDirective',
  'NeuralTableColumn',
  'NeuralTableColumnOrder',
  'NeuralTableColumnReorderEvent',
  'NeuralTableFilterEvent',
  'NeuralTableColumnResizeEvent',
  'NeuralTableColumnVisibilityChange',
  'NeuralTableColumnWidths',
  'NeuralTableEditEvent',
  'NeuralTableEditMode',
  'NeuralTableEditValidator',
  'NeuralTableRowGroupMode',
  'NeuralTableRowGroupContext',
  'NeuralTableRowGroupExpansionChange',
  'NeuralTableAggregate',
  'NeuralTableEditorContext',
  'NeuralTableHeaderGroup',
  'NeuralTableSelectAllMode',
  'NeuralTableRowEditEvent',
  'NeuralTableSelectionChange',
  'NeuralTableSelectionControl',
  'NeuralTableSelectionMode',
  'NeuralTableStateChange',
  'NeuralTableStateAdapter',
  'NeuralTableStateRestoreEvent',
  'NeuralTableStateStorage',
  'NeuralTableLoadingMode',
  'serializeNeuralTableState',
  'parseNeuralTableState',
  'NEURAL_TABLE_STATE_VERSION',
  'filterNeuralTableRows',
  'aggregateNeuralTableRows',
  'aggregateNeuralTableValues',
  'serializeNeuralTableState',
  'parseNeuralTableState',
]) {
  assert(
    tableTypes.includes(symbol),
    `Table type export is missing: ${symbol}`,
  );
}

const buttonTypes = await read('types/neural-ng-core-button.d.ts');
for (const symbol of [
  'NeuralButton',
  'NeuralButtonBadgePosition',
  'NeuralButtonGroup',
  'NeuralButtonGroupOrientation',
  'NeuralButtonIconPosition',
  'NeuralButtonIconSize',
  'NeuralButtonSeverity',
  'NeuralButtonSize',
]) {
  assert(
    buttonTypes.includes(symbol),
    `Button type export is missing: ${symbol}`,
  );
}

const tagTypes = await read('types/neural-ng-core-tag.d.ts');
for (const symbol of [
  'TagComponent',
  'NeuralTagClasses',
  'NeuralTagRemove',
  'NeuralTagSeverity',
  'NeuralTagSize',
]) {
  assert(tagTypes.includes(symbol), `Tag type export is missing: ${symbol}`);
}

const tooltipTypes = await read('types/neural-ng-core-tooltip.d.ts');
for (const symbol of [
  'TooltipDirective',
  'NeuralTooltipClasses',
  'NeuralTooltipPosition',
]) {
  assert(
    tooltipTypes.includes(symbol),
    `Tooltip type export is missing: ${symbol}`,
  );
}

const tabsBundlePath = join(packageRoot, packageJson.exports['./tabs'].default);
const angularCompilerSpecifier = ['@angular', 'compiler'].join('/');
await import(angularCompilerSpecifier);
const appearanceBundlePath = join(
  packageRoot,
  packageJson.exports['./appearance'].default,
);
const appearanceApi = await import(pathToFileURL(appearanceBundlePath).href);
for (const symbol of ['provideNeuralAppearance', 'NeuralAppearanceService']) {
  assert(
    typeof appearanceApi[symbol] === 'function',
    'Cannot import ' + symbol + '.',
  );
}
for (const symbol of ['NEURAL_PRIMARY_PALETTES', 'NEURAL_SURFACE_PALETTES']) {
  assert(
    Array.isArray(appearanceApi[symbol]) && appearanceApi[symbol].length > 0,
    'Cannot import ' + symbol + '.',
  );
}
const accordionBundlePath = join(
  packageRoot,
  packageJson.exports['./accordion'].default,
);
const accordionApi = await import(pathToFileURL(accordionBundlePath).href);
for (const symbol of [
  'NeuralAccordion',
  'NeuralAccordionPanel',
  'NeuralAccordionHeader',
  'NeuralAccordionContent',
  'AccordionComponent',
  'AccordionPanelComponent',
  'AccordionHeaderComponent',
  'AccordionContentComponent',
]) {
  assert(
    typeof accordionApi[symbol] === 'function',
    `Cannot import ${symbol}.`,
  );
}

const tabsApi = await import(pathToFileURL(tabsBundlePath).href);
for (const symbol of [
  'NeuralTabs',
  'NeuralTabList',
  'NeuralTab',
  'NeuralTabPanels',
  'NeuralTabPanel',
  'TabsComponent',
  'TabListComponent',
  'TabComponent',
  'TabPanelsComponent',
  'TabPanelComponent',
]) {
  assert(typeof tabsApi[symbol] === 'function', `Cannot import ${symbol}.`);
}

const inputBundlePath = join(
  packageRoot,
  packageJson.exports['./input'].default,
);
const inputApi = await import(pathToFileURL(inputBundlePath).href);
assert(
  typeof inputApi.NeuralInput === 'function',
  'Cannot import NeuralInput.',
);

const inputNumberBundlePath = join(
  packageRoot,
  packageJson.exports['./input-number'].default,
);
const inputNumberApi = await import(pathToFileURL(inputNumberBundlePath).href);
for (const symbol of ['NeuralInputNumber', 'InputNumberComponent']) {
  assert(
    typeof inputNumberApi[symbol] === 'function',
    `Cannot import ${symbol}.`,
  );
}

const i18nBundlePath = join(packageRoot, packageJson.exports['./i18n'].default);
const i18nApi = await import(pathToFileURL(i18nBundlePath).href);
assert(
  typeof i18nApi.NeuralLocaleService === 'function',
  'Cannot import NeuralLocaleService.',
);

const fieldBundlePath = join(
  packageRoot,
  packageJson.exports['./field'].default,
);
const fieldApi = await import(pathToFileURL(fieldBundlePath).href);
for (const symbol of [
  'NeuralField',
  'NeuralFieldControl',
  'NeuralFieldError',
  'NeuralFieldHint',
  'NeuralFieldLabel',
  'FieldComponent',
  'FieldControlDirective',
  'FieldErrorDirective',
  'FieldHintDirective',
  'FieldLabelDirective',
]) {
  assert(typeof fieldApi[symbol] === 'function', `Cannot import ${symbol}.`);
}

const fileUploadBundlePath = join(
  packageRoot,
  packageJson.exports['./file-upload'].default,
);
const fileUploadApi = await import(pathToFileURL(fileUploadBundlePath).href);
for (const symbol of ['NeuralFileUpload', 'FileUploadComponent']) {
  assert(
    typeof fileUploadApi[symbol] === 'function',
    `Cannot import ${symbol}.`,
  );
}

const inputMaskBundlePath = join(
  packageRoot,
  packageJson.exports['./input-mask'].default,
);
const inputMaskApi = await import(pathToFileURL(inputMaskBundlePath).href);
for (const symbol of [
  'NeuralInputMask',
  'InputMaskComponent',
  'formatNeuralMask',
  'unmaskNeuralValue',
]) {
  assert(
    typeof inputMaskApi[symbol] === 'function',
    `Cannot import ${symbol}.`,
  );
}

const inputOtpBundlePath = join(
  packageRoot,
  packageJson.exports['./input-otp'].default,
);
const inputOtpApi = await import(pathToFileURL(inputOtpBundlePath).href);
for (const symbol of ['NeuralInputOtp', 'InputOtpComponent']) {
  assert(typeof inputOtpApi[symbol] === 'function', `Cannot import ${symbol}.`);
}

const dialogBundlePath = join(
  packageRoot,
  packageJson.exports['./dialog'].default,
);
const dialogApi = await import(pathToFileURL(dialogBundlePath).href);
for (const symbol of [
  'NeuralDialog',
  'NeuralDialogHeader',
  'NeuralDialogBody',
  'NeuralDialogFooter',
  'NeuralDialogInitialFocus',
  'DialogComponent',
  'DialogHeaderComponent',
  'DialogBodyComponent',
  'DialogFooterComponent',
  'DialogInitialFocusDirective',
]) {
  assert(typeof dialogApi[symbol] === 'function', `Cannot import ${symbol}.`);
}

const drawerBundlePath = join(
  packageRoot,
  packageJson.exports['./drawer'].default,
);
const drawerApi = await import(pathToFileURL(drawerBundlePath).href);
for (const symbol of [
  'NeuralDrawer',
  'NeuralDrawerHeader',
  'NeuralDrawerBody',
  'NeuralDrawerFooter',
  'NeuralDrawerInitialFocus',
]) {
  assert(typeof drawerApi[symbol] === 'function', `Cannot import ${symbol}.`);
}
for (const [legacy, canonical] of [
  ['DrawerComponent', 'NeuralDrawer'],
  ['DrawerHeaderComponent', 'NeuralDrawerHeader'],
  ['DrawerBodyComponent', 'NeuralDrawerBody'],
  ['DrawerFooterComponent', 'NeuralDrawerFooter'],
  ['DrawerInitialFocusDirective', 'NeuralDrawerInitialFocus'],
]) {
  assert(
    drawerApi[legacy] === drawerApi[canonical],
    `Deprecated ${legacy} alias does not resolve to ${canonical}.`,
  );
}

const confirmDialogBundlePath = join(
  packageRoot,
  packageJson.exports['./confirm-dialog'].default,
);
const confirmDialogApi = await import(
  pathToFileURL(confirmDialogBundlePath).href
);
for (const symbol of [
  'NeuralConfirmDialog',
  'ConfirmDialogComponent',
  'NeuralConfirmationService',
  'ConfirmationService',
]) {
  assert(
    typeof confirmDialogApi[symbol] === 'function',
    `Cannot import ${symbol}.`,
  );
}
assert(
  confirmDialogApi.NeuralConfirmDialog ===
    confirmDialogApi.ConfirmDialogComponent,
  'ConfirmDialog compatibility alias does not resolve to NeuralConfirmDialog.',
);
assert(
  confirmDialogApi.NeuralConfirmationService ===
    confirmDialogApi.ConfirmationService,
  'ConfirmationService alias does not resolve to NeuralConfirmationService.',
);

const datePickerBundlePath = join(
  packageRoot,
  packageJson.exports['./date-picker'].default,
);
const datePickerApi = await import(pathToFileURL(datePickerBundlePath).href);
for (const symbol of ['NeuralDatePicker', 'DatePickerComponent']) {
  assert(
    typeof datePickerApi[symbol] === 'function',
    `Cannot import ${symbol}.`,
  );
}
assert(
  datePickerApi.NeuralDatePicker === datePickerApi.DatePickerComponent,
  'DatePicker compatibility alias does not resolve to NeuralDatePicker.',
);

const dataViewBundlePath = join(
  packageRoot,
  packageJson.exports['./data-view'].default,
);
const dataViewApi = await import(pathToFileURL(dataViewBundlePath).href);
for (const symbol of ['NeuralDataView', 'DataViewComponent']) {
  assert(typeof dataViewApi[symbol] === 'function', `Cannot import ${symbol}.`);
}
assert(
  dataViewApi.NeuralDataView === dataViewApi.DataViewComponent,
  'DataView compatibility alias does not resolve to NeuralDataView.',
);

const selectBundlePath = join(
  packageRoot,
  packageJson.exports['./select'].default,
);
const selectApi = await import(pathToFileURL(selectBundlePath).href);
for (const symbol of ['NeuralSelect', 'SelectComponent', 'OptionComponent']) {
  assert(typeof selectApi[symbol] === 'function', `Cannot import ${symbol}.`);
}

const checkboxBundlePath = join(
  packageRoot,
  packageJson.exports['./checkbox'].default,
);
const checkboxApi = await import(pathToFileURL(checkboxBundlePath).href);
for (const symbol of [
  'NeuralCheckbox',
  'CheckboxComponent',
  'NeuralTriStateCheckbox',
  'TriStateCheckboxComponent',
]) {
  assert(typeof checkboxApi[symbol] === 'function', `Cannot import ${symbol}.`);
}
assert(
  checkboxApi.NeuralCheckbox === checkboxApi.CheckboxComponent,
  'Checkbox compatibility alias does not resolve to NeuralCheckbox.',
);
assert(
  checkboxApi.NeuralTriStateCheckbox === checkboxApi.TriStateCheckboxComponent,
  'Tri-state compatibility alias does not resolve to NeuralTriStateCheckbox.',
);

const radioBundlePath = join(
  packageRoot,
  packageJson.exports['./radio'].default,
);
const radioApi = await import(pathToFileURL(radioBundlePath).href);
for (const symbol of ['RadioGroupComponent', 'RadioComponent']) {
  assert(typeof radioApi[symbol] === 'function', `Cannot import ${symbol}.`);
}

const switchBundlePath = join(
  packageRoot,
  packageJson.exports['./switch'].default,
);
const switchApi = await import(pathToFileURL(switchBundlePath).href);
assert(
  typeof switchApi.NeuralSwitch === 'function',
  'Cannot import NeuralSwitch.',
);
assert(
  typeof switchApi.SwitchComponent === 'function',
  'Cannot import SwitchComponent.',
);

const textareaBundlePath = join(
  packageRoot,
  packageJson.exports['./textarea'].default,
);
const textareaApi = await import(pathToFileURL(textareaBundlePath).href);
assert(
  typeof textareaApi.TextareaComponent === 'function',
  'Cannot import TextareaComponent.',
);

const overlayBundlePath = join(
  packageRoot,
  packageJson.exports['./overlay'].default,
);
const overlayApi = await import(pathToFileURL(overlayBundlePath).href);
assert(
  typeof overlayApi.NeuralOverlayPositioner === 'function',
  'Cannot import NeuralOverlayPositioner.',
);

const panelMenuBundlePath = join(
  packageRoot,
  packageJson.exports['./panel-menu'].default,
);
const panelMenuApi = await import(pathToFileURL(panelMenuBundlePath).href);
for (const symbol of [
  'PanelMenuComponent',
  'PanelMenuItemComponent',
  'PanelMenuSeparatorComponent',
]) {
  assert(
    typeof panelMenuApi[symbol] === 'function',
    `Cannot import ${symbol}.`,
  );
}

const popoverBundlePath = join(
  packageRoot,
  packageJson.exports['./popover'].default,
);
const popoverApi = await import(pathToFileURL(popoverBundlePath).href);
for (const symbol of [
  'PopoverComponent',
  'PopoverTriggerDirective',
  'PopoverCloseDirective',
  'PopoverInitialFocusDirective',
]) {
  assert(typeof popoverApi[symbol] === 'function', `Cannot import ${symbol}.`);
}

const menuBundlePath = join(packageRoot, packageJson.exports['./menu'].default);
const menuApi = await import(pathToFileURL(menuBundlePath).href);
for (const symbol of [
  'NeuralMenu',
  'NeuralMenuItem',
  'NeuralMenuGroup',
  'NeuralMenuSeparatorItem',
  'NeuralMenuTrigger',
  'MenuComponent',
  'MenuItemComponent',
  'MenuGroupComponent',
  'MenuSeparatorComponent',
  'MenuTriggerDirective',
]) {
  assert(typeof menuApi[symbol] === 'function', `Cannot import ${symbol}.`);
}

const messageBundlePath = join(
  packageRoot,
  packageJson.exports['./message'].default,
);
const messageApi = await import(pathToFileURL(messageBundlePath).href);
for (const symbol of [
  'NeuralMessage',
  'MessageComponent',
  'NeuralMessageService',
  'provideNeuralMessages',
]) {
  assert(typeof messageApi[symbol] === 'function', `Cannot import ${symbol}.`);
}

const breadcrumbBundlePath = join(
  packageRoot,
  packageJson.exports['./breadcrumb'].default,
);
const breadcrumbApi = await import(pathToFileURL(breadcrumbBundlePath).href);
for (const symbol of [
  'BreadcrumbComponent',
  'NeuralBreadcrumb',
  'NeuralBreadcrumbItemComponent',
  'NeuralBreadcrumbSeparatorTemplate',
  'BreadcrumbItemComponent',
  'BreadcrumbSeparatorTemplate',
]) {
  assert(
    typeof breadcrumbApi[symbol] === 'function',
    `Cannot import ${symbol}.`,
  );
}

const cardBundlePath = join(packageRoot, packageJson.exports['./card'].default);
const cardApi = await import(pathToFileURL(cardBundlePath).href);
for (const symbol of [
  'NeuralCard',
  'NeuralCardHeader',
  'NeuralCardBody',
  'NeuralCardFooter',
  'CardComponent',
  'CardHeaderComponent',
  'CardBodyComponent',
  'CardFooterComponent',
]) {
  assert(typeof cardApi[symbol] === 'function', `Cannot import ${symbol}.`);
}

const badgeBundlePath = join(
  packageRoot,
  packageJson.exports['./badge'].default,
);
const badgeApi = await import(pathToFileURL(badgeBundlePath).href);
for (const symbol of [
  'NeuralBadge',
  'NeuralBadgeDirective',
  'BadgeComponent',
  'BadgeDirective',
]) {
  assert(typeof badgeApi[symbol] === 'function', `Cannot import ${symbol}.`);
}

const avatarBundlePath = join(
  packageRoot,
  packageJson.exports['./avatar'].default,
);
const avatarApi = await import(pathToFileURL(avatarBundlePath).href);
for (const symbol of [
  'NeuralAvatar',
  'NeuralAvatarGroup',
  'AvatarComponent',
  'AvatarGroupComponent',
]) {
  assert(typeof avatarApi[symbol] === 'function', `Cannot import ${symbol}.`);
}

const progressBarBundlePath = join(
  packageRoot,
  packageJson.exports['./progress-bar'].default,
);
const progressBarApi = await import(pathToFileURL(progressBarBundlePath).href);
assert(
  typeof progressBarApi.ProgressBarComponent === 'function',
  'Cannot import ProgressBarComponent.',
);

const progressSpinnerBundlePath = join(
  packageRoot,
  packageJson.exports['./progress-spinner'].default,
);
const progressSpinnerApi = await import(
  pathToFileURL(progressSpinnerBundlePath).href
);
assert(
  typeof progressSpinnerApi.ProgressSpinnerComponent === 'function',
  'Cannot import ProgressSpinnerComponent.',
);

const loadingOverlayBundlePath = join(
  packageRoot,
  packageJson.exports['./loading-overlay'].default,
);
const loadingOverlayApi = await import(
  pathToFileURL(loadingOverlayBundlePath).href
);
for (const symbol of [
  'NeuralLoadingIndicator',
  'NeuralLoadingOverlay',
  'LoadingIndicatorDirective',
  'LoadingOverlayComponent',
]) {
  assert(
    typeof loadingOverlayApi[symbol] === 'function',
    `Cannot import ${symbol}.`,
  );
}

const skeletonBundlePath = join(
  packageRoot,
  packageJson.exports['./skeleton'].default,
);
const skeletonApi = await import(pathToFileURL(skeletonBundlePath).href);
assert(
  typeof skeletonApi.SkeletonComponent === 'function',
  'Cannot import SkeletonComponent.',
);

const dividerBundlePath = join(
  packageRoot,
  packageJson.exports['./divider'].default,
);
const dividerApi = await import(pathToFileURL(dividerBundlePath).href);
assert(
  typeof dividerApi.NeuralDivider === 'function',
  'Cannot import NeuralDivider.',
);
assert(
  dividerApi.DividerComponent === dividerApi.NeuralDivider,
  'Deprecated DividerComponent alias does not resolve to NeuralDivider.',
);

const meterGroupBundlePath = join(
  packageRoot,
  packageJson.exports['./meter-group'].default,
);
const meterGroupApi = await import(pathToFileURL(meterGroupBundlePath).href);
for (const symbol of ['NeuralMeterGroup', 'MeterGroupComponent']) {
  assert(
    typeof meterGroupApi[symbol] === 'function',
    `Cannot import ${symbol}.`,
  );
}

const tableBundlePath = join(
  packageRoot,
  packageJson.exports['./table'].default,
);
const tableApi = await import(pathToFileURL(tableBundlePath).href);
for (const symbol of [
  'NeuralTable',
  'TableComponent',
  'NeuralTableCellDirective',
  'NeuralTableEditorDirective',
  'NeuralTableExpansionDirective',
  'NeuralTableGroupHeaderDirective',
  'NeuralTableGroupFooterDirective',
  'NeuralTableFilterDirective',
  'filterNeuralTableRows',
  'aggregateNeuralTableRows',
  'aggregateNeuralTableValues',
]) {
  assert(typeof tableApi[symbol] === 'function', `Cannot import ${symbol}.`);
}

const tagBundlePath = join(packageRoot, packageJson.exports['./tag'].default);
const tagApi = await import(pathToFileURL(tagBundlePath).href);
assert(
  typeof tagApi.TagComponent === 'function',
  'Cannot import TagComponent.',
);

const tooltipBundlePath = join(
  packageRoot,
  packageJson.exports['./tooltip'].default,
);
const tooltipApi = await import(pathToFileURL(tooltipBundlePath).href);
assert(
  typeof tooltipApi.TooltipDirective === 'function',
  'Cannot import TooltipDirective.',
);

const neutralTheme = await read('themes/neutral.css');
for (const palette of ['primary', 'surface']) {
  for (const step of [
    '50',
    '100',
    '200',
    '300',
    '400',
    '500',
    '600',
    '700',
    '800',
    '900',
    '950',
  ]) {
    const token = `--neural-color-${palette}-${step}`;
    assert(neutralTheme.includes(token), `Missing palette token: ${token}`);
  }
}
assert(
  neutralTheme.includes('--neural-color-surface-0'),
  'Missing palette token: --neural-color-surface-0',
);
assert(
  !neutralTheme.includes('--neural-editor-'),
  'Editor tokens leaked into the Core theme.',
);

const tailwindTheme = await read('themes/tailwind.css');
for (const utilityToken of [
  '--color-primary-50',
  '--color-primary-950',
  '--color-surface-0',
  '--color-surface-50',
  '--color-surface-950',
]) {
  assert(
    tailwindTheme.includes(utilityToken),
    `Tailwind bridge omits ${utilityToken}.`,
  );
}

for (const token of [
  '--neural-accordion-panel-background',
  '--neural-accordion-content-duration',
  '--neural-tab-indicator-color',
  '--neural-tab-panel-enter-duration',
  '--neural-tabs-vertical-gap',
  '--neural-tabs-scrollbar-color',
  '--neural-input-border-color-invalid',
  '--neural-input-number-button-background',
  '--neural-password-strength-strong',
  '--neural-password-border-color-invalid',
  '--neural-file-upload-dropzone-background',
  '--neural-file-upload-dropzone-border-color-invalid',
  '--neural-input-otp-border-color-focus',
  '--neural-input-otp-border-color-invalid',
  '--neural-input-mask-border-color-focus',
  '--neural-input-mask-border-color-invalid',
  '--neural-slider-fill-background',
  '--neural-slider-thumb-background',
  '--neural-field-required-color',
  '--neural-dialog-backdrop',
  '--neural-dialog-enter-duration',
  '--neural-select-option-background-selected',
  '--neural-checkbox-background-checked',
  '--neural-radio-border-color-selected',
  '--neural-switch-track-background-checked',
  '--neural-textarea-auto-max-block-size',
  '--neural-tooltip-background',
  '--neural-tooltip-enter-duration',
  '--neural-panel-menu-item-background-expanded',
  '--neural-panel-menu-group-duration',
  '--neural-menu-item-background-active',
  '--neural-menu-enter-duration',
  '--neural-popover-background',
  '--neural-popover-enter-duration',
  '--neural-breadcrumb-current-color',
  '--neural-avatar-group-overflow-background',
  '--neural-button-primary-background',
  '--neural-button-secondary-background',
  '--neural-badge-primary-background',
  '--neural-badge-secondary-background',
  '--neural-badge-success-background',
  '--neural-tag-primary-background',
  '--neural-tag-remove-background-hover',
  '--neural-progress-bar-primary-background',
  '--neural-progress-bar-track-background',
  '--neural-progress-spinner-primary-color',
  '--neural-progress-spinner-track-color',
  '--neural-toast-primary-color',
  '--neural-loading-overlay-panel-background',
  '--neural-divider-color',
  '--neural-meter-group-track-background',
  '--neural-table-background',
  '--neural-skeleton-background',
  '--neural-date-picker-background',
  '--neural-date-picker-panel-background',
  '--neural-date-picker-day-background-selected',
  '--neural-date-picker-focus-ring',
]) {
  assert(neutralTheme.includes(token), `Missing Tabs theme token: ${token}`);
}

const experimentalThemeTokens = [
  '--neural-accordion-panel-radius',
  '--neural-button-radius',
  '--neural-card-radius',
  '--neural-dialog-radius',
  '--neural-checkbox-radius',
  '--neural-input-radius',
  '--neural-input-number-radius',
  '--neural-password-radius',
  '--neural-file-upload-radius',
  '--neural-input-otp-radius',
  '--neural-input-mask-radius',
  '--neural-slider-thumb-radius',
  '--neural-textarea-radius',
  '--neural-field-label-color',
  '--neural-select-panel-radius',
  '--neural-radio-shadow',
  '--neural-switch-track-radius',
  '--neural-paginator-button-radius',
  '--neural-tabs-list-border',
  '--neural-tab-radius',
  '--neural-toast-message-radius',
  '--neural-tooltip-radius',
  '--neural-panel-menu-radius',
  '--neural-menu-radius',
  '--neural-popover-radius',
  '--neural-breadcrumb-radius',
  '--neural-avatar-rounded-radius',
  '--neural-badge-radius',
  '--neural-tag-radius',
  '--neural-progress-bar-radius',
  '--neural-progress-spinner-filter',
  '--neural-loading-overlay-panel-radius',
  '--neural-divider-content-color',
  '--neural-meter-group-radius',
  '--neural-table-radius',
  '--neural-skeleton-rounded-radius',
  '--neural-date-picker-radius',
  '--neural-date-picker-panel-radius',
  '--neural-date-picker-focus-ring',
];
for (const themePath of [
  'themes/experimental/glass.css',
  'themes/experimental/mist.css',
  'themes/experimental/futuristic.css',
]) {
  const theme = await read(themePath);
  for (const token of experimentalThemeTokens) {
    assert(
      theme.includes(token),
      `Experimental theme ${themePath} omits ${token}.`,
    );
  }
}

const tabsReadme = await read('tabs/README.md');
const tabsLlmContext = await read('tabs/llms.txt');
const accordionReadme = await read('accordion/README.md');
const accordionLlmContext = await read('accordion/llms.txt');
const inputReadme = await read('input/README.md');
const inputLlmContext = await read('input/llms.txt');
const inputNumberReadme = await read('input-number/README.md');
const inputNumberLlmContext = await read('input-number/llms.txt');
const inputOtpReadme = await read('input-otp/README.md');
const inputOtpLlmContext = await read('input-otp/llms.txt');
const fieldReadme = await read('field/README.md');
const fieldLlmContext = await read('field/llms.txt');
const fileUploadReadme = await read('file-upload/README.md');
const fileUploadLlmContext = await read('file-upload/llms.txt');
const inputMaskReadme = await read('input-mask/README.md');
const inputMaskLlmContext = await read('input-mask/llms.txt');
const dialogReadme = await read('dialog/README.md');
const dialogLlmContext = await read('dialog/llms.txt');
const drawerReadme = await read('drawer/README.md');
const drawerLlmContext = await read('drawer/llms.txt');
const selectReadme = await read('select/README.md');
const selectLlmContext = await read('select/llms.txt');
const checkboxReadme = await read('checkbox/README.md');
const checkboxLlmContext = await read('checkbox/llms.txt');
const radioReadme = await read('radio/README.md');
const radioLlmContext = await read('radio/llms.txt');
const switchReadme = await read('switch/README.md');
const switchLlmContext = await read('switch/llms.txt');
const textareaReadme = await read('textarea/README.md');
const textareaLlmContext = await read('textarea/llms.txt');
const overlayReadme = await read('overlay/README.md');
const overlayLlmContext = await read('overlay/llms.txt');
const panelMenuReadme = await read('panel-menu/README.md');
const panelMenuLlmContext = await read('panel-menu/llms.txt');
const popoverReadme = await read('popover/README.md');
const popoverLlmContext = await read('popover/llms.txt');
const menuReadme = await read('menu/README.md');
const menuLlmContext = await read('menu/llms.txt');
const tooltipReadme = await read('tooltip/README.md');
const tooltipLlmContext = await read('tooltip/llms.txt');
const progressBarReadme = await read('progress-bar/README.md');
const progressBarLlmContext = await read('progress-bar/llms.txt');
const progressSpinnerReadme = await read('progress-spinner/README.md');
const progressSpinnerLlmContext = await read('progress-spinner/llms.txt');
const loadingOverlayReadme = await read('loading-overlay/README.md');
const loadingOverlayLlmContext = await read('loading-overlay/llms.txt');
const skeletonReadme = await read('skeleton/README.md');
const skeletonLlmContext = await read('skeleton/llms.txt');
const dividerReadme = await read('divider/README.md');
const dividerLlmContext = await read('divider/llms.txt');
const meterGroupReadme = await read('meter-group/README.md');
const meterGroupLlmContext = await read('meter-group/llms.txt');
const tableReadme = await read('table/README.md');
const tableChangelog = await read('table/CHANGELOG.md');
const tableSizeReport = await read('table/SIZE.md');
const tableLlmContext = await read('table/llms.txt');
const datePickerReadme = await read('date-picker/README.md');
const datePickerLlmContext = await read('date-picker/llms.txt');
const autoCompleteReadme = await read('auto-complete/README.md');
const autoCompleteLlmContext = await read('auto-complete/llms.txt');
const multiSelectReadme = await read('multi-select/README.md');
const multiSelectLlmContext = await read('multi-select/llms.txt');
const treeSelectReadme = await read('tree-select/README.md');
const treeSelectLlmContext = await read('tree-select/llms.txt');
assert(tabsReadme.includes('iconClass'), 'Tabs README omits iconClass.');
assert(
  accordionReadme.includes('panelChange'),
  'Accordion README omits panelChange.',
);
assert(
  accordionLlmContext.includes('@neural-ng/core/accordion'),
  'Accordion llms.txt omits its secondary entry point.',
);
assert(
  tabsLlmContext.includes('@neural-ng/core/tabs'),
  'Tabs llms.txt omits its secondary entry point.',
);
assert(inputReadme.includes('neuralInput'), 'Input README omits neuralInput.');
assert(
  inputLlmContext.includes('@neural-ng/core/input'),
  'Input llms.txt omits its secondary entry point.',
);
assert(
  inputNumberReadme.includes('FormValueControl'),
  'InputNumber README omits Signal Forms.',
);
assert(
  inputNumberLlmContext.includes('@neural-ng/core/input-number'),
  'InputNumber llms.txt omits its secondary entry point.',
);
assert(
  inputNumberReadme.includes('NeuralInputNumber') &&
    inputNumberLlmContext.includes('NeuralInputNumber'),
  'InputNumber documentation omits its canonical runtime name.',
);
for (const adapter of ['[formField]', '[formControl]', '[(ngModel)]']) {
  assert(
    inputNumberReadme.includes(adapter),
    `InputNumber README omits Forms adapter: ${adapter}`,
  );
}
assert(
  inputOtpReadme.includes('NeuralInputOtp') &&
    inputOtpLlmContext.includes('NeuralInputOtp'),
  'InputOtp documentation omits its canonical runtime name.',
);
for (const adapter of ['[formField]', '[formControl]', '[(ngModel)]']) {
  assert(
    inputOtpReadme.includes(adapter),
    `InputOtp README omits Forms adapter: ${adapter}`,
  );
}
for (const rule of ['one-time-code', 'RTL', 'server']) {
  assert(
    inputOtpReadme.includes(rule) || inputOtpLlmContext.includes(rule),
    `InputOtp documentation omits rule: ${rule}`,
  );
}
assert(
  datePickerReadme.includes('FormValueControl') &&
    datePickerReadme.includes('browser top layer'),
  'DatePicker README omits Forms or overlay guidance.',
);
assert(
  datePickerLlmContext.includes('@neural-ng/core/date-picker') &&
    datePickerLlmContext.includes('Do not add appendTo="body"'),
  'DatePicker llms.txt omits entry point or top-layer rules.',
);
assert(
  autoCompleteReadme.includes('requestId') &&
    autoCompleteReadme.includes('FormValueControl'),
  'AutoComplete README omits remote or Signal Forms guidance.',
);
assert(
  autoCompleteLlmContext.includes('@neural-ng/core/auto-complete') &&
    autoCompleteLlmContext.includes('IME'),
  'AutoComplete llms.txt omits entry point or composition guidance.',
);
assert(
  autoCompleteReadme.includes('FormValueControl<TValue | string | null>'),
  'AutoComplete README omits its canonical Forms contract.',
);
assert(
  autoCompleteReadme.includes('aria-readonly'),
  'AutoComplete README omits readonly semantics.',
);
for (const adapter of ['[formField]', '[formControl]', '[(ngModel)]']) {
  assert(
    autoCompleteReadme.includes(adapter),
    `AutoComplete README omits Forms adapter: ${adapter}`,
  );
}
assert(
  autoCompleteLlmContext.includes('FormValueControl<TValue | string | null>'),
  'AutoComplete llms.txt omits its canonical Forms contract.',
);
assert(
  multiSelectReadme.includes('FormValueControl<readonly TValue[]>'),
  'MultiSelect README omits its canonical Forms contract.',
);
assert(
  multiSelectReadme.includes('aria-readonly'),
  'MultiSelect README omits readonly semantics.',
);
for (const adapter of ['[formField]', '[formControl]', '[(ngModel)]']) {
  assert(
    multiSelectReadme.includes(adapter),
    `MultiSelect README omits Forms adapter: ${adapter}`,
  );
}
assert(
  multiSelectLlmContext.includes('FormValueControl<readonly TValue[]>'),
  'MultiSelect llms.txt omits its canonical Forms contract.',
);
assert(
  multiSelectReadme.includes('NeuralMultiSelect') &&
    multiSelectLlmContext.includes('NeuralMultiSelect'),
  'MultiSelect documentation omits its canonical runtime name.',
);
assert(
  treeSelectReadme.includes('FormValueControl<NeuralTreeSelectValue<TValue>>'),
  'TreeSelect README omits its canonical Forms contract.',
);
assert(
  treeSelectReadme.includes('aria-readonly'),
  'TreeSelect README omits readonly semantics.',
);
for (const adapter of ['[formField]', '[formControl]', '[(ngModel)]']) {
  assert(
    treeSelectReadme.includes(adapter),
    `TreeSelect README omits Forms adapter: ${adapter}`,
  );
}
assert(
  treeSelectLlmContext.includes(
    'FormValueControl<NeuralTreeSelectValue<TValue>>',
  ),
  'TreeSelect llms.txt omits its canonical Forms contract.',
);
assert(
  fieldReadme.includes('neuralFieldLabel'),
  'Field README omits neuralFieldLabel.',
);
assert(
  fieldLlmContext.includes('@neural-ng/core/field'),
  'Field llms.txt omits its secondary entry point.',
);
for (const symbol of [
  'NeuralField',
  'NeuralFieldLabel',
  'NeuralFieldHint',
  'NeuralFieldError',
  'NeuralFieldControl',
]) {
  assert(
    fieldLlmContext.includes(symbol),
    `Field llms.txt omits canonical symbol: ${symbol}`,
  );
}
assert(
  fileUploadReadme.includes('NeuralFileUpload') &&
    fileUploadLlmContext.includes('NeuralFileUpload'),
  'FileUpload documentation omits its canonical runtime name.',
);
for (const adapter of ['[formField]', '[formControl]', '[(ngModel)]']) {
  assert(
    fileUploadReadme.includes(adapter),
    `FileUpload README omits Forms adapter: ${adapter}`,
  );
}
assert(
  fileUploadReadme.includes('FormData') &&
    fileUploadLlmContext.includes('HTTP requests'),
  'FileUpload documentation omits its HTTP ownership boundary.',
);
assert(
  inputMaskReadme.includes('NeuralInputMask') &&
    inputMaskLlmContext.includes('NeuralInputMask'),
  'InputMask documentation omits its canonical runtime name.',
);
for (const adapter of ['[formField]', '[formControl]', '[(ngModel)]']) {
  assert(
    inputMaskReadme.includes(adapter),
    `InputMask README omits Forms adapter: ${adapter}`,
  );
}
for (const rule of ['`9`', '`a`', '`*`', '`unmask`', '`clearIncomplete`']) {
  assert(
    inputMaskReadme.includes(rule) || inputMaskLlmContext.includes(rule),
    `InputMask documentation omits rule: ${rule}`,
  );
}
assert(
  dialogReadme.includes('neuralDialogInitialFocus'),
  'Dialog README omits initial focus.',
);
assert(
  dialogLlmContext.includes('@neural-ng/core/dialog') &&
    dialogLlmContext.includes('NeuralDialog') &&
    dialogLlmContext.includes('NeuralDialogHeader') &&
    dialogLlmContext.includes('NeuralDialogBody') &&
    dialogLlmContext.includes('NeuralDialogFooter') &&
    dialogLlmContext.includes('NeuralDialogInitialFocus') &&
    dialogLlmContext.includes('deprecated `Dialog*` aliases'),
  'Dialog llms.txt omits its canonical entry point or alias guidance.',
);
assert(
  drawerReadme.includes('neuralDrawerInitialFocus') &&
    drawerReadme.includes('start`, `end`, `top`, or `bottom'),
  'Drawer README omits focus or logical placement guidance.',
);
assert(
  drawerLlmContext.includes('@neural-ng/core/drawer') &&
    drawerLlmContext.includes('NeuralDrawer') &&
    drawerLlmContext.includes('NeuralDrawerInitialFocus') &&
    drawerLlmContext.includes('deprecated Drawer* aliases') &&
    drawerLlmContext.includes('Popover top layer') &&
    drawerLlmContext.includes('RTL-aware'),
  'Drawer llms.txt omits its canonical entry point, alias, or RTL rule.',
);
assert(
  overlayReadme.includes('CSS Anchor Positioning'),
  'Overlay README omits its positioning strategy.',
);
assert(
  overlayLlmContext.includes('@neural-ng/core/overlay'),
  'Overlay llms.txt omits its secondary entry point.',
);
assert(
  panelMenuReadme.includes('expandedKeys'),
  'PanelMenu README omits expandedKeys.',
);
assert(
  panelMenuLlmContext.includes('@neural-ng/core/panel-menu'),
  'PanelMenu llms.txt omits its secondary entry point.',
);
assert(
  popoverReadme.includes('neuralPopoverTriggerFor'),
  'Popover README omits its trigger directive.',
);
assert(
  popoverLlmContext.includes('@neural-ng/core/popover'),
  'Popover llms.txt omits its secondary entry point.',
);
assert(
  menuReadme.includes('neuralMenuTriggerFor'),
  'Menu README omits neuralMenuTriggerFor.',
);
assert(
  menuLlmContext.includes('@neural-ng/core/menu'),
  'Menu llms.txt omits its secondary entry point.',
);
assert(
  tooltipReadme.includes('neuralTooltip'),
  'Tooltip README omits neuralTooltip.',
);
assert(
  tooltipLlmContext.includes('@neural-ng/core/tooltip'),
  'Tooltip llms.txt omits its secondary entry point.',
);
assert(
  progressBarReadme.includes('mode="indeterminate"'),
  'ProgressBar README omits indeterminate mode.',
);
assert(
  progressBarLlmContext.includes('@neural-ng/core/progress-bar'),
  'ProgressBar llms.txt omits its secondary entry point.',
);
assert(
  progressSpinnerReadme.includes('prefers-reduced-motion'),
  'ProgressSpinner README omits reduced-motion behavior.',
);
assert(
  progressSpinnerLlmContext.includes('@neural-ng/core/progress-spinner'),
  'ProgressSpinner llms.txt omits its secondary entry point.',
);
assert(
  loadingOverlayReadme.includes('minimumDuration'),
  'LoadingOverlay README omits minimumDuration.',
);
assert(
  loadingOverlayLlmContext.includes('@neural-ng/core/loading-overlay'),
  'LoadingOverlay llms.txt omits its secondary entry point.',
);
assert(
  loadingOverlayReadme.includes('NeuralLoadingOverlay') &&
    loadingOverlayLlmContext.includes('NeuralLoadingOverlay'),
  'LoadingOverlay documentation omits its canonical runtime name.',
);
assert(
  skeletonReadme.includes('aria-hidden="true"'),
  'Skeleton README omits decorative semantics.',
);
assert(
  skeletonLlmContext.includes('@neural-ng/core/skeleton'),
  'Skeleton llms.txt omits its secondary entry point.',
);
assert(
  dividerReadme.includes('role="separator"'),
  'Divider README omits separator semantics.',
);
assert(
  dividerLlmContext.includes('@neural-ng/core/divider') &&
    dividerLlmContext.includes('NeuralDivider') &&
    dividerLlmContext.includes('deprecated DividerComponent'),
  'Divider llms.txt omits its canonical entry point or alias guidance.',
);
assert(
  meterGroupReadme.includes('role="meter"'),
  'MeterGroup README omits meter semantics.',
);
assert(
  meterGroupLlmContext.includes('@neural-ng/core/meter-group'),
  'MeterGroup llms.txt omits its secondary entry point.',
);
assert(
  tableReadme.includes('dataMode="remote"'),
  'Table README omits remote data mode.',
);
assert(
  tableLlmContext.includes('@neural-ng/core/table'),
  'Table llms.txt omits its secondary entry point.',
);
assert(
  tableChangelog.includes('0.1.0-beta.0'),
  'Table changelog omits the alpha release.',
);
assert(
  tableSizeReport.includes('neural-ng-core-table.mjs'),
  'Table size report omits the built entry point.',
);
assert(
  selectReadme.includes('selectionChange'),
  'Select README omits selectionChange.',
);
assert(
  selectLlmContext.includes('@neural-ng/core/select'),
  'Select llms.txt omits its secondary entry point.',
);
assert(
  selectReadme.includes('FormValueControl<TValue | null>'),
  'Select README omits its Forms contract.',
);
assert(
  selectReadme.includes('aria-readonly'),
  'Select README omits readonly semantics.',
);
for (const adapter of ['[formField]', '[formControl]', '[(ngModel)]']) {
  assert(
    selectReadme.includes(adapter),
    `Select README omits Forms adapter: ${adapter}`,
  );
}
assert(
  selectLlmContext.includes('FormValueControl<TValue | null>'),
  'Select llms.txt omits its Forms contract.',
);
assert(
  checkboxReadme.includes('FormCheckboxControl'),
  'Checkbox README omits the binary Forms contract.',
);
assert(
  checkboxReadme.includes('neural-tri-state-checkbox'),
  'Checkbox README omits the tri-state component.',
);
assert(
  !checkboxReadme.includes('`checked` model is `boolean | null`'),
  'Checkbox README still documents a nullable checked model.',
);
assert(
  checkboxLlmContext.includes('@neural-ng/core/checkbox'),
  'Checkbox llms.txt omits its secondary entry point.',
);
assert(
  radioReadme.includes('selectionChange'),
  'Radio README omits selectionChange.',
);
assert(
  radioLlmContext.includes('@neural-ng/core/radio'),
  'Radio llms.txt omits its secondary entry point.',
);
assert(
  radioReadme.includes('FormValueControl<TValue | null>'),
  'Radio README omits its Forms contract.',
);
assert(
  radioReadme.includes('aria-readonly'),
  'Radio README omits readonly semantics.',
);
for (const adapter of ['[formField]', '[formControl]', '[(ngModel)]']) {
  assert(
    radioReadme.includes(adapter),
    `Radio README omits Forms adapter: ${adapter}`,
  );
}
assert(
  radioLlmContext.includes('FormValueControl<TValue | null>'),
  'Radio llms.txt omits its Forms contract.',
);
assert(
  switchReadme.includes('aria-readonly'),
  'Switch README omits readonly semantics.',
);
assert(
  switchReadme.includes('FormCheckboxControl'),
  'Switch README omits its Forms contract.',
);
for (const adapter of ['[formField]', '[formControl]', '[(ngModel)]']) {
  assert(
    switchReadme.includes(adapter),
    `Switch README omits Forms adapter: ${adapter}`,
  );
}
assert(
  switchLlmContext.includes('@neural-ng/core/switch'),
  'Switch llms.txt omits its secondary entry point.',
);
assert(
  switchLlmContext.includes('FormCheckboxControl'),
  'Switch llms.txt omits its Forms contract.',
);
assert(
  textareaReadme.includes('field-sizing: content'),
  'Textarea README omits native auto resize.',
);
assert(
  textareaLlmContext.includes('@neural-ng/core/textarea'),
  'Textarea llms.txt omits its secondary entry point.',
);

const npmCli =
  process.env['npm_execpath'] ??
  join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
await access(npmCli);
const { stdout } = await execute(
  process.execPath,
  [npmCli, 'pack', '--dry-run', '--json', packageRoot],
  { cwd: workspaceRoot, maxBuffer: 10 * 1024 * 1024 },
);
const packResult = JSON.parse(stdout)[0];
const publishedFiles = new Set(packResult.files.map((file) => file.path));
for (const file of [
  'package.json',
  'fesm2022/neural-ng-core-accordion.mjs',
  'types/neural-ng-core-accordion.d.ts',
  'accordion/README.md',
  'accordion/llms.txt',
  'fesm2022/neural-ng-core-auto-complete.mjs',
  'types/neural-ng-core-auto-complete.d.ts',
  'auto-complete/README.md',
  'auto-complete/llms.txt',
  'fesm2022/neural-ng-core-avatar.mjs',
  'types/neural-ng-core-avatar.d.ts',
  'avatar/README.md',
  'avatar/llms.txt',
  'fesm2022/neural-ng-core-progress-bar.mjs',
  'types/neural-ng-core-progress-bar.d.ts',
  'progress-bar/README.md',
  'progress-bar/llms.txt',
  'fesm2022/neural-ng-core-progress-spinner.mjs',
  'types/neural-ng-core-progress-spinner.d.ts',
  'progress-spinner/README.md',
  'progress-spinner/llms.txt',
  'fesm2022/neural-ng-core-loading-overlay.mjs',
  'types/neural-ng-core-loading-overlay.d.ts',
  'loading-overlay/README.md',
  'loading-overlay/llms.txt',
  'fesm2022/neural-ng-core-skeleton.mjs',
  'types/neural-ng-core-skeleton.d.ts',
  'skeleton/README.md',
  'skeleton/llms.txt',
  'fesm2022/neural-ng-core-divider.mjs',
  'types/neural-ng-core-divider.d.ts',
  'divider/README.md',
  'divider/llms.txt',
  'fesm2022/neural-ng-core-meter-group.mjs',
  'types/neural-ng-core-meter-group.d.ts',
  'meter-group/README.md',
  'meter-group/llms.txt',
  'fesm2022/neural-ng-core-table.mjs',
  'types/neural-ng-core-table.d.ts',
  'table/README.md',
  'table/CHANGELOG.md',
  'table/SIZE.md',
  'table/llms.txt',
  'fesm2022/neural-ng-core-badge.mjs',
  'types/neural-ng-core-badge.d.ts',
  'badge/README.md',
  'badge/llms.txt',
  'fesm2022/neural-ng-core-tag.mjs',
  'types/neural-ng-core-tag.d.ts',
  'tag/README.md',
  'tag/llms.txt',
  'fesm2022/neural-ng-core-breadcrumb.mjs',
  'types/neural-ng-core-breadcrumb.d.ts',
  'breadcrumb/README.md',
  'breadcrumb/llms.txt',
  'fesm2022/neural-ng-core-tabs.mjs',
  'types/neural-ng-core-tabs.d.ts',
  'fesm2022/neural-ng-core-input.mjs',
  'types/neural-ng-core-input.d.ts',
  'fesm2022/neural-ng-core-input-number.mjs',
  'types/neural-ng-core-input-number.d.ts',
  'fesm2022/neural-ng-core-i18n.mjs',
  'types/neural-ng-core-i18n.d.ts',
  'fesm2022/neural-ng-core-locales-en.mjs',
  'types/neural-ng-core-locales-en.d.ts',
  'fesm2022/neural-ng-core-locales-tr.mjs',
  'types/neural-ng-core-locales-tr.d.ts',
  'fesm2022/neural-ng-core-locales-de.mjs',
  'types/neural-ng-core-locales-de.d.ts',
  'fesm2022/neural-ng-core-locales-fr.mjs',
  'types/neural-ng-core-locales-fr.d.ts',
  'fesm2022/neural-ng-core-locales-es.mjs',
  'types/neural-ng-core-locales-es.d.ts',
  'fesm2022/neural-ng-core-locales-pt-br.mjs',
  'types/neural-ng-core-locales-pt-br.d.ts',
  'fesm2022/neural-ng-core-locales-ar.mjs',
  'types/neural-ng-core-locales-ar.d.ts',
  'fesm2022/neural-ng-core-locales-zh-cn.mjs',
  'types/neural-ng-core-locales-zh-cn.d.ts',
  'fesm2022/neural-ng-core-field.mjs',
  'types/neural-ng-core-field.d.ts',
  'fesm2022/neural-ng-core-dialog.mjs',
  'types/neural-ng-core-dialog.d.ts',
  'dialog/README.md',
  'dialog/llms.txt',
  'fesm2022/neural-ng-core-select.mjs',
  'types/neural-ng-core-select.d.ts',
  'fesm2022/neural-ng-core-checkbox.mjs',
  'types/neural-ng-core-checkbox.d.ts',
  'fesm2022/neural-ng-core-radio.mjs',
  'types/neural-ng-core-radio.d.ts',
  'field/README.md',
  'field/llms.txt',
  'tabs/README.md',
  'tabs/llms.txt',
  'input/README.md',
  'input/llms.txt',
  'input-number/README.md',
  'input-number/llms.txt',
  'select/README.md',
  'select/llms.txt',
  'checkbox/README.md',
  'checkbox/llms.txt',
  'radio/README.md',
  'radio/llms.txt',
  'fesm2022/neural-ng-core-switch.mjs',
  'types/neural-ng-core-switch.d.ts',
  'switch/README.md',
  'switch/llms.txt',
  'fesm2022/neural-ng-core-textarea.mjs',
  'types/neural-ng-core-textarea.d.ts',
  'textarea/README.md',
  'textarea/llms.txt',
  'fesm2022/neural-ng-core-overlay.mjs',
  'types/neural-ng-core-overlay.d.ts',
  'overlay/README.md',
  'overlay/llms.txt',
  'fesm2022/neural-ng-core-panel-menu.mjs',
  'types/neural-ng-core-panel-menu.d.ts',
  'panel-menu/README.md',
  'panel-menu/llms.txt',
  'fesm2022/neural-ng-core-popover.mjs',
  'types/neural-ng-core-popover.d.ts',
  'popover/README.md',
  'popover/llms.txt',
  'fesm2022/neural-ng-core-menu.mjs',
  'types/neural-ng-core-menu.d.ts',
  'menu/README.md',
  'menu/llms.txt',
  'fesm2022/neural-ng-core-tooltip.mjs',
  'types/neural-ng-core-tooltip.d.ts',
  'tooltip/README.md',
  'tooltip/llms.txt',
  'LICENSE',
  'THIRD_PARTY_NOTICES.md',
  'themes/neutral.css',
  'themes/tailwind.css',
  'themes/experimental/glass.css',
  'themes/experimental/mist.css',
  'themes/experimental/futuristic.css',
]) {
  assert(publishedFiles.has(file), `npm pack would omit ${file}.`);
}
assert(
  !publishedFiles.has('types/neural-ng-core-editor.d.ts'),
  'Removed Editor secondary entry point leaked into Core package.',
);
assert(
  [...publishedFiles].every((file) => !file.endsWith('.spec.ts')),
  'Test source leaked into the npm package.',
);

console.log(
  `Validated ${packageJson.name}@${packageJson.version}: ${expectedExports.length} exports, importable i18n/InputNumber and component runtimes, types, themes, docs, and npm pack contents.`,
);

async function read(relativePath) {
  return readFile(join(packageRoot, relativePath), 'utf8');
}

async function readJson(relativePath) {
  return JSON.parse(await read(relativePath));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
