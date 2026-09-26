import {
  parseTemplate,
  TmplAstElement,
  TmplAstRecursiveVisitor,
  tmplAstVisitAll,
} from '@angular/compiler';
import type { NeuralProjectDiagnostic } from './types.js';

interface Source {
  readonly path: string;
  readonly content: string;
}
interface Template {
  readonly content: string;
}

/** Conservative hints, not a cascade evaluator. Only flat CSS and static selectors. */
export function inspectStyleRisks(
  sources: readonly Source[],
  templates: readonly Template[],
): NeuralProjectDiagnostic[] {
  const hiddenElements: TmplAstElement[] = [];
  let hiddenTruncated = false;
  class HiddenVisitor extends TmplAstRecursiveVisitor {
    override visitElement(node: TmplAstElement) {
      if (
        node.attributes.some((attr) => attr.name === 'hidden') ||
        node.inputs.some((input) => input.name === 'hidden')
      ) {
        if (hiddenElements.length < 1000) hiddenElements.push(node);
        else hiddenTruncated = true;
      }
      super.visitElement(node);
    }
  }
  for (const template of templates)
    tmplAstVisitAll(
      new HiddenVisitor(),
      parseTemplate(template.content, 'template').nodes,
    );
  const result: NeuralProjectDiagnostic[] = [];
  if (hiddenTruncated)
    result.push({
      code: 'NNP013',
      severity: 'info',
      message: 'CSS hints cover only the first 1000 hidden elements.',
      suggestion:
        'Inspect remaining elements in browser tools; this is not a complete CSS audit.',
    });
  let rules = 0;
  for (const source of sources) {
    // Inline component styles, Sass nesting, imports and generated CSS are not evaluated.
    if (!source.path.endsWith('.css')) continue;
    const css = source.content.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
      comment.replace(/[^\n]/g, ' '),
    );
    for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (++rules > 2000 || result.length >= 100) {
        result.push({
          code: 'NNP013',
          severity: 'info',
          message: 'CSS hint scan reached its rule or warning limit.',
          suggestion:
            'Inspect remaining styles in browser tools; these bounded hints are not a complete CSS audit.',
        });
        return result;
      }
      const selector = rule[1].trim();
      const declarations = rule[2];
      const line = css.slice(0, rule.index).split('\n').length;
      const display = [
        ...declarations.matchAll(/(?:^|;)\s*display\s*:\s*([^;]+)/gi),
      ]
        .at(-1)?.[1]
        .trim();
      if (
        display &&
        /^(?:grid|flex|block|inline(?:-block|-flex|-grid)?|table)(?:\s*!important)?$/i.test(
          display,
        ) &&
        selector
          .split(',')
          .some((part) =>
            hiddenElements.some((element) =>
              matchesStaticSelector(part.trim(), element),
            ),
          )
      ) {
        result.push({
          code: 'NNP011',
          severity: 'warning',
          file: source.path,
          line,
          message: `Possible hidden/display conflict: ${selector} sets display: ${display} and matches an element with hidden.`,
          suggestion:
            'Author display rules can override the browser hidden style. Verify the cascade; use conditional rendering or an explicit hidden display:none rule with sufficient priority. This is a heuristic, not a computed-style verdict.',
        });
      }
      if (
        /:root/.test(selector) &&
        /(?:^|;)\s*--(?:n|neural)-[\w-]+\s*:[^;]*!important/i.test(declarations)
      ) {
        result.push({
          code: 'NNP012',
          severity: 'warning',
          file: source.path,
          line,
          message:
            'Root NeuralNg tokens use !important and may prevent Appearance overrides.',
          suggestion:
            'Check token ownership and computed styles during primary/surface and color-mode changes. Prefer recipe/provider configuration; selector specificity alone does not prove a conflict.',
        });
      }
    }
  }
  return result;
}

function matchesStaticSelector(
  selector: string,
  element: TmplAstElement,
): boolean {
  // Deliberately skip combinators, pseudo-classes and dynamic class bindings.
  if (
    !/^(?:[a-z][\w-]*)?(?:[.#][\w-]+)*(?:\[hidden\])?$/i.test(selector) ||
    !selector
  )
    return false;
  const tag = selector.match(/^[a-z][\w-]*/i)?.[0];
  if (tag && tag.toLowerCase() !== element.name.toLowerCase()) return false;
  const classes = (
    element.attributes.find((attr) => attr.name === 'class')?.value ?? ''
  ).split(/\s+/);
  const id = element.attributes.find((attr) => attr.name === 'id')?.value;
  return [...selector.matchAll(/([.#])([\w-]+)/g)].every((match) =>
    match[1] === '.' ? classes.includes(match[2]) : id === match[2],
  );
}
