export type NeuralCatalogKind = 'component' | 'directive';

export interface NeuralComponentModel {
  readonly name: string;
  readonly type: string;
}

export interface NeuralComponentResources {
  readonly contract: string;
  readonly readme: string;
  readonly llms: string;
}

export interface NeuralComponentContract {
  readonly id: string;
  readonly name: string;
  readonly className: string;
  readonly kind: NeuralCatalogKind;
  readonly selector: string;
  readonly entryPoint: string;
  readonly status: 'alpha' | 'beta';
  readonly summary: string;
  readonly formContract?: string;
  readonly models: readonly NeuralComponentModel[];
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
