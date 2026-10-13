import { NextFunction, Request, Response } from "express";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import { hash, compare } from "bcrypt";
import { createToken } from "../utils/token-manager.js";
import { COOKIE_NAME, getCookieOptions } from "../utils/constants.js";
import { generateNumericOtp, sendOtpEmail } from "../utils/mail-service.js";

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await User.find();
    return res.status(200).json({ message: "OK", users });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error?.message });
  }
};

/**
 * Sends OTP to user's email for registration or password reset
 */
export const sendOtpController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, purpose } = req.body as {
      email: string;
      purpose: "signup" | "reset_password";
    };

    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (purpose === "signup") {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "This email is already registered. Please login." });
      }
    } else if (purpose === "reset_password") {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (!existingUser) {
        return res.status(404).json({
          message: "No registered account found with this email address.",
        });
      }
    }

    // Generate 6-digit OTP
    const otp = generateNumericOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any existing unused OTPs for this email and purpose
    await Otp.deleteMany({ email: cleanEmail, purpose });

    await Otp.create({
      email: cleanEmail,
      otp,
      purpose,
      expiresAt,
      isVerified: false,
    });

    const mailResult = await sendOtpEmail(cleanEmail, otp, purpose);

    return res.status(200).json({
      message: mailResult.message,
      sentViaSmtp: mailResult.sentViaSmtp,
      previewOtp: mailResult.previewOtp,
    });
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    return res
      .status(500)
      .json({ message: "Failed to send OTP", cause: error?.message });
  }
};

/**
 * Verifies email OTP
 */
export const verifyOtpController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, purpose } = req.body as {
      email: string;
      otp: string;
      purpose: "signup" | "reset_password";
    };

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanOtp = (otp || "").trim();

    if (!cleanEmail || !cleanOtp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      purpose,
      otp: cleanOtp,
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res
        .status(400)
        .json({ message: "Verification code has expired. Please request a new one." });
    }

    otpRecord.isVerified = true;
    await otpRecord.save();

    return res.status(200).json({
      message: "Email verified successfully",
      verified: true,
    });
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return res
      .status(500)
      .json({ message: "Failed to verify OTP", cause: error?.message });
  }
};

/**
 * User Signup with mobile number, password confirmation, and mandatory email OTP verification
 */
export const userSignup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, mobile, password, confirmPassword } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanMobile = (mobile || "").trim();

    if (!cleanEmail || !name || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already registered" });
    }

    // Verify that OTP was verified
    const verifiedOtp = await Otp.findOne({
      email: cleanEmail,
      purpose: "signup",
      isVerified: true,
    });

    if (!verifiedOtp) {
      return res.status(400).json({
        message: "Please verify your email address using OTP before signing up",
      });
    }

    const hashedPassword = await hash(password, 10);
    const user = new User({
      name,
      email: cleanEmail,
      mobile: cleanMobile,
      password: hashedPassword,
      isVerified: true,
    });
    await user.save();

    // Clean up OTP
    await Otp.deleteMany({ email: cleanEmail });

    // Clear and set auth cookie
    res.clearCookie(COOKIE_NAME, getCookieOptions());

    const token = createToken(user._id.toString(), user.email, "7d");
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    res.cookie(COOKIE_NAME, token, getCookieOptions(expires));

    return res.status(201).json({
      message: "OK",
      name: user.name,
      email: user.email,
      mobile: user.mobile,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error?.message });
  }
};

/**
 * User Login with optional mobile and confirm password verification
 */
export const userLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, mobile, password, confirmPassword } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanMobile = (mobile || "").trim();

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    let user = null;
    if (cleanEmail) {
      user = await User.findOne({ email: cleanEmail });
    } else if (cleanMobile) {
      user = await User.findOne({ mobile: cleanMobile });
    }

    if (!user) {
      return res.status(401).json({ message: "User not registered" });
    }

    const isPasswordCorrect = await compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(403).json({ message: "Incorrect Password" });
    }

    // If user didn't have mobile saved before, save it now
    if (cleanMobile && !user.mobile) {
      user.mobile = cleanMobile;
      await user.save();
    }

    // Create token and store cookie
    res.clearCookie(COOKIE_NAME, getCookieOptions());

    const token = createToken(user._id.toString(), user.email, "7d");
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    res.cookie(COOKIE_NAME, token, getCookieOptions(expires));

    return res.status(200).json({
      message: "OK",
      name: user.name,
      email: user.email,
      mobile: user.mobile,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error?.message });
  }
};

/**
 * Reset password using email OTP verification
 */
export const resetPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, mobile, password, confirmPassword } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanMobile = (mobile || "").trim();

    if (!cleanEmail || !password) {
      return res
        .status(400)
        .json({ message: "Email and new password are required" });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Verify OTP was verified for reset_password
    const verifiedOtp = await Otp.findOne({
      email: cleanEmail,
      purpose: "reset_password",
      isVerified: true,
    });

    if (!verifiedOtp) {
      return res.status(400).json({
        message: "Please verify the OTP sent to your email before resetting password",
      });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const hashedPassword = await hash(password, 10);
    user.password = hashedPassword;
    if (cleanMobile) {
      user.mobile = cleanMobile;
    }
    await user.save();

    // Clean up OTPs
    await Otp.deleteMany({ email: cleanEmail, purpose: "reset_password" });

    return res.status(200).json({
      message: "Password reset successfully. You can now login.",
    });
  } catch (error: any) {
    console.error("Error resetting password:", error);
    return res
      .status(500)
      .json({ message: "Failed to reset password", cause: error?.message });
  }
};

export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).send("User not registered OR Token malfunctioned");
    }
    if (user._id.toString() !== res.locals.jwtData.id) {
      return res.status(401).send("Permissions didn't match");
    }
    return res.status(200).json({
      message: "OK",
      name: user.name,
      email: user.email,
      mobile: user.mobile,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error?.message });
  }
};

export const userLogout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).send("User not registered OR Token malfunctioned");
    }
    if (user._id.toString() !== res.locals.jwtData.id) {
      return res.status(401).send("Permissions didn't match");
    }

    res.clearCookie(COOKIE_NAME, getCookieOptions());

    return res.status(200).json({
      message: "OK",
      name: user.name,
      email: user.email,
      mobile: user.mobile,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error?.message });
  }
};
