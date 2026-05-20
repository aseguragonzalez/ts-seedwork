import { buildCommandBus } from '../application/composition-root.js';
import { DepositMoneyCommand } from '../application/deposit-money/deposit-money.command.js';
import { OpenAccountCommand } from '../application/open-account/open-account.command.js';
import { SendWelcomeEmailTask } from '../application/send-welcome-email/send-welcome-email.task.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('SendWelcomeEmailTask', () => {
  it('is scheduled with correct fields after OpenAccountCommand', async () => {
    const { commandBus, taskScheduler } = buildCommandBus();

    await commandBus.dispatch(new OpenAccountCommand('acc-1', 'Alice', 100, 'EUR'));

    expect(taskScheduler.scheduled).toHaveLength(1);
    const task = taskScheduler.scheduled[0];
    expect(task).toBeInstanceOf(SendWelcomeEmailTask);
    expect(task.type).toBe(SendWelcomeEmailTask.TYPE);
    expect(task.payload).toMatchObject({ accountId: 'acc-1', owner: 'Alice' });
    expect(task.causationId).toMatch(UUID_RE);
    expect(task.correlationId).toMatch(UUID_RE);
  });

  it('handler is invoked via executeScheduled without error', async () => {
    const { commandBus, taskScheduler } = buildCommandBus();
    await commandBus.dispatch(new OpenAccountCommand('acc-1', 'Alice', 100, 'EUR'));

    await expect(taskScheduler.executeScheduled()).resolves.toBeUndefined();
  });

  it('is not scheduled when the command returns a domain failure', async () => {
    const { commandBus, taskScheduler } = buildCommandBus();

    await commandBus.dispatch(new DepositMoneyCommand('unknown', 50, 'EUR'));

    expect(taskScheduler.scheduled).toHaveLength(0);
  });
});
