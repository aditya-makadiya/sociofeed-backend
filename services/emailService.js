import transporter from '../config/nodemailer.js';
import { BASE_URL } from '../config/constants.js';
import { AppError } from '../middleware/errorHandler.js';

export const sendActivationEmail = async (user, token) => {
  const activationLink = `${BASE_URL}/activate/${token}`;
  const mailOptions = {
    from: process.env.NODEMAILER_EMAIL,
    to: user.email,
    subject: 'Activate Your SocioFeed Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2>Welcome to SocioFeed, ${user.username}!</h2>
        <p>Thank you for registering. Please activate your account by clicking the button below:</p>
        <a href="${activationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Activate Account</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${activationLink}">${activationLink}</a></p>
        <p>This link will expire in 1 hour. If you didn't register, please ignore this email.</p>
        <p>Best regards,<br>The SocioFeed Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new AppError('Failed to send activation email', error, 500);
  }
};

export const sendResetPasswordEmail = async (user, token) => {
  const resetLink = `${BASE_URL}/auth/reset-password/${token}`;
  const mailOptions = {
    from: process.env.NODEMAILER_EMAIL,
    to: user.email,
    subject: 'Reset Your SocioFeed Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <h2>Hello, ${user.username}!</h2>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link will expire in 1 hour. If you didn't request a reset, please ignore this email.</p>
        <p>Best regards,<br>The SocioFeed Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new AppError('Failed to send password reset email', error, 500);
  }
};
