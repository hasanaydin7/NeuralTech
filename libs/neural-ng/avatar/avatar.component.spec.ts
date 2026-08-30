import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralAvatarGroup } from './avatar-group.component';
import { NeuralAvatar } from './avatar.component';
import type {
  NeuralAvatarClasses,
  NeuralAvatarGroupClasses,
} from './avatar.types';

@Component({
  imports: [NeuralAvatar],
  template: `
    <neural-avatar
      [name]="name()"
      [initials]="initials()"
      [iconClass]="iconClass()"
      [unstyled]="unstyled()"
      [classes]="classes"
    >
      <strong class="projected-fallback">AI</strong>
    </neural-avatar>
  `,
})
class AvatarHost {
  readonly name = signal<string | null>(null);
  readonly initials = signal<string | null>(null);
  readonly iconClass = signal<string | null>(null);
  readonly unstyled = signal(false);
  classes: NeuralAvatarClasses = {
    root: 'slot-root',
    image: 'slot-image',
    fallback: 'slot-fallback',
    initials: 'slot-initials',
    icon: 'slot-icon',
    content: 'slot-content',
  };
}

@Component({
  imports: [NeuralAvatar, NeuralAvatarGroup],
  template: `
    <neural-avatar-group
      ariaLabel="Project team"
      [max]="max()"
      overflowLabel="{count} additional teammates"
      [unstyled]="unstyled()"
      [classes]="classes"
    >
      <neural-avatar name="Ada Lovelace" />
      <neural-avatar name="Grace Hopper" />
      <neural-avatar name="Margaret Hamilton" />
      <neural-avatar name="Radia Perlman" />
      <neural-avatar name="Annie Easley" />
    </neural-avatar-group>
  `,
})
class AvatarGroupHost {
  readonly max = signal(3);
  readonly unstyled = signal(false);
  readonly classes: NeuralAvatarGroupClasses = {
    root: 'slot-group',
    overflow: 'slot-overflow',
  };
}

describe('NeuralAvatar', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideNeuralNg()],
    }),
  );

  it('derives accessible initials from the first and last name', () => {
    const fixture = TestBed.createComponent(NeuralAvatar);
    fixture.componentRef.setInput('name', 'Ada Byron Lovelace');
    fixture.componentRef.setInput('size', 'large');
    fixture.componentRef.setInput('shape', 'rounded');
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-avatar-root',
    ) as HTMLElement;

    expect(root.textContent?.trim()).toBe('AL');
    expect(root.getAttribute('role')).toBe('img');
    expect(root.getAttribute('aria-label')).toBe('Ada Byron Lovelace');
    expect(root.dataset['size']).toBe('large');
    expect(root.dataset['shape']).toBe('rounded');
    expect(root.classList).toContain('neural-avatar-large-base');
    expect(root.classList).toContain('neural-avatar-rounded-base');
  });

  it('prefers explicit initials, then icon class, then projected fallback', () => {
    const fixture = TestBed.createComponent(AvatarHost);
    fixture.componentInstance.name.set('Neural Ng');
    fixture.componentInstance.initials.set('NT');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.slot-initials').textContent.trim(),
    ).toBe('NT');

    fixture.componentInstance.name.set(null);
    fixture.componentInstance.initials.set(null);
    fixture.componentInstance.iconClass.set('nt nt-user');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.nt-user.slot-icon'),
    ).toBeTruthy();

    fixture.componentInstance.iconClass.set(null);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.projected-fallback'),
    ).toBeTruthy();
  });

  it('renders native responsive image attributes and emits load', () => {
    const fixture = TestBed.createComponent(NeuralAvatar);
    const loaded = vi.fn();
    fixture.componentInstance.imageLoaded.subscribe(loaded);
    fixture.componentRef.setInput('src', '/ada.webp');
    fixture.componentRef.setInput('srcSet', '/ada.webp 1x, /ada@2x.webp 2x');
    fixture.componentRef.setInput('sizes', '48px');
    fixture.componentRef.setInput('name', 'Ada Lovelace');
    fixture.componentRef.setInput('loading', 'eager');
    fixture.componentRef.setInput('fetchPriority', 'high');
    fixture.componentRef.setInput('imageFit', 'contain');
    fixture.detectChanges();
    const image = fixture.nativeElement.querySelector(
      '.neural-avatar-image-root',
    ) as HTMLImageElement;

    expect(image.getAttribute('alt')).toBe('Ada Lovelace');
    expect(image.getAttribute('srcset')).toContain('/ada@2x.webp 2x');
    expect(image.getAttribute('sizes')).toBe('48px');
    expect(image.loading).toBe('eager');
    expect(image.getAttribute('fetchpriority')).toBe('high');

    image.dispatchEvent(new Event('load'));
    fixture.detectChanges();
    expect(loaded).toHaveBeenCalledOnce();
    expect(
      fixture.nativeElement.querySelector('.neural-avatar-root').dataset[
        'imageState'
      ],
    ).toBe('loaded');
  });

  it('falls back on image error and retries when src changes', () => {
    const fixture = TestBed.createComponent(NeuralAvatar);
    const failed = vi.fn();
    fixture.componentInstance.imageError.subscribe(failed);
    fixture.componentRef.setInput('src', '/missing.webp');
    fixture.componentRef.setInput('name', 'Grace Hopper');
    fixture.detectChanges();
    const image = fixture.nativeElement.querySelector(
      'img',
    ) as HTMLImageElement;

    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(failed).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent.trim()).toBe('GH');
    expect(
      fixture.nativeElement.querySelector('.neural-avatar-root').dataset[
        'imageState'
      ],
    ).toBe('error');

    fixture.componentRef.setInput('src', '/grace.webp');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeTruthy();
  });

  it('preserves structural and consumer slots in unstyled mode', () => {
    const fixture = TestBed.createComponent(AvatarHost);
    fixture.componentInstance.name.set('Ada Lovelace');
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-avatar-root',
    ) as HTMLElement;

    expect(root.classList).toContain('neural-avatar-root');
    expect(root.classList).toContain('slot-root');
    expect(root.classList).not.toContain('neural-avatar-base');
    expect(
      fixture.nativeElement.querySelector('.slot-fallback.slot-initials'),
    ).toBeNull();
    expect(fixture.nativeElement.querySelector('.slot-fallback')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.slot-initials')).toBeTruthy();
  });
});

describe('NeuralAvatarGroup', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideNeuralNg()],
    }),
  );

  it('limits projected avatars and renders a localized overflow', () => {
    const fixture = TestBed.createComponent(AvatarGroupHost);
    fixture.detectChanges();
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector(
      '.neural-avatar-group-root',
    ) as HTMLElement;
    const avatars = Array.from(
      fixture.nativeElement.querySelectorAll('neural-avatar'),
    ) as HTMLElement[];
    const overflow = fixture.nativeElement.querySelector(
      '.neural-avatar-group-overflow-root',
    ) as HTMLElement;

    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Project team');
    expect(avatars.filter((avatar) => avatar.hidden)).toHaveLength(2);
    expect(overflow.textContent?.trim()).toBe('+2');
    expect(overflow.getAttribute('aria-label')).toBe('2 additional teammates');
    expect(overflow.classList).toContain('slot-overflow');

    fixture.componentInstance.max.set(4);
    fixture.detectChanges();
    fixture.detectChanges();
    expect(avatars.filter((avatar) => avatar.hidden)).toHaveLength(1);
    expect(overflow.textContent?.trim()).toBe('+1');
  });

  it('keeps group hooks and slots while removing visual classes', () => {
    const fixture = TestBed.createComponent(AvatarGroupHost);
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector(
      '.neural-avatar-group-root',
    ) as HTMLElement;
    const overflow = fixture.nativeElement.querySelector(
      '.neural-avatar-group-overflow-root',
    ) as HTMLElement;

    expect(group.classList).toContain('slot-group');
    expect(group.classList).not.toContain('neural-avatar-group-base');
    expect(overflow.classList).toContain('slot-overflow');
    expect(overflow.classList).not.toContain(
      'neural-avatar-group-overflow-base',
    );
  });
});
