import { SITE_SURFACE_PALETTES, SiteThemeService } from './site-theme.service';

describe('SiteThemeService', () => {
  it('exposes every Otaqo surface palette with a complete scale', () => {
    const expectedSteps = [
      '0',
      '50',
      '100',
      '200',
      '300',
      '400',
      '500',
      '600',
      '700',
      '800',
      '900',
      '950',
    ];

    expect(SITE_SURFACE_PALETTES).toHaveLength(20);
    expect(new Set(SITE_SURFACE_PALETTES.map(({ value }) => value)).size).toBe(
      20,
    );

    for (const { palette } of SITE_SURFACE_PALETTES) {
      expect(Object.keys(palette)).toEqual(expectedSteps);
    }
  });

  it('switches to the original Otaqo scale without deriving colors', () => {
    const service = new SiteThemeService();

    service.setSurface('ocean-ink');

    expect(service.surfaceColor()).toBe('#5b707a');
    expect(service.surfaceScale()).toEqual({
      0: '#ffffff',
      50: '#f3f7f9',
      100: '#e2edf1',
      200: '#c5dbe2',
      300: '#9bbfc9',
      400: '#6f9fb0',
      500: '#5b707a',
      600: '#3d6575',
      700: '#2f4e5c',
      800: '#203740',
      900: '#14252c',
      950: '#0a1317',
    });
  });
  it('applies the calm Mist defaults as one topbar preset action', () => {
    const service = new SiteThemeService();

    service.applyPreset('mist');

    expect(service.theme()).toBe('mist');
    expect(service.primary()).toBe('teal');
    expect(service.primaryColor()).toBe('#4f747b');
    expect(service.surface()).toBe('slate-soft');
  });
});
