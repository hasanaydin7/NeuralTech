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
