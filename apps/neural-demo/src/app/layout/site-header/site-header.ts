import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { NeuralNgService, type NeuralDirection } from '@neural-ng/core';
import {
  RouterLink,
  RouterLinkActive,
  type IsActiveMatchOptions,
} from '@angular/router';
import {
  NeuralColorModeService,
  type NeuralColorMode,
} from '@neural-ng/core/color-mode';
import {
  PopoverCloseDirective,
  PopoverComponent,
  PopoverTriggerDirective,
} from '@neural-ng/core/popover';
import { NeuralSwitch } from '@neural-ng/core/switch';
import {
  SITE_SURFACE_PALETTES,
  SiteThemeService,
  type SitePrimaryPalette,
  type SiteSurfacePalette,
  type SiteTheme,
} from '../../core/site-theme.service';

interface PrimaryNavigationItem {
  readonly label: string;
  readonly route: string;
  readonly exact?: boolean;
}

interface PaletteOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly color: string;
}

@Component({
  selector: 'app-site-header',
  imports: [
    PopoverCloseDirective,
    PopoverComponent,
    PopoverTriggerDirective,
    RouterLink,
    RouterLinkActive,
    NeuralSwitch,
  ],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  readonly siteTheme = inject(SiteThemeService);
  readonly colorMode = inject(NeuralColorModeService);
  readonly neuralNg = inject(NeuralNgService);
  readonly mobileOpen = signal(false);
  readonly themes: readonly SiteTheme[] = [
    'neutral',
    'glass',
    'mist',
    'futuristic',
  ];
  readonly colorModes: readonly NeuralColorMode[] = ['light', 'dark', 'system'];
  readonly primaryPalettes: readonly PaletteOption<SitePrimaryPalette>[] = [
    { value: 'blue', label: 'Blue', color: '#3b82f6' },
    { value: 'emerald', label: 'Emerald', color: '#10b981' },
    { value: 'green', label: 'Green', color: '#22c55e' },
    { value: 'lime', label: 'Lime', color: '#84cc16' },
    { value: 'orange', label: 'Orange', color: '#f97316' },
    { value: 'amber', label: 'Amber', color: '#f59e0b' },
    { value: 'yellow', label: 'Yellow', color: '#eab308' },
    { value: 'cyan', label: 'Cyan', color: '#06b6d4' },
    { value: 'sky', label: 'Sky', color: '#0ea5e9' },
    { value: 'teal', label: 'Teal', color: '#4f747b' },
    { value: 'indigo', label: 'Indigo', color: '#6366f1' },
    { value: 'violet', label: 'Violet', color: '#8b5cf6' },
    { value: 'purple', label: 'Purple', color: '#a855f7' },
    { value: 'fuchsia', label: 'Fuchsia', color: '#d946ef' },
    { value: 'pink', label: 'Pink', color: '#ec4899' },
    { value: 'rose', label: 'Rose', color: '#f43f5e' },
  ];
  readonly surfacePalettes: readonly PaletteOption<SiteSurfacePalette>[] = [
    ...SITE_SURFACE_PALETTES.map(({ value, label, palette }) => ({
      value,
      label,
      color: palette[500],
    })),
  ];
  readonly navigation: readonly PrimaryNavigationItem[] = [
    { label: 'Home', route: '/', exact: true },
    { label: 'Get Started', route: '/docs/getting-started/installation' },
    { label: 'Components', route: '/docs/components/button' },
    { label: 'Playground', route: '/playground' },
  ];
  readonly exactMatch: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored',
  };
  readonly subsetMatch: IsActiveMatchOptions = {
    paths: 'subset',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored',
  };

  setTheme(theme: SiteTheme): void {
    this.siteTheme.applyPreset(theme);
  }

  setColorMode(mode: NeuralColorMode): void {
    this.colorMode.set(mode);
  }

  setPrimary(primary: SitePrimaryPalette): void {
    this.siteTheme.setPrimary(primary);
  }

  setSurface(surface: SiteSurfacePalette): void {
    this.siteTheme.setSurface(surface);
  }

  setDirection(direction: NeuralDirection): void {
    this.neuralNg.setDirection(direction);
  }

  setRtl(enabled: boolean): void {
    this.setDirection(enabled ? 'rtl' : 'ltr');
  }

  closeMobileNavigation(): void {
    this.mobileOpen.set(false);
  }
}
