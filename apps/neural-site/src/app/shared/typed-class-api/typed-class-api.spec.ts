import { resolveComponentApiRoute } from './typed-class-api';

describe('resolveComponentApiRoute', () => {
  it('resolves component API routes and ignores other documentation views', () => {
    expect(resolveComponentApiRoute('/docs/components/select/api')).toBe(
      'select',
    );
    expect(
      resolveComponentApiRoute('/docs/components/tree-select/api#class-slots'),
    ).toBe('tree-select');
    expect(resolveComponentApiRoute('/docs/components/select')).toBeNull();
    expect(resolveComponentApiRoute('/docs/theming/api')).toBeNull();
  });
});
