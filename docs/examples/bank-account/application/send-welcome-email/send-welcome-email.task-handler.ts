import { TaskHandler } from '@aseguragonzalez/ts-seedwork';

import { SendWelcomeEmailTask } from './send-welcome-email.task.js';

export class SendWelcomeEmailTaskHandler implements TaskHandler<SendWelcomeEmailTask> {
  async handle(_task: SendWelcomeEmailTask): Promise<void> {}
}
