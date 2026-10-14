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
import { sendOtp, verifyOtp } from "../helpers/api-communicator";
import { FiCheckCircle } from "react-icons/fi";

const Signup = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // OTP Verification states
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  const [previewOtp, setPreviewOtp] = useState<string | null>(null);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [otpCountdown]);

  const handleSendOtp = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      toast.error("Please enter your email address first");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setIsOtpSending(true);
      const data = await sendOtp(cleanEmail, "signup");
      setIsOtpSent(true);
      setOtpCountdown(60);
      if (data.previewOtp) {
        setPreviewOtp(data.previewOtp);
      }
      toast.success(data.message || "OTP sent successfully!");
    } catch (error: unknown) {
      console.error(error);
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || "Failed to send verification code");
    } finally {
      setIsOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    try {
      setIsOtpVerifying(true);
      const data = await verifyOtp(email.trim(), otp.trim(), "signup");
      if (data.verified) {
        setIsEmailVerified(true);
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
      setIsOtpVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!isEmailVerified) {
      toast.error("Please verify your email address using OTP before signing up");
      return;
    }

    if (!password) {
      toast.error("Password is required");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match. Please re-enter carefully.");
      return;
    }

    try {
      toast.loading("Signing Up", { id: "signup" });
      await auth?.signup(name, email, password, confirmPassword);
      toast.success("Signed Up Successfully", { id: "signup" });
      navigate("/chat");
    } catch (error: unknown) {
      console.log(error);
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || "Signing Up Failed", { id: "signup" });
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
      {/* Robot Image on Left Side */}
      <Box
        display={{ md: "flex", sm: "none", xs: "none" }}
        alignItems={"center"}
        justifyContent={"center"}
        flex={1}
        pl={{ md: 2, lg: 6 }}
      >
        <img
          src="airobot.png"
          alt="Robot"
          style={{
            width: "360px",
            maxHeight: "500px",
            objectFit: "contain",
            filter: "drop-shadow(0 10px 25px rgba(0, 255, 252, 0.22))",
          }}
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
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            margin: 0,
            p: { xs: 2.2, sm: 3.2 },
            bgcolor: "rgb(17,29,39)",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            width: "100%",
            maxWidth: "390px",
            boxSizing: "border-box",
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
              color="white"
              mb={0.3}
            >
              Sign Up
            </Typography>
            <Typography
              variant="caption"
              display="block"
              textAlign="center"
              color="rgba(255,255,255,0.6)"
              mb={1.5}
            >
              Create your account with verified credentials
            </Typography>

            {/* Name Input */}
            <CustomizedInput
              type="text"
              name="name"
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              width="100%"
            />

            {/* Email Address Input with Sized, Clear Send OTP Button */}
            <Box sx={{ position: "relative", width: "100%" }}>
              <CustomizedInput
                type="email"
                name="email"
                label="Email Address"
                value={email}
                disabled={isEmailVerified}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsEmailVerified(false);
                  setIsOtpSent(false);
                }}
                required
                width="100%"
                endAdornment={
                  isEmailVerified ? (
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
                      onClick={handleSendOtp}
                      disabled={isOtpSending || otpCountdown > 0 || !email}
                      sx={{
                        color:
                          isOtpSending || otpCountdown > 0 || !email
                            ? "rgba(255,255,255,0.4)"
                            : "#001a1c",
                        bgcolor:
                          isOtpSending || otpCountdown > 0 || !email
                            ? "rgba(255,255,255,0.08)"
                            : "#00fffc",
                        border:
                          isOtpSending || otpCountdown > 0 || !email
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
                          isOtpSending || otpCountdown > 0 || !email
                            ? "none"
                            : "0 2px 8px rgba(0, 255, 252, 0.3)",
                        ":hover": {
                          bgcolor:
                            isOtpSending || otpCountdown > 0 || !email
                              ? "rgba(255,255,255,0.08)"
                              : "white",
                          color: "black",
                        },
                      }}
                    >
                      {isOtpSending ? (
                        <CircularProgress size={13} sx={{ color: "#00fffc" }} />
                      ) : otpCountdown > 0 ? (
                        `${otpCountdown}s`
                      ) : isOtpSent ? (
                        "Resend"
                      ) : (
                        "Send OTP"
                      )}
                    </Button>
                  )
                }
              />
            </Box>

            {/* OTP Input & Verification Row */}
            {isOtpSent && !isEmailVerified && (
              <>
                {previewOtp && (
                  <Box
                    onClick={() => setOtp(previewOtp)}
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
                      OTP Code: <span style={{ letterSpacing: 3, fontSize: "14px" }}>{previewOtp}</span> (Click to fill)
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
                  name="otp"
                  label="6-Digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  width="100%"
                  placeholder="123456"
                />
                <Button
                  onClick={handleVerifyOtp}
                  disabled={isOtpVerifying || !otp}
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
                  {isOtpVerifying ? (
                    <CircularProgress size={14} sx={{ color: "#001a1c" }} />
                  ) : (
                    "Verify"
                  )}
                </Button>
              </Box>
            </>
          )}

            {/* Password Input */}
            <CustomizedInput
              type="password"
              name="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              width="100%"
            />

            {/* Re-enter Password Input */}
            <CustomizedInput
              type="password"
              name="confirmPassword"
              label="Re-enter Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              width="100%"
            />

            {/* Password Match Indicator */}
            {confirmPassword && (
              <Typography
                sx={{
                  fontSize: "11px",
                  color: password === confirmPassword ? "#00e676" : "#ff5252",
                  mt: -0.2,
                  mb: 0.5,
                  px: 0.5,
                }}
              >
                {password === confirmPassword
                  ? "✓ Passwords match"
                  : "✗ Passwords do not match"}
              </Typography>
            )}

            {/* Signup Submit Button */}
            <Button
              type="submit"
              fullWidth
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
              endIcon={<IoIosLogIn size={18} />}
            >
              Sign Up
            </Button>

            {/* Link to Login */}
            <Box textAlign="center" mt={1.8}>
              <Typography variant="caption" color="rgba(255, 255, 255, 0.6)">
                Already have an account?{" "}
                <Link
                  to="/login"
                  style={{
                    color: "#00fffc",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Login here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Signup;
