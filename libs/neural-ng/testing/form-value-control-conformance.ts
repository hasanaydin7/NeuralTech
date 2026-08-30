export type FormValueControlAdapter =
  | 'direct'
  | 'signal'
  | 'reactive'
  | 'template';

export interface FormValueControlConformanceHarness<TValue, TSemanticEvent> {
  readonly initialValue: TValue;
  readonly programmaticValue: TValue;
  readonly userValue: TValue;
  readonly resetValue: TValue;
  value(adapter: FormValueControlAdapter): TValue;
  setValue(adapter: FormValueControlAdapter, value: TValue): void;
  interact(adapter: FormValueControlAdapter, value: TValue): void;
  events(adapter: FormValueControlAdapter): readonly TSemanticEvent[];
  eventValue(event: TSemanticEvent): TValue;
  eventPreviousValue(event: TSemanticEvent): TValue;
  setReadonly(value: boolean): void;
  setDisabled(value: boolean): void;
  setRequired(value: boolean): void;
  isReadonly(): boolean;
  isDisabled(): boolean;
  isRequired(): boolean;
  touchCount(): number;
  blur(): void;
  focus(options?: FocusOptions): void;
  focusTarget(): HTMLElement;
  reset(): void;
  stabilize(): Promise<void>;
}

export type FormValueControlConformanceFactory<TValue, TSemanticEvent> =
  () => Promise<FormValueControlConformanceHarness<TValue, TSemanticEvent>>;

const ADAPTERS: readonly FormValueControlAdapter[] = [
  'direct',
  'signal',
  'reactive',
  'template',
];

/**
 * Registers the shared Forms contract used by controls with a `value` model.
 *
 * The suite is test-only. Component-specific harnesses own DOM interaction and
 * state inspection while this helper keeps adapter, event, readonly, touch,
 * focus, and reset expectations identical across the library.
 */
export function describeFormValueControlConformance<TValue, TSemanticEvent>(
  controlName: string,
  createHarness: FormValueControlConformanceFactory<TValue, TSemanticEvent>,
): void {
  describe(`${controlName} FormValueControl conformance`, () => {
    it('exposes one value model across every forms adapter', async () => {
      const harness = await createHarness();

      for (const adapter of ADAPTERS) {
        expect(harness.value(adapter)).toEqual(harness.initialValue);
      }
    });

    it('accepts programmatic writes without semantic user events', async () => {
      const harness = await createHarness();

      for (const adapter of ADAPTERS) {
        harness.setValue(adapter, harness.programmaticValue);
      }
      await harness.stabilize();

      for (const adapter of ADAPTERS) {
        expect(harness.value(adapter)).toEqual(harness.programmaticValue);
        expect(harness.events(adapter)).toHaveLength(0);
      }
    });

    it('writes one user change through every forms adapter', async () => {
      const harness = await createHarness();

      for (const adapter of ADAPTERS) {
        harness.interact(adapter, harness.userValue);
        await harness.stabilize();
      }

      for (const adapter of ADAPTERS) {
        expect(harness.value(adapter)).toEqual(harness.userValue);
        expect(harness.events(adapter)).toHaveLength(1);
        expect(harness.eventValue(harness.events(adapter)[0]!)).toEqual(
          harness.userValue,
        );
        expect(harness.eventPreviousValue(harness.events(adapter)[0]!)).toEqual(
          harness.initialValue,
        );
      }
    });

    it('keeps readonly controls focusable and blocks mutation', async () => {
      const harness = await createHarness();
      harness.setReadonly(true);
      await harness.stabilize();

      expect(harness.isReadonly()).toBe(true);
      expect(harness.isDisabled()).toBe(false);

      harness.focus();
      expect(document.activeElement).toBe(harness.focusTarget());
      harness.interact('direct', harness.userValue);
      await harness.stabilize();

      expect(harness.value('direct')).toEqual(harness.initialValue);
      expect(harness.events('direct')).toHaveLength(0);

      harness.setValue('direct', harness.programmaticValue);
      await harness.stabilize();
      expect(harness.value('direct')).toEqual(harness.programmaticValue);
      expect(harness.events('direct')).toHaveLength(0);
    });

    it('exposes disabled and required state', async () => {
      const harness = await createHarness();
      harness.setDisabled(true);
      harness.setRequired(true);
      await harness.stabilize();

      expect(harness.isDisabled()).toBe(true);
      expect(harness.isRequired()).toBe(true);
      harness.interact('direct', harness.userValue);
      await harness.stabilize();

      expect(harness.value('direct')).toEqual(harness.initialValue);
      expect(harness.events('direct')).toHaveLength(0);

      harness.setValue('direct', harness.programmaticValue);
      await harness.stabilize();
      expect(harness.value('direct')).toEqual(harness.programmaticValue);
      expect(harness.events('direct')).toHaveLength(0);
    });

    it('emits touch when focus leaves the control', async () => {
      const harness = await createHarness();
      harness.blur();
      await harness.stabilize();

      expect(harness.touchCount()).toBe(1);
    });

    it('exposes focus and reset without semantic events', async () => {
      const harness = await createHarness();
      harness.setValue('direct', harness.programmaticValue);
      await harness.stabilize();

      harness.focus();
      expect(document.activeElement).toBe(harness.focusTarget());

      harness.reset();
      await harness.stabilize();
      expect(harness.value('direct')).toEqual(harness.resetValue);
      expect(harness.events('direct')).toHaveLength(0);
    });
  });
}
