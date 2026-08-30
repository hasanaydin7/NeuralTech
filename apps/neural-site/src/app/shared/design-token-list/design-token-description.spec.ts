import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { describeDesignToken } from './design-token-description';

describe('describeDesignToken', () => {
  it('describes component surfaces and dimensions', () => {
    expect(describeDesignToken('--neural-multi-select-background')).toBe(
      'Trigger background surface.',
    );
    expect(describeDesignToken('--neural-multi-select-width')).toBe(
      'Trigger inline size.',
    );
  });
  it('preserves slot, state, severity, and motion meaning', () => {
    expect(
      describeDesignToken('--neural-accordion-panel-background-expanded'),
    ).toBe('Expanded panel background surface.');
    expect(describeDesignToken('--neural-badge-error-border-color')).toBe(
      'Error severity border color.',
    );
    expect(describeDesignToken('--neural-dialog-enter-duration')).toBe(
      'Component enter animation duration.',
    );
  });
  it('uses audited overrides for tokens with non-generic behavior', () => {
    expect(describeDesignToken('--neural-field-required-content')).toContain(
      'marker appended to labels',
    );
  });

  it('gives every component token documented by the landing a specific description', () => {
    const tokens = documentedComponentTokens();
    const genericDescriptions = tokens.filter((token) =>
      describeDesignToken(token).endsWith(' visual token.'),
    );

    expect(genericDescriptions).toEqual([]);
  });

  it('only documents component tokens present in the shipped source contract', () => {
    const sourceRoots = [
      'libs/neural-ng',
      'libs/neural-editor',
      'libs/neural-theme',
    ].map((path) => resolve(process.cwd(), path));
    const contractSource = sourceRoots
      .flatMap((root) =>
        collectFiles(root, new Set(['.css', '.html', '.scss', '.ts'])),
      )
      .filter(
        (path) =>
          !path.endsWith('.spec.ts') &&
          !path.includes(`${join('scripts', '')}`),
      )
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n');
    const missingTokens = documentedComponentTokens().filter(
      (token) => !contractSource.includes(token),
    );

    expect(missingTokens).toEqual([]);
  });
});

function documentedComponentTokens(): string[] {
  const docsRoot = resolve(
    process.cwd(),
    'apps/neural-site/src/app/pages/docs',
  );
  const source = collectFiles(docsRoot, new Set(['.html', '.ts']))
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
  return [...new Set(source.match(/--neural-[a-z0-9-]+/g) ?? [])].filter(
    (token) => !token.startsWith('--neural-color-'),
  );
}

function collectFiles(
  directory: string,
  extensions: ReadonlySet<string>,
): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(path, extensions);
    return extensions.has(extname(entry.name)) ? [path] : [];
  });
}
