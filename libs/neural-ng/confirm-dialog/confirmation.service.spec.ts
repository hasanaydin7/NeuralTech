import { TestBed } from '@angular/core/testing';
import { NeuralConfirmationService } from './confirmation.service';

describe('NeuralConfirmationService', () => {
  let service: NeuralConfirmationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NeuralConfirmationService);
  });

  it('creates a signal-backed reference and completes it', () => {
    const ref = service.confirm({ message: 'Delete the workspace?' });
    const confirmation = service.confirmation();
    expect(confirmation?.message).toBe('Delete the workspace?');
    if (!confirmation) throw new Error('Expected an active confirmation.');
    service.complete(confirmation.id, 'accepted', 'accept');
    expect(ref.closed()).toBe(true);
    expect(ref.result()).toBe('accepted');
    expect(ref.closeReason()).toBe('accept');
  });

  it('keeps keys independent and replaces only the matching key', () => {
    const first = service.confirm({ key: 'delete', message: 'First' });
    service.confirm({ key: 'archive', message: 'Archive' });
    service.confirm({ key: 'delete', message: 'Second' });

    expect(first.closeReason()).toBe('replaced');
    expect(service.confirmation('delete')?.message).toBe('Second');
    expect(service.confirmation('archive')?.message).toBe('Archive');
  });

  it('supports async guards that can keep the dialog open', async () => {
    const accept = vi.fn().mockResolvedValue(false);
    const ref = service.confirm({ message: 'Guarded', accept });
    expect(await service.runAction(ref.id, 'accept')).toBe(false);
    expect(ref.closed()).toBe(false);
  });

  it('rejects empty messages and keys', () => {
    expect(() => service.confirm({ message: '  ' })).toThrow(/message/);
    expect(() => service.confirm({ key: ' ', message: 'Valid' })).toThrow(
      /key/,
    );
  });
});
