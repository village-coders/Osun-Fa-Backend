import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export const sendEmail = async (options: EmailOptions) => {
    try {
        const data = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'OsunFA@theyoungpioneers.com',
            to: options.to,
            subject: options.subject,
            text: options.text || '',
            html: options.html || ''
        });

        console.log('Email sent successfully via Resend:', data);
        return data;
    } catch (error) {
        console.error('Error sending email via Resend:', error);
        throw error;
    }
};

export const sendVerificationEmail = async (email: string, token: string, role: string) => {
    const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 4000}`;
    const verificationUrl = `${baseUrl}/api/portal-auth/verify-email?token=${token}&role=${role}`;

    const subject = 'Verify your Osun FA Portal Account';
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #025928; text-align: center;">Welcome to Osun FA Portal</h2>
            <p>Hello,</p>
            <p>Thank you for registering on the Osun FA Portal. Please verify your email address to activate your account.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background-color: #00ff88; color: #013618; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <hr style="border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #999;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
    `;

    return sendEmail({
        to: email,
        subject,
        html
    });
};

export const sendApprovalEmail = async (email: string, role: string, name: string) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const portalUrl = `${frontendUrl}/portal/login`;

    const subject = `Your Osun FA ${role.charAt(0).toUpperCase() + role.slice(1)} Account is Approved!`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #025928; text-align: center;">Account Approved</h2>
            <p>Hello ${name},</p>
            <p>Great news! Your ${role} registration on the Osun FA Portal has been officially <strong>Approved</strong>.</p>
            <p>You can now log in to the portal to access your dashboard and manage your profile.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${portalUrl}" style="background-color: #00ff88; color: #013618; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Portal</a>
            </div>
            <p>If you have any questions, please contact the Osun FA administration.</p>
            <hr style="border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #999;">Osun State Football Association</p>
        </div>
    `;

    return sendEmail({
        to: email,
        subject,
        html
    });
};
