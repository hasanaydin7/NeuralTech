import {
  getComponentContract,
  getComponentDocument,
  getPackageCatalog,
  listComponents,
  listThemes,
} from './catalog.js';
import { getIconCatalogSummary } from './icons.js';
import {
  BUILT_IN_THEME_RECIPES,
  formatJson,
  NEURAL_THEME_AI_GUIDE,
  NEURAL_THEME_SCHEMA_GUIDE,
} from './theme.js';
import type {
  NeuralResourceContents,
  NeuralResourceDescriptor,
} from './types.js';

const catalogUri = 'neural://catalog';
const capabilitiesUri = 'neural://server/capabilities';
const packageExportsUri = 'neural://package/exports';
const iconsUri = 'neural://icons/catalog';
const themesUri = 'neural://themes/catalog';
const themeSchemaUri = 'neural://themes/schema';
const themePresetsUri = 'neural://themes/presets';
const neutralThemePresetUri = 'neural://themes/presets/neutral';
const glassThemePresetUri = 'neural://themes/presets/glass';
const mistThemePresetUri = 'neural://themes/presets/mist';
const futuristicThemePresetUri = 'neural://themes/presets/futuristic';
const themeAiGuideUri = 'neural://themes/ai-guide';
const resourceDescriptors = buildResourceDescriptors();
const resourceDescriptorByUri = new Map(
  resourceDescriptors.map((descriptor) => [descriptor.uri, descriptor]),
);

export function listNeuralResources(): readonly NeuralResourceDescriptor[] {
  return resourceDescriptors;
}

export function readNeuralResource(
  uri: string,
): NeuralResourceContents | undefined {
  const descriptor = resourceDescriptorByUri.get(uri);
  if (!descriptor) return undefined;

  if (uri === catalogUri) {
    return withText(
      descriptor,
      JSON.stringify({ components: listComponents() }, null, 2),
    );
  }
  if (uri === capabilitiesUri) {
    return withText(
      descriptor,
      formatJson({
        schemaVersion: 1,
        server: 'neural-ng',
        purpose:
          'Angular UI expert interface for NeuralNg discovery, icon search, composition, correctness, project consistency, and theme workflows.',
        toolGroups: {
          discovery: [
            'search_components',
            'get_component',
            'get_component_examples',
            'recommend_components',
          ],
          icons: ['search_icons'],
          composition: [
            'plan_ui',
            'suggest_form_structure',
            'suggest_page_structure',
            'suggest_table_structure',
          ],
          correctness: ['validate_usage'],
          project: [
            'inspect_project',
            'inspect_neuralng_project',
            'suggest_consistent_ui',
          ],
          theme: [
            'get_component_theme_contract',
            'create_theme_recipe',
            'validate_theme_recipe',
            'edit_theme_recipe',
            'diff_theme_recipes',
            'compile_theme_recipe',
          ],
          compatibility: ['get_component_contract'],
        },
        resultSchemas: {
          componentContract: 2,
          iconCatalog: 1,
          iconSearch: 1,
          compositionPlan: 1,
          usageValidation: 2,
          projectInspection: 2,
          consistentUiSuggestion: 1,
        },
        projectInspectionLimits: {
          root: 'MCP process working directory only',
          pathArgumentAccepted: false,
          maxFiles: 400,
          maxBytesPerFile: 262144,
          maxTotalBytes: 5242880,
          followsSymbolicLinks: false,
        },
        guarantees: {
          deterministic: true,
          readOnly: true,
          networkAccess: false,
          writesProjectFiles: false,
          executesShellCommands: false,
        },
        deprecatedTools: {
          get_component_contract: {
            replacement: 'get_component',
            removalScheduled: false,
          },
          inspect_neuralng_project: {
            replacement: 'inspect_project',
            removalScheduled: false,
          },
        },
      }),
    );
  }
  if (uri === packageExportsUri) {
    return withText(descriptor, JSON.stringify(getPackageCatalog(), null, 2));
  }
  if (uri === iconsUri) {
    return withText(
      descriptor,
      JSON.stringify(getIconCatalogSummary(), null, 2),
    );
  }
  if (uri === themesUri) {
    return withText(
      descriptor,
      JSON.stringify({ themes: listThemes() }, null, 2),
    );
  }
  if (uri === themeSchemaUri) {
    return withText(descriptor, formatJson(NEURAL_THEME_SCHEMA_GUIDE));
  }
  if (uri === themePresetsUri) {
    return withText(
      descriptor,
      formatJson({
        presets: [
          {
            id: 'neutral',
            resource: neutralThemePresetUri,
            extends: 'neutral',
            stability: 'stable',
            quality: 'release',
          },
          {
            id: 'glass',
            resource: glassThemePresetUri,
            extends: 'glass',
            stability: 'experimental',
            quality: 'preview',
          },
          {
            id: 'mist',
            resource: mistThemePresetUri,
            extends: 'mist',
            stability: 'experimental',
            quality: 'preview',
          },
          {
            id: 'futuristic',
            resource: futuristicThemePresetUri,
            extends: 'futuristic',
            stability: 'experimental',
            quality: 'preview',
          },
        ],
      }),
    );
  }
  if (uri === neutralThemePresetUri) {
    return withText(descriptor, formatJson(BUILT_IN_THEME_RECIPES.neutral));
  }
  if (uri === glassThemePresetUri) {
    return withText(descriptor, formatJson(BUILT_IN_THEME_RECIPES.glass));
  }
  if (uri === mistThemePresetUri) {
    return withText(descriptor, formatJson(BUILT_IN_THEME_RECIPES.mist));
  }
  if (uri === futuristicThemePresetUri) {
    return withText(descriptor, formatJson(BUILT_IN_THEME_RECIPES.futuristic));
  }
  if (uri === themeAiGuideUri) {
    return withText(descriptor, formatJson(NEURAL_THEME_AI_GUIDE));
  }

  const match =
    /^neural:\/\/components\/([a-z0-9-]+)\/(contract|readme|llms)$/.exec(uri);
  if (!match) return undefined;

  const document = getComponentDocument(match[1]);
  if (!document) return undefined;

  switch (match[2]) {
    case 'contract': {
      const contract = getComponentContract(document.id);
      return contract
        ? withText(descriptor, JSON.stringify(contract, null, 2))
        : undefined;
    }
    case 'readme':
      return withText(descriptor, document.readme);
    case 'llms':
      return withText(descriptor, document.llms);
    default:
      return undefined;
  }
}

function buildResourceDescriptors(): readonly NeuralResourceDescriptor[] {
  const descriptors: NeuralResourceDescriptor[] = [
    {
      name: 'neural-catalog',
      title: 'NeuralNg component catalog',
      uri: catalogUri,
      mimeType: 'application/json',
      description:
        'Deterministic catalog of public NeuralNg components and directives.',
    },
    {
      name: 'neural-server-capabilities',
      title: 'NeuralNg MCP capabilities',
      uri: capabilitiesUri,
      mimeType: 'application/json',
      description:
        'Versioned tool groups, result schemas, safety guarantees, scan limits, and compatibility guidance for agents.',
    },
    {
      name: 'neural-package-exports',
      title: 'NeuralNg package exports',
      uri: packageExportsUri,
      mimeType: 'application/json',
      description:
        'Runtime secondary entry points and documented package exports.',
    },
    {
      name: 'neural-icon-catalog',
      title: 'Neural Icons catalog summary',
      uri: iconsUri,
      mimeType: 'application/json',
      description:
        'Versioned Neural Icons counts, categories, package metadata, and search policy. Use search_icons for bounded results.',
    },
    {
      name: 'neural-theme-catalog',
      title: 'NeuralNg theme catalog',
      uri: themesUri,
      mimeType: 'application/json',
      description:
        'Stable, experimental, bridge and compiler theme entry points.',
    },
    {
      name: 'neural-theme-ai-guide',
      title: 'NeuralNg AI theme workflow',
      uri: themeAiGuideUri,
      mimeType: 'application/json',
      description:
        'Low-token workflow for compact theme recipe authoring and validation.',
    },
    {
      name: 'neural-theme-presets',
      title: 'NeuralNg theme presets',
      uri: themePresetsUri,
      mimeType: 'application/json',
      description:
        'Available compact theme recipe presets and their resource URIs.',
    },
    {
      name: 'neural-theme-neutral-preset',
      title: 'NeuralNg Neutral theme recipe',
      uri: neutralThemePresetUri,
      mimeType: 'application/json',
      description:
        'Canonical compact recipe for the Neutral Core and Editor theme.',
    },
    {
      name: 'neural-theme-glass-preset',
      title: 'NeuralNg Glass theme recipe',
      uri: glassThemePresetUri,
      mimeType: 'application/json',
      description:
        'Compact recipe for the experimental Glass Core and Editor preset.',
    },
    {
      name: 'neural-theme-mist-preset',
      title: 'NeuralNg Mist theme recipe',
      uri: mistThemePresetUri,
      mimeType: 'application/json',
      description:
        'Compact recipe for the calm, blur-based Mist Core and Editor preset.',
    },
    {
      name: 'neural-theme-futuristic-preset',
      title: 'NeuralNg Futuristic theme recipe',
      uri: futuristicThemePresetUri,
      mimeType: 'application/json',
      description:
        'Compact recipe for the experimental Futuristic Core and Editor preset.',
    },
    {
      name: 'neural-theme-schema',
      title: 'NeuralNg compact theme schema',
      uri: themeSchemaUri,
      mimeType: 'application/json',
      description:
        'Token-efficient schema guide, defaults, enums and sparse patch format.',
    },
  ];

  for (const component of listComponents()) {
    descriptors.push(
      {
        name: `${component.id}-contract`,
        title: `${component.name} contract`,
        uri: component.resources.contract,
        mimeType: 'application/json',
        description: `Public selector, entry point, models, and form contract for ${component.name}.`,
      },
      {
        name: `${component.id}-readme`,
        title: `${component.name} README`,
        uri: component.resources.readme,
        mimeType: 'text/markdown',
        description: `Published README guidance for ${component.name}.`,
      },
      {
        name: `${component.id}-llms`,
        title: `${component.name} llms.txt`,
        uri: component.resources.llms,
        mimeType: 'text/plain',
        description: `Agent-focused usage rules for ${component.name}.`,
      },
    );
  }

  return descriptors.sort((left, right) =>
    left.uri.localeCompare(right.uri, 'en'),
  );
}

function withText(
  descriptor: NeuralResourceDescriptor,
  text: string,
): NeuralResourceContents {
  return { ...descriptor, text };
}
