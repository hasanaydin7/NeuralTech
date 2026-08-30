import { Injectable, inject } from '@angular/core';
import {
  NeuralAppearanceService,
  type NeuralPrimaryPalette,
  type NeuralSurfacePalette,
} from '@neural-ng/core/appearance';
import type { NeuralDirection } from '@neural-ng/core';
import type { NeuralResolvedColorMode } from '@neural-ng/core/color-mode';

export type SiteMode = NeuralResolvedColorMode;

@Injectable({ providedIn: 'root' })
export class SiteAppearanceService {
  private readonly appearance = inject(NeuralAppearanceService);
  readonly mode = this.appearance.resolvedMode;
  readonly primary = this.appearance.primary;
  readonly surface = this.appearance.surface;
  readonly direction = this.appearance.resolvedDirection;

  toggle(): void {
    this.appearance.toggleMode();
  }

  setMode(mode: SiteMode): void {
    this.appearance.setMode(mode);
  }

  setPrimary(primary: NeuralPrimaryPalette): void {
    this.appearance.setPrimary(primary);
  }

  setSurface(surface: NeuralSurfacePalette): void {
    this.appearance.setSurface(surface);
  }

  setDirection(direction: Exclude<NeuralDirection, 'auto'>): void {
    this.appearance.setDirection(direction);
  }

  setRtl(enabled: boolean): void {
    this.appearance.setRtl(enabled);
  }
}
