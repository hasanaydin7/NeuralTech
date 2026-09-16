import { describe, expect, it } from 'vitest';
import { getIconCatalog, getIconCatalogSummary, searchIcons } from './icons.js';

describe('Neural MCP icon catalog', () => {
  it('exposes the complete generated Neural Icons inventory', () => {
    const catalog = getIconCatalog();
    const summary = getIconCatalogSummary();

    expect(catalog.schemaVersion).toBe(1);
    expect(catalog.totals).toEqual({
      icons: 6184,
      outline: 5130,
      filled: 1054,
    });
    expect(catalog.icons).toHaveLength(5130);
    expect(summary).not.toHaveProperty('icons');
    expect(summary.searchTool).toBe('search_icons');
  });

  it('maps product intent to exact usable icon classes and CSS imports', () => {
    const result = searchIcons('delete user', { limit: 10 });
    const trash = result.matches.find((match) => match.icon.name === 'trash');

    expect(result.schemaVersion).toBe(1);
    expect(trash?.icon.className).toBe('nt nt-trash');
    expect(trash?.icon.example).toContain('aria-hidden="true"');
    expect(trash?.icon.cssImports.outline).toContain('@neural-ng/icons/');
  });

  it('filters filled icons and returns the filled usage example', () => {
    const result = searchIcons('bell', { style: 'filled', limit: 5 });

    expect(result.matches.length).toBeGreaterThan(0);
    expect(
      result.matches.every((match) => match.icon.styles.includes('filled')),
    ).toBe(true);
    expect(result.matches[0]?.icon.example).toContain('nt-filled-');
  });

  it('excludes brand icons by default and allows an explicit opt-in', () => {
    expect(searchIcons('brand github').matches).toEqual([]);
    expect(
      searchIcons('brand github', { includeBrands: true }).matches.some(
        (match) => match.icon.category === 'brand',
      ),
    ).toBe(true);
  });

  it('validates style and category filters', () => {
    expect(() => searchIcons('user', { style: 'solid' as 'filled' })).toThrow(
      'style must be',
    );
    expect(() => searchIcons('user', { category: 'not-real' })).toThrow(
      'Unknown icon category',
    );
  });
});
