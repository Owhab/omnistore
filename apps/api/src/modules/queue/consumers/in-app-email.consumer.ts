import { MailerService } from '@nestjs-modules/mailer';
import { Address } from '@nestjs-modules/mailer/dist/interfaces/send-mail-options.interface';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as fs from 'fs/promises';
import Handlebars from 'handlebars';
import { htmlToText } from 'html-to-text';
import path from 'path';
import { InAppEmail, Queues } from 'src/constants/queue.enum';
import { EnvService } from 'src/shared/services/env.service';

export type SendEmail = {
  to: string | Address;
  from?: string | Address;
  replyTo?: string | Address;
  subject: string;
  template: string;
  context?: Record<string, string>;
};

@Processor(Queues.IN_APP_EMAIL)
export class InAppEmailConsumer extends WorkerHost {
  constructor(
    private readonly mailService: MailerService,
    private readonly env: EnvService,
  ) {
    super();
  }

  async sendEmail(config: SendEmail) {
    if (this.env.isDevelopment) {
      try {
        const email = await fs.readFile(
          path.join(
            __dirname,
            '../../../',
            'templates',
            `${config.template}.hbs`,
          ),
        );
        const template = Handlebars.compile(email.toString());
        const html = template(config.context);
        console.log('App not running in production, dumping the content:');
        console.log('--- start');
        console.log({
          to: config.to,
          subject: config.subject,
        });
        console.log(htmlToText(html));
        console.log('--- end');
      } catch (error) {
        console.log('Template not found', error);
      }

      return;
    }

    await this.mailService.sendMail(config);
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case InAppEmail.GET_IN_TOUCH.toString(): {
        // const data = job.data;
        // await this.sendEmail({
        //   to: {
        //     name: MailConfig.TO_NAME,
        //     address: MailConfig.TO_EMAIL,
        //   },
        //   replyTo: {
        //     name: data.firstName,
        //     address: data.email,
        //   },
        //   subject: "Hurry: New submission coming",
        //   template: "get-in-touch",
        //   context: { ...data },
        // });

        return;
      }
    }
  }
}
