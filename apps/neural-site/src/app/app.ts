import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import {
  PopoverComponent,
  PopoverTriggerDirective,
} from '@neural-ng/core/popover';
import { NeuralSwitch } from '@neural-ng/core/switch';
import { SiteAppearanceService } from './core/site-appearance.service';
import {
  SITE_PRIMARY_PALETTES,
  SITE_SURFACE_PALETTES,
  type SitePrimaryPalette,
  type SiteSurfacePalette,
} from './core/site-palettes';
import { SiteSeoService } from './core/site-seo.service';

@Component({
  imports: [
    PopoverComponent,
    PopoverTriggerDirective,
    RouterLink,
    RouterOutlet,
    NeuralSwitch,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly appearance = inject(SiteAppearanceService);
  readonly seo = inject(SiteSeoService);
  readonly mobileOpen = signal(false);
  readonly primaryPalettes = SITE_PRIMARY_PALETTES;
  readonly surfacePalettes = SITE_SURFACE_PALETTES;

  setPrimary(primary: SitePrimaryPalette): void {
    this.appearance.setPrimary(primary);
  }

  setSurface(surface: SiteSurfacePalette): void {
    this.appearance.setSurface(surface);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }
}
