import { TestBed } from '@angular/core/testing';
import { NeuralOverlayPositioner } from './overlay-positioner';

describe('NeuralOverlayPositioner', () => {
  it('maps logical start and end to edge-aligned anchor areas', () => {
    vi.stubGlobal('CSS', { supports: () => true });
    const positioner = TestBed.inject(NeuralOverlayPositioner);
    const anchor = document.createElement('button');
    const overlay = document.createElement('div');
    document.body.append(anchor, overlay);

    const startRef = positioner.connect(anchor, overlay, {
      placement: 'top-start',
      offset: 8,
    });
    expect(overlay.style.getPropertyValue('position-area')).toBe(
      'block-start span-inline-end',
    );
    expect(overlay.style.margin).toBe('0px 0px 8px');
    startRef.destroy();

    const endRef = positioner.connect(anchor, overlay, {
      placement: 'bottom-end',
      offset: 8,
    });
    expect(overlay.style.getPropertyValue('position-area')).toBe(
      'block-end span-inline-start',
    );
    expect(overlay.style.margin).toBe('8px 0px 0px');
    endRef.destroy();

    anchor.remove();
    overlay.remove();
    vi.unstubAllGlobals();
  });

  it('keeps concurrent native overlays anchored to the same trigger', () => {
    vi.stubGlobal('CSS', { supports: () => true });
    const positioner = TestBed.inject(NeuralOverlayPositioner);
    const anchor = document.createElement('button');
    const first = document.createElement('div');
    const second = document.createElement('div');
    anchor.style.setProperty('anchor-name', '--consumer-anchor');
    document.body.append(anchor, first, second);

    const firstRef = positioner.connect(anchor, first);
    const firstName = first.style.getPropertyValue('position-anchor');
    const secondRef = positioner.connect(anchor, second);
    const secondName = second.style.getPropertyValue('position-anchor');

    expect(anchor.style.getPropertyValue('anchor-name')).toContain(firstName);
    expect(anchor.style.getPropertyValue('anchor-name')).toContain(secondName);

    firstRef.destroy();
    expect(anchor.style.getPropertyValue('anchor-name')).not.toContain(
      firstName,
    );
    expect(anchor.style.getPropertyValue('anchor-name')).toContain(secondName);

    secondRef.destroy();
    expect(anchor.style.getPropertyValue('anchor-name')).toBe(
      '--consumer-anchor',
    );
    anchor.remove();
    first.remove();
    second.remove();
    vi.unstubAllGlobals();
  });

  it('flips a fallback overlay into the viewport and cleans its styles', () => {
    vi.stubGlobal('CSS', { supports: () => false });
    const positioner = TestBed.inject(NeuralOverlayPositioner);
    const anchor = document.createElement('button');
    const overlay = document.createElement('div');
    document.body.append(anchor, overlay);
    vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue(
      rect({ left: 100, top: 2, width: 40, height: 20 }),
    );
    vi.spyOn(overlay, 'getBoundingClientRect').mockReturnValue(
      rect({ width: 80, height: 40 }),
    );

    const ref = positioner.connect(anchor, overlay, {
      placement: 'top',
      offset: 8,
    });

    expect(ref.resolvedPlacement()).toBe('bottom');
    expect(overlay.dataset['position']).toBe('bottom');
    expect(overlay.style.top).toBe('30px');
    expect(overlay.style.left).toBe('80px');

    ref.destroy();
    expect(overlay.style.top).toBe('');
    expect(overlay.style.left).toBe('');
    anchor.remove();
    overlay.remove();
    vi.unstubAllGlobals();
  });
});

function rect(
  values: Partial<DOMRect> & Pick<DOMRect, 'width' | 'height'>,
): DOMRect {
  const left = values.left ?? 0;
  const top = values.top ?? 0;
  const width = values.width;
  const height = values.height;
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  };
}
