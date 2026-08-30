import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  signal,
} from '@angular/core';
import {
  TabComponent,
  TabListComponent,
  TabPanelComponent,
  TabPanelsComponent,
  TabsComponent,
  type NeuralTabsClasses,
  type NeuralTabValue,
} from '@neural-ng/core/tabs';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-tabs-page',
  imports: [
    CodeExample,
    TabComponent,
    TabListComponent,
    TabPanelComponent,
    TabPanelsComponent,
    TabsComponent,
  ],
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsPage {
  readonly activeTab = signal<NeuralTabValue | null>('overview');
  readonly manualTab = signal<NeuralTabValue | null>('activity');
  readonly headlessTab = signal<NeuralTabValue | null>('markup');
  readonly headlessClasses: NeuralTabsClasses = {
    root: 'docs-headless-tabs',
    list: 'docs-headless-tabs__list',
    tab: 'docs-headless-tabs__tab',
    activeTab: 'docs-headless-tabs__tab--active',
    panels: 'docs-headless-tabs__panels',
    panel: 'docs-headless-tabs__panel',
  };
  readonly importCode = `import {
  TabsComponent,
  TabListComponent,
  TabComponent,
  TabPanelsComponent,
  TabPanelComponent,
} from '@neural-ng/core/tabs';`;
  readonly basicCode = `<neural-tabs tabsId="account-tabs" [(value)]="activeTab">
  <neural-tab-list ariaLabel="Account sections">
    <neural-tab value="overview" iconClass="nt-home">Overview</neural-tab>
    <neural-tab value="profile" iconClass="nt-user">Profile</neural-tab>
  </neural-tab-list>
  <neural-tab-panels>
    <neural-tab-panel value="overview">Overview content</neural-tab-panel>
    <neural-tab-panel value="profile">Profile content</neural-tab-panel>
  </neural-tab-panels>
</neural-tabs>`;
}
