import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SiteThemeService } from '../../core/site-theme.service';
import { SiteHeader } from '../site-header/site-header';

@Component({
  selector: 'app-site-shell',
  imports: [RouterLink, RouterOutlet, SiteHeader],
  templateUrl: './site-shell.html',
  styleUrl: './site-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteShell {
  readonly siteTheme = inject(SiteThemeService);
}
