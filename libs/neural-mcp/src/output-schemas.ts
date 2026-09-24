import { z } from 'zod/v4';

// Additive fields are allowed, but every advertised field is validated.
// Changing required fields or their types requires a contract version change.
const s = z.string();
const b = z.boolean();
const n = z.number().int().nonnegative();
const strings = z.array(s);
const o = z.looseObject;
const stringMap = z.record(s, s);
const importMap = z.record(s, strings);
const severity = z.enum(['error', 'warning', 'info']);
const provider = o({
  name: s,
  requirement: z.enum(['required', 'optional', 'supported']),
  evidence: s,
});
const example = o({ title: s, language: s, code: s });
const input = o({
  name: s,
  bindingName: s,
  type: s,
  required: b,
  defaultValue: s.optional(),
  transform: s.optional(),
  description: s.optional(),
});
const model = o({
  name: s,
  bindingName: s.optional(),
  type: s,
  defaultValue: s.optional(),
  description: s.optional(),
});
const output = o({
  name: s,
  bindingName: s,
  type: s,
  description: s.optional(),
});
const template = o({ name: s, className: s, selector: s, contextType: s });
const componentProvider = o({
  name: s,
  returnType: s,
  description: s.optional(),
});
const method = o({
  name: s,
  signature: s,
  returnType: s,
  description: s.optional(),
});
const alias = o({ name: s, type: s });
const classes = o({
  typeName: s,
  sourcePath: s,
  slots: z.array(o({ name: s, type: s, description: s })),
});
const componentBase = {
  schemaVersion: z.literal(2),
  id: s,
  name: s,
  className: s,
  kind: z.enum(['component', 'directive']),
  selector: s,
  entryPoint: s,
  status: z.enum(['alpha', 'beta']),
  summary: s,
  formContract: s.optional(),
  relatedComponents: strings,
  resources: o({ contract: s, readme: s, llms: s }),
};
const componentFields = {
  inputs: z.array(input),
  models: z.array(model),
  outputs: z.array(output),
  templates: z.array(template),
  providers: z.array(componentProvider),
  providerRequirements: z.array(provider),
  methods: z.array(method),
  typeAliases: z.array(alias),
};
export const fullComponentSchema = o({
  ...componentBase,
  ...componentFields,
  examples: z.array(example),
  classes: z.array(classes),
});
const componentView = o({
  ...componentBase,
  ...Object.fromEntries(
    Object.entries(componentFields).map(([key, schema]) => [
      key,
      schema.optional(),
    ]),
  ),
  examples: z.array(example).optional(),
  classes: z.array(classes).optional(),
  classTypes: strings.optional(),
  exampleCount: n.optional(),
});
const match = o({
  component: fullComponentSchema,
  score: z.number(),
  reason: s,
});
const plan = o({
  schemaVersion: z.literal(1),
  kind: z.enum(['form', 'page', 'table']),
  goal: s,
  rationale: s,
  components: z.array(
    o({
      id: s,
      className: s,
      selector: s,
      entryPoint: s,
      role: z.enum(['foundation', 'feature', 'support']),
      reason: s,
      requiredInputs: strings,
      models: strings,
      outputs: strings,
      templates: strings,
    }),
  ),
  sections: z.array(o({ id: s, purpose: s, components: strings })),
  imports: importMap,
  providers: z.array(provider),
  state: strings,
  accessibility: strings,
  implementationOrder: strings,
  exampleQueries: strings,
});
const diagnostic = o({
  code: s,
  severity,
  message: s,
  line: n,
  column: n,
  component: s.optional(),
  suggestion: s.optional(),
});
const projectDiagnostic = o({
  code: s,
  severity,
  message: s,
  file: s.optional(),
  line: n.optional(),
  column: n.optional(),
  suggestion: s.optional(),
});
const validation = o({
  schemaVersion: z.literal(2),
  valid: b,
  syntax: o({
    parser: z.literal('@angular/compiler'),
    parserVersion: s,
    valid: b,
    errors: n,
  }),
  components: strings,
  componentUsages: z.array(o({ id: s, occurrences: n })),
  diagnostics: z.array(diagnostic),
  suggestedImports: importMap,
  suggestedProviders: z.array(provider),
  summary: o({ errors: n, warnings: n, infos: n }),
});
const coverage = z.enum(['complete', 'partial']);
const semantics = z.enum(['heuristic', 'insufficient']);
const confidence = {
  confidence: coverage.describe(
    'Deprecated: scan coverage only; never semantic correctness.',
  ),
  scanCoverage: coverage,
  semanticConfidence: semantics,
  compilationVerified: z.literal(false),
};
const diagnosticCounts = o({ errors: n, warnings: n, info: n });
const importStyle = z.enum([
  'exact-entry-points',
  'root-barrel',
  'mixed',
  'unknown',
]);
const inspection = o({
  schemaVersion: z.literal(2),
  workspace: s,
  workspaceConfig: o({
    kind: z.enum(['angular-cli', 'nx', 'angular-package', 'unknown']),
    packageManager: s.optional(),
  }),
  framework: o({
    angularVersion: s.optional(),
    neuralPackages: stringMap,
    versionSource: z.literal('package.json'),
    installedCoreVersion: s.optional(),
    installedAngularVersion: s.optional(),
  }),
  analysis: o({
    ...confidence,
    engine: z.literal('@angular/compiler'),
    templateStrategy: z.literal('angular-ast'),
    metadataStrategy: z.literal('static-heuristic'),
    limitations: strings,
  }),
  files: o({ scanned: n, truncated: b, totalBytes: n }),
  summary: o({
    componentKinds: n,
    componentOccurrences: n,
    templateCount: n,
    invalidTemplates: n,
    iconKinds: n,
    iconOccurrences: n,
    diagnostics: diagnosticCounts,
  }),
  components: z.array(
    o({
      id: s,
      className: s,
      selector: s,
      entryPoint: s,
      occurrences: n,
      files: strings,
      filesOmitted: n,
    }),
  ),
  templates: z.array(
    o({
      file: s,
      kind: z.enum(['external', 'inline']),
      owner: s.optional(),
      importsSource: z.enum(['component-metadata', 'workspace-fallback']),
      components: strings,
      valid: b,
    }),
  ),
  icons: o({
    packageVersion: s.optional(),
    stylesheets: strings,
    usages: z.array(
      o({
        name: s,
        style: z.enum(['outline', 'filled']),
        className: s,
        occurrences: n,
        files: strings,
        filesOmitted: n,
      }),
    ),
  }),
  imports: importMap,
  themes: strings,
  appearance: o({
    providerConfigured: b,
    globalConfigConfigured: b,
    unstyled: b,
  }),
  conventions: o({ importStyle, preferredTheme: s.optional() }),
  providers: strings,
  diagnostics: z.array(projectDiagnostic),
});
const suggestion = o({
  schemaVersion: z.literal(2),
  plan,
  projectContext: o({
    ...confidence,
    workspace: s,
    inspectionSchemaVersion: z.literal(2),
    angularVersion: s.optional(),
    neuralPackages: stringMap,
    importStyle,
    theme: o({
      mode: z.enum(['detected', 'unstyled', 'undetected']),
      name: s.optional(),
    }),
    diagnostics: diagnosticCounts,
  }),
  compatibility: o({
    catalogCoreVersion: s,
    declaredCoreVersion: s.optional(),
    installedCoreVersion: s.optional(),
    status: z.enum(['aligned', 'review', 'missing']),
    evidenceSource: z.enum(['installed', 'declared', 'missing']),
    contractUsability: z.enum([
      'verified-version',
      'review-required',
      'unavailable',
    ]),
    unverifiedAspects: strings,
    requiredActions: strings,
    guidance: s,
  }),
  consistency: o({
    reusedComponents: strings,
    introducedComponents: strings,
    components: z.array(
      o({
        id: s,
        decision: z.enum(['reuse', 'introduce']),
        occurrences: n,
        evidence: strings,
        evidenceOmitted: n,
        reason: s,
      }),
    ),
    imports: o({ reuse: importMap, add: importMap }),
    providers: o({ configured: strings, add: strings }),
    theme: o({
      decision: z.enum(['preserve', 'preserve-unstyled', 'adopt-neutral']),
      value: s,
      reason: s,
    }),
    risks: z.array(
      o({
        code: s,
        severity: z.enum(['error', 'warning']),
        message: s,
        evidence: s.optional(),
      }),
    ),
    guidance: strings,
    nextTools: strings,
  }),
});
const icon = o({
  name: s,
  category: s,
  styles: z.array(z.enum(['outline', 'filled'])),
  effects: strings.optional(),
  core: b,
  className: s,
  filledClassName: s.optional(),
  cssImports: o({ outline: s, filled: s.optional() }),
  example: s,
  accessibility: s,
});
const icons = o({
  schemaVersion: z.literal(1),
  query: s,
  filters: o({
    style: z.enum(['outline', 'filled', 'any']),
    category: s.optional(),
    includeBrands: b,
  }),
  totalMatches: n,
  truncated: b,
  matches: z.array(o({ icon, score: z.number(), reason: s })),
});
const themeDiagnostic = o({
  severity: z.enum(['error', 'warning']),
  code: s,
  path: s,
  message: s,
});
const themeValidation = o({ valid: b, diagnostics: z.array(themeDiagnostic) });
// Recipes and diffs deliberately contain sparse, arbitrary JSON values.
const json = z.json();
const recipe = o({
  name: s,
  schemaVersion: z.literal(1).optional(),
  extends: z.enum(['neutral', 'glass', 'mist', 'futuristic']).optional(),
}).catchall(json);
const themeSummary = o({
  name: s,
  extends: z.enum(['neutral', 'glass', 'mist', 'futuristic']),
  primary: s,
  surface: s,
  density: s,
  radius: s,
  elevation: s,
  motion: s,
  quality: o({
    status: z.enum(['release', 'preview']),
    minimumPrimarySurfaceContrast: z.number(),
    allowedDiagnosticCodes: strings,
  }),
  modes: strings,
  componentOverrides: strings,
  tokenOverrides: n,
  sourceHash: s,
});

export const toolOutputSchemas = {
  search_components: o({ matches: z.array(match) }),
  recommend_components: o({ matches: z.array(match) }),
  search_icons: o({ icons }),
  get_component: o({ component: componentView }),
  get_component_contract: o({ component: fullComponentSchema }),
  get_component_examples: o({
    component: o({ id: s, className: s, selector: s, entryPoint: s }),
    examples: z.array(example),
  }),
  plan_ui: o({ plan }),
  suggest_form_structure: o({ plan }),
  suggest_page_structure: o({ plan }),
  suggest_table_structure: o({ plan }),
  validate_usage: o({ validation }),
  inspect_project: o({ inspection }),
  inspect_neuralng_project: o({ inspection }),
  suggest_consistent_ui: o({ suggestion }),
  create_theme_recipe: o({ recipe, validation: themeValidation }),
  validate_theme_recipe: o({
    recipe: recipe.optional(),
    validation: themeValidation,
  }),
  edit_theme_recipe: o({
    recipe: recipe.optional(),
    recipeJson: s.optional(),
    validation: themeValidation,
  }),
  diff_theme_recipes: o({
    changes: z.array(
      o({ path: s, before: json.optional(), after: json.optional() }),
    ),
  }),
  get_component_theme_contract: o({
    component: s,
    tokenCount: n,
    properties: z.array(
      o({
        property: s,
        token: s,
        source: z.enum(['core', 'editor', 'shared']),
        modes: strings,
        defaults: stringMap.optional(),
      }),
    ),
  }),
  compile_theme_recipe: o({
    valid: b,
    diagnostics: z.array(themeDiagnostic),
    summary: themeSummary.optional(),
    artifacts: z.record(s, o({ bytes: n })).optional(),
    integration: o({ command: s, cssImport: s, htmlAttributes: s }).optional(),
  }),
} satisfies Record<string, z.ZodType>;

export type NeuralToolName = keyof typeof toolOutputSchemas;
export const toolErrorSchema = o({
  error: o({ schemaVersion: z.literal(1), message: s }),
});

export function getToolOutputSchema(name: string): z.ZodType {
  if (!Object.hasOwn(toolOutputSchemas, name))
    throw new Error(`Missing output contract: ${name}`);
  return toolOutputSchemas[name as NeuralToolName];
}
