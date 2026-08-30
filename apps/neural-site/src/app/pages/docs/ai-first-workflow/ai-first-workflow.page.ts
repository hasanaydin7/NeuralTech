import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-ai-first-workflow-page',
  imports: [SiteOnThisPage, CodeView, RouterLink],
  templateUrl: './ai-first-workflow.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiFirstWorkflowPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly pageLinks = [
    ['The contract', 'contract'],
    ['Connect MCP', 'connect-mcp'],
    ['Agent loop', 'agent-loop'],
    ['Use llms.txt', 'llms-context'],
    ['Prompt recipe', 'prompt-recipe'],
    ['Generated result', 'generated-result'],
    ['Verification', 'verification'],
  ] as const;

  readonly installMcpCode = `npx -y @neural-ng/mcp-server`;
  readonly mcpConfigCode = `{
  "mcpServers": {
    "neural-ng": {
      "command": "npx",
      "args": ["-y", "@neural-ng/mcp-server"]
    }
  }
}`;
  readonly discoveryCode = `1. search_components({
  "query": "button with loading state and badge",
  "limit": 5
})

2. get_component_contract({
  "component": "neural-button"
})

3. Read neural://components/button/llms
4. Generate from the returned entry point, selector and models
5. Run the project's typecheck and tests`;
  readonly contextPathsCode = `@neural-ng/core/llms.txt
@neural-ng/core/button/llms.txt
@neural-ng/core/button/README.md
@neural-ng/mcp-server/llms.txt`;
  readonly promptCode = `Build a standalone Angular 22+ save action with NeuralNg.

Requirements:
- Discover the exact Button contract through the NeuralNg MCP server.
- Use only documented secondary entry points, selectors and inputs.
- Show a loading label while saving and block duplicate activation.
- Use the documented semantic output.
- Preserve SSR safety and native accessibility.
- Do not invent an NgModule, alias, input or output.
- After generating, run typecheck and the relevant tests.`;
  readonly generatedCode = `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';

@Component({
  selector: 'app-save-action',
  imports: [NeuralButton],
  template: \`
    <neural-button
      label="Save changes"
      icon="nt nt-check"
      [loading]="saving()"
      loadingLabel="Saving changes"
      (clicked)="save()"
    />
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveAction {
  readonly saving = signal(false);

  async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);

    try {
      await this.persist();
    } finally {
      this.saving.set(false);
    }
  }

  private async persist(): Promise<void> {
    // Call the application data layer.
  }
}`;

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
