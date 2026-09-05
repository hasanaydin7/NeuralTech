export type NeuralCatalogKind = 'component' | 'directive';

export interface NeuralComponentInput {
  readonly name: string;
  readonly bindingName: string;
  readonly type: string;
  readonly required: boolean;
  readonly defaultValue?: string;
  readonly transform?: string;
  readonly description?: string;
}

export interface NeuralComponentModel {
  readonly name: string;
  readonly bindingName?: string;
  readonly type: string;
  readonly defaultValue?: string;
  readonly description?: string;
}

export interface NeuralComponentOutput {
  readonly name: string;
  readonly bindingName: string;
  readonly type: string;
  readonly description?: string;
}

export interface NeuralComponentTemplate {
  readonly name: string;
  readonly className: string;
  readonly selector: string;
  readonly contextType: string;
}

export interface NeuralComponentProvider {
  readonly name: string;
  readonly returnType: string;
  readonly description?: string;
}

export interface NeuralProviderRequirement {
  readonly name: string;
  readonly requirement: 'required' | 'optional' | 'supported';
  readonly evidence: string;
}

export interface NeuralComponentMethod {
  readonly name: string;
  readonly signature: string;
  readonly returnType: string;
  readonly description?: string;
}

export interface NeuralTypeAliasContract {
  readonly name: string;
  readonly type: string;
}

export interface NeuralComponentExample {
  readonly title: string;
  readonly language: string;
  readonly code: string;
}

export interface NeuralClassSlotContract {
  readonly name: string;
  readonly type: string;
  readonly description: string;
}

export interface NeuralClassesContract {
  readonly typeName: string;
  readonly sourcePath: string;
  readonly slots: readonly NeuralClassSlotContract[];
}

export interface NeuralComponentResources {
  readonly contract: string;
  readonly readme: string;
  readonly llms: string;
}

export interface NeuralComponentContract {
  readonly schemaVersion: 2;
  readonly id: string;
  readonly name: string;
  readonly className: string;
  readonly kind: NeuralCatalogKind;
  readonly selector: string;
  readonly entryPoint: string;
  readonly status: 'alpha' | 'beta';
  readonly summary: string;
  readonly formContract?: string;
  readonly inputs: readonly NeuralComponentInput[];
  readonly models: readonly NeuralComponentModel[];
  readonly outputs: readonly NeuralComponentOutput[];
  readonly templates: readonly NeuralComponentTemplate[];
  readonly providers: readonly NeuralComponentProvider[];
  readonly providerRequirements: readonly NeuralProviderRequirement[];
  readonly methods: readonly NeuralComponentMethod[];
  readonly typeAliases: readonly NeuralTypeAliasContract[];
  readonly examples: readonly NeuralComponentExample[];
  readonly classes: readonly NeuralClassesContract[];
  readonly relatedComponents: readonly string[];
  readonly resources: NeuralComponentResources;
}

export interface NeuralComponentDocument extends NeuralComponentContract {
  readonly sourceDirectory: string;
  readonly readme: string;
  readonly llms: string;
}

export interface NeuralPackageCatalog {
  readonly packageName: string;
  readonly version: string;
  readonly runtimeEntryPoints: readonly string[];
  readonly documentedExports: readonly string[];
}

export interface NeuralThemeCatalogEntry {
  readonly id: string;
  readonly exportPath: string;
  readonly stability: 'stable' | 'experimental' | 'bridge' | 'tooling';
}

export interface NeuralSearchMatch {
  readonly component: NeuralComponentContract;
  readonly score: number;
  readonly reason: string;
}

export type NeuralIconStyle = 'outline' | 'filled';

export interface NeuralIconCatalogEntry {
  readonly name: string;
  readonly category: string;
  readonly styles: readonly NeuralIconStyle[];
  readonly effects?: readonly string[];
  readonly core: boolean;
}

export interface NeuralIconCategory {
  readonly name: string;
  readonly outline: number;
  readonly filled: number;
}

export interface NeuralIconCatalog {
  readonly schemaVersion: 1;
  readonly packageName: '@neural-ng/icons';
  readonly packageVersion: string;
  readonly upstream: {
    readonly package: string;
    readonly version: string;
    readonly license: string;
  };
  readonly totals: {
    readonly icons: number;
    readonly outline: number;
    readonly filled: number;
  };
  readonly categories: readonly NeuralIconCategory[];
  readonly icons: readonly NeuralIconCatalogEntry[];
}

export interface NeuralIconContract extends NeuralIconCatalogEntry {
  readonly className: string;
  readonly filledClassName?: string;
  readonly cssImports: {
    readonly outline: string;
    readonly filled?: string;
  };
  readonly example: string;
  readonly accessibility: string;
}

export interface NeuralIconSearchMatch {
  readonly icon: NeuralIconContract;
  readonly score: number;
  readonly reason: string;
}

export interface NeuralIconSearchResult {
  readonly schemaVersion: 1;
  readonly query: string;
  readonly filters: {
    readonly style: NeuralIconStyle | 'any';
    readonly category?: string;
    readonly includeBrands: boolean;
  };
  readonly totalMatches: number;
  readonly truncated: boolean;
  readonly matches: readonly NeuralIconSearchMatch[];
}

export type NeuralCompositionKind = 'auto' | 'form' | 'page' | 'table';

export interface NeuralCompositionRequest {
  readonly goal: string;
  readonly kind?: NeuralCompositionKind;
}

export interface NeuralCompositionComponent {
  readonly id: string;
  readonly className: string;
  readonly selector: string;
  readonly entryPoint: string;
  readonly role: 'foundation' | 'feature' | 'support';
  readonly reason: string;
  readonly requiredInputs: readonly string[];
  readonly models: readonly string[];
  readonly outputs: readonly string[];
  readonly templates: readonly string[];
}

export interface NeuralCompositionSection {
  readonly id: string;
  readonly purpose: string;
  readonly components: readonly string[];
}

export interface NeuralCompositionPlan {
  readonly schemaVersion: 1;
  readonly kind: Exclude<NeuralCompositionKind, 'auto'>;
  readonly goal: string;
  readonly rationale: string;
  readonly components: readonly NeuralCompositionComponent[];
  readonly sections: readonly NeuralCompositionSection[];
  readonly imports: Readonly<Record<string, readonly string[]>>;
  readonly providers: readonly NeuralProviderRequirement[];
  readonly state: readonly string[];
  readonly accessibility: readonly string[];
  readonly implementationOrder: readonly string[];
  readonly exampleQueries: readonly string[];
}

export type NeuralUsageDiagnosticSeverity = 'error' | 'warning' | 'info';

export interface NeuralUsageDiagnostic {
  readonly code: string;
  readonly severity: NeuralUsageDiagnosticSeverity;
  readonly message: string;
  readonly line: number;
  readonly column: number;
  readonly component?: string;
  readonly suggestion?: string;
}

export interface NeuralUsageValidationRequest {
  readonly template: string;
  readonly imports?: readonly string[];
  readonly providers?: readonly string[];
}

export interface NeuralUsageValidationResult {
  readonly schemaVersion: 2;
  readonly valid: boolean;
  readonly syntax: {
    readonly parser: '@angular/compiler';
    readonly parserVersion: string;
    readonly valid: boolean;
    readonly errors: number;
  };
  readonly components: readonly string[];
  readonly componentUsages: readonly {
    readonly id: string;
    readonly occurrences: number;
  }[];
  readonly diagnostics: readonly NeuralUsageDiagnostic[];
  readonly suggestedImports: Readonly<Record<string, readonly string[]>>;
  readonly suggestedProviders: readonly NeuralProviderRequirement[];
  readonly summary: {
    readonly errors: number;
    readonly warnings: number;
    readonly infos: number;
  };
}

export interface NeuralProjectDiagnostic {
  readonly code: string;
  readonly severity: 'error' | 'warning' | 'info';
  readonly message: string;
  readonly file?: string;
  readonly line?: number;
  readonly column?: number;
  readonly suggestion?: string;
}

export interface NeuralProjectComponentUsage {
  readonly id: string;
  readonly className: string;
  readonly selector: string;
  readonly entryPoint: string;
  readonly occurrences: number;
  readonly files: readonly string[];
  readonly filesOmitted: number;
}

export interface NeuralProjectIconUsage {
  readonly name: string;
  readonly style: NeuralIconStyle;
  readonly className: string;
  readonly occurrences: number;
  readonly files: readonly string[];
  readonly filesOmitted: number;
}

export interface NeuralProjectTemplateInspection {
  readonly file: string;
  readonly kind: 'external' | 'inline';
  readonly owner?: string;
  readonly importsSource: 'component-metadata' | 'workspace-fallback';
  readonly components: readonly string[];
  readonly valid: boolean;
}

export interface NeuralProjectInspection {
  readonly schemaVersion: 2;
  readonly workspace: string;
  readonly workspaceConfig: {
    readonly kind: 'angular-cli' | 'nx' | 'angular-package' | 'unknown';
    readonly packageManager?: string;
  };
  readonly framework: {
    readonly angularVersion?: string;
    readonly neuralPackages: Readonly<Record<string, string>>;
    readonly versionSource: 'package.json';
  };
  readonly analysis: {
    readonly engine: '@angular/compiler';
    readonly confidence: 'complete' | 'partial';
    readonly limitations: readonly string[];
  };
  readonly files: {
    readonly scanned: number;
    readonly truncated: boolean;
    readonly totalBytes: number;
  };
  readonly summary: {
    readonly componentKinds: number;
    readonly componentOccurrences: number;
    readonly templateCount: number;
    readonly invalidTemplates: number;
    readonly iconKinds: number;
    readonly iconOccurrences: number;
    readonly diagnostics: {
      readonly errors: number;
      readonly warnings: number;
      readonly info: number;
    };
  };
  readonly components: readonly NeuralProjectComponentUsage[];
  readonly templates: readonly NeuralProjectTemplateInspection[];
  readonly icons: {
    readonly packageVersion?: string;
    readonly stylesheets: readonly string[];
    readonly usages: readonly NeuralProjectIconUsage[];
  };
  readonly imports: Readonly<Record<string, readonly string[]>>;
  readonly themes: readonly string[];
  readonly appearance: {
    readonly providerConfigured: boolean;
    readonly globalConfigConfigured: boolean;
    readonly unstyled: boolean;
  };
  readonly conventions: {
    readonly importStyle:
      | 'exact-entry-points'
      | 'root-barrel'
      | 'mixed'
      | 'unknown';
    readonly preferredTheme?: string;
  };
  readonly providers: readonly string[];
  readonly diagnostics: readonly NeuralProjectDiagnostic[];
}

export interface NeuralConsistentUiSuggestion {
  readonly schemaVersion: 2;
  readonly plan: NeuralCompositionPlan;
  readonly projectContext: {
    readonly workspace: string;
    readonly inspectionSchemaVersion: 2;
    readonly confidence: 'complete' | 'partial';
    readonly angularVersion?: string;
    readonly neuralPackages: Readonly<Record<string, string>>;
    readonly importStyle: NeuralProjectInspection['conventions']['importStyle'];
    readonly theme: {
      readonly mode: 'detected' | 'unstyled' | 'undetected';
      readonly name?: string;
    };
    readonly diagnostics: NeuralProjectInspection['summary']['diagnostics'];
  };
  readonly compatibility: {
    readonly catalogCoreVersion: string;
    readonly declaredCoreVersion?: string;
    readonly status: 'aligned' | 'review' | 'missing';
    readonly guidance: string;
  };
  readonly consistency: {
    readonly reusedComponents: readonly string[];
    readonly introducedComponents: readonly string[];
    readonly components: readonly {
      readonly id: string;
      readonly decision: 'reuse' | 'introduce';
      readonly occurrences: number;
      readonly evidence: readonly string[];
      readonly evidenceOmitted: number;
      readonly reason: string;
    }[];
    readonly imports: {
      readonly reuse: Readonly<Record<string, readonly string[]>>;
      readonly add: Readonly<Record<string, readonly string[]>>;
    };
    readonly providers: {
      readonly configured: readonly string[];
      readonly add: readonly string[];
    };
    readonly theme: {
      readonly decision: 'preserve' | 'preserve-unstyled' | 'adopt-neutral';
      readonly value: string;
      readonly reason: string;
    };
    readonly risks: readonly {
      readonly code: string;
      readonly severity: 'error' | 'warning';
      readonly message: string;
      readonly evidence?: string;
    }[];
    readonly guidance: readonly string[];
    readonly nextTools: readonly string[];
  };
}

export interface NeuralResourceDescriptor {
  readonly name: string;
  readonly title: string;
  readonly uri: string;
  readonly mimeType: 'application/json' | 'text/markdown' | 'text/plain';
  readonly description: string;
}

export interface NeuralResourceContents extends NeuralResourceDescriptor {
  readonly text: string;
}
