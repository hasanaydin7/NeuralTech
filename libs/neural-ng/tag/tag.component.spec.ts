import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralTag } from './tag.component';
import type {
  NeuralTagClasses,
  NeuralTagRemove,
  NeuralTagSeverity,
  NeuralTagSize,
} from './tag.types';

@Component({
  imports: [NeuralTag],
  template: `
    <neural-tag
      [value]="value"
      [severity]="severity"
      [size]="size"
      [rounded]="rounded"
      [iconClass]="iconClass"
      [removable]="removable"
      [disabled]="disabled"
      [removeLabel]="removeLabel"
      [unstyled]="unstyled"
      [classes]="classes"
      (removed)="lastRemove = $event"
    >
      <strong>Projected</strong>
    </neural-tag>
  `,
})
class TagHost {
  value: string | null = 'Angular';
  severity: NeuralTagSeverity = 'info';
  size: NeuralTagSize = 'medium';
  rounded = true;
  iconClass: string | null = 'nt nt-brand-angular';
  removable = false;
  disabled = false;
  removeLabel: string | null = null;
  unstyled = false;
  classes: NeuralTagClasses = {
    root: 'slot-root',
    icon: 'slot-icon',
    label: 'slot-label',
    content: 'slot-content',
    removeButton: 'slot-remove',
    removeIcon: 'slot-remove-icon',
  };
  lastRemove: NeuralTagRemove | null = null;
}

describe('NeuralTag', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideNeuralNg()],
    }),
  );

  it('renders a semantic value, icon, size, rounded state, and typed slots', () => {
    const fixture = TestBed.createComponent(TagHost);
    fixture.componentInstance.size = 'large';
    fixture.detectChanges();
    const tag = fixture.nativeElement.querySelector(
      '.neural-tag-root',
    ) as HTMLElement;

    expect(tag.textContent?.trim()).toBe('Angular');
    expect(tag.dataset['severity']).toBe('info');
    expect(tag.dataset['size']).toBe('large');
    expect(tag.classList).toContain('neural-tag-info-base');
    expect(tag.classList).toContain('neural-tag-large-base');
    expect(tag.classList).toContain('neural-tag-rounded-base');
    expect(tag.querySelector('.nt-brand-angular.slot-icon')).toBeTruthy();
    expect(tag.querySelector('.slot-label')).toBeTruthy();
  });

  it('supports primary and secondary severities', () => {
    const fixture = TestBed.createComponent(TagHost);
    fixture.componentInstance.severity = 'primary';
    fixture.detectChanges();
    const tag = fixture.nativeElement.querySelector(
      '.neural-tag-root',
    ) as HTMLElement;
    expect(tag.classList).toContain('neural-tag-primary-base');

    const secondaryFixture = TestBed.createComponent(TagHost);
    secondaryFixture.componentInstance.severity = 'secondary';
    secondaryFixture.detectChanges();
    const secondaryTag = secondaryFixture.nativeElement.querySelector(
      '.neural-tag-root',
    ) as HTMLElement;
    expect(secondaryTag.classList).toContain('neural-tag-secondary-base');
  });

  it('uses projected content only when value is absent', () => {
    const fixture = TestBed.createComponent(TagHost);
    fixture.componentInstance.value = null;
    fixture.componentInstance.iconClass = null;
    fixture.detectChanges();

    const content = fixture.nativeElement.querySelector(
      '.neural-tag-content-root',
    ) as HTMLElement;
    expect(content.textContent?.trim()).toBe('Projected');
    expect(content.querySelector('strong')).toBeTruthy();
  });

  it('emits a controlled remove event with value and original event', () => {
    const fixture = TestBed.createComponent(TagHost);
    fixture.componentInstance.removable = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      '.neural-tag-remove-root',
    ) as HTMLButtonElement;

    button.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.lastRemove?.value).toBe('Angular');
    expect(fixture.componentInstance.lastRemove?.originalEvent).toBeInstanceOf(
      MouseEvent,
    );
    expect(button.getAttribute('aria-label')).toBe('Remove Angular');
  });

  it('does not emit removal while disabled', () => {
    const fixture = TestBed.createComponent(TagHost);
    fixture.componentInstance.removable = true;
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      '.neural-tag-remove-root',
    ) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
    button.click();
    expect(fixture.componentInstance.lastRemove).toBeNull();
    expect(
      fixture.nativeElement
        .querySelector('.neural-tag-root')
        .getAttribute('aria-disabled'),
    ).toBe('true');
  });

  it('supports custom remove labels and icon classes', () => {
    const fixture = TestBed.createComponent(TagHost);
    fixture.componentInstance.removable = true;
    fixture.componentInstance.removeLabel = 'Delete technology filter';
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      '.neural-tag-remove-root',
    ) as HTMLButtonElement;

    expect(button.getAttribute('aria-label')).toBe('Delete technology filter');
    expect(button.querySelector('.nt-x.slot-remove-icon')).toBeTruthy();
  });

  it('removes visual classes in unstyled mode but keeps structural hooks', () => {
    const fixture = TestBed.createComponent(TagHost);
    fixture.componentInstance.unstyled = true;
    fixture.componentInstance.removable = true;
    fixture.detectChanges();
    const tag = fixture.nativeElement.querySelector(
      '.neural-tag-root',
    ) as HTMLElement;
    const button = fixture.nativeElement.querySelector(
      '.neural-tag-remove-root',
    ) as HTMLButtonElement;

    expect(tag.classList).not.toContain('neural-tag-base');
    expect(tag.classList).toContain('slot-root');
    expect(button.classList).not.toContain('neural-tag-remove-base');
    expect(button.classList).toContain('slot-remove');
  });
});
