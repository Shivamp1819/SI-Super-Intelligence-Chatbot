import nodemailer from "nodemailer";
import { config } from "dotenv";
import dns from "node:dns";

// Force IPv4 DNS lookups to avoid ENETUNREACH on cloud containers without IPv6 routes
if (dns.setDefaultResultOrder) {
  try {
    dns.setDefaultResultOrder("ipv4first");
  } catch (e) {
    // ignore
  }
}

/**
 * Generates a random 6-digit numeric OTP.
 */
export const generateNumericOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Creates a nodemailer transporter using env variables if configured.
 * @param targetPort Optional explicit port (defaults to configured SMTP_PORT or 587)
 */
const createTransporter = (targetPort?: number) => {
  // Ensure the latest environment variables from .env are loaded
  try {
    config({ override: true });
  } catch (e) {
    // ignore
  }

  const host = (process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com").trim();
  const configuredPort = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT);
  const port = targetPort || configuredPort || 587;
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
      family: 4, // CRITICAL: Force IPv4 socket to prevent ENETUNREACH on Render/cloud hosts
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 7000,
      tls: {
        rejectUnauthorized: false,
      },
    } as any);
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
        console.log(`[MAIL SERVICE] Email sent to ${recipientEmail} via Resend (HTTPS)`);
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

  // 2. Try Nodemailer with IPv4 on primary port, then alternative port (587 <-> 465)
  const user = (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim();
  const pass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || "").replace(/\s+/g, "");

  if (user && pass) {
    const configuredPort = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587;
    const portsToTry = configuredPort === 465 ? [465, 587] : [587, 465];

    for (const port of portsToTry) {
      const transporter = createTransporter(port);
      if (transporter) {
        try {
          await transporter.sendMail({
            from: `"SI Super Intelligence" <${user}>`,
            to: recipientEmail,
            subject,
            html: htmlContent,
          });

          console.log(`[MAIL SERVICE] Email sent to ${recipientEmail} via SMTP (port ${port}, IPv4)`);
          return {
            success: true,
            sentViaSmtp: true,
            message: `Verification code sent to ${recipientEmail}`,
          };
        } catch (err: any) {
          console.warn(`[MAIL SERVICE] SMTP attempt failed on port ${port} (IPv4):`, err?.message || err);
        }
      }
    }
  }

  // Fallback: If cloud host blocks SMTP and Resend not configured
  console.log("=================================================");
  console.log(`[OTP SERVICE] EMAIL: ${recipientEmail}`);
  console.log(`[OTP SERVICE] VERIFICATION OTP: ${otp}`);
  console.log("=================================================");

  return {
    success: true,
    sentViaSmtp: false,
    previewOtp: otp,
    message: "Verification code generated! Please enter the code below.",
  };
};
