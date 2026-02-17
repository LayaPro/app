import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('EmailService');

let sesClient: SESClient | null = null;

const getSESClient = () => {
  if (!sesClient) {
    logger.info('Initializing AWS SES Client', {
      region: process.env.AWS_SES_REGION,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      fromEmail: process.env.AWS_SES_FROM_EMAIL
    });

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
    logger.info('[DEV MODE] Email would be sent', {
      to,
      subject,
      bodyPreview: htmlBody.substring(0, 100) + '...',
      mode: 'development'
    });
    return;
  }

  logger.info('Sending email', { to, subject });

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
    logger.info('Email sent successfully', { to, subject });
  } catch (error: any) {
    logger.error('Error sending email', {
      to,
      subject,
      error: error.message,
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

export const sendProjectWelcomeEmail = async (
  clientEmail: string,
  clientName: string,
  projectName: string,
  organizationName: string,
  accessCode: string,
  accessPin: string
): Promise<void> => {
  const customerAppUrl = process.env.CUSTOMER_APP_URL || 'http://localhost:5174';
  const portalUrl = `${customerAppUrl}/${accessCode}`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; margin: 0; padding: 20px; }
        .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
        .header p { color: rgba(255, 255, 255, 0.95); margin: 10px 0 0; font-size: 16px; }
        .content { padding: 40px 30px; }
        .welcome-text { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
        .info-box { background: #f3f4f6; border-left: 4px solid #6366f1; padding: 20px; margin: 25px 0; border-radius: 8px; }
        .info-box h3 { margin: 0 0 15px; color: #1f2937; font-size: 16px; }
        .credentials { background: white; padding: 15px; border-radius: 6px; margin-top: 15px; }
        .credential-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .credential-row:last-child { border-bottom: none; }
        .credential-label { color: #6b7280; font-size: 14px; }
        .credential-value { color: #1f2937; font-weight: 600; font-size: 16px; letter-spacing: 1px; }
        .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0; }
        .button:hover { background: linear-gradient(135deg, #4f46e5, #7c3aed); }
        .features { margin: 30px 0; }
        .feature { display: flex; align-items: flex-start; margin: 15px 0; }
        .feature-icon { width: 24px; height: 24px; margin-right: 15px; color: #6366f1; }
        .feature-text { color: #4b5563; font-size: 15px; }
        .divider { border-top: 1px solid #e5e7eb; margin: 30px 0; }
        .footer { text-align: center; padding: 30px; background: #f9fafb; color: #6b7280; font-size: 14px; }
        .footer a { color: #6366f1; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to ${organizationName}!</h1>
          <p>Your project "${projectName}" is now live</p>
        </div>
        <div class="content">
          <p class="welcome-text">
            Dear ${clientName},
          </p>
          
          <p>
            We're thrilled to welcome you onboard! Your project <strong>${projectName}</strong> has been created and we're excited to work with you to capture and preserve your special moments.
          </p>
          
          <div class="info-box">
            <h3>🔐 Your Customer Portal Access</h3>
            <p style="margin-bottom: 15px; color: #4b5563;">Use your PIN to access your dedicated customer portal:</p>
            <div class="credentials">
              <div class="credential-row">
                <span class="credential-label">Access PIN:</span>
                <span class="credential-value">${accessPin}</span>
              </div>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${portalUrl}" class="button">Access Your Portal</a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 20px;">
            Or visit: <a href="${portalUrl}" style="color: #6366f1;">${portalUrl}</a>
          </p>
          
          <div class="features">
            <h3 style="color: #1f2937; margin-bottom: 20px;">✨ What you can do in your portal:</h3>
            
            <div class="feature">
              <div class="feature-icon">📸</div>
              <div class="feature-text">View and approve photo selections</div>
            </div>
            
            <div class="feature">
              <div class="feature-icon">📚</div>
              <div class="feature-text">Review and approve album designs</div>
            </div>
            
            <div class="feature">
              <div class="feature-icon">💬</div>
              <div class="feature-text">Provide feedback and request changes</div>
            </div>
            
            <div class="feature">
              <div class="feature-icon">📊</div>
              <div class="feature-text">Track your project progress in real-time</div>
            </div>
            
            <div class="feature">
              <div class="feature-icon">📥</div>
              <div class="feature-text">Download final deliverables when ready</div>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <p style="color: #4b5563; font-size: 15px;">
            If you have any questions or need assistance, please don't hesitate to reach out to us. We're here to make your experience exceptional!
          </p>
          
          <p style="color: #4b5563; font-size: 15px; margin-top: 20px;">
            <strong>Best regards,</strong><br>
            The ${organizationName} Team
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${organizationName}. All rights reserved.</p>
          <p style="margin-top: 10px;">
            <a href="${portalUrl}">Customer Portal</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Welcome to ${organizationName}!

Dear ${clientName},

We're thrilled to welcome you onboard! Your project "${projectName}" has been created and we're excited to work with you.

Your Customer Portal Access:
Access PIN: ${accessPin}

Portal URL: ${portalUrl}

What you can do in your portal:
- View and approve photo selections
- Review and approve album designs
- Provide feedback and request changes
- Track your project progress in real-time
- Download final deliverables when ready

If you have any questions, please don't hesitate to reach out.

Best regards,
The ${organizationName} Team

© ${new Date().getFullYear()} ${organizationName}
  `;

  await sendEmail({
    to: clientEmail,
    subject: `🎉 Welcome Onboard - ${projectName} | ${organizationName}`,
    htmlBody,
    textBody,
  });
};

export const sendAlbumPublishedEmail = async (
  clientEmail: string,
  clientName: string,
  eventName: string,
  projectName: string,
  organizationName: string,
  accessCode: string,
  accessPin: string
): Promise<void> => {
  const customerAppUrl = process.env.CUSTOMER_APP_URL || 'http://localhost:5174';
  const portalUrl = `${customerAppUrl}/${accessCode}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; margin: 0; padding: 20px; }
        .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 26px; font-weight: 700; }
        .header p { color: rgba(255, 255, 255, 0.95); margin: 10px 0 0; font-size: 15px; }
        .content { padding: 36px 30px; }
        .info-box { background: #f3f4f6; border-left: 4px solid #6366f1; padding: 18px; margin: 22px 0; border-radius: 8px; }
        .info-box h3 { margin: 0 0 10px; color: #1f2937; font-size: 16px; }
        .credentials { background: white; padding: 12px; border-radius: 6px; margin-top: 12px; }
        .credential-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
        .credential-label { color: #6b7280; font-size: 14px; }
        .credential-value { color: #1f2937; font-weight: 600; font-size: 16px; letter-spacing: 1px; }
        .button { display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 22px 0; }
        .button:hover { background: linear-gradient(135deg, #4f46e5, #7c3aed); }
        .footer { text-align: center; padding: 26px; background: #f9fafb; color: #6b7280; font-size: 14px; }
        .footer a { color: #6366f1; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📸 Your Images Are Ready!</h1>
          <p>${organizationName} has shared your ${eventName} gallery</p>
        </div>
        <div class="content">
          <p>Dear ${clientName},</p>
          <p>
            Great news! Your studio has published the images for <strong>${eventName}</strong>
            in your project <strong>${projectName}</strong>.
          </p>

          <div class="info-box">
            <h3>🔐 Access Your Gallery</h3>
            <p style="margin-bottom: 10px; color: #4b5563;">Use your PIN to access the gallery:</p>
            <div class="credentials">
              <div class="credential-row">
                <span class="credential-label">Access PIN:</span>
                <span class="credential-value">${accessPin}</span>
              </div>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${portalUrl}" class="button">View Your Gallery</a>
          </div>

          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 18px;">
            Or visit: <a href="${portalUrl}" style="color: #6366f1;">${portalUrl}</a>
          </p>

          <p style="color: #4b5563; font-size: 15px; margin-top: 24px;">
            If you have any questions, just reply to this email and we’ll be happy to help.
          </p>

          <p style="color: #4b5563; font-size: 15px; margin-top: 18px;">
            <strong>Best regards,</strong><br />
            The ${organizationName} Team
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${organizationName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Your Images Are Ready!

Dear ${clientName},

${organizationName} has published the images for ${eventName} in your project ${projectName}.

Access your gallery:
PIN: ${accessPin}

Portal URL: ${portalUrl}

If you have any questions, just reply to this email.

Best regards,
The ${organizationName} Team

© ${new Date().getFullYear()} ${organizationName}
  `;

  await sendEmail({
    to: clientEmail,
    subject: `📸 ${eventName} Gallery Published | ${organizationName}`,
    htmlBody,
    textBody,
  });
};

export const sendAlbumPdfUploadedEmail = async (
  clientEmail: string,
  clientName: string,
  eventNames: string,
  projectName: string,
  organizationName: string,
  accessCode: string,
  accessPin: string
): Promise<void> => {
  const customerAppUrl = process.env.CUSTOMER_APP_URL || 'http://localhost:5174';
  const portalUrl = `${customerAppUrl}/${accessCode}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; margin: 0; padding: 20px; }
        .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 26px; font-weight: 700; }
        .header p { color: rgba(255, 255, 255, 0.95); margin: 10px 0 0; font-size: 15px; }
        .content { padding: 36px 30px; }
        .info-box { background: #f3f4f6; border-left: 4px solid #6366f1; padding: 18px; margin: 22px 0; border-radius: 8px; }
        .info-box h3 { margin: 0 0 10px; color: #1f2937; font-size: 16px; }
        .credentials { background: white; padding: 12px; border-radius: 6px; margin-top: 12px; }
        .credential-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
        .credential-label { color: #6b7280; font-size: 14px; }
        .credential-value { color: #1f2937; font-weight: 600; font-size: 16px; letter-spacing: 1px; }
        .button { display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 22px 0; }
        .button:hover { background: linear-gradient(135deg, #4f46e5, #7c3aed); }
        .footer { text-align: center; padding: 26px; background: #f9fafb; color: #6b7280; font-size: 14px; }
        .footer a { color: #6366f1; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📘 Album Proofs Ready for Review</h1>
          <p>${organizationName} has uploaded album proofs</p>
        </div>
        <div class="content">
          <p>Dear ${clientName},</p>
          <p>
            Your album proofs are ready for review for <strong>${eventNames}</strong>
            in your project <strong>${projectName}</strong>.
          </p>

          <div class="info-box">
            <h3>🔐 Review Access</h3>
            <p style="margin-bottom: 10px; color: #4b5563;">Use your PIN to review the album proofs:</p>
            <div class="credentials">
              <div class="credential-row">
                <span class="credential-label">Access PIN:</span>
                <span class="credential-value">${accessPin}</span>
              </div>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${portalUrl}" class="button">Review Album Proofs</a>
          </div>

          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 18px;">
            Or visit: <a href="${portalUrl}" style="color: #6366f1;">${portalUrl}</a>
          </p>

          <p style="color: #4b5563; font-size: 15px; margin-top: 24px;">
            Please review and share your feedback so we can finalize your album.
          </p>

          <p style="color: #4b5563; font-size: 15px; margin-top: 18px;">
            <strong>Best regards,</strong><br />
            The ${organizationName} Team
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${organizationName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Album Proofs Ready for Review

Dear ${clientName},

Your album proofs are ready for review for ${eventNames} in your project ${projectName}.

Review access:
PIN: ${accessPin}

Portal URL: ${portalUrl}

Please review and share your feedback so we can finalize your album.

Best regards,
The ${organizationName} Team

© ${new Date().getFullYear()} ${organizationName}
  `;

  await sendEmail({
    to: clientEmail,
    subject: `📘 Album Proofs Ready | ${organizationName}`,
    htmlBody,
    textBody,
  });
};

export const sendAlbumApprovedEmail = async (
  clientEmail: string,
  clientName: string,
  eventName: string,
  projectName: string,
  organizationName: string
): Promise<void> => {
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; margin: 0; padding: 20px; }
        .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 26px; font-weight: 700; }
        .header p { color: rgba(255, 255, 255, 0.95); margin: 10px 0 0; font-size: 15px; }
        .content { padding: 36px 30px; }
        .footer { text-align: center; padding: 26px; background: #f9fafb; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Album Approved</h1>
          <p>Printing will begin soon</p>
        </div>
        <div class="content">
          <p>Dear ${clientName},</p>
          <p>
            Thanks for approving the album for <strong>${eventName}</strong>
            in your project <strong>${projectName}</strong>.
          </p>
          <p>
            We’ll now initiate printing and keep you updated on the progress.
          </p>
          <p style="color: #4b5563; font-size: 15px; margin-top: 18px;">
            <strong>Best regards,</strong><br />
            The ${organizationName} Team
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${organizationName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Album Approved

Dear ${clientName},

Thanks for approving the album for ${eventName} in your project ${projectName}.

We’ll now initiate printing and keep you updated on the progress.

Best regards,
The ${organizationName} Team

© ${new Date().getFullYear()} ${organizationName}
  `;

  await sendEmail({
    to: clientEmail,
    subject: `✅ Album Approved | ${organizationName}`,
    htmlBody,
    textBody,
  });
};

export const sendProjectCompletedEmail = async (
  clientEmail: string,
  clientName: string,
  projectName: string,
  organizationName: string
): Promise<void> => {
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; margin: 0; padding: 20px; }
        .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 26px; font-weight: 700; }
        .header p { color: rgba(255, 255, 255, 0.95); margin: 10px 0 0; font-size: 15px; }
        .content { padding: 36px 30px; }
        .footer { text-align: center; padding: 26px; background: #f9fafb; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Project Completed</h1>
          <p>Thank you for choosing ${organizationName}</p>
        </div>
        <div class="content">
          <p>Dear ${clientName},</p>
          <p>
            Your project <strong>${projectName}</strong> has been completed. Thank you for trusting ${organizationName} with your memories.
          </p>
          <p>
            It was a pleasure working with you. If you need anything in the future, we’re always here to help.
          </p>
          <p style="color: #4b5563; font-size: 15px; margin-top: 18px;">
            <strong>With gratitude,</strong><br />
            The ${organizationName} Team
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${organizationName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Project Completed

Dear ${clientName},

Your project ${projectName} has been completed. Thank you for trusting ${organizationName} with your memories.

It was a pleasure working with you. If you need anything in the future, we’re always here to help.

With gratitude,
The ${organizationName} Team

© ${new Date().getFullYear()} ${organizationName}
  `;

  await sendEmail({
    to: clientEmail,
    subject: `🎉 Project Completed | ${organizationName}`,
    htmlBody,
    textBody,
  });
};
