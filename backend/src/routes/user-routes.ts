import { Router } from "express";
import {
  getAllUsers,
  resetPasswordController,
  sendOtpController,
  userLogin,
  userLogout,
  userSignup,
  verifyOtpController,
  verifyUser,
} from "../controllers/user-controllers.js";
import {
  loginValidator,
  otpSendValidator,
  otpVerifyValidator,
  resetPasswordValidator,
  signupValidator,
  validate,
} from "../utils/validators.js";
import { verifyToken } from "../utils/token-manager.js";

const userRoutes = Router();

userRoutes.get("/", getAllUsers);
userRoutes.post("/send-otp", validate(otpSendValidator), sendOtpController);
userRoutes.post("/verify-otp", validate(otpVerifyValidator), verifyOtpController);
userRoutes.post("/signup", validate(signupValidator), userSignup);
userRoutes.post("/login", validate(loginValidator), userLogin);
userRoutes.post(
  "/reset-password",
  validate(resetPasswordValidator),
  resetPasswordController
);
userRoutes.get("/auth-status", verifyToken, verifyUser);
userRoutes.get("/logout", verifyToken, userLogout);

export default userRoutes;
