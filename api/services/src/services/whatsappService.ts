import twilio from 'twilio';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('WhatsAppService');

let client: ReturnType<typeof twilio> | null = null;

const getClient = () => {
  if (!client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials are missing');
    }

    client = twilio(accountSid, authToken);
  }

  return client;
};

interface SendWhatsAppParams {
  to: string;
  body: string;
}

export const sendWhatsAppMessage = async ({ to, body }: SendWhatsAppParams): Promise<void> => {
  const from = process.env.TWILIO_WHATSAPP_FROM;

  console.log('[WhatsApp] Sending message', { to, bodyLength: body.length, from, nodeEnv: process.env.NODE_ENV });

  if (!from) {
    console.error('[WhatsApp] Error: TWILIO_WHATSAPP_FROM is not configured');
    throw new Error('TWILIO_WHATSAPP_FROM is not configured');
  }

  logger.info('Sending WhatsApp message', { to });
  console.log('[WhatsApp] Creating Twilio message');

  try {
    const result = await getClient().messages.create({
      from,
      to,
      body,
    });
    console.log('[WhatsApp] Message sent successfully', { messageSid: result.sid });
  } catch (err: any) {
    console.error('[WhatsApp] Error sending message', { error: err.message, code: err.code });
    throw err;
  }
};
