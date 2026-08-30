import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { NeuralButton } from '@neural-ng/core/button';
import { filter } from 'rxjs';

@Component({
  selector: 'app-docs-layout',
  imports: [NeuralButton, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './docs-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsLayout {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  readonly sidebarOpen = signal(false);

  constructor() {
    const subscription = this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe(() => this.sidebarOpen.set(false));
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
