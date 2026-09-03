import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing.page').then(
        (module) => module.LandingPage,
      ),
    title: 'NeuralNg — Angular UI Library for AI Coding Agents',
  },
  {
    path: 'docs',
    loadComponent: () =>
      import('./pages/docs/docs-layout').then((module) => module.DocsLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'installation' },
      {
        path: 'installation',
        loadComponent: () =>
          import('./pages/docs/installation/installation.page').then(
            (module) => module.InstallationPage,
          ),
        title: 'Installation — NeuralNg',
      },
      {
        path: 'components',
        pathMatch: 'full',
        loadComponent: () =>
          import(
            './pages/docs/components-overview/components-overview.page'
          ).then((module) => module.ComponentsOverviewPage),
        title: 'Components — NeuralNg',
      },
      {
        path: 'icons',
        loadComponent: () =>
          import('./pages/docs/icons/icons.page').then(
            (module) => module.IconsPage,
          ),
        title: 'Neural Icons — NeuralNg',
      },
      {
        path: 'ai-first-workflow',
        loadComponent: () =>
          import('./pages/docs/ai-first-workflow/ai-first-workflow.page').then(
            (module) => module.AiFirstWorkflowPage,
          ),
        title: 'AI-First Workflow — NeuralNg',
      },
      {
        path: 'configuration',
        loadComponent: () =>
          import('./pages/docs/configuration/configuration.page').then(
            (module) => module.ConfigurationPage,
          ),
        title: 'Configuration — NeuralNg',
      },
      {
        path: 'theming',
        loadComponent: () =>
          import('./pages/docs/theming/theming.page').then(
            (module) => module.ThemingPage,
          ),
        title: 'Theming — NeuralNg',
      },
      {
        path: 'localization',
        loadComponent: () =>
          import('./pages/docs/localization/localization.page').then(
            (module) => module.LocalizationPage,
          ),
        title: 'Localization — NeuralNg',
      },
      {
        path: 'accessibility',
        loadComponent: () =>
          import('./pages/docs/accessibility/accessibility.page').then(
            (module) => module.AccessibilityPage,
          ),
        title: 'Accessibility — NeuralNg',
      },
      {
        path: 'ssr-hydration',
        loadComponent: () =>
          import('./pages/docs/ssr-hydration/ssr-hydration.page').then(
            (module) => module.SsrHydrationPage,
          ),
        title: 'SSR & Hydration — NeuralNg',
      },
      {
        path: 'forms-integration',
        loadComponent: () =>
          import('./pages/docs/forms-integration/forms-integration.page').then(
            (module) => module.FormsIntegrationPage,
          ),
        title: 'Forms Integration — NeuralNg',
      },
      {
        path: 'performance-bundling',
        loadComponent: () =>
          import(
            './pages/docs/performance-bundling/performance-bundling.page'
          ).then((module) => module.PerformanceBundlingPage),
        title: 'Performance & Bundling — NeuralNg',
      },
      {
        path: 'testing',
        loadComponent: () =>
          import('./pages/docs/testing/testing.page').then(
            (module) => module.TestingPage,
          ),
        title: 'Testing NeuralNg — NeuralNg',
      },
      {
        path: 'troubleshooting',
        loadComponent: () =>
          import('./pages/docs/troubleshooting/troubleshooting.page').then(
            (module) => module.TroubleshootingPage,
          ),
        title: 'Troubleshooting — NeuralNg',
      },
      {
        path: 'mcp-server',
        loadComponent: () =>
          import('./pages/docs/mcp-server/mcp-server.page').then(
            (module) => module.McpServerPage,
          ),
        title: 'MCP Server Reference — NeuralNg',
      },
      {
        path: 'versioning-compatibility',
        loadComponent: () =>
          import(
            './pages/docs/versioning-compatibility/versioning-compatibility.page'
          ).then((module) => module.VersioningCompatibilityPage),
        title: 'Versioning & Compatibility — NeuralNg',
      },
      {
        path: 'components/avatar',
        loadChildren: () =>
          import('./pages/docs/avatar/avatar.routes').then(
            (module) => module.AVATAR_ROUTES,
          ),
      },
      {
        path: 'components/breadcrumb',
        loadChildren: () =>
          import('./pages/docs/breadcrumb/breadcrumb.routes').then(
            (module) => module.BREADCRUMB_ROUTES,
          ),
      },
      {
        path: 'components/card',
        loadChildren: () =>
          import('./pages/docs/card/card.routes').then(
            (module) => module.CARD_ROUTES,
          ),
      },
      {
        path: 'components/data-view',
        loadChildren: () =>
          import('./pages/docs/data-view/data-view.routes').then(
            (module) => module.DATA_VIEW_ROUTES,
          ),
      },
      {
        path: 'components/tree',
        loadChildren: () =>
          import('./pages/docs/tree/tree.routes').then(
            (module) => module.TREE_ROUTES,
          ),
      },
      {
        path: 'components/tree-select',
        loadChildren: () =>
          import('./pages/docs/tree-select/tree-select.routes').then(
            (module) => module.TREE_SELECT_ROUTES,
          ),
      },
      {
        path: 'components/virtual-scroller',
        loadChildren: () =>
          import('./pages/docs/virtual-scroller/virtual-scroller.routes').then(
            (module) => module.VIRTUAL_SCROLLER_ROUTES,
          ),
      },
      {
        path: 'components/table',
        loadChildren: () =>
          import('./pages/docs/table/table.routes').then(
            (module) => module.TABLE_ROUTES,
          ),
      },
      {
        path: 'components/paginator',
        loadChildren: () =>
          import('./pages/docs/paginator/paginator.routes').then(
            (module) => module.PAGINATOR_ROUTES,
          ),
      },
      {
        path: 'components/date-picker',
        loadChildren: () =>
          import('./pages/docs/date-picker/date-picker.routes').then(
            (module) => module.DATE_PICKER_ROUTES,
          ),
      },
      {
        path: 'components/badge',
        loadChildren: () =>
          import('./pages/docs/badge/badge.routes').then(
            (module) => module.BADGE_ROUTES,
          ),
      },
      {
        path: 'components/tag',
        loadChildren: () =>
          import('./pages/docs/tag/tag.routes').then(
            (module) => module.TAG_ROUTES,
          ),
      },
      {
        path: 'components/toolbar',
        loadChildren: () =>
          import('./pages/docs/toolbar/toolbar.routes').then(
            (module) => module.TOOLBAR_ROUTES,
          ),
      },
      {
        path: 'components/accordion',
        loadChildren: () =>
          import('./pages/docs/accordion/accordion.routes').then(
            (module) => module.ACCORDION_ROUTES,
          ),
      },
      {
        path: 'components/tabs',
        loadChildren: () =>
          import('./pages/docs/tabs/tabs.routes').then(
            (module) => module.TABS_ROUTES,
          ),
      },
      {
        path: 'components/button',
        loadChildren: () =>
          import('./pages/docs/button/button.routes').then(
            (module) => module.BUTTON_ROUTES,
          ),
      },
      {
        path: 'components/auto-complete',
        loadChildren: () =>
          import('./pages/docs/auto-complete/auto-complete.routes').then(
            (module) => module.AUTO_COMPLETE_ROUTES,
          ),
      },
      {
        path: 'components/checkbox',
        loadChildren: () =>
          import('./pages/docs/checkbox/checkbox.routes').then(
            (module) => module.CHECKBOX_ROUTES,
          ),
      },
      {
        path: 'components/radio',
        loadChildren: () =>
          import('./pages/docs/radio/radio.routes').then(
            (module) => module.RADIO_ROUTES,
          ),
      },
      {
        path: 'components/slider',
        loadChildren: () =>
          import('./pages/docs/slider/slider.routes').then(
            (module) => module.SLIDER_ROUTES,
          ),
      },
      {
        path: 'components/switch',
        loadChildren: () =>
          import('./pages/docs/switch/switch.routes').then(
            (module) => module.SWITCH_ROUTES,
          ),
      },
      {
        path: 'components/dialog',
        loadChildren: () =>
          import('./pages/docs/dialog/dialog.routes').then(
            (module) => module.DIALOG_ROUTES,
          ),
      },
      {
        path: 'components/sidebar',
        loadChildren: () =>
          import('./pages/docs/sidebar/sidebar.routes').then(
            (module) => module.SIDEBAR_ROUTES,
          ),
      },
      {
        path: 'components/drawer',
        loadChildren: () =>
          import('./pages/docs/drawer/drawer.routes').then(
            (module) => module.DRAWER_ROUTES,
          ),
      },
      {
        path: 'components/divider',
        loadChildren: () =>
          import('./pages/docs/divider/divider.routes').then(
            (module) => module.DIVIDER_ROUTES,
          ),
      },
      {
        path: 'components/confirm-dialog',
        loadChildren: () =>
          import('./pages/docs/confirm-dialog/confirm-dialog.routes').then(
            (module) => module.CONFIRM_DIALOG_ROUTES,
          ),
      },
      {
        path: 'components/field',
        loadChildren: () =>
          import('./pages/docs/field/field.routes').then(
            (module) => module.FIELD_ROUTES,
          ),
      },
      {
        path: 'components/file-upload',
        loadChildren: () =>
          import('./pages/docs/file-upload/file-upload.routes').then(
            (module) => module.FILE_UPLOAD_ROUTES,
          ),
      },
      {
        path: 'components/input',
        loadChildren: () =>
          import('./pages/docs/input/input.routes').then(
            (module) => module.INPUT_ROUTES,
          ),
      },
      {
        path: 'components/input-mask',
        loadChildren: () =>
          import('./pages/docs/input-mask/input-mask.routes').then(
            (module) => module.INPUT_MASK_ROUTES,
          ),
      },
      {
        path: 'components/textarea',
        loadChildren: () =>
          import('./pages/docs/textarea/textarea.routes').then(
            (module) => module.TEXTAREA_ROUTES,
          ),
      },
      {
        path: 'components/password',
        loadChildren: () =>
          import('./pages/docs/password/password.routes').then(
            (module) => module.PASSWORD_ROUTES,
          ),
      },
      {
        path: 'components/input-number',
        loadChildren: () =>
          import('./pages/docs/input-number/input-number.routes').then(
            (module) => module.INPUT_NUMBER_ROUTES,
          ),
      },
      {
        path: 'components/input-otp',
        loadChildren: () =>
          import('./pages/docs/input-otp/input-otp.routes').then(
            (module) => module.INPUT_OTP_ROUTES,
          ),
      },
      {
        path: 'components/loading-overlay',
        loadChildren: () =>
          import('./pages/docs/loading-overlay/loading-overlay.routes').then(
            (module) => module.LOADING_OVERLAY_ROUTES,
          ),
      },
      {
        path: 'components/editor',
        loadChildren: () =>
          import('./pages/docs/editor/editor.routes').then(
            (module) => module.EDITOR_ROUTES,
          ),
      },
      {
        path: 'components/menu',
        loadChildren: () =>
          import('./pages/docs/menu/menu.routes').then(
            (module) => module.MENU_ROUTES,
          ),
      },
      {
        path: 'components/panel-menu',
        loadChildren: () =>
          import('./pages/docs/panel-menu/panel-menu.routes').then(
            (module) => module.PANEL_MENU_ROUTES,
          ),
      },
      {
        path: 'components/popover',
        loadChildren: () =>
          import('./pages/docs/popover/popover.routes').then(
            (module) => module.POPOVER_ROUTES,
          ),
      },
      {
        path: 'components/tooltip',
        loadChildren: () =>
          import('./pages/docs/tooltip/tooltip.routes').then(
            (module) => module.TOOLTIP_ROUTES,
          ),
      },
      {
        path: 'components/progress-bar',
        loadChildren: () =>
          import('./pages/docs/progress-bar/progress-bar.routes').then(
            (module) => module.PROGRESS_BAR_ROUTES,
          ),
      },
      {
        path: 'components/progress-spinner',
        loadChildren: () =>
          import('./pages/docs/progress-spinner/progress-spinner.routes').then(
            (module) => module.PROGRESS_SPINNER_ROUTES,
          ),
      },
      {
        path: 'components/skeleton',
        loadChildren: () =>
          import('./pages/docs/skeleton/skeleton.routes').then(
            (module) => module.SKELETON_ROUTES,
          ),
      },
      {
        path: 'components/meter-group',
        loadChildren: () =>
          import('./pages/docs/meter-group/meter-group.routes').then(
            (module) => module.METER_GROUP_ROUTES,
          ),
      },
      {
        path: 'components/message',
        loadChildren: () =>
          import('./pages/docs/message/message.routes').then(
            (module) => module.MESSAGE_ROUTES,
          ),
      },
      {
        path: 'components/toast',
        loadChildren: () =>
          import('./pages/docs/toast/toast.routes').then(
            (module) => module.TOAST_ROUTES,
          ),
      },
      {
        path: 'components/select',
        loadChildren: () =>
          import('./pages/docs/select/select.routes').then(
            (module) => module.SELECT_ROUTES,
          ),
      },
      {
        path: 'components/multi-select',
        loadChildren: () =>
          import('./pages/docs/multi-select/multi-select.routes').then(
            (module) => module.MULTI_SELECT_ROUTES,
          ),
      },
    ],
  },
  {
    path: '404',
    loadComponent: () =>
      import('./pages/not-found/not-found.page').then(
        (module) => module.NotFoundPage,
      ),
    title: 'Page not found — NeuralNg',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.page').then(
        (module) => module.NotFoundPage,
      ),
    title: 'Page not found — NeuralNg',
  },
];
