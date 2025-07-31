import { Resend } from 'resend';

// Email service using Resend API for secure email verification
export class EmailService {
  private resend: Resend;
  private fromEmail: string;
  private apiKey: string;

  constructor(apiKey: string, fromEmail: string = 'Kisigua <onboarding@resend.dev>') {
    this.apiKey = apiKey;
    this.resend = new Resend(apiKey);
    this.fromEmail = fromEmail;

    // Log API key status for debugging
    console.log('EmailService initialized with API key:', apiKey ? (apiKey.startsWith('re_') ? 'VALID_FORMAT' : 'INVALID_FORMAT') : 'MISSING');
  }

  /**
   * Send email verification email to user
   */
  async sendVerificationEmail(
    to: string,
    verificationToken: string,
    userName: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Check if API key is properly configured
      if (!this.apiKey || !this.apiKey.startsWith('re_')) {
        console.error('❌ Invalid or missing Resend API key:', this.apiKey ? 'INVALID_FORMAT' : 'MISSING');
        return {
          success: false,
          error: 'Email service not properly configured. Please contact support.'
        };
      }

      // Check if this is still a placeholder key
      if (this.apiKey.includes('PLACEHOLDER') || this.apiKey.includes('development')) {
        console.log('🧪 Development mode: Simulating email send success');
        console.log('📧 Would send verification email to:', to);
        console.log('🔗 Verification URL would be: https://kisigua.com/verify-email?token=' + verificationToken);
        return {
          success: true,
          messageId: 'dev-simulation-' + Date.now(),
          error: undefined
        };
      }

      const verificationUrl = `https://kisigua.com/verify-email?token=${verificationToken}`;

      console.log('📧 Sending verification email to:', to);
      console.log('🔗 Verification URL:', verificationUrl);
      console.log('🔑 Using API key format:', this.apiKey.substring(0, 10) + '...');

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: 'Verify your Kisigua account',
        html: this.getVerificationEmailTemplate(userName, verificationUrl),
      });

      if (error) {
        console.error('❌ Resend API error:', error);
        console.error('❌ Full error details:', JSON.stringify(error, null, 2));
        return { success: false, error: error.message || 'Unknown Resend API error' };
      }

      console.log('✅ Verification email sent successfully:', data);
      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error('❌ Email service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send verification email'
      };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string, 
    resetToken: string, 
    userName: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const resetUrl = `https://kisigua.com/reset-password?token=${resetToken}`;
      
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: 'Reset your Kisigua password',
        html: this.getPasswordResetEmailTemplate(userName, resetUrl),
      });

      if (error) {
        console.error('Resend API error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error: 'Failed to send password reset email' };
    }
  }

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(
    to: string, 
    userName: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: 'Welcome to Kisigua - Your sustainable community awaits!',
        html: this.getWelcomeEmailTemplate(userName),
      });

      if (error) {
        console.error('Resend API error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error: 'Failed to send welcome email' };
    }
  }

  /**
   * Send batch emails (for notifications, newsletters, etc.)
   */
  async sendBatchEmails(
    emails: Array<{
      to: string;
      subject: string;
      html: string;
    }>
  ): Promise<{ success: boolean; results?: any[]; error?: string }> {
    try {
      const emailData = emails.map(email => ({
        from: this.fromEmail,
        to: [email.to],
        subject: email.subject,
        html: email.html,
      }));

      const { data, error } = await this.resend.batch.send(emailData);

      if (error) {
        console.error('Resend batch API error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, results: data as unknown as any[] };
    } catch (error) {
      console.error('Batch email service error:', error);
      return { success: false, error: 'Failed to send batch emails' };
    }
  }

  /**
   * Test Resend API connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      // Check API key format
      if (!this.apiKey || !this.apiKey.startsWith('re_')) {
        return {
          success: false,
          error: 'Invalid or missing API key format',
          details: {
            hasApiKey: !!this.apiKey,
            correctFormat: this.apiKey?.startsWith('re_') || false,
            isPlaceholder: this.apiKey?.includes('PLACEHOLDER') || false
          }
        };
      }

      // Try to send a test email to a test address
      const testResult = await this.resend.emails.send({
        from: this.fromEmail,
        to: ['test@resend.dev'], // Resend's test email address
        subject: 'Kisigua API Connection Test',
        html: '<p>This is a test email to verify the Resend API connection is working.</p>'
      });

      if (testResult.error) {
        return {
          success: false,
          error: testResult.error.message,
          details: testResult.error
        };
      }

      return {
        success: true,
        details: {
          messageId: testResult.data?.id,
          apiKeyValid: true,
          connectionWorking: true
        }
      };
    } catch (error) {
      console.error('Resend connection test error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown connection error',
        details: { error }
      };
    }
  }

  /**
   * Retrieve email status
   */
  async getEmailStatus(emailId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await this.resend.emails.get(emailId);

      if (error) {
        console.error('Resend get email error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get email status error:', error);
      return { success: false, error: 'Failed to retrieve email status' };
    }
  }

  /**
   * Update scheduled email
   */
  async updateScheduledEmail(
    emailId: string, 
    scheduledAt: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await this.resend.emails.update({
        id: emailId,
        scheduledAt,
      });

      if (error) {
        console.error('Resend update email error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Update email error:', error);
      return { success: false, error: 'Failed to update scheduled email' };
    }
  }

  /**
   * Cancel scheduled email
   */
  async cancelScheduledEmail(emailId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.resend.emails.cancel(emailId);

      if (error) {
        console.error('Resend cancel email error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Cancel email error:', error);
      return { success: false, error: 'Failed to cancel scheduled email' };
    }
  }

  /**
   * Email verification template
   */
  private getVerificationEmailTemplate(userName: string, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your Kisigua account</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981, #3b82f6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Kisigua!</h1>
            <p style="color: #e5f3ff; margin: 10px 0 0 0; font-size: 16px;">Your sustainable community awaits</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0;">Hi ${userName}!</h2>
            
            <p>Thank you for joining Kisigua, the platform for discovering sustainable locations and eco-friendly businesses in your community.</p>
            
            <p>To complete your registration and start exploring organic farms, water sources, and sustainable businesses, please verify your email address:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="color: #3b82f6; word-break: break-all; font-size: 14px;">${verificationUrl}</p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              This verification link will expire in 24 hours. If you didn't create an account with Kisigua, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 12px;">
            <p>© 2025 Kisigua. Building sustainable communities together.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Password reset email template
   */
  private getPasswordResetEmailTemplate(userName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your Kisigua password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444, #f97316); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
            <p style="color: #fef2f2; margin: 10px 0 0 0; font-size: 16px;">Secure your Kisigua account</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0;">Hi ${userName}!</h2>
            
            <p>We received a request to reset your password for your Kisigua account.</p>
            
            <p>Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="color: #3b82f6; word-break: break-all; font-size: 14px;">${resetUrl}</p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              This reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 12px;">
            <p>© 2025 Kisigua. Building sustainable communities together.</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Welcome email template
   */
  private getWelcomeEmailTemplate(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Kisigua!</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981, #3b82f6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to Kisigua!</h1>
            <p style="color: #e5f3ff; margin: 10px 0 0 0; font-size: 16px;">Your sustainable journey starts here</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0;">Hi ${userName}!</h2>
            
            <p>🌱 Your email has been verified and your Kisigua account is now active! Welcome to our community of sustainability enthusiasts.</p>
            
            <h3 style="color: #10b981;">What you can do now:</h3>
            <ul style="color: #475569;">
              <li>🔍 <strong>Discover sustainable locations</strong> - Find organic farms, water sources, and eco-friendly businesses near you</li>
              <li>📍 <strong>Use enhanced location search</strong> - Search by city, region, or specific areas with our new advanced filters</li>
              <li>💚 <strong>Create your own listings</strong> - Share sustainable businesses and locations with the community</li>
              <li>⭐ <strong>Save favorites</strong> - Build your personal collection of sustainable places</li>
              <li>🗺️ <strong>Explore with maps</strong> - Use our interactive maps to discover nearby sustainable options</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://kisigua.com/dashboard" 
                 style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                Start Exploring
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #64748b; font-size: 14px;">
              Need help getting started? Visit our <a href="https://kisigua.com/help" style="color: #3b82f6;">Help Center</a> or reply to this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 12px;">
            <p>© 2025 Kisigua. Building sustainable communities together.</p>
            <p>🌍 Together, we're making the world more sustainable, one location at a time.</p>
          </div>
        </body>
      </html>
    `;
  }
}
