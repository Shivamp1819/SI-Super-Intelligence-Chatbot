import nodemailer from "nodemailer";
import { config } from "dotenv";

/**
 * Generates a random 6-digit numeric OTP.
 */
export const generateNumericOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Creates a nodemailer transporter using env variables if configured.
 */
const createTransporter = () => {
  // Ensure the latest environment variables from .env are loaded
  try {
    config({ override: true });
  } catch (e) {
    // ignore
  }

  const host = (process.env.SMTP_HOST || process.env.EMAIL_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 465;
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  // Strip whitespace from passwords (Google App Passwords are often copied as "abcd efgh ijkl mnop")
  const pass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || "").replace(/\s+/g, "");

  if (user && pass) {
    const isSecure = port === 465;
    return nodemailer.createTransport({
      host: host || "smtp.gmail.com",
      port,
      secure: isSecure,
      auth: { user, pass },
      connectionTimeout: 6000,
      greetingTimeout: 6000,
      socketTimeout: 8000,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return null;
};

/**
 * Sends OTP to the specified email address.
 */
export const sendOtpEmail = async (
  recipientEmail: string,
  otp: string,
  purpose: "signup" | "reset_password"
): Promise<{
  success: boolean;
  sentViaSmtp: boolean;
  previewOtp?: string;
  message: string;
}> => {
  const subject =
    purpose === "signup"
      ? "SI Super Intelligence - Verify Your Email Address"
      : "SI Super Intelligence - Password Reset Verification Code";

  const purposeText =
    purpose === "signup"
      ? "Thank you for creating an account with SI Super Intelligence. Please enter the verification code below to complete your registration."
      : "We received a request to reset your password for SI Super Intelligence. Please enter the verification code below to proceed.";

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b151e; color: #ffffff; padding: 40px 20px; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid rgba(0, 255, 252, 0.2);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #00fffc; font-size: 26px; margin: 0; font-weight: 800; letter-spacing: 1px;">SI Super Intelligence</h1>
        <p style="color: rgba(255, 255, 255, 0.6); font-size: 13px; margin-top: 6px;">AI-Powered Conversational Assistant</p>
      </div>

      <div style="background-color: rgba(17, 29, 39, 0.85); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 24px; text-align: center;">
        <h3 style="color: #ffffff; margin-top: 0; font-size: 18px;">Email Verification Code</h3>
        <p style="color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.5;">${purposeText}</p>

        <div style="margin: 28px 0; background: rgba(0, 255, 252, 0.1); border: 2px dashed #00fffc; padding: 14px 24px; border-radius: 8px; display: inline-block;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #00fffc;">${otp}</span>
        </div>

        <p style="color: rgba(255, 255, 255, 0.5); font-size: 12px; margin-bottom: 0;">This code is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
      </div>

      <div style="text-align: center; margin-top: 24px; color: rgba(255, 255, 255, 0.4); font-size: 11px;">
        &copy; ${new Date().getFullYear()} SI Super Intelligence. If you did not request this, please ignore this email.
      </div>
    </div>
  `;

  // 1. Check for HTTPS-based Resend API (bypasses Render/cloud SMTP port blocks)
  const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || "SI Super Intelligence <onboarding@resend.dev>",
          to: [recipientEmail],
          subject,
          html: htmlContent,
        }),
      });

      if (res.ok) {
        console.log(`[MAIL SERVICE] Real email sent to ${recipientEmail} via Resend (HTTPS)`);
        return {
          success: true,
          sentViaSmtp: true,
          message: `Verification code sent to ${recipientEmail}`,
        };
      } else {
        const errorBody = await res.json().catch(() => ({}));
        console.error("[MAIL SERVICE] Resend API error response:", errorBody);
      }
    } catch (apiError: any) {
      console.error("[MAIL SERVICE] Resend API network error:", apiError?.message || apiError);
    }
  }

  // 2. Try Nodemailer SMTP
  const transporter = createTransporter();

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"SI Super Intelligence" <${
          process.env.SMTP_USER || process.env.EMAIL_USER || "no-reply@sichatbot.com"
        }>`,
        to: recipientEmail,
        subject,
        html: htmlContent,
      });

      console.log(`[MAIL SERVICE] Real email sent to ${recipientEmail} via SMTP`);
      return {
        success: true,
        sentViaSmtp: true,
        message: `Verification code sent to ${recipientEmail}`,
      };
    } catch (err: any) {
      console.error("[MAIL SERVICE] SMTP Transporter error:", err?.message || err);
      const isBadCredentials =
        err?.message?.includes("535") ||
        err?.message?.includes("BadCredentials") ||
        err?.code === "EAUTH";

      const failureNote = isBadCredentials
        ? "Google requires a 16-character App Password (myaccount.google.com/apppasswords)."
        : `Cloud SMTP timeout/blocked by host (${err?.message || "Check email credentials"}).`;

      return {
        success: true,
        sentViaSmtp: false,
        previewOtp: otp,
        message: `${failureNote} Verification code is ready below.`,
      };
    }
  }

  // Fallback when SMTP is not yet configured in .env
  console.log("=================================================");
  console.log(`[OTP SERVICE] EMAIL: ${recipientEmail}`);
  console.log(`[OTP SERVICE] VERIFICATION OTP: ${otp}`);
  console.log("NOTE: Add RESEND_API_KEY or EMAIL_USER/EMAIL_PASS for inbox delivery.");
  console.log("=================================================");

  return {
    success: true,
    sentViaSmtp: false,
    previewOtp: otp,
    message: "Email service not configured. Verification code provided below.",
  };
};
