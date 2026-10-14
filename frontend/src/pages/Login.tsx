import React, { useEffect, useState } from "react";
import { IoIosLogIn } from "react-icons/io";
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
} from "@mui/material";
import CustomizedInput from "../components/shared/CustomizedInput";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  sendOtp,
  verifyOtp,
  resetUserPassword,
} from "../helpers/api-communicator";
import { FiCheckCircle, FiArrowLeft, FiKey } from "react-icons/fi";
import DynamicRobot from "../components/robot/DynamicRobot";
import { useThemeMode } from "../context/ThemeContext";

const Login = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { isDark } = useThemeMode();

  // Mode: "login" or "forgot_password"
  const [mode, setMode] = useState<"login" | "forgot_password">("login");

  // Login form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginConfirmPassword, setLoginConfirmPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Forgot password form states
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [isResetOtpSent, setIsResetOtpSent] = useState(false);
  const [isResetOtpSending, setIsResetOtpSending] = useState(false);
  const [isResetOtpVerifying, setIsResetOtpVerifying] = useState(false);
  const [isResetEmailVerified, setIsResetEmailVerified] = useState(false);
  const [resetCountdown, setResetCountdown] = useState(0);
  const [previewResetOtp, setPreviewResetOtp] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (resetCountdown > 0) {
      timer = setTimeout(() => setResetCountdown(resetCountdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resetCountdown]);

  // Login submit handler
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!loginEmail.trim()) {
      toast.error("Please enter email address");
      return;
    }

    if (!loginPassword) {
      toast.error("Please enter password");
      return;
    }

    if (
      loginConfirmPassword &&
      loginPassword !== loginConfirmPassword
    ) {
      toast.error("Passwords do not match. Please re-enter carefully.");
      return;
    }

    try {
      setIsLoggingIn(true);
      toast.loading("Signing In", { id: "login" });
      await auth?.login(
        loginEmail.trim(),
        loginPassword,
        loginConfirmPassword
      );
      toast.success("Signed In Successfully", { id: "login" });
      navigate("/chat");
    } catch (error: unknown) {
      console.log(error);
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || "Signing In Failed", { id: "login" });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Forgot Password: Send OTP
  const handleSendResetOtp = async () => {
    const cleanEmail = resetEmail.trim();
    if (!cleanEmail) {
      toast.error("Please enter your registered email address");
      return;
    }

    try {
      setIsResetOtpSending(true);
      const data = await sendOtp(cleanEmail, "reset_password");
      setIsResetOtpSent(true);
      setResetCountdown(60);
      if (data.previewOtp) {
        setPreviewResetOtp(data.previewOtp);
      }
      toast.success(data.message || "OTP sent successfully!");
    } catch (error: unknown) {
      console.error(error);
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || "Failed to send reset OTP");
    } finally {
      setIsResetOtpSending(false);
    }
  };

  // Forgot Password: Verify OTP
  const handleVerifyResetOtp = async () => {
    if (!resetOtp.trim()) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    try {
      setIsResetOtpVerifying(true);
      const data = await verifyOtp(
        resetEmail.trim(),
        resetOtp.trim(),
        "reset_password"
      );
      if (data.verified) {
        setIsResetEmailVerified(true);
        toast.success("Email verified successfully!", { icon: "✅" });
      }
    } catch (error: unknown) {
      console.error(error);
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || "Invalid or expired verification code");
    } finally {
      setIsResetOtpVerifying(false);
    }
  };

  // Forgot Password: Submit Reset Password
  const handleResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!resetEmail.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!isResetEmailVerified) {
      toast.error("Please verify the OTP sent to your email first");
      return;
    }

    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match. Please re-enter carefully.");
      return;
    }

    try {
      setIsResetting(true);
      toast.loading("Resetting Password...", { id: "resetpw" });
      await resetUserPassword(
        resetEmail.trim(),
        newPassword,
        confirmNewPassword
      );
      toast.success("Password reset successfully! You can now login.", {
        id: "resetpw",
      });

      // Switch back to login mode with email pre-filled
      setLoginEmail(resetEmail.trim());
      setLoginPassword("");
      setLoginConfirmPassword("");
      setMode("login");
    } catch (error: unknown) {
      console.error(error);
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || "Failed to reset password", { id: "resetpw" });
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    if (auth?.user) {
      return navigate("/chat");
    }
  }, [auth, navigate]);

  return (
    <Box
      width={"100%"}
      minHeight={"calc(100vh - 85px)"}
      display="flex"
      flex={1}
      alignItems={"center"}
      justifyContent={"space-between"}
      sx={{
        px: { xs: 2, md: 4, lg: 8 },
        py: 2,
        boxSizing: "border-box",
      }}
    >
      {/* Interactive 3D Dynamic Robot */}
      <Box
        display={{ md: "flex", sm: "none", xs: "none" }}
        alignItems={"center"}
        justifyContent={"center"}
        flex={1}
        pl={{ md: 2, lg: 6 }}
      >
        <DynamicRobot
          width={{ md: "340px", lg: "380px" }}
          maxHeight="520px"
          bubbleText={
            mode === "login"
              ? "⚡ Welcome back! Ready to chat?"
              : "🔒 Let's get your password reset!"
          }
          enableScrollReaction={true}
          enableMouseTracking={true}
          showBubble={true}
        />
      </Box>

      {/* Form Container: Proportionally adjusted & shifted to the right */}
      <Box
        display={"flex"}
        flex={1}
        justifyContent={{ md: "flex-end", xs: "center" }}
        alignItems={"center"}
        pr={{ md: 4, lg: 10, xl: 14 }}
      >
        {mode === "login" ? (
          /* ================= LOGIN FORM ================= */
          <Box
            component="form"
            onSubmit={handleLoginSubmit}
            sx={{
              margin: 0,
              p: { xs: 2.2, sm: 3.2 },
              bgcolor: isDark ? "rgb(17,29,39)" : "#ffffff",
              boxShadow: isDark
                ? "0 10px 40px rgba(0, 0, 0, 0.5)"
                : "0 12px 40px rgba(15, 23, 42, 0.08)",
              borderRadius: "14px",
              border: isDark
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid rgba(2, 132, 199, 0.2)",
              width: "100%",
              maxWidth: "390px",
              boxSizing: "border-box",
              transition: "all 0.3s ease",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="h5"
                textAlign="center"
                fontWeight={700}
                color={isDark ? "white" : "#0f172a"}
                mb={0.3}
              >
                Login
              </Typography>
              <Typography
                variant="caption"
                display="block"
                textAlign="center"
                color={isDark ? "rgba(255,255,255,0.6)" : "#64748b"}
                mb={1.5}
              >
                Enter your credentials to access your chats
              </Typography>

              {/* Email Address */}
              <CustomizedInput
                type="email"
                name="email"
                label="Email Address"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                width="100%"
              />

              {/* Password */}
              <CustomizedInput
                type="password"
                name="password"
                label="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                width="100%"
              />

              {/* Re-enter Password */}
              <CustomizedInput
                type="password"
                name="confirmPassword"
                label="Re-enter Password"
                value={loginConfirmPassword}
                onChange={(e) => setLoginConfirmPassword(e.target.value)}
                width="100%"
              />

              {/* Password Match Indicator if re-enter is filled */}
              {loginConfirmPassword && (
                <Typography
                  sx={{
                    fontSize: "11px",
                    color:
                      loginPassword === loginConfirmPassword
                        ? "#00e676"
                        : "#ff5252",
                    mt: -0.2,
                    mb: 0.5,
                    px: 0.5,
                  }}
                >
                  {loginPassword === loginConfirmPassword
                    ? "✓ Passwords match"
                    : "✗ Passwords do not match"}
                </Typography>
              )}

              {/* Forgot Password Link */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mt: 0.5,
                  mb: 1,
                }}
              >
                <Button
                  onClick={() => setMode("forgot_password")}
                  sx={{
                    color: isDark ? "#00fffc" : "#0284c7",
                    textTransform: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                    p: 0,
                    minWidth: "auto",
                    ":hover": {
                      textDecoration: "underline",
                      bgcolor: "transparent",
                    },
                  }}
                >
                  Forgot Password?
                </Button>
              </Box>

              {/* Login Button */}
              <Button
                type="submit"
                fullWidth
                disabled={isLoggingIn}
                sx={{
                  py: 1.1,
                  mt: 0.5,
                  borderRadius: 2,
                  bgcolor: isDark ? "#00fffc" : "#0284c7",
                  color: isDark ? "#001a1c" : "#ffffff",
                  fontWeight: 700,
                  fontSize: "14.5px",
                  textTransform: "none",
                  boxShadow: isDark
                    ? "0 4px 16px rgba(0, 255, 252, 0.25)"
                    : "0 4px 16px rgba(2, 132, 199, 0.25)",
                  ":hover": {
                    bgcolor: isDark ? "white" : "#0369a1",
                    color: isDark ? "black" : "#ffffff",
                    transform: "translateY(-1px)",
                  },
                }}
                endIcon={<IoIosLogIn size={18} />}
              >
                {isLoggingIn ? (
                  <CircularProgress size={16} sx={{ color: isDark ? "#001a1c" : "#ffffff" }} />
                ) : (
                  "Login"
                )}
              </Button>

              {/* Link to Signup */}
              <Box textAlign="center" mt={1.8}>
                <Typography variant="caption" color={isDark ? "rgba(255, 255, 255, 0.6)" : "#64748b"}>
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    style={{
                      color: isDark ? "#00fffc" : "#0284c7",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Sign Up here
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Box>
        ) : (
          /* ================= FORGOT / RESET PASSWORD FORM ================= */
          <Box
            component="form"
            onSubmit={handleResetSubmit}
            sx={{
              margin: 0,
              p: { xs: 2.2, sm: 3.2 },
              bgcolor: isDark ? "rgb(17,29,39)" : "#ffffff",
              boxShadow: isDark
                ? "0 10px 40px rgba(0, 0, 0, 0.5)"
                : "0 12px 40px rgba(15, 23, 42, 0.08)",
              borderRadius: "14px",
              border: isDark
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid rgba(2, 132, 199, 0.2)",
              width: "100%",
              maxWidth: "390px",
              boxSizing: "border-box",
              transition: "all 0.3s ease",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {/* Back to Login Button */}
              <Button
                startIcon={<FiArrowLeft size={14} />}
                onClick={() => setMode("login")}
                sx={{
                  color: isDark ? "rgba(255, 255, 255, 0.7)" : "#475569",
                  textTransform: "none",
                  fontSize: "12px",
                  alignSelf: "flex-start",
                  p: 0,
                  mb: 1,
                  ":hover": { color: isDark ? "#00fffc" : "#0284c7", bgcolor: "transparent" },
                }}
              >
                Back to Login
              </Button>

              <Typography
                variant="h5"
                textAlign="center"
                fontWeight={700}
                color="white"
                mb={0.3}
              >
                Reset Password
              </Typography>
              <Typography
                variant="caption"
                display="block"
                textAlign="center"
                color="rgba(255,255,255,0.6)"
                mb={1.5}
              >
                Enter your details to receive an OTP and reset your password
              </Typography>

              {/* Registered Email Input with Sized, Clear Send OTP Button */}
              <Box sx={{ position: "relative", width: "100%" }}>
                <CustomizedInput
                  type="email"
                  name="resetEmail"
                  label="Registered Email"
                  value={resetEmail}
                  disabled={isResetEmailVerified}
                  onChange={(e) => {
                    setResetEmail(e.target.value);
                    setIsResetEmailVerified(false);
                    setIsResetOtpSent(false);
                  }}
                  required
                  width="100%"
                  endAdornment={
                    isResetEmailVerified ? (
                      <Chip
                        icon={<FiCheckCircle size={15} color="#00e676" />}
                        label="Verified"
                        size="small"
                        sx={{
                          bgcolor: "rgba(0, 230, 118, 0.15)",
                          color: "#00e676",
                          border: "1px solid #00e676",
                          fontWeight: 700,
                          fontSize: "12px",
                          height: "26px",
                          px: 0.5,
                        }}
                      />
                    ) : (
                      <Button
                        size="small"
                        onClick={handleSendResetOtp}
                        disabled={
                          isResetOtpSending ||
                          resetCountdown > 0 ||
                          !resetEmail
                        }
                        sx={{
                          color:
                            isResetOtpSending ||
                            resetCountdown > 0 ||
                            !resetEmail
                              ? "rgba(255,255,255,0.4)"
                              : "#001a1c",
                          bgcolor:
                            isResetOtpSending ||
                            resetCountdown > 0 ||
                            !resetEmail
                              ? "rgba(255,255,255,0.08)"
                              : "#00fffc",
                          border:
                            isResetOtpSending ||
                            resetCountdown > 0 ||
                            !resetEmail
                              ? "1px solid rgba(255,255,255,0.15)"
                              : "none",
                          fontSize: "12px",
                          fontWeight: 700,
                          textTransform: "none",
                          px: 1.5,
                          py: 0.5,
                          minWidth: "auto",
                          borderRadius: 1.5,
                          boxShadow:
                            isResetOtpSending ||
                            resetCountdown > 0 ||
                            !resetEmail
                              ? "none"
                              : "0 2px 8px rgba(0, 255, 252, 0.3)",
                          ":hover": {
                            bgcolor:
                              isResetOtpSending ||
                              resetCountdown > 0 ||
                              !resetEmail
                                ? "rgba(255,255,255,0.08)"
                                : "white",
                            color: "black",
                          },
                        }}
                      >
                        {isResetOtpSending ? (
                          <CircularProgress
                            size={13}
                            sx={{ color: "#00fffc" }}
                          />
                        ) : resetCountdown > 0 ? (
                          `${resetCountdown}s`
                        ) : isResetOtpSent ? (
                          "Resend"
                        ) : (
                          "Send OTP"
                        )}
                      </Button>
                    )
                  }
                />
              </Box>

              {/* OTP Row */}
              {isResetOtpSent && !isResetEmailVerified && (
                <>
                  {previewResetOtp && (
                    <Box
                      onClick={() => setResetOtp(previewResetOtp)}
                      sx={{
                        cursor: "pointer",
                        p: 0.9,
                        my: 0.5,
                        borderRadius: 2,
                        bgcolor: "rgba(0, 255, 252, 0.12)",
                        border: "1px dashed #00fffc",
                        textAlign: "center",
                        transition: "all 0.2s ease",
                        ":hover": { bgcolor: "rgba(0, 255, 252, 0.22)" },
                      }}
                      title="Click to auto-fill code"
                    >
                      <Typography
                        sx={{
                          fontSize: "12px",
                          color: "#00fffc",
                          fontWeight: 700,
                        }}
                      >
                        OTP Code: <span style={{ letterSpacing: 3, fontSize: "14px" }}>{previewResetOtp}</span> (Click to fill)
                      </Typography>
                    </Box>
                  )}
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      alignItems: "center",
                      my: 0.5,
                      p: 1,
                      borderRadius: 2,
                      bgcolor: "rgba(0, 255, 252, 0.05)",
                      border: "1px solid rgba(0, 255, 252, 0.2)",
                    }}
                  >
                    <CustomizedInput
                      type="text"
                      name="resetOtp"
                      label="6-Digit OTP"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      width="100%"
                      placeholder="123456"
                    />
                    <Button
                      onClick={handleVerifyResetOtp}
                      disabled={isResetOtpVerifying || !resetOtp}
                      variant="contained"
                      size="small"
                      sx={{
                        bgcolor: "#00fffc",
                        color: "#001a1c",
                        fontWeight: 700,
                        textTransform: "none",
                        borderRadius: 1.5,
                        px: 1.8,
                        py: 1,
                        fontSize: "12px",
                        whiteSpace: "nowrap",
                        ":hover": { bgcolor: "white" },
                      }}
                    >
                      {isResetOtpVerifying ? (
                        <CircularProgress size={14} sx={{ color: "#001a1c" }} />
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </Box>
                </>
              )}

              {/* Enter New Password */}
              <CustomizedInput
                type="password"
                name="newPassword"
                label="Enter New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                width="100%"
              />

              {/* Re-enter New Password */}
              <CustomizedInput
                type="password"
                name="confirmNewPassword"
                label="Re-enter New Password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                width="100%"
              />

              {/* Password Match Indicator */}
              {confirmNewPassword && (
                <Typography
                  sx={{
                    fontSize: "11px",
                    color:
                      newPassword === confirmNewPassword
                        ? "#00e676"
                        : "#ff5252",
                    mt: -0.2,
                    mb: 0.5,
                    px: 0.5,
                  }}
                >
                  {newPassword === confirmNewPassword
                    ? "✓ Passwords match"
                    : "✗ Passwords do not match"}
                </Typography>
              )}

              {/* Submit Reset Password Button */}
              <Button
                type="submit"
                fullWidth
                disabled={isResetting || !isResetEmailVerified}
                sx={{
                  py: 1.1,
                  mt: 1.5,
                  borderRadius: 2,
                  bgcolor: "#00fffc",
                  color: "#001a1c",
                  fontWeight: 700,
                  fontSize: "14.5px",
                  textTransform: "none",
                  boxShadow: "0 4px 16px rgba(0, 255, 252, 0.25)",
                  ":hover": {
                    bgcolor: "white",
                    color: "black",
                    transform: "translateY(-1px)",
                  },
                }}
                endIcon={<FiKey size={16} />}
              >
                {isResetting ? (
                  <CircularProgress size={16} sx={{ color: "#001a1c" }} />
                ) : (
                  "Reset Password"
                )}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Login;
