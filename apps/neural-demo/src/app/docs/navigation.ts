export interface DocsNavigationItem {
  readonly label: string;
  readonly route?: string;
  readonly status?: 'alpha' | 'soon';
}

export interface DocsNavigationGroup {
  readonly label: string;
  readonly items: readonly DocsNavigationItem[];
}

export const DOCS_NAVIGATION: readonly DocsNavigationGroup[] = [
  {
    label: 'Getting Started',
    items: [
      {
        label: 'Installation',
        route: '/docs/getting-started/installation',
        status: 'alpha',
      },
      {
        label: 'Configuration',
        route: '/docs/getting-started/configuration',
        status: 'alpha',
      },
      {
        label: 'Theming',
        route: '/docs/getting-started/theming',
        status: 'alpha',
      },
      {
        label: 'Neural Icons',
        route: '/docs/getting-started/icons',
        status: 'alpha',
      },
    ],
  },
  {
    label: 'Tools',
    items: [
      {
        label: 'Theme Studio',
        route: '/docs/tools/theme-studio',
        status: 'alpha',
      },
    ],
  },
  {
    label: 'Guides',
    items: [
      {
        label: 'AI-first workflow',
        route: '/docs/guides/ai-first',
        status: 'alpha',
      },
      {
        label: 'Localization',
        route: '/docs/guides/localization',
        status: 'alpha',
      },
      {
        label: 'Headless mode',
        route: '/docs/guides/headless',
        status: 'alpha',
      },
      {
        label: 'Accessibility',
        route: '/docs/guides/accessibility',
        status: 'alpha',
      },
      {
        label: 'SSR and hydration',
        route: '/docs/guides/ssr-hydration',
        status: 'alpha',
      },
    ],
  },
  {
    label: 'Components',
    items: [
      {
        label: 'Accordion',
        route: '/docs/components/accordion',
        status: 'alpha',
      },
      {
        label: 'AutoComplete',
        route: '/docs/components/auto-complete',
        status: 'alpha',
      },
      {
        label: 'Breadcrumb',
        route: '/docs/components/breadcrumb',
        status: 'alpha',
      },
      {
        label: 'Avatar',
        route: '/docs/components/avatar',
        status: 'alpha',
      },
      {
        label: 'Badge',
        route: '/docs/components/badge',
        status: 'alpha',
      },
      {
        label: 'Button',
        route: '/docs/components/button',
        status: 'alpha',
      },
      {
        label: 'Checkbox',
        route: '/docs/components/checkbox',
        status: 'alpha',
      },
      {
        label: 'TriStateCheckbox',
        route: '/docs/components/tri-state-checkbox',
        status: 'alpha',
      },
      {
        label: 'Card',
        route: '/docs/components/card',
        status: 'alpha',
      },
      {
        label: 'Dialog',
        route: '/docs/components/dialog',
        status: 'alpha',
      },
      {
        label: 'ConfirmDialog',
        route: '/docs/components/confirm-dialog',
        status: 'alpha',
      },
      {
        label: 'Drawer',
        route: '/docs/components/drawer',
        status: 'alpha',
      },
      {
        label: 'DatePicker',
        route: '/docs/components/date-picker',
        status: 'alpha',
      },
      {
        label: 'DataView',
        route: '/docs/components/data-view',
        status: 'alpha',
      },
      {
        label: 'Divider',
        route: '/docs/components/divider',
        status: 'alpha',
      },
      {
        label: 'Editor',
        route: '/docs/components/editor',
        status: 'alpha',
      },
      {
        label: 'Field',
        route: '/docs/components/field',
        status: 'alpha',
      },
      {
        label: 'FileUpload',
        route: '/docs/components/file-upload',
        status: 'alpha',
      },
      {
        label: 'Input',
        route: '/docs/components/input',
        status: 'alpha',
      },
      {
        label: 'InputMask',
        route: '/docs/components/input-mask',
        status: 'alpha',
      },
      {
        label: 'InputNumber',
        route: '/docs/components/input-number',
        status: 'alpha',
      },
      {
        label: 'InputOtp',
        route: '/docs/components/input-otp',
        status: 'alpha',
      },
      {
        label: 'LoadingOverlay',
        route: '/docs/components/loading-overlay',
        status: 'alpha',
      },
      {
        label: 'Menu',
        route: '/docs/components/menu',
        status: 'alpha',
      },
      {
        label: 'MeterGroup',
        route: '/docs/components/meter-group',
        status: 'alpha',
      },
      {
        label: 'MultiSelect',
        route: '/docs/components/multi-select',
        status: 'alpha',
      },
      {
        label: 'Paginator',
        route: '/docs/components/paginator',
        status: 'alpha',
      },
      {
        label: 'Password',
        route: '/docs/components/password',
        status: 'alpha',
      },
      {
        label: 'PanelMenu',
        route: '/docs/components/panel-menu',
        status: 'alpha',
      },
      {
        label: 'Popover',
        route: '/docs/components/popover',
        status: 'alpha',
      },
      {
        label: 'ProgressBar',
        route: '/docs/components/progress-bar',
        status: 'alpha',
      },
      {
        label: 'ProgressSpinner',
        route: '/docs/components/progress-spinner',
        status: 'alpha',
      },
      {
        label: 'Radio',
        route: '/docs/components/radio',
        status: 'alpha',
      },
      {
        label: 'Select',
        route: '/docs/components/select',
        status: 'alpha',
      },
      {
        label: 'Skeleton',
        route: '/docs/components/skeleton',
        status: 'alpha',
      },
      {
        label: 'Slider',
        route: '/docs/components/slider',
        status: 'alpha',
      },
      {
        label: 'Switch',
        route: '/docs/components/switch',
        status: 'alpha',
      },
      {
        label: 'Table',
        route: '/docs/components/table',
        status: 'alpha',
      },
      {
        label: 'Tabs',
        route: '/docs/components/tabs',
        status: 'alpha',
      },
      {
        label: 'Tag',
        route: '/docs/components/tag',
        status: 'alpha',
      },
      {
        label: 'Textarea',
        route: '/docs/components/textarea',
        status: 'alpha',
      },
      {
        label: 'Toast',
        route: '/docs/components/toast',
        status: 'alpha',
      },
      {
        label: 'Toolbar',
        route: '/docs/components/toolbar',
        status: 'alpha',
      },
      {
        label: 'Tree',
        route: '/docs/components/tree',
        status: 'alpha',
      },
      {
        label: 'TreeSelect',
        route: '/docs/components/tree-select',
        status: 'alpha',
      },
      {
        label: 'Tooltip',
        route: '/docs/components/tooltip',
        status: 'alpha',
      },
      {
        label: 'VirtualScroller',
        route: '/docs/components/virtual-scroller',
        status: 'alpha',
      },
    ],
  },
  {
    label: 'APIs',
    items: [
      {
        label: 'Message API',
        route: '/docs/apis/message',
        status: 'alpha',
      },
      {
        label: 'Color Mode',
        route: '/docs/apis/color-mode',
        status: 'alpha',
      },
    ],
  },
] as const;
