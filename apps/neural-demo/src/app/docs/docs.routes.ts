import { type Routes } from '@angular/router';

export const DOC_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/docs-shell/docs-shell').then((shell) => shell.DocsShell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'getting-started/installation',
      },
      {
        path: 'getting-started/installation',
        title: 'Installation — NeuralNg',
        loadComponent: () =>
          import('./pages/installation/installation.page').then(
            (page) => page.InstallationPage,
          ),
      },
      {
        path: 'getting-started/configuration',
        title: 'Configuration — NeuralNg',
        data: { guide: 'configuration' },
        loadComponent: () =>
          import('./pages/foundation-guide/foundation-guide.page').then(
            (page) => page.FoundationGuidePage,
          ),
      },
      {
        path: 'getting-started/icons',
        title: 'Neural Icons — NeuralNg',
        loadComponent: () =>
          import('./pages/icons/icons.page').then((page) => page.IconsPage),
      },
      {
        path: 'getting-started/theming',
        title: 'Theming — NeuralNg',
        loadComponent: () =>
          import('./pages/theming/theming.page').then(
            (page) => page.ThemingPage,
          ),
      },
      {
        path: 'tools/theme-studio',
        title: 'Theme Studio — NeuralNg',
        loadComponent: () =>
          import('./pages/theme-studio/theme-studio.page').then(
            (page) => page.ThemeStudioPage,
          ),
      },
      {
        path: 'guides/localization',
        title: 'Localization — NeuralNg',
        loadComponent: () =>
          import('./pages/localization/localization.page').then(
            (page) => page.LocalizationPage,
          ),
      },
      {
        path: 'guides/ai-first',
        title: 'AI-first workflow — NeuralNg',
        data: { guide: 'ai-first' },
        loadComponent: () =>
          import('./pages/foundation-guide/foundation-guide.page').then(
            (page) => page.FoundationGuidePage,
          ),
      },
      {
        path: 'guides/headless',
        title: 'Headless mode — NeuralNg',
        data: { guide: 'headless' },
        loadComponent: () =>
          import('./pages/foundation-guide/foundation-guide.page').then(
            (page) => page.FoundationGuidePage,
          ),
      },
      {
        path: 'guides/accessibility',
        title: 'Accessibility — NeuralNg',
        data: { guide: 'accessibility' },
        loadComponent: () =>
          import('./pages/foundation-guide/foundation-guide.page').then(
            (page) => page.FoundationGuidePage,
          ),
      },
      {
        path: 'guides/ssr-hydration',
        title: 'SSR and hydration — NeuralNg',
        data: { guide: 'ssr' },
        loadComponent: () =>
          import('./pages/foundation-guide/foundation-guide.page').then(
            (page) => page.FoundationGuidePage,
          ),
      },
      {
        path: 'components/accordion',
        title: 'Accordion — NeuralNg',
        loadComponent: () =>
          import('./pages/accordion/accordion.page').then(
            (page) => page.AccordionPage,
          ),
      },
      {
        path: 'components/auto-complete',
        title: 'AutoComplete — NeuralNg',
        loadComponent: () =>
          import('./pages/auto-complete/auto-complete.page').then(
            (page) => page.AutoCompletePage,
          ),
      },
      {
        path: 'components/breadcrumb',
        title: 'Breadcrumb — NeuralNg',
        loadComponent: () =>
          import('./pages/breadcrumb/breadcrumb.page').then(
            (page) => page.BreadcrumbPage,
          ),
      },
      {
        path: 'components/avatar',
        title: 'Avatar — NeuralNg',
        loadComponent: () =>
          import('./pages/avatar/avatar.page').then((page) => page.AvatarPage),
      },
      {
        path: 'components/badge',
        title: 'Badge — NeuralNg',
        loadComponent: () =>
          import('./pages/badge/badge.page').then((page) => page.BadgePage),
      },
      {
        path: 'components/button',
        title: 'Button — NeuralNg',
        loadComponent: () =>
          import('./pages/button/button.page').then((page) => page.ButtonPage),
      },
      {
        path: 'components/card',
        title: 'Card — NeuralNg',
        loadComponent: () =>
          import('./pages/card/card.page').then((page) => page.CardPage),
      },
      {
        path: 'components/checkbox',
        title: 'Checkbox — NeuralNg',
        loadComponent: () =>
          import('./pages/checkbox/checkbox.page').then(
            (page) => page.CheckboxPage,
          ),
      },
      {
        path: 'components/tri-state-checkbox',
        title: 'TriStateCheckbox — NeuralNg',
        loadComponent: () =>
          import('./pages/tri-state-checkbox/tri-state-checkbox.page').then(
            (page) => page.TriStateCheckboxPage,
          ),
      },
      {
        path: 'components/dialog',
        title: 'Dialog — NeuralNg',
        loadComponent: () =>
          import('./pages/dialog/dialog.page').then((page) => page.DialogPage),
      },
      {
        path: 'components/confirm-dialog',
        title: 'ConfirmDialog — NeuralNg',
        loadComponent: () =>
          import('./pages/confirm-dialog/confirm-dialog.page').then(
            (page) => page.ConfirmDialogPage,
          ),
      },
      {
        path: 'components/drawer',
        title: 'Drawer — NeuralNg',
        loadComponent: () =>
          import('./pages/drawer/drawer.page').then((page) => page.DrawerPage),
      },
      {
        path: 'components/toolbar',
        title: 'Toolbar — NeuralNg',
        loadComponent: () =>
          import('./pages/toolbar/toolbar.page').then(
            (page) => page.ToolbarPage,
          ),
      },
      {
        path: 'components/tree',
        title: 'Tree — NeuralNg',
        loadComponent: () =>
          import('./pages/tree/tree.page').then((page) => page.TreePage),
      },
      {
        path: 'components/tree-select',
        title: 'TreeSelect — NeuralNg',
        loadComponent: () =>
          import('./pages/tree-select/tree-select.page').then(
            (page) => page.TreeSelectPage,
          ),
      },
      {
        path: 'components/date-picker',
        title: 'DatePicker — NeuralNg',
        loadComponent: () =>
          import('./pages/date-picker/date-picker.page').then(
            (page) => page.DatePickerPage,
          ),
      },
      {
        path: 'components/data-view',
        title: 'DataView — NeuralNg',
        loadComponent: () =>
          import('./pages/data-view/data-view.page').then(
            (page) => page.DataViewPage,
          ),
      },
      {
        path: 'components/divider',
        title: 'Divider — NeuralNg',
        loadComponent: () =>
          import('./pages/divider/divider.page').then(
            (page) => page.DividerPage,
          ),
      },
      {
        path: 'components/radio',
        title: 'Radio — NeuralNg',
        loadComponent: () =>
          import('./pages/radio/radio.page').then((page) => page.RadioPage),
      },
      {
        path: 'components/select',
        title: 'Select — NeuralNg',
        loadComponent: () =>
          import('./pages/select/select.page').then((page) => page.SelectPage),
      },
      {
        path: 'components/skeleton',
        title: 'Skeleton — NeuralNg',
        loadComponent: () =>
          import('./pages/skeleton/skeleton.page').then(
            (page) => page.SkeletonPage,
          ),
      },
      {
        path: 'components/slider',
        title: 'Slider — NeuralNg',
        loadComponent: () =>
          import('./pages/slider/slider.page').then((page) => page.SliderPage),
      },
      {
        path: 'components/switch',
        title: 'Switch — NeuralNg',
        loadComponent: () =>
          import('./pages/switch/switch.page').then((page) => page.SwitchPage),
      },
      {
        path: 'components/textarea',
        title: 'Textarea — NeuralNg',
        loadComponent: () =>
          import('./pages/textarea/textarea.page').then(
            (page) => page.TextareaPage,
          ),
      },
      {
        path: 'components/input-number',
        title: 'InputNumber — NeuralNg',
        loadComponent: () =>
          import('./pages/input-number/input-number.page').then(
            (page) => page.InputNumberPage,
          ),
      },
      {
        path: 'components/field',
        title: 'Field — NeuralNg',
        loadComponent: () =>
          import('./pages/field/field.page').then((page) => page.FieldPage),
      },
      {
        path: 'components/input',
        title: 'Input — NeuralNg',
        loadComponent: () =>
          import('./pages/input/input.page').then((page) => page.InputPage),
      },
      {
        path: 'components/input-mask',
        title: 'InputMask — NeuralNg',
        loadComponent: () =>
          import('./pages/input-mask/input-mask.page').then(
            (page) => page.InputMaskPage,
          ),
      },
      {
        path: 'components/password',
        title: 'Password — NeuralNg',
        loadComponent: () =>
          import('./pages/password/password.page').then(
            (page) => page.PasswordPage,
          ),
      },
      {
        path: 'components/editor',
        title: 'Editor — NeuralNg',
        loadComponent: () =>
          import('./pages/editor/editor.page').then((page) => page.EditorPage),
      },
      {
        path: 'components/file-upload',
        title: 'FileUpload — NeuralNg',
        loadComponent: () =>
          import('./pages/file-upload/file-upload.page').then(
            (page) => page.FileUploadPage,
          ),
      },
      {
        path: 'components/input-otp',
        title: 'InputOtp — NeuralNg',
        loadComponent: () =>
          import('./pages/input-otp/input-otp.page').then(
            (page) => page.InputOtpPage,
          ),
      },
      {
        path: 'components/loading-overlay',
        title: 'LoadingOverlay — NeuralNg',
        loadComponent: () =>
          import('./pages/loading-overlay/loading-overlay.page').then(
            (page) => page.LoadingOverlayPage,
          ),
      },
      {
        path: 'components/menu',
        title: 'Menu — NeuralNg',
        loadComponent: () =>
          import('./pages/menu/menu.page').then((page) => page.MenuPage),
      },
      {
        path: 'components/meter-group',
        title: 'MeterGroup — NeuralNg',
        loadComponent: () =>
          import('./pages/meter-group/meter-group.page').then(
            (page) => page.MeterGroupPage,
          ),
      },
      {
        path: 'components/multi-select',
        title: 'MultiSelect — NeuralNg',
        loadComponent: () =>
          import('./pages/multi-select/multi-select.page').then(
            (page) => page.MultiSelectPage,
          ),
      },
      {
        path: 'components/paginator',
        title: 'Paginator — NeuralNg',
        loadComponent: () =>
          import('./pages/paginator/paginator.page').then(
            (page) => page.PaginatorPage,
          ),
      },
      {
        path: 'components/progress-bar',
        title: 'ProgressBar — NeuralNg',
        loadComponent: () =>
          import('./pages/progress-bar/progress-bar.page').then(
            (page) => page.ProgressBarPage,
          ),
      },
      {
        path: 'components/popover',
        title: 'Popover — NeuralNg',
        loadComponent: () =>
          import('./pages/popover/popover.page').then(
            (page) => page.PopoverPage,
          ),
      },
      {
        path: 'components/progress-spinner',
        title: 'ProgressSpinner — NeuralNg',
        loadComponent: () =>
          import('./pages/progress-spinner/progress-spinner.page').then(
            (page) => page.ProgressSpinnerPage,
          ),
      },
      {
        path: 'components/panel-menu',
        title: 'PanelMenu — NeuralNg',
        loadComponent: () =>
          import('./pages/panel-menu/panel-menu.page').then(
            (page) => page.PanelMenuPage,
          ),
      },
      {
        path: 'components/table',
        title: 'Table — NeuralNg',
        loadComponent: () =>
          import('./pages/table/table.page').then((page) => page.TablePage),
      },
      {
        path: 'components/tabs',
        title: 'Tabs — NeuralNg',
        loadComponent: () =>
          import('./pages/tabs/tabs.page').then((page) => page.TabsPage),
      },
      {
        path: 'components/tag',
        title: 'Tag — NeuralNg',
        loadComponent: () =>
          import('./pages/tag/tag.page').then((page) => page.TagPage),
      },
      {
        path: 'components/toast',
        title: 'Toast — NeuralNg',
        loadComponent: () =>
          import('./pages/toast/toast.page').then((page) => page.ToastPage),
      },
      {
        path: 'components/tooltip',
        title: 'Tooltip — NeuralNg',
        loadComponent: () =>
          import('./pages/tooltip/tooltip.page').then(
            (page) => page.TooltipPage,
          ),
      },
      {
        path: 'components/virtual-scroller',
        title: 'VirtualScroller — NeuralNg',
        loadComponent: () =>
          import('./pages/virtual-scroller/virtual-scroller.page').then(
            (page) => page.VirtualScrollerPage,
          ),
      },
      {
        path: 'apis/message',
        title: 'Message API — NeuralNg',
        loadComponent: () =>
          import('./pages/message-api/message-api.page').then(
            (page) => page.MessageApiPage,
          ),
      },
      {
        path: 'apis/color-mode',
        title: 'Color Mode — NeuralNg',
        data: { guide: 'color-mode' },
        loadComponent: () =>
          import('./pages/foundation-guide/foundation-guide.page').then(
            (page) => page.FoundationGuidePage,
          ),
      },
    ],
  },
];
