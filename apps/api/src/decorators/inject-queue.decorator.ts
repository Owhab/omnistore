import { InjectQueue } from '@nestjs/bullmq';
import { Queues } from 'src/constants/queue.enum';

export const InjectBackgroundQueue = (): ParameterDecorator =>
  InjectQueue(Queues.BACKGROUND_JOBS);

export const InjectInAppEmail = (): ParameterDecorator =>
  InjectQueue(Queues.IN_APP_EMAIL);
