import { randomUUID } from 'node:crypto';
import { getEnv } from '@/lib/env';
import { log } from '@/lib/log';
import type { EmailMessage, EmailResult, EmailTransport } from './transport';

export class ConsoleTransport implements EmailTransport {
  constructor(private readonly from: string) {}

  async send(msg: EmailMessage): Promise<EmailResult> {
    const id = randomUUID();
    const from = msg.from ?? this.from;
    const matched = msg.text.match(/https?:\/\/\S+/g) ?? [];
    // Magic-link tokens live in the query string; only emit them in dev so they
    // don't land in prod log aggregation if EMAIL_TRANSPORT defaults to console.
    const urls =
      getEnv().NODE_ENV === 'development' ? matched : matched.map((u) => u.split('?')[0]);
    log.info(
      {
        emailId: id,
        to: msg.to,
        from,
        subject: msg.subject,
        urls,
        textPreview: msg.text.slice(0, 600),
      },
      '[email:console] 📬 would send',
    );
    return { id, transport: 'console' };
  }
}
