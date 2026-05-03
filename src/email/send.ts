import { createElement } from 'react';
import { getEmailTransport } from './index';
import { ReminderEmail, type ReminderEmailProps } from './templates/reminder';
import { renderEmail } from './render';

export async function sendReminder(to: string, props: ReminderEmailProps) {
  const { html, text } = await renderEmail(createElement(ReminderEmail, props));
  return getEmailTransport().send({
    to,
    subject: `Reminder: ${props.slotLabel} · ${props.signupTitle}`,
    html,
    text,
  });
}
