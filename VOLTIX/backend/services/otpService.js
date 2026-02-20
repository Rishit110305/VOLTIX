import nodemailer from "nodemailer";
import ExpressError from "../middlewares/expressError.js";

class OTPService {
  constructor() {
    // Email transporter with better error handling
    this.transporter = null;
    this.emailEnabled = false;
    
    try {
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASSWORD;
      
      if (!emailUser || !emailPass) {
        console.warn("⚠️ EMAIL_USER or EMAIL_PASSWORD not set - Email service disabled");
        console.log("📧 OTPs will only be logged to console");
      } else {
        this.transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });

        // Verify transporter
        this.transporter.verify((err) => {
          if (err) {
            console.error("⚠️ Mailer connection failed:", err.message);
            console.log("📧 Common issue: Gmail requires 'App Password' not regular password");
            console.log("📧 Generate App Password: https://myaccount.google.com/apppasswords");
            this.emailEnabled = false;
          } else {
            console.log("✅ Mailer ready to send emails");
            this.emailEnabled = true;
          }
        });
      }
    } catch (error) {
      console.error("⚠️ Failed to initialize mailer:", error.message);
      this.emailEnabled = false;
    }

    // In-memory OTP storage (in production, use Redis)
    this.otpStore = new Map();
  }

  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Store OTP with expiration
  storeOTP(userId, otp, type, expirationMinutes = 10) {
    const key = `${userId}_${type}`;
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    this.otpStore.set(key, {
      otp,
      expiresAt,
      attempts: 0,
      maxAttempts: 3,
    });

    // Auto cleanup after expiration
    setTimeout(
      () => {
        this.otpStore.delete(key);
      },
      expirationMinutes * 60 * 1000,
    );
  }

  // Verify OTP
  verifyOTP(userId, inputOTP, type) {
    const key = `${userId}_${type}`;
    const otpData = this.otpStore.get(key);

    console.log('🔍 OTP Verification Debug:', {
      userId,
      inputOTP,
      type,
      key,
      otpExists: !!otpData,
      storedOTP: otpData?.otp,
      attempts: otpData?.attempts,
      maxAttempts: otpData?.maxAttempts,
      expiresAt: otpData?.expiresAt,
      currentTime: new Date(),
      isExpired: otpData ? new Date() > otpData.expiresAt : 'N/A'
    });

    if (!otpData) {
      console.log('❌ OTP not found for key:', key);
      return false; // OTP not found or expired
    }

    // Check if expired
    if (new Date() > otpData.expiresAt) {
      console.log('❌ OTP expired for key:', key);
      this.otpStore.delete(key);
      return false;
    }

    // Check attempts
    if (otpData.attempts >= otpData.maxAttempts) {
      console.log('❌ Too many attempts for key:', key);
      this.otpStore.delete(key);
      return false;
    }

    // Increment attempts
    otpData.attempts++;

    // Check OTP
    if (otpData.otp === inputOTP) {
      console.log('✅ OTP verified successfully for key:', key);
      this.otpStore.delete(key); // Remove OTP after successful verification
      return true;
    }

    console.log('❌ OTP mismatch for key:', key, 'Expected:', otpData.otp, 'Got:', inputOTP);
    return false;
  }

  // Generate and send OTP
  async generateAndSendOTP(userId, email, type) {
    const otp = this.generateOTP();
    this.storeOTP(userId, otp, type);

    // ALWAYS log OTP to console (for backup)
    console.log("\n========================================");
    console.log("🔐 OTP GENERATED");
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Type: ${type}`);
    console.log(`   OTP: ${otp}`);
    console.log(`   Email Service: ${this.emailEnabled ? 'ENABLED' : 'DISABLED'}`);
    console.log("========================================\n");

    try {
      // Try to send email if service is available
      if (!this.transporter || !this.emailEnabled) {
        console.log("⚠️ Email service unavailable, OTP logged to console above");
        return {
          success: true,
          message: "OTP generated (check server logs for OTP)",
        };
      }

      const emailContent = this.getEmailContent(type, otp);

      console.log(`📧 Attempting to send OTP email to ${email}...`);

      await this.transporter.sendMail({
        from: `"EV Copilot" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      console.log(`✅ OTP email sent successfully to ${email}`);
      return {
        success: true,
        message: "OTP sent to your email",
      };
    } catch (error) {
      console.error("❌ OTP email failed:", error.message);
      console.log("⚠️ Email failed but OTP is available in console above");
      
      // Don't throw error - OTP is already stored and logged
      return {
        success: true,
        message: "OTP generated (email delivery failed, check server logs)",
        emailError: error.message
      };
    }
  }

  // Get email content based on type
  getEmailContent(type, otp) {
    const baseStyle = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">EV Copilot</h1>
            <p style="color: #666; margin: 5px 0;">Smart EV Charging Solutions</p>
          </div>
    `;

    const footerStyle = `
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p style="margin-top: 20px;">
              <strong>EV Copilot Team</strong><br>
              Smart Charging for a Sustainable Future
            </p>
          </div>
        </div>
      </div>
    `;

    switch (type) {
      case "email_verification":
        return {
          subject: "Verify Your EV Copilot Account",
          html: `
            ${baseStyle}
            <h2 style="color: #333; text-align: center;">Welcome to EV Copilot!</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Thank you for joining our smart EV charging platform. To complete your registration and start finding the best charging stations, please verify your email address.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; display: inline-block;">
                <p style="margin: 0; color: #333; font-size: 14px;">Your verification code is:</p>
                <h1 style="color: #16a34a; font-size: 36px; margin: 10px 0; letter-spacing: 5px; font-family: monospace;">${otp}</h1>
              </div>
            </div>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Once verified, you'll be able to:
            </p>
            <ul style="color: #666; font-size: 16px; line-height: 1.8;">
              <li>Find nearby charging stations</li>
              <li>Get exclusive incentive offers</li>
              <li>Track your charging history</li>
              <li>Monitor your carbon savings</li>
            </ul>
            ${footerStyle}
          `,
        };

      case "password_reset":
        return {
          subject: "Reset Your EV Copilot Password",
          html: `
            ${baseStyle}
            <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              We received a request to reset your EV Copilot account password. Use the code below to create a new password.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; display: inline-block;">
                <p style="margin: 0; color: #333; font-size: 14px;">Your password reset code is:</p>
                <h1 style="color: #d97706; font-size: 36px; margin: 10px 0; letter-spacing: 5px; font-family: monospace;">${otp}</h1>
              </div>
            </div>
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
              <p style="margin: 0; color: #dc2626; font-size: 14px;">
                <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.
              </p>
            </div>
            ${footerStyle}
          `,
        };

      case "phone_verification":
        return {
          subject: "Verify Your Phone Number 📱",
          html: `
            ${baseStyle}
            <h2 style="color: #333; text-align: center;">Phone Verification 📱</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Please verify your phone number to enhance your account security and receive important charging notifications.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; display: inline-block;">
                <p style="margin: 0; color: #333; font-size: 14px;">Your verification code is:</p>
                <h1 style="color: #2563eb; font-size: 36px; margin: 10px 0; letter-spacing: 5px; font-family: monospace;">${otp}</h1>
              </div>
            </div>
            ${footerStyle}
          `,
        };

      default:
        return {
          subject: "Your EV Copilot Verification Code",
          html: `
            ${baseStyle}
            <h2 style="color: #333; text-align: center;">Verification Code</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Your verification code is:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <h1 style="color: #16a34a; font-size: 36px; margin: 10px 0; letter-spacing: 5px; font-family: monospace;">${otp}</h1>
            </div>
            ${footerStyle}
          `,
        };
    }
  }

  // Clean expired OTPs (call this periodically)
  cleanExpiredOTPs() {
    const now = new Date();
    for (const [key, data] of this.otpStore.entries()) {
      if (now > data.expiresAt) {
        this.otpStore.delete(key);
      }
    }
  }

  // Get OTP status (for debugging)
  getOTPStatus(userId, type) {
    const key = `${userId}_${type}`;
    const otpData = this.otpStore.get(key);

    if (!otpData) {
      return { exists: false };
    }

    return {
      exists: true,
      expiresAt: otpData.expiresAt,
      attempts: otpData.attempts,
      maxAttempts: otpData.maxAttempts,
      isExpired: new Date() > otpData.expiresAt,
    };
  }
}

// Create singleton instance
const otpService = new OTPService();

// Clean expired OTPs every 5 minutes
setInterval(
  () => {
    otpService.cleanExpiredOTPs();
  },
  5 * 60 * 1000,
);

export default otpService;
