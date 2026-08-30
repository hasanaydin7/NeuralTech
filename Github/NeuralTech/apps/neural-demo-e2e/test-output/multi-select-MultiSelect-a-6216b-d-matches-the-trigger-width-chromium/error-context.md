# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: multi-select.spec.ts >> MultiSelect alpha >> filters, selects, removes chips, and matches the trigger width
- Location: ..\..\Github\NeuralTech\apps\neural-demo-e2e\src\multi-select.spec.ts:10:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.neural-popover-root[data-open="true"]:visible').getByRole('searchbox')

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - link "Skip to content" [ref=e5] [cursor=pointer]:
    - /url: "#main-content"
  - banner [ref=e7]:
    - link "NEURALNG Angular UI for the AI era ALPHA" [ref=e8] [cursor=pointer]:
      - /url: /
      - img [ref=e10]
      - generic [ref=e16]:
        - generic [ref=e17]: NEURALNG
        - generic [ref=e18]:
          - generic [ref=e19]: Angular UI for the AI era
          - generic [ref=e20]: ALPHA
    - navigation "Primary navigation" [ref=e21]:
      - link "Home" [ref=e22] [cursor=pointer]:
        - /url: /
      - link "Get Started" [ref=e23] [cursor=pointer]:
        - /url: /docs/getting-started/installation
      - link "Components" [ref=e24] [cursor=pointer]:
        - /url: /docs/components/button
      - link "Playground" [ref=e25] [cursor=pointer]:
        - /url: /playground
    - button "Open theme configurator" [ref=e27] [cursor=pointer]
  - generic [ref=e31]:
    - complementary [ref=e32]:
      - navigation "Documentation" [ref=e33]:
        - generic [ref=e34]:
          - heading "Getting Started" [level=2] [ref=e35]
          - list [ref=e36]:
            - listitem [ref=e37]:
              - link "Installation Alpha" [ref=e38] [cursor=pointer]:
                - /url: /docs/getting-started/installation
                - generic [ref=e39]: Installation
                - generic [ref=e40]: Alpha
            - listitem [ref=e41]:
              - link "Configuration Alpha" [ref=e42] [cursor=pointer]:
                - /url: /docs/getting-started/configuration
                - generic [ref=e43]: Configuration
                - generic [ref=e44]: Alpha
            - listitem [ref=e45]:
              - link "Theming Alpha" [ref=e46] [cursor=pointer]:
                - /url: /docs/getting-started/theming
                - generic [ref=e47]: Theming
                - generic [ref=e48]: Alpha
            - listitem [ref=e49]:
              - link "Neural Icons Alpha" [ref=e50] [cursor=pointer]:
                - /url: /docs/getting-started/icons
                - generic [ref=e51]: Neural Icons
                - generic [ref=e52]: Alpha
        - generic [ref=e53]:
          - heading "Tools" [level=2] [ref=e54]
          - list [ref=e55]:
            - listitem [ref=e56]:
              - link "Theme Studio Alpha" [ref=e57] [cursor=pointer]:
                - /url: /docs/tools/theme-studio
                - generic [ref=e58]: Theme Studio
                - generic [ref=e59]: Alpha
        - generic [ref=e60]:
          - heading "Guides" [level=2] [ref=e61]
          - list [ref=e62]:
            - listitem [ref=e63]:
              - link "AI-first workflow Alpha" [ref=e64] [cursor=pointer]:
                - /url: /docs/guides/ai-first
                - generic [ref=e65]: AI-first workflow
                - generic [ref=e66]: Alpha
            - listitem [ref=e67]:
              - link "Localization Alpha" [ref=e68] [cursor=pointer]:
                - /url: /docs/guides/localization
                - generic [ref=e69]: Localization
                - generic [ref=e70]: Alpha
            - listitem [ref=e71]:
              - link "Headless mode Alpha" [ref=e72] [cursor=pointer]:
                - /url: /docs/guides/headless
                - generic [ref=e73]: Headless mode
                - generic [ref=e74]: Alpha
            - listitem [ref=e75]:
              - link "Accessibility Alpha" [ref=e76] [cursor=pointer]:
                - /url: /docs/guides/accessibility
                - generic [ref=e77]: Accessibility
                - generic [ref=e78]: Alpha
            - listitem [ref=e79]:
              - link "SSR and hydration Alpha" [ref=e80] [cursor=pointer]:
                - /url: /docs/guides/ssr-hydration
                - generic [ref=e81]: SSR and hydration
                - generic [ref=e82]: Alpha
        - generic [ref=e83]:
          - heading "Components" [level=2] [ref=e84]
          - list [ref=e85]:
            - listitem [ref=e86]:
              - link "Accordion Alpha" [ref=e87] [cursor=pointer]:
                - /url: /docs/components/accordion
                - generic [ref=e88]: Accordion
                - generic [ref=e89]: Alpha
            - listitem [ref=e90]:
              - link "AutoComplete Alpha" [ref=e91] [cursor=pointer]:
                - /url: /docs/components/auto-complete
                - generic [ref=e92]: AutoComplete
                - generic [ref=e93]: Alpha
            - listitem [ref=e94]:
              - link "Breadcrumb Alpha" [ref=e95] [cursor=pointer]:
                - /url: /docs/components/breadcrumb
                - generic [ref=e96]: Breadcrumb
                - generic [ref=e97]: Alpha
            - listitem [ref=e98]:
              - link "Avatar Alpha" [ref=e99] [cursor=pointer]:
                - /url: /docs/components/avatar
                - generic [ref=e100]: Avatar
                - generic [ref=e101]: Alpha
            - listitem [ref=e102]:
              - link "Badge Alpha" [ref=e103] [cursor=pointer]:
                - /url: /docs/components/badge
                - generic [ref=e104]: Badge
                - generic [ref=e105]: Alpha
            - listitem [ref=e106]:
              - link "Button Alpha" [ref=e107] [cursor=pointer]:
                - /url: /docs/components/button
                - generic [ref=e108]: Button
                - generic [ref=e109]: Alpha
            - listitem [ref=e110]:
              - link "Checkbox Alpha" [ref=e111] [cursor=pointer]:
                - /url: /docs/components/checkbox
                - generic [ref=e112]: Checkbox
                - generic [ref=e113]: Alpha
            - listitem [ref=e114]:
              - link "TriStateCheckbox Alpha" [ref=e115] [cursor=pointer]:
                - /url: /docs/components/tri-state-checkbox
                - generic [ref=e116]: TriStateCheckbox
                - generic [ref=e117]: Alpha
            - listitem [ref=e118]:
              - link "Card Alpha" [ref=e119] [cursor=pointer]:
                - /url: /docs/components/card
                - generic [ref=e120]: Card
                - generic [ref=e121]: Alpha
            - listitem [ref=e122]:
              - link "Dialog Alpha" [ref=e123] [cursor=pointer]:
                - /url: /docs/components/dialog
                - generic [ref=e124]: Dialog
                - generic [ref=e125]: Alpha
            - listitem [ref=e126]:
              - link "ConfirmDialog Alpha" [ref=e127] [cursor=pointer]:
                - /url: /docs/components/confirm-dialog
                - generic [ref=e128]: ConfirmDialog
                - generic [ref=e129]: Alpha
            - listitem [ref=e130]:
              - link "Drawer Alpha" [ref=e131] [cursor=pointer]:
                - /url: /docs/components/drawer
                - generic [ref=e132]: Drawer
                - generic [ref=e133]: Alpha
            - listitem [ref=e134]:
              - link "DatePicker Alpha" [ref=e135] [cursor=pointer]:
                - /url: /docs/components/date-picker
                - generic [ref=e136]: DatePicker
                - generic [ref=e137]: Alpha
            - listitem [ref=e138]:
              - link "DataView Alpha" [ref=e139] [cursor=pointer]:
                - /url: /docs/components/data-view
                - generic [ref=e140]: DataView
                - generic [ref=e141]: Alpha
            - listitem [ref=e142]:
              - link "Divider Alpha" [ref=e143] [cursor=pointer]:
                - /url: /docs/components/divider
                - generic [ref=e144]: Divider
                - generic [ref=e145]: Alpha
            - listitem [ref=e146]:
              - link "Editor Alpha" [ref=e147] [cursor=pointer]:
                - /url: /docs/components/editor
                - generic [ref=e148]: Editor
                - generic [ref=e149]: Alpha
            - listitem [ref=e150]:
              - link "Field Alpha" [ref=e151] [cursor=pointer]:
                - /url: /docs/components/field
                - generic [ref=e152]: Field
                - generic [ref=e153]: Alpha
            - listitem [ref=e154]:
              - link "FileUpload Alpha" [ref=e155] [cursor=pointer]:
                - /url: /docs/components/file-upload
                - generic [ref=e156]: FileUpload
                - generic [ref=e157]: Alpha
            - listitem [ref=e158]:
              - link "Input Alpha" [ref=e159] [cursor=pointer]:
                - /url: /docs/components/input
                - generic [ref=e160]: Input
                - generic [ref=e161]: Alpha
            - listitem [ref=e162]:
              - link "InputMask Alpha" [ref=e163] [cursor=pointer]:
                - /url: /docs/components/input-mask
                - generic [ref=e164]: InputMask
                - generic [ref=e165]: Alpha
            - listitem [ref=e166]:
              - link "InputNumber Alpha" [ref=e167] [cursor=pointer]:
                - /url: /docs/components/input-number
                - generic [ref=e168]: InputNumber
                - generic [ref=e169]: Alpha
            - listitem [ref=e170]:
              - link "InputOtp Alpha" [ref=e171] [cursor=pointer]:
                - /url: /docs/components/input-otp
                - generic [ref=e172]: InputOtp
                - generic [ref=e173]: Alpha
            - listitem [ref=e174]:
              - link "LoadingOverlay Alpha" [ref=e175] [cursor=pointer]:
                - /url: /docs/components/loading-overlay
                - generic [ref=e176]: LoadingOverlay
                - generic [ref=e177]: Alpha
            - listitem [ref=e178]:
              - link "Menu Alpha" [ref=e179] [cursor=pointer]:
                - /url: /docs/components/menu
                - generic [ref=e180]: Menu
                - generic [ref=e181]: Alpha
            - listitem [ref=e182]:
              - link "MeterGroup Alpha" [ref=e183] [cursor=pointer]:
                - /url: /docs/components/meter-group
                - generic [ref=e184]: MeterGroup
                - generic [ref=e185]: Alpha
            - listitem [ref=e186]:
              - link "MultiSelect Alpha" [ref=e187] [cursor=pointer]:
                - /url: /docs/components/multi-select
                - generic [ref=e188]: MultiSelect
                - generic [ref=e189]: Alpha
            - listitem [ref=e190]:
              - link "Paginator Alpha" [ref=e191] [cursor=pointer]:
                - /url: /docs/components/paginator
                - generic [ref=e192]: Paginator
                - generic [ref=e193]: Alpha
            - listitem [ref=e194]:
              - link "Password Alpha" [ref=e195] [cursor=pointer]:
                - /url: /docs/components/password
                - generic [ref=e196]: Password
                - generic [ref=e197]: Alpha
            - listitem [ref=e198]:
              - link "PanelMenu Alpha" [ref=e199] [cursor=pointer]:
                - /url: /docs/components/panel-menu
                - generic [ref=e200]: PanelMenu
                - generic [ref=e201]: Alpha
            - listitem [ref=e202]:
              - link "Popover Alpha" [ref=e203] [cursor=pointer]:
                - /url: /docs/components/popover
                - generic [ref=e204]: Popover
                - generic [ref=e205]: Alpha
            - listitem [ref=e206]:
              - link "ProgressBar Alpha" [ref=e207] [cursor=pointer]:
                - /url: /docs/components/progress-bar
                - generic [ref=e208]: ProgressBar
                - generic [ref=e209]: Alpha
            - listitem [ref=e210]:
              - link "ProgressSpinner Alpha" [ref=e211] [cursor=pointer]:
                - /url: /docs/components/progress-spinner
                - generic [ref=e212]: ProgressSpinner
                - generic [ref=e213]: Alpha
            - listitem [ref=e214]:
              - link "Radio Alpha" [ref=e215] [cursor=pointer]:
                - /url: /docs/components/radio
                - generic [ref=e216]: Radio
                - generic [ref=e217]: Alpha
            - listitem [ref=e218]:
              - link "Select Alpha" [ref=e219] [cursor=pointer]:
                - /url: /docs/components/select
                - generic [ref=e220]: Select
                - generic [ref=e221]: Alpha
            - listitem [ref=e222]:
              - link "Skeleton Alpha" [ref=e223] [cursor=pointer]:
                - /url: /docs/components/skeleton
                - generic [ref=e224]: Skeleton
                - generic [ref=e225]: Alpha
            - listitem [ref=e226]:
              - link "Slider Alpha" [ref=e227] [cursor=pointer]:
                - /url: /docs/components/slider
                - generic [ref=e228]: Slider
                - generic [ref=e229]: Alpha
            - listitem [ref=e230]:
              - link "Switch Alpha" [ref=e231] [cursor=pointer]:
                - /url: /docs/components/switch
                - generic [ref=e232]: Switch
                - generic [ref=e233]: Alpha
            - listitem [ref=e234]:
              - link "Table Alpha" [ref=e235] [cursor=pointer]:
                - /url: /docs/components/table
                - generic [ref=e236]: Table
                - generic [ref=e237]: Alpha
            - listitem [ref=e238]:
              - link "Tabs Alpha" [ref=e239] [cursor=pointer]:
                - /url: /docs/components/tabs
                - generic [ref=e240]: Tabs
                - generic [ref=e241]: Alpha
            - listitem [ref=e242]:
              - link "Tag Alpha" [ref=e243] [cursor=pointer]:
                - /url: /docs/components/tag
                - generic [ref=e244]: Tag
                - generic [ref=e245]: Alpha
            - listitem [ref=e246]:
              - link "Textarea Alpha" [ref=e247] [cursor=pointer]:
                - /url: /docs/components/textarea
                - generic [ref=e248]: Textarea
                - generic [ref=e249]: Alpha
            - listitem [ref=e250]:
              - link "Toast Alpha" [ref=e251] [cursor=pointer]:
                - /url: /docs/components/toast
                - generic [ref=e252]: Toast
                - generic [ref=e253]: Alpha
            - listitem [ref=e254]:
              - link "Toolbar Alpha" [ref=e255] [cursor=pointer]:
                - /url: /docs/components/toolbar
                - generic [ref=e256]: Toolbar
                - generic [ref=e257]: Alpha
            - listitem [ref=e258]:
              - link "Tree Alpha" [ref=e259] [cursor=pointer]:
                - /url: /docs/components/tree
                - generic [ref=e260]: Tree
                - generic [ref=e261]: Alpha
            - listitem [ref=e262]:
              - link "TreeSelect Alpha" [ref=e263] [cursor=pointer]:
                - /url: /docs/components/tree-select
                - generic [ref=e264]: TreeSelect
                - generic [ref=e265]: Alpha
            - listitem [ref=e266]:
              - link "Tooltip Alpha" [ref=e267] [cursor=pointer]:
                - /url: /docs/components/tooltip
                - generic [ref=e268]: Tooltip
                - generic [ref=e269]: Alpha
            - listitem [ref=e270]:
              - link "VirtualScroller Alpha" [ref=e271] [cursor=pointer]:
                - /url: /docs/components/virtual-scroller
                - generic [ref=e272]: VirtualScroller
                - generic [ref=e273]: Alpha
        - generic [ref=e274]:
          - heading "APIs" [level=2] [ref=e275]
          - list [ref=e276]:
            - listitem [ref=e277]:
              - link "Message API Alpha" [ref=e278] [cursor=pointer]:
                - /url: /docs/apis/message
                - generic [ref=e279]: Message API
                - generic [ref=e280]: Alpha
            - listitem [ref=e281]:
              - link "Color Mode Alpha" [ref=e282] [cursor=pointer]:
                - /url: /docs/apis/color-mode
                - generic [ref=e283]: Color Mode
                - generic [ref=e284]: Alpha
    - article [ref=e287]:
      - generic [ref=e288]:
        - generic [ref=e289]: Components · Sprint 2
        - heading "MultiSelect" [level=1] [ref=e290]
        - paragraph [ref=e291]: A Signal-first multiple listbox with chips, grouped filtering, selection limits, top-layer overlay, and a fully headless visual contract.
      - generic [ref=e292]:
        - heading "Import" [level=2] [ref=e293]
        - paragraph [ref=e294]: Import only the tree-shakable secondary entry point.
        - region "app.ts" [ref=e299]:
          - generic [ref=e300]:
            - generic [ref=e305]:
              - strong [ref=e306]: app.ts
              - generic [ref=e307]: TypeScript
            - button "Copy" [ref=e308] [cursor=pointer]
          - code [ref=e312]: "import { MultiSelectComponent, NeuralMultiSelectOptionTemplate, } from '@neural-ng/core/multi-select';"
      - generic [ref=e313]:
        - heading "Angular Forms adapters" [level=2] [ref=e314]
        - paragraph [ref=e315]: The immutable array model is shared by Signal Forms, Reactive Forms, and template-driven Forms. Readonly controls remain focusable and may open for inspection while option, chip, clear, and select-all mutations stay blocked.
        - generic [ref=e316]:
          - generic [ref=e317]:
            - strong [ref=e318]: Signal Forms
            - combobox "Signal form capabilities" [ref=e321] [cursor=pointer]:
              - generic [ref=e324]:
                - generic [ref=e325]: Angular
                - button "Remove Angular" [ref=e326]
              - button "Clear selection" [ref=e328]
            - status [ref=e332]: "Value: Angular"
          - generic [ref=e333]:
            - strong [ref=e334]: Reactive Forms
            - combobox "Reactive form capabilities" [ref=e337] [cursor=pointer]:
              - generic [ref=e340]:
                - generic [ref=e341]: React
                - button "Remove React" [ref=e342]
              - button "Clear selection" [ref=e344]
            - status [ref=e348]: "Value: React"
          - generic [ref=e349]:
            - strong [ref=e350]: Template-driven Forms
            - combobox "Template form capabilities" [ref=e353] [cursor=pointer]:
              - generic [ref=e356]:
                - generic [ref=e357]: Vue
                - button "Remove Vue" [ref=e358]
              - button "Clear selection" [ref=e360]
            - status [ref=e364]: "Value: Vue"
          - generic [ref=e365]:
            - strong [ref=e366]: Readonly
            - combobox "Readonly capabilities" [ref=e369] [cursor=pointer]:
              - generic [ref=e372]:
                - generic [ref=e373]: Angular
                - button "Remove Angular" [disabled] [ref=e374]
              - button "Clear selection" [disabled] [ref=e376]
            - status [ref=e380]: "Value: Angular"
        - region "forms.html" [ref=e385]:
          - generic [ref=e386]:
            - generic [ref=e391]:
              - strong [ref=e392]: forms.html
              - generic [ref=e393]: HTML
            - button "Copy" [ref=e394] [cursor=pointer]
          - code [ref=e398]:
            - text: <!-- Signal Forms -->
            - generic [ref=e399]:
              - generic [ref=e400]: <neural-multi-select
              - text: "[options]"
              - generic [ref=e401]: ="capabilities"
              - text: "[formField]"
              - generic [ref=e402]: ="signalForm.capabilities"
              - text: />
            - text: <!-- Reactive Forms -->
            - generic [ref=e403]:
              - generic [ref=e404]: <neural-multi-select
              - text: "[options]"
              - generic [ref=e405]: ="capabilities"
              - text: "[formControl]"
              - generic [ref=e406]: ="reactiveCapabilities"
              - text: />
            - text: <!-- Template-driven Forms -->
            - generic [ref=e407]:
              - generic [ref=e408]: <neural-multi-select
              - text: "[options]"
              - generic [ref=e409]: ="capabilities"
              - text: name
              - generic [ref=e410]: ="capabilities"
              - text: "[(ngModel)]"
              - generic [ref=e411]: ="templateCapabilities"
              - text: />
      - generic [ref=e412]:
        - heading "Virtual scrolling" [level=2] [ref=e413]
        - paragraph [ref=e414]: A fixed-size, overscanned window keeps 1,000 options responsive without rendering the full list. Filtering resets the window deterministically.
        - generic [ref=e417]:
          - generic [ref=e418]:
            - combobox "Virtual capabilities" [ref=e421] [cursor=pointer]:
              - generic [ref=e422]: Choose capabilities
            - generic [ref=e425]: 0 selected from 1,000 options
          - generic [ref=e426]:
            - button "Show code" [ref=e427] [cursor=pointer]
            - button "Copy" [ref=e429] [cursor=pointer]
      - generic [ref=e431]:
        - heading "Grouped chips" [level=2] [ref=e432]
        - paragraph [ref=e433]: Filter nested data, keep disabled options visible, remove individual chips, or select every visible option.
        - generic [ref=e436]:
          - generic [ref=e437]:
            - generic [ref=e438]:
              - generic [ref=e439]: Technology stack
              - generic [ref=e440]:
                - combobox "Technology stack" [expanded] [ref=e442] [cursor=pointer]:
                  - generic [ref=e444]:
                    - generic [ref=e445]:
                      - generic [ref=e446]: Angular
                      - button "Remove Angular" [ref=e447]
                    - generic [ref=e449]:
                      - generic [ref=e450]: Signals
                      - button "Remove Signals" [ref=e451]
                  - button "Clear selection" [ref=e453]
                - generic [ref=e459]:
                  - generic [ref=e460]:
                    - button "Select all" [ref=e461] [cursor=pointer]
                    - combobox "Search options" [expanded] [active] [ref=e465]
                  - listbox "Technology stack" [ref=e466]:
                    - text: Frameworks
                    - option "Angular Frameworks" [selected] [ref=e467] [cursor=pointer]:
                      - generic [ref=e473]:
                        - strong [ref=e474]: Angular
                        - generic [ref=e475]: Frameworks
                    - option "React Frameworks" [ref=e477] [cursor=pointer]:
                      - generic [ref=e482]:
                        - strong [ref=e483]: React
                        - generic [ref=e484]: Frameworks
                    - option "Vue Frameworks" [ref=e485] [cursor=pointer]:
                      - generic [ref=e490]:
                        - strong [ref=e491]: Vue
                        - generic [ref=e492]: Frameworks
                    - text: Architecture
                    - option "Signals Architecture" [selected] [ref=e493] [cursor=pointer]:
                      - generic [ref=e499]:
                        - strong [ref=e500]: Signals
                        - generic [ref=e501]: Architecture
                    - option "SSR & hydration Architecture" [ref=e503] [cursor=pointer]:
                      - generic [ref=e508]:
                        - strong [ref=e509]: SSR & hydration
                        - generic [ref=e510]: Architecture
                    - option "Legacy modules Architecture" [disabled] [ref=e511]:
                      - generic [ref=e516]:
                        - strong [ref=e517]: Legacy modules
                        - generic [ref=e518]: Architecture
              - generic [ref=e519]: 2 selected · filter request 0
            - status [ref=e520]: Choose the technologies in your stack.
          - generic [ref=e521]:
            - button "Show code" [ref=e522] [cursor=pointer]
            - button "Copy" [ref=e524] [cursor=pointer]
      - generic [ref=e526]:
        - heading "Compact summary and limits" [level=2] [ref=e527]
        - paragraph [ref=e528]: Comma mode collapses long selections while selectionLimit protects the domain rule.
        - generic [ref=e531]:
          - generic [ref=e532]:
            - combobox "Limited technologies" [ref=e535] [cursor=pointer]:
              - generic [ref=e536]: React, Vue
              - button "Clear selection" [ref=e537]
            - combobox "Loading technologies" [ref=e543] [cursor=pointer]:
              - generic [ref=e546]:
                - generic [ref=e547]: Angular
                - button "Remove Angular" [ref=e548]
              - button "Clear selection" [ref=e550]
            - generic [ref=e554]:
              - generic:
                - combobox "Disabled technologies" [disabled]:
                  - generic:
                    - generic:
                      - generic:
                        - generic: Angular
                        - button "Remove Angular" [disabled]
                  - button "Clear selection" [disabled]
          - generic [ref=e555]:
            - button "Show code" [ref=e556] [cursor=pointer]
            - button "Copy" [ref=e558] [cursor=pointer]
      - generic [ref=e560]:
        - heading "Unstyled and typed class slots" [level=2] [ref=e561]
        - paragraph [ref=e562]: NeuralNg owns listbox behavior and popup positioning; the consumer owns every visual decision.
        - generic [ref=e565]:
          - generic [ref=e567]:
            - generic [ref=e568]: Deployment capabilities
            - combobox "Headless capabilities" [ref=e571] [cursor=pointer]:
              - generic [ref=e574]:
                - generic [ref=e575]: Angular
                - button "Remove Angular" [ref=e576]
              - button "Clear selection" [ref=e578]
            - generic [ref=e582]: Consumer CSS · NeuralNg state, focus, ARIA and overlay
          - generic [ref=e583]:
            - button "Show code" [ref=e584] [cursor=pointer]
            - button "Copy" [ref=e586] [cursor=pointer]
  - contentinfo [ref=e588]:
    - generic [ref=e589]: NeuralNg · Angular 22+ · v0.1.0-alpha.0
    - link "Documentation" [ref=e590] [cursor=pointer]:
      - /url: /docs/getting-started/installation
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | import { waitForHydration } from './support/hydration';
  3   | 
  4   | test.describe('MultiSelect alpha', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await page.goto('/docs/components/multi-select');
  7   |     await waitForHydration(page);
  8   |   });
  9   | 
  10  |   test('filters, selects, removes chips, and matches the trigger width', async ({
  11  |     page,
  12  |   }) => {
  13  |     await expect(
  14  |       page.getByRole('link', { name: 'MultiSelect Alpha' }),
  15  |     ).toHaveAttribute('aria-current', 'page');
  16  |     const section = page
  17  |       .getByRole('heading', { name: 'Grouped chips' })
  18  |       .locator('..');
  19  |     const trigger = section.getByRole('combobox', { name: 'Technology stack' });
  20  |     await trigger.click();
  21  |     const panel = page.locator(
  22  |       '.neural-popover-root[data-open="true"]:visible',
  23  |     );
  24  |     await expect(panel).toBeVisible();
  25  |     const [triggerBox, panelBox] = await Promise.all([
  26  |       trigger.boundingBox(),
  27  |       panel.boundingBox(),
  28  |     ]);
  29  |     const triggerWidth = triggerBox?.width ?? 0;
  30  |     const panelWidth = panelBox?.width ?? 0;
  31  |     const crossBrowserWidthTolerance = Math.max(triggerWidth * 0.06, 1);
  32  |     expect(Math.abs(triggerWidth - panelWidth)).toBeLessThanOrEqual(
  33  |       crossBrowserWidthTolerance,
  34  |     );
> 35  |     await panel.getByRole('searchbox').fill('react');
      |                                        ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  36  |     await expect(panel.getByRole('option')).toHaveCount(1);
  37  |     await panel.getByRole('option').click();
  38  |     await expect(section.getByText('3 selected')).toBeVisible();
  39  |     await section.getByRole('button', { name: 'Remove React' }).click();
  40  |     await expect(section.getByText('2 selected')).toBeVisible();
  41  |   });
  42  | 
  43  |   test('keeps consumer visuals and structural semantics in unstyled mode', async ({
  44  |     page,
  45  |   }) => {
  46  |     const section = page
  47  |       .getByRole('heading', { name: 'Unstyled and typed class slots' })
  48  |       .locator('..');
  49  |     const root = section.locator('.neural-multi-select-root');
  50  |     await expect(root).not.toHaveClass(/neural-multi-select-base/);
  51  |     const trigger = section.getByRole('combobox', {
  52  |       name: 'Headless capabilities',
  53  |     });
  54  |     await expect(trigger).toHaveCSS(
  55  |       'background-color',
  56  |       'rgba(15, 23, 42, 0.92)',
  57  |     );
  58  |     await trigger.click();
  59  |     await expect(
  60  |       page.locator('.docs-multi-select-headless__panel:visible'),
  61  |     ).toHaveCSS('background-color', 'rgba(7, 17, 31, 0.98)');
  62  |   });
  63  | 
  64  |   test('windows 1,000 options and preserves absolute listbox metadata', async ({
  65  |     page,
  66  |   }) => {
  67  |     const section = page
  68  |       .getByRole('heading', { name: 'Virtual scrolling' })
  69  |       .locator('..');
  70  |     await section
  71  |       .getByRole('combobox', { name: 'Virtual capabilities' })
  72  |       .click();
  73  |     const panel = page.locator(
  74  |       '.neural-popover-root[data-open="true"]:visible',
  75  |     );
  76  |     const listbox = panel.getByRole('listbox');
  77  |     const options = listbox.getByRole('option');
  78  |     await expect(options.first()).toContainText('Capability 0001');
  79  |     expect(await options.count()).toBeLessThan(20);
  80  |     await expect(options.first()).toHaveAttribute('aria-setsize', '1000');
  81  | 
  82  |     await listbox.evaluate((element) => {
  83  |       element.scrollTop = element.scrollHeight;
  84  |       element.dispatchEvent(new Event('scroll'));
  85  |     });
  86  |     await expect(listbox.getByText('Capability 1000')).toBeVisible();
  87  |   });
  88  | 
  89  |   test('binds every Forms adapter and blocks readonly mutations', async ({
  90  |     page,
  91  |   }) => {
  92  |     const forms = page.locator('#forms');
  93  | 
  94  |     const signalExample = forms.locator('.multi-select-forms-example').filter({
  95  |       hasText: 'Signal Forms',
  96  |     });
  97  |     const signal = signalExample.getByRole('combobox', {
  98  |       name: 'Signal form capabilities',
  99  |     });
  100 |     await signal.click();
  101 |     await page
  102 |       .locator('.neural-popover-root[data-open="true"]:visible')
  103 |       .getByRole('option', { name: 'React', exact: true })
  104 |       .click();
  105 |     await expect(
  106 |       signalExample.getByText('Value: Angular, React'),
  107 |     ).toBeVisible();
  108 |     await signal.press('Escape');
  109 | 
  110 |     const reactiveExample = forms
  111 |       .locator('.multi-select-forms-example')
  112 |       .filter({ hasText: 'Reactive Forms' });
  113 |     const reactive = reactiveExample.getByRole('combobox', {
  114 |       name: 'Reactive form capabilities',
  115 |     });
  116 |     await reactive.click();
  117 |     await page
  118 |       .locator('.neural-popover-root[data-open="true"]:visible')
  119 |       .getByRole('option', { name: 'Vue', exact: true })
  120 |       .click();
  121 |     await expect(reactiveExample.getByText('Value: React, Vue')).toBeVisible();
  122 |     await reactive.press('Escape');
  123 | 
  124 |     const templateExample = forms
  125 |       .locator('.multi-select-forms-example')
  126 |       .filter({ hasText: 'Template-driven Forms' });
  127 |     const template = templateExample.getByRole('combobox', {
  128 |       name: 'Template form capabilities',
  129 |     });
  130 |     await template.click();
  131 |     await page
  132 |       .locator('.neural-popover-root[data-open="true"]:visible')
  133 |       .getByRole('option', { name: 'Angular', exact: true })
  134 |       .click();
  135 |     await expect(
```