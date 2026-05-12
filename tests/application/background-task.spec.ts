import { BaseBackgroundTask } from '@src';

class SendEmailTask extends BaseBackgroundTask {
  constructor(correlationId: string, causationId?: string, metadata?: Record<string, string>, id?: string) {
    super('send-email', { to: 'test@example.com' }, correlationId, causationId, metadata, id);
  }
}

describe('BaseBackgroundTask', () => {
  it('assigns a random id when none is provided', () => {
    const task = new SendEmailTask('corr-1');
    expect(task.id).toBeDefined();
    expect(typeof task.id).toBe('string');
  });

  it('uses the provided id', () => {
    const task = new SendEmailTask('corr-1', undefined, undefined, 'fixed-id');
    expect(task.id).toBe('fixed-id');
  });

  it('assigns type, payload and correlationId', () => {
    const task = new SendEmailTask('corr-1');
    expect(task.type).toBe('send-email');
    expect(task.payload).toEqual({ to: 'test@example.com' });
    expect(task.correlationId).toBe('corr-1');
  });

  it('causationId defaults to undefined', () => {
    const task = new SendEmailTask('corr-1');
    expect(task.causationId).toBeUndefined();
  });

  it('assigns causationId when provided', () => {
    const task = new SendEmailTask('corr-1', 'cause-1');
    expect(task.causationId).toBe('cause-1');
  });

  it('metadata defaults to undefined', () => {
    const task = new SendEmailTask('corr-1');
    expect(task.metadata).toBeUndefined();
  });

  it('assigns metadata when provided', () => {
    const task = new SendEmailTask('corr-1', undefined, { priority: 'high', source: 'api' });
    expect(task.metadata).toEqual({ priority: 'high', source: 'api' });
  });
});
