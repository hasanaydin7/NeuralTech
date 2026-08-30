export type FormCheckboxControlAdapter =
  | 'direct'
  | 'signal'
  | 'reactive'
  | 'template';

export interface FormCheckboxControlSemanticEvent {
  readonly checked: boolean;
  readonly previousChecked: boolean;
  readonly nativeEvent: Event;
}

export interface FormCheckboxControlConformanceHarness {
  readonly expectedRole: 'checkbox' | 'switch';
  input(adapter: FormCheckboxControlAdapter): HTMLInputElement;
  value(adapter: FormCheckboxControlAdapter): boolean;
  setValue(adapter: FormCheckboxControlAdapter, value: boolean): void;
  events(
    adapter: FormCheckboxControlAdapter,
  ): readonly FormCheckboxControlSemanticEvent[];
  setReadonly(value: boolean): void;
  setDisabled(value: boolean): void;
  setRequired(value: boolean): void;
  touchCount(): number;
  focus(options?: FocusOptions): void;
  reset(): void;
  stabilize(): Promise<void>;
}

export type FormCheckboxControlConformanceFactory =
  () => Promise<FormCheckboxControlConformanceHarness>;

const ADAPTERS: readonly FormCheckboxControlAdapter[] = [
  'direct',
  'signal',
  'reactive',
  'template',
];

/**
 * Registers the shared binary Forms contract used by Checkbox and Switch.
 *
 * The suite is intentionally test-only. It validates the public behavior of a
 * FormCheckboxControl without becoming part of the @neural-ng/core runtime.
 */
export function describeFormCheckboxControlConformance(
  controlName: string,
  createHarness: FormCheckboxControlConformanceFactory,
): void {
  describe(`${controlName} FormCheckboxControl conformance`, () => {
    it('exposes one native boolean model across every forms adapter', async () => {
      const harness = await createHarness();

      for (const adapter of ADAPTERS) {
        const input = harness.input(adapter);
        expect(input.type).toBe('checkbox');
        expect(input.getAttribute('role') ?? 'checkbox').toBe(
          harness.expectedRole,
        );
        expect(input.checked).toBe(false);
        expect(harness.value(adapter)).toBe(false);
      }
    });

    it('accepts programmatic writes without semantic user events', async () => {
      const harness = await createHarness();

      for (const adapter of ADAPTERS) {
        harness.setValue(adapter, true);
      }
      await harness.stabilize();

      for (const adapter of ADAPTERS) {
        expect(harness.input(adapter).checked).toBe(true);
        expect(harness.value(adapter)).toBe(true);
        expect(harness.events(adapter)).toHaveLength(0);
      }
    });

    it('writes one user change through every forms adapter', async () => {
      const harness = await createHarness();

      for (const adapter of ADAPTERS) {
        harness.input(adapter).click();
        await harness.stabilize();
      }

      for (const adapter of ADAPTERS) {
        expect(harness.value(adapter)).toBe(true);
        expect(harness.events(adapter)).toHaveLength(1);
        expect(harness.events(adapter)[0]).toMatchObject({
          checked: true,
          previousChecked: false,
        });
      }
    });

    it('keeps readonly controls focusable and blocks mutation', async () => {
      const harness = await createHarness();
      harness.setReadonly(true);
      await harness.stabilize();

      const input = harness.input('direct');
      expect(input.disabled).toBe(false);
      expect(input.getAttribute('aria-readonly')).toBe('true');

      harness.focus();
      expect(document.activeElement).toBe(input);
      input.click();
      await harness.stabilize();

      expect(harness.value('direct')).toBe(false);
      expect(harness.events('direct')).toHaveLength(0);
    });

    it('uses native disabled and required state', async () => {
      const harness = await createHarness();
      harness.setDisabled(true);
      harness.setRequired(true);
      await harness.stabilize();

      const input = harness.input('direct');
      expect(input.disabled).toBe(true);
      expect(input.required).toBe(true);
      input.click();
      await harness.stabilize();

      expect(harness.value('direct')).toBe(false);
      expect(harness.events('direct')).toHaveLength(0);
    });

    it('emits touch from native blur', async () => {
      const harness = await createHarness();
      harness.input('direct').dispatchEvent(new FocusEvent('blur'));
      await harness.stabilize();

      expect(harness.touchCount()).toBe(1);
    });

    it('exposes focus and reset without semantic events', async () => {
      const harness = await createHarness();
      harness.setValue('direct', true);
      await harness.stabilize();

      harness.focus();
      expect(document.activeElement).toBe(harness.input('direct'));

      harness.reset();
      await harness.stabilize();
      expect(harness.value('direct')).toBe(false);
      expect(harness.events('direct')).toHaveLength(0);
    });
  });
}
