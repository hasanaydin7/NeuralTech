import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteAppearanceService } from '../../core/site-appearance.service';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink],
  templateUrl: './landing.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {
  readonly appearance = inject(SiteAppearanceService);

  readonly heroCode = `import { Component, signal } from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';

@Component({
  selector: 'agent-action',
  imports: [NeuralButton],
  template: \`
    <neural-button
      severity="primary"
      [loading]="running()"
      loadingLabel="Agent is working"
      (clicked)="run()"
    >
      <i class="nt nt-sparkles" aria-hidden="true"></i>
      Run agent
    </neural-button>
  \`,
})
export class AgentAction {
  readonly running = signal(false);

  run(): void {
    this.running.set(true);
  }
}`;

  readonly features = [
    {
      icon: 'nt nt-cpu',
      title: 'AI-native context',
      description:
        'README and llms.txt contracts give coding agents the exact imports, types and behavioral rules they need.',
    },
    {
      icon: 'nt nt-shield',
      title: 'Accessible by default',
      description:
        'Native semantics, robust keyboard models and ARIA behavior are part of the component core—not an optional layer.',
    },
    {
      icon: 'nt nt-components',
      title: 'Headless without compromise',
      description:
        'Keep the state machine and accessibility, then own every visual decision with Tailwind or typed class slots.',
    },
    {
      icon: 'nt nt-sparkles',
      title: 'Signals and standalone',
      description:
        'Angular 22+ APIs, granular entry points and strict typing keep application code direct, modern and tree-shakable.',
    },
    {
      icon: 'nt nt-world',
      title: 'SSR and hydration safe',
      description:
        'Browser work is isolated from server rendering so production Angular apps remain deterministic from first paint.',
    },
    {
      icon: 'nt nt-code',
      title: 'Release gates that matter',
      description:
        'Unit, package, accessibility, prerender and cross-browser checks protect the contract before it reaches npm.',
    },
  ] as const;
}
