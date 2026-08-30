import { TestBed } from '@angular/core/testing';
import { PlaygroundPage } from './playground.page';
import {
  NeuralMessageService,
  provideNeuralMessages,
} from '@neural-ng/core/message';
import {
  NeuralColorModeService,
  provideNeuralColorMode,
} from '@neural-ng/core/color-mode';

describe('PlaygroundPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaygroundPage],
      providers: [
        provideNeuralColorMode({ defaultMode: 'light', storageKey: null }),
        provideNeuralMessages({ defaultDuration: null }),
      ],
    }).compileComponents();
  });

  it('switches color mode from the demo controls', async () => {
    const fixture = TestBed.createComponent(PlaygroundPage);
    await fixture.componentInstance.iconCatalogReady;
    await fixture.whenStable();
    const service = TestBed.inject(NeuralColorModeService);
    const darkButton = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.theme-switcher button',
      ) as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.trim() === 'dark');

    darkButton?.click();

    expect(service.preference()).toBe('dark');
    expect(service.resolvedMode()).toBe('dark');
    expect(document.documentElement.dataset['neuralMode']).toBe('dark');
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(PlaygroundPage);
    await fixture.componentInstance.iconCatalogReady;
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'NeuralNg Component Lab',
    );
    expect(compiled.querySelectorAll('neural-button')).toHaveLength(21);
    expect(compiled.querySelectorAll('neural-toast')).toHaveLength(4);
    expect(fixture.componentInstance.iconTotals()).toEqual({
      icons: 6184,
      outline: 5130,
      filled: 1054,
    });
    expect(compiled.querySelectorAll('.icon-grid .nt')).toHaveLength(48);
    expect(compiled.querySelectorAll('.nt-spin-dual')).toHaveLength(1);
    expect(compiled.querySelector('.nt-loader-3.nt-spin-dual')).not.toBeNull();
    expect(compiled.querySelectorAll('neural-paginator')).toHaveLength(3);
    expect(compiled.querySelectorAll('neural-card')).toHaveLength(3);
    expect(compiled.querySelectorAll('neural-card article')).toHaveLength(3);
    expect(compiled.querySelectorAll('neural-field')).toHaveLength(5);
    expect(compiled.querySelectorAll('input[neuralInput]')).toHaveLength(9);
    expect(
      compiled
        .querySelector('.demo-headless-card')
        ?.classList.contains('neural-card-base'),
    ).toBe(false);
    expect(
      compiled.querySelector('.neural-paginator-report-root')?.textContent,
    ).toContain('5130 ikondan 1–48 arası gösteriliyor');
  });

  it('filters the icon catalog by name and style', async () => {
    const fixture = TestBed.createComponent(PlaygroundPage);
    await fixture.componentInstance.iconCatalogReady;
    await fixture.whenStable();

    fixture.componentInstance.iconQuery.set('user');
    fixture.componentInstance.iconStyle.set('filled');
    fixture.detectChanges();

    expect(fixture.componentInstance.matchingIcons().length).toBeGreaterThan(0);
    expect(
      fixture.nativeElement.querySelector('.nt-filled-user'),
    ).not.toBeNull();
  });

  it('should send a message from a button interaction', async () => {
    const fixture = TestBed.createComponent(PlaygroundPage);
    await fixture.componentInstance.iconCatalogReady;
    await fixture.whenStable();
    const service = TestBed.inject(NeuralMessageService);
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll(
        'neural-button button',
      ) as NodeListOf<HTMLButtonElement>,
    );
    const successButton = buttons.find(
      (button) => button.textContent?.trim() === 'Success',
    );

    successButton?.click();

    expect(service.messages()).toHaveLength(1);
    expect(service.messages()[0]).toMatchObject({
      severity: 'success',
      message: 'İşlem başarıyla tamamlandı.',
    });
  });
});
