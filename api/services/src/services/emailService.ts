import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

let sesClient: SESClient | null = null;

const getSESClient = () => {
  if (!sesClient) {
    console.log('🔍 Initializing AWS SES Client:');
    console.log('AWS_SES_REGION:', process.env.AWS_SES_REGION);
    console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
    console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
    console.log('AWS_SES_FROM_EMAIL:', process.env.AWS_SES_FROM_EMAIL);

    sesClient = new SESClient({
      region: process.env.AWS_SES_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return sesClient;
};

const FROM_EMAIL = process.env.AWS_SES_FROM_EMAIL || 'productionslaya@gmail.com';

interface SendEmailParams {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export const sendEmail = async ({ to, subject, htmlBody, textBody }: SendEmailParams): Promise<void> => {
  // Check if running in development without proper AWS credentials
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

  if (isDevelopment && !hasAwsCredentials) {
    console.log('📧 [DEV MODE] Email would be sent:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('HTML Body:', htmlBody.substring(0, 200) + '...');
    console.log('✅ Email logged in development mode (AWS credentials not configured)');
    return;
  }

  const params = {
    Source: FROM_EMAIL,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8',
        },
        ...(textBody && {
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        }),
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    await getSESClient().send(command);
    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error: any) {
    console.error('❌ Error sending email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export const sendProposalEmail = async (
  clientEmail: string,
  clientName: string,
  organizationName: string,
  proposalUrl: string,
  accessPin: string,
  projectName: string
): Promise<void> => {
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; }
        .pin-box { background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; border: 2px dashed #f59e0b; }
        .pin-label { font-size: 14px; color: #92400e; font-weight: 600; margin-bottom: 8px; }
        .pin-code { font-size: 32px; font-weight: 800; color: #b45309; letter-spacing: 4px; font-family: 'Courier New', monospace; }
        .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; background: #f9fafb; border-radius: 0 0 10px 10px; }
        .info-text { background: #eff6ff; padding: 15px; border-radius: 8px; color: #1e40af; font-size: 14px; margin: 20px 0; border-left: 4px solid #3b82f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ Your Proposal is Ready!</h1>
        </div>
        <div class="content">
          <h2>Hello ${clientName}! 👋</h2>
          <p>We're excited to share a personalized proposal from <strong>${organizationName}</strong> for your project: <strong>${projectName}</strong>.</p>
          
          <p>To view your proposal, you'll need the secure PIN below:</p>
          
          <div class="pin-box">
            <div class="pin-label">🔐 YOUR SECURE PIN</div>
            <div class="pin-code">${accessPin}</div>
          </div>
          
          <div class="info-text">
            💡 <strong>Pro Tip:</strong> Keep this PIN safe - you'll need it to access your proposal.
          </div>
          
          <p style="text-align: center;">
            <a href="${proposalUrl}" class="button">View My Proposal</a>
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${proposalUrl}" style="color: #6366f1; word-break: break-all;">${proposalUrl}</a>
          </p>
        </div>
        <div class="footer">
          <p>This proposal was sent by ${organizationName}</p>
          <p style="margin-top: 10px; font-size: 12px;">If you have any questions, please contact us directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Hello ${clientName}!

You have a new proposal from ${organizationName} for: ${projectName}

Your Secure PIN: ${accessPin}

View your proposal here: ${proposalUrl}

Keep your PIN safe - you'll need it to access your proposal.

If you have any questions, please contact ${organizationName} directly.
  `;

  await sendEmail({
    to: clientEmail,
    subject: `✨ Your Proposal from ${organizationName}`,
    htmlBody,
    textBody,
  });
};

export const sendActivationEmail = async (email: string, name: string, token: string): Promise<void> => {
  const activationUrl = `${process.env.FRONTEND_URL}/setup-password?token=${token}`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Laya Studio</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}! 👋</h2>
          <p>You've been added as a team member at Laya Studio. To get started, please set up your password by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${activationUrl}" class="button" style="color: white !important;">Set Up Your Password</a>
          </div>
          
          <div class="divider"></div>
          
          <p style="color: #6b7280; font-size: 13px;">
            <strong>⏰ This link will expire in 24 hours</strong> for security reasons.
          </p>
          
          <p style="color: #6b7280; font-size: 13px;">
            If you didn't expect this email, please ignore it or contact your administrator.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Laya Studio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Welcome to Laya Studio!

Hello ${name},

You've been added as a team member. Please set up your password by visiting:
${activationUrl}

This link will expire in 24 hours.

If you didn't expect this email, please ignore it.

© ${new Date().getFullYear()} Laya Studio
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to Laya Studio - Set Up Your Password',
    htmlBody,
    textBody,
  });
};

export const sendPasswordResetEmail = async (email: string, name: string, token: string): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/setup-password?token=${token}`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Reset Your Password</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Or copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #6366f1; word-break: break-all;">${resetUrl}</a>
          </p>
          
          <div class="divider"></div>
          
          <p style="color: #6b7280; font-size: 13px;">
            <strong>⏰ This link will expire in 24 hours</strong> for security reasons.
          </p>
          
          <p style="color: #6b7280; font-size: 13px;">
            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Laya Studio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Reset Your Password

Hello ${name},

We received a request to reset your password. Please visit:
${resetUrl}

This link will expire in 24 hours.

If you didn't request this, please ignore this email.

© ${new Date().getFullYear()} Laya Studio
  `;

  await sendEmail({
    to: email,
    subject: '🔐 Reset Your Laya Studio Password',
    htmlBody,
    textBody,
  });
};
