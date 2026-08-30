import { TestBed } from '@angular/core/testing';
import { provideNeuralMessages } from './message.providers';
import { NeuralMessageService } from './message.service';
import type { NeuralMessagesOptions } from './message.types';

describe('NeuralMessageService', () => {
  function createService(
    options: NeuralMessagesOptions = {},
  ): NeuralMessageService {
    TestBed.configureTestingModule({
      providers: [provideNeuralMessages(options)],
    });

    return TestBed.inject(NeuralMessageService);
  }

  it('normalizes input and applies stable defaults', () => {
    const service = createService();
    const ref = service.notify({
      title: ' Saved ',
      message: ' Changes saved. ',
    });

    expect(ref.id).toBe('neural-message-1');
    expect(ref.closed()).toBe(false);
    expect(ref.closeReason()).toBeNull();
    expect(service.messages()).toEqual([
      {
        id: 'neural-message-1',
        severity: 'neutral',
        title: 'Saved',
        message: 'Changes saved.',
        channel: 'global',
        duration: 5000,
        dismissible: true,
      },
    ]);
    expect(Object.isFrozen(service.messages()[0])).toBe(true);
  });

  it('keeps warning and error messages persistent by default', () => {
    const service = createService();

    service.notify({ severity: 'warning', message: 'Check this.' });
    service.notify({ severity: 'error', message: 'Save failed.' });

    expect(service.messages().map((message) => message.duration)).toEqual([
      null,
      null,
    ]);
  });

  it('respects an explicit persistent duration for any severity', () => {
    const service = createService();

    service.notify({ severity: 'success', message: 'Saved.', duration: null });

    expect(service.messages()[0]?.duration).toBeNull();
  });

  it('preserves primary and secondary severities', () => {
    const service = createService();

    service.notify({ severity: 'primary', message: 'Primary action.' });
    service.notify({ severity: 'secondary', message: 'Secondary action.' });

    expect(service.messages().map((message) => message.severity)).toEqual([
      'primary',
      'secondary',
    ]);
  });

  it('applies configured defaults', () => {
    const service = createService({
      defaultChannel: ' app ',
      defaultDuration: 2500,
      importantDuration: 10000,
      maxVisible: 2,
    });

    service.notify({ severity: 'info', message: 'Info' });
    service.notify({ severity: 'error', message: 'Error' });

    expect(service.messages()).toEqual([
      expect.objectContaining({ channel: 'app', duration: 2500 }),
      expect.objectContaining({ channel: 'app', duration: 10000 }),
    ]);
  });

  it('closes the oldest message when a channel exceeds maxVisible', () => {
    const service = createService({ maxVisible: 2 });
    const first = service.notify({ message: 'First' });
    service.notify({ message: 'Second' });
    service.notify({ message: 'Third' });

    expect(service.messages().map((message) => message.message)).toEqual([
      'Second',
      'Third',
    ]);
    expect(first.closed()).toBe(true);
    expect(first.closeReason()).toBe('overflow');
  });

  it('applies maxVisible independently per channel', () => {
    const service = createService({ maxVisible: 1 });

    service.notify({ message: 'Global', channel: 'global' });
    service.notify({ message: 'Feature', channel: 'feature' });

    expect(service.messages().map((message) => message.channel)).toEqual([
      'global',
      'feature',
    ]);
  });

  it('dismisses through both the service and message ref', () => {
    const service = createService();
    const first = service.notify({ message: 'First' });
    const second = service.notify({ message: 'Second' });

    expect(service.dismiss(first.id, 'user')).toBe(true);
    expect(first.closed()).toBe(true);
    expect(first.closeReason()).toBe('user');

    second.dismiss();
    expect(second.closed()).toBe(true);
    expect(second.closeReason()).toBe('api');
    expect(service.messages()).toEqual([]);
    expect(service.dismiss('missing')).toBe(false);
  });

  it('clears one channel without affecting other channels', () => {
    const service = createService();
    const global = service.notify({ message: 'Global' });
    const feature = service.notify({ message: 'Feature', channel: 'feature' });

    service.clear('feature');

    expect(service.messages().map((message) => message.message)).toEqual([
      'Global',
    ]);
    expect(global.closed()).toBe(false);
    expect(feature.closed()).toBe(true);
    expect(feature.closeReason()).toBe('clear');
  });

  it('clears every channel when no channel is provided', () => {
    const service = createService();
    const first = service.notify({ message: 'First' });
    const second = service.notify({ message: 'Second', channel: 'feature' });

    service.clear();

    expect(service.messages()).toEqual([]);
    expect(first.closeReason()).toBe('clear');
    expect(second.closeReason()).toBe('clear');
  });

  it('rejects invalid message input', () => {
    const service = createService();

    expect(() => service.notify({ message: '   ' })).toThrowError(
      'NeuralNg messages: message cannot be empty.',
    );
    expect(() =>
      service.notify({ message: 'Message', channel: '   ' }),
    ).toThrowError('NeuralNg messages: channel cannot be empty.');
    expect(() =>
      service.notify({ message: 'Message', duration: 0 }),
    ).toThrowError(
      'NeuralNg messages: duration must be a positive number or null.',
    );
    expect(() => service.clear('   ')).toThrowError(
      'NeuralNg messages: channel cannot be empty.',
    );
  });

  it('rejects invalid provider configuration', () => {
    expect(() => provideNeuralMessages({ maxVisible: 0 })).toThrowError(
      'NeuralNg messages: maxVisible must be a positive integer.',
    );
    expect(() => provideNeuralMessages({ defaultChannel: '   ' })).toThrowError(
      'NeuralNg messages: defaultChannel cannot be empty.',
    );
    expect(() =>
      provideNeuralMessages({ defaultDuration: Number.NaN }),
    ).toThrowError(
      'NeuralNg messages: defaultDuration must be a positive number or null.',
    );
  });
});
