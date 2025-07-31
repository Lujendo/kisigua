import { EmailService } from './emailService';
import {
  EmailLog,
  User,
  UserRole
} from '../types/auth';

export class EmailVerificationService {
  private emailService: EmailService;
  private db: D1Database;

  constructor(db: D1Database, resendApiKey: string) {
    this.db = db;
    this.emailService = new EmailService(resendApiKey);
  }

  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return crypto.randomUUID();
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(user: User): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Starting email verification process for user:', user.email);

      // Generate verification token
      const token = this.generateToken();
      const tokenId = this.generateId();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

      console.log('🔑 Generated verification token:', token.substring(0, 10) + '...');

      // Store token in database
      try {
        await this.db.prepare(`
          INSERT INTO email_verification_tokens (id, user_id, token, email, expires_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(tokenId, user.id, token, user.email, expiresAt).run();
        console.log('✅ Token stored in database');
      } catch (dbError) {
        console.error('❌ Failed to store token in database:', dbError);
        return { success: false, error: 'Failed to store verification token' };
      }

      // Update user with verification token (handle missing columns gracefully)
      try {
        await this.db.prepare(`
          UPDATE users
          SET email_verification_token = ?, email_verification_expires_at = ?
          WHERE id = ?
        `).bind(token, expiresAt, user.id).run();
        console.log('✅ User updated with verification token');
      } catch (dbError) {
        console.log('⚠️ Could not update user with verification token (columns may not exist):', dbError);
        // Continue anyway - the token is stored in the tokens table
      }

      // Send email
      console.log('📤 Sending verification email...');
      const emailResult = await this.emailService.sendVerificationEmail(
        user.email,
        token,
        user.firstName
      );

      console.log('📧 Email result:', emailResult);

      // Log email
      try {
        await this.logEmail({
          id: this.generateId(),
          userId: user.id,
          emailType: 'verification',
          recipientEmail: user.email,
          subject: 'Verify your Kisigua account',
          resendMessageId: emailResult.messageId,
          status: emailResult.success ? 'sent' : 'failed',
          errorMessage: emailResult.error,
          sentAt: new Date().toISOString()
        });
        console.log('✅ Email logged successfully');
      } catch (logError) {
        console.error('⚠️ Failed to log email (continuing anyway):', logError);
      }

      return emailResult;
    } catch (error) {
      console.error('❌ Send email verification error:', error);
      return { success: false, error: 'Failed to send verification email' };
    }
  }

  /**
   * Verify email token
   */
  async verifyEmail(token: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Find token in database
      const tokenResult = await this.db.prepare(`
        SELECT * FROM email_verification_tokens 
        WHERE token = ? AND used_at IS NULL AND expires_at > datetime('now')
      `).bind(token).first();

      if (!tokenResult) {
        return { success: false, error: 'Invalid or expired verification token' };
      }

      // Get user
      const userResult = await this.db.prepare(`
        SELECT * FROM users WHERE id = ?
      `).bind(tokenResult.user_id).first();

      if (!userResult) {
        return { success: false, error: 'User not found' };
      }

      // Mark token as used
      await this.db.prepare(`
        UPDATE email_verification_tokens 
        SET used_at = datetime('now')
        WHERE token = ?
      `).bind(token).run();

      // Update user as verified - handle case where email_verified column might not exist
      try {
        await this.db.prepare(`
          UPDATE users
          SET email_verified = true,
              email_verification_token = NULL,
              email_verification_expires_at = NULL
          WHERE id = ?
        `).bind(tokenResult.user_id).run();
      } catch (dbError) {
        // If email_verified column doesn't exist, just update the token fields
        console.log('email_verified column not found, updating available fields only');
        await this.db.prepare(`
          UPDATE users
          SET email_verification_token = NULL,
              email_verification_expires_at = NULL
          WHERE id = ?
        `).bind(tokenResult.user_id).run();
      }

      // Send welcome email
      await this.emailService.sendWelcomeEmail(
        userResult.email as string,
        userResult.first_name as string
      );

      // Log welcome email
      await this.logEmail({
        id: this.generateId(),
        userId: userResult.id as string,
        emailType: 'welcome',
        recipientEmail: userResult.email as string,
        subject: 'Welcome to Kisigua - Your sustainable community awaits!',
        status: 'sent',
        sentAt: new Date().toISOString()
      });

      return { 
        success: true, 
        user: {
          ...userResult,
          emailVerified: true
        } as User
      };
    } catch (error) {
      console.error('Verify email error:', error);
      return { success: false, error: 'Failed to verify email' };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Find user by email
      const userResult = await this.db.prepare(`
        SELECT * FROM users WHERE email = ? AND is_active = true
      `).bind(email).first();

      if (!userResult) {
        // Don't reveal if email exists for security
        return { success: true };
      }

      // Generate reset token
      const token = this.generateToken();
      const tokenId = this.generateId();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      // Store token in database
      await this.db.prepare(`
        INSERT INTO password_reset_tokens (id, user_id, token, email, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(tokenId, userResult.id, token, email, expiresAt).run();

      // Update user with reset token
      await this.db.prepare(`
        UPDATE users 
        SET password_reset_token = ?, password_reset_expires_at = ?
        WHERE id = ?
      `).bind(token, expiresAt, userResult.id).run();

      // Send email
      const emailResult = await this.emailService.sendPasswordResetEmail(
        email,
        token,
        userResult.first_name as string
      );

      // Log email
      await this.logEmail({
        id: this.generateId(),
        userId: userResult.id as string,
        emailType: 'password_reset',
        recipientEmail: email,
        subject: 'Reset your Kisigua password',
        resendMessageId: emailResult.messageId,
        status: emailResult.success ? 'sent' : 'failed',
        errorMessage: emailResult.error,
        sentAt: new Date().toISOString()
      });

      return emailResult;
    } catch (error) {
      console.error('Send password reset error:', error);
      return { success: false, error: 'Failed to send password reset email' };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Find token in database
      const tokenResult = await this.db.prepare(`
        SELECT * FROM password_reset_tokens 
        WHERE token = ? AND used_at IS NULL AND expires_at > datetime('now')
      `).bind(token).first();

      if (!tokenResult) {
        return { success: false, error: 'Invalid or expired reset token' };
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update user password
      await this.db.prepare(`
        UPDATE users 
        SET password_hash = ?, 
            password_reset_token = NULL, 
            password_reset_expires_at = NULL
        WHERE id = ?
      `).bind(hashedPassword, tokenResult.user_id).run();

      // Mark token as used
      await this.db.prepare(`
        UPDATE password_reset_tokens 
        SET used_at = datetime('now')
        WHERE token = ?
      `).bind(token).run();

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'Failed to reset password' };
    }
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Resending verification for email:', email);

      // Find user by email - first try with email_verified column
      let userResult;
      try {
        userResult = await this.db.prepare(`
          SELECT * FROM users WHERE email = ? AND is_active = true AND (email_verified = false OR email_verified IS NULL)
        `).bind(email).first();
        console.log('✅ User found with email_verified query');
      } catch (dbError) {
        // If email_verified column doesn't exist, fall back to simpler query
        console.log('⚠️ email_verified column not found, using fallback query');
        userResult = await this.db.prepare(`
          SELECT * FROM users WHERE email = ? AND is_active = true
        `).bind(email).first();
        console.log('✅ User found with fallback query');
      }

      if (!userResult) {
        console.log('❌ User not found in database for email:', email);
        return { success: false, error: 'User not found or already verified' };
      }

      console.log('👤 Found user:', { id: userResult.id, email: userResult.email });

      // Check if user is already verified (if column exists)
      if (userResult.email_verified === true) {
        console.log('⚠️ User email is already verified');
        return { success: false, error: 'Email is already verified' };
      }

      // Convert database user to User type
      const user: User = {
        id: userResult.id as string,
        email: userResult.email as string,
        password: userResult.password_hash as string,
        role: userResult.role as UserRole,
        firstName: userResult.first_name as string,
        lastName: userResult.last_name as string,
        emailVerified: false,
        isActive: Boolean(userResult.is_active),
        createdAt: userResult.created_at as string,
        updatedAt: userResult.updated_at as string,
        lastLoginAt: userResult.last_login_at as string
      };

      console.log('📧 Sending verification email to user:', user.firstName, user.email);

      // Send verification email
      const result = await this.sendEmailVerification(user);

      if (result.success) {
        console.log('✅ Verification email resent successfully');
      } else {
        console.log('❌ Failed to resend verification email:', result.error);
      }

      return result;
    } catch (error) {
      console.error('Resend verification error:', error);
      return { success: false, error: 'Failed to resend verification email' };
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      // Clean up expired verification tokens
      await this.db.prepare(`
        DELETE FROM email_verification_tokens 
        WHERE expires_at < datetime('now')
      `).run();

      // Clean up expired password reset tokens
      await this.db.prepare(`
        DELETE FROM password_reset_tokens 
        WHERE expires_at < datetime('now')
      `).run();

      // Clear expired tokens from users table
      await this.db.prepare(`
        UPDATE users 
        SET email_verification_token = NULL, 
            email_verification_expires_at = NULL
        WHERE email_verification_expires_at < datetime('now')
      `).run();

      await this.db.prepare(`
        UPDATE users 
        SET password_reset_token = NULL, 
            password_reset_expires_at = NULL
        WHERE password_reset_expires_at < datetime('now')
      `).run();
    } catch (error) {
      console.error('Cleanup expired tokens error:', error);
    }
  }

  /**
   * Log email activity
   */
  private async logEmail(emailLog: EmailLog): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO email_logs (
          id, user_id, email_type, recipient_email, subject, 
          resend_message_id, status, error_message, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        emailLog.id,
        emailLog.userId,
        emailLog.emailType,
        emailLog.recipientEmail,
        emailLog.subject,
        emailLog.resendMessageId,
        emailLog.status,
        emailLog.errorMessage,
        emailLog.sentAt
      ).run();
    } catch (error) {
      console.error('Log email error:', error);
    }
  }

  /**
   * Hash password using Web Crypto API
   */
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
