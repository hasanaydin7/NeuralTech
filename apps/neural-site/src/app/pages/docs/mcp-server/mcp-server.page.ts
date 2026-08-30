import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-mcp-server-page',
  imports: [SiteOnThisPage, CodeView],
  templateUrl: './mcp-server.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class McpServerPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly pageLinks = [
    ['Architecture', 'architecture'],
    ['Install and connect', 'install'],
    ['Component tools', 'component-tools'],
    ['Theme tools', 'theme-tools'],
    ['Resources', 'resources'],
    ['Agent workflow', 'workflow'],
    ['Results and errors', 'results'],
    ['Security boundary', 'security'],
    ['Versioning', 'versioning'],
    ['Troubleshooting', 'troubleshooting'],
  ] as const;

  readonly componentTools = [
    [
      'search_components',
      'query: string, limit?: 1..20',
      'Search selectors, entry points, summaries, README and llms.txt.',
    ],
    [
      'get_component_contract',
      'component: string',
      'Resolve by catalog ID, class, selector or public entry point.',
    ],
    [
      'recommend_components',
      'goal: string, limit?: 1..20',
      'Return deterministic matches for a described UI goal.',
    ],
  ] as const;

  readonly themeTools = [
    [
      'create_theme_recipe',
      'name, options_json?',
      'Create and validate a compact sparse recipe.',
    ],
    [
      'validate_theme_recipe',
      'recipe_json',
      'Validate schema, aliases and token ownership.',
    ],
    [
      'edit_theme_recipe',
      'recipe_json, patch_json',
      'Apply bounded dotted set/unset operations and revalidate.',
    ],
    [
      'diff_theme_recipes',
      'left_json, right_json',
      'Return changed recipe paths only.',
    ],
    [
      'get_component_theme_contract',
      'component, detail?',
      'Read supported property names or current defaults.',
    ],
    [
      'compile_theme_recipe',
      'recipe_json',
      'Return diagnostics, summary, sizes and integration instructions.',
    ],
  ] as const;

  readonly installCode = `npm install --save-dev @neural-ng/mcp-server@0.1.0-beta.5`;

  readonly configCode = `{
  "mcpServers": {
    "neural-ng": {
      "command": "npx",
      "args": ["--no-install", "neural-ng-mcp"]
    }
  }
}`;

  readonly trialCode = `npx -y @neural-ng/mcp-server@0.1.0-beta.5`;

  readonly searchCode = `{
  "query": "localized date range input",
  "limit": 5
}`;

  readonly contractCode = `{
  "component": "neural-date-picker"
}`;

  readonly recommendCode = `{
  "goal": "nullable inherited permission checkbox",
  "limit": 3
}`;

  readonly createThemeCode = JSON.stringify(
    {
      name: 'violet-workspace',
      options_json: JSON.stringify({
        preset: 'neutral',
        primary: '#7c3aed',
        radius: 'large',
      }),
    },
    null,
    2,
  );

  readonly editThemeCode = JSON.stringify(
    {
      recipe_json: JSON.stringify({
        schemaVersion: 1,
        name: 'violet-workspace',
        extends: 'neutral',
      }),
      patch_json: JSON.stringify({
        set: {
          'color.primary': '#7c3aed',
          'shape.radius': 'large',
        },
      }),
    },
    null,
    2,
  );

  readonly resourceCode = `neural://catalog
neural://package/exports
neural://components/button/contract
neural://components/button/readme
neural://components/button/llms

neural://themes/catalog
neural://themes/schema
neural://themes/presets
neural://themes/presets/neutral
neural://themes/ai-guide`;

  readonly workflowCode = `1. Call search_components with the user's intent.
2. Call get_component_contract for the selected result.
3. Read neural://components/{id}/llms for strict usage rules.
4. Import the exact entryPoint and use the returned selector/models.
5. Read the README only when examples or deeper behavior are required.
6. Never invent an input, output, class name or compatibility alias.`;

  readonly resultCode = `${JSON.stringify(
    {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ matches: ['...'] }, null, 2),
        },
      ],
    },
    null,
    2,
  )}

// Domain or validation failure:
${JSON.stringify(
  {
    isError: true,
    content: [{ type: 'text', text: 'Unknown NeuralNg component: ...' }],
  },
  null,
  2,
)}`;

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
