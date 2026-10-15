import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  Fade,
  Slide,
} from "@mui/material";
import {
  FiX,
  FiVolume2,
  FiVolumeX,
  FiMic,
  FiSend,
  FiRotateCcw,
  FiMaximize2,
  FiMinimize2,
  FiSmile,
  FiZap,
  FiFeather,
  FiCompass,
  FiRadio,
} from "react-icons/fi";
import { IoMdSend } from "react-icons/io";
import { useThemeMode } from "../../context/ThemeContext";
import { sendChatRequest } from "../../helpers/api-communicator";
import {
  speakWithIndianFemaleVoice,
  previewIndianFemaleVoice,
  stopSpeaking,
} from "../../helpers/indianVoiceSynthesizer";
import toast from "react-hot-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  time?: string;
}

interface RobotPersona {
  id: string;
  name: string;
  title: string;
  badge: string;
  accentColor: string;
  glowColor: string;
  avatarIcon: string;
  greeting: string;
  starters: string[];
}

const NOVA_PERSONA: RobotPersona = {
  id: "nova",
  name: "Nova",
  title: "AI Conversational Companion",
  badge: "Free-Talk Companion",
  accentColor: "#a855f7",
  glowColor: "rgba(168, 85, 247, 0.5)",
  avatarIcon: "✨",
  greeting:
    "Namaste, main aapki kaise madad kar sakti hoon? / Hello, how may I help you?",
  starters: [
    "Aaj ka din thoda busy tha, let's talk and relax!",
    "How are you doing today? Kuch mazedaar baat batao!",
    "नमस्ते! आप कैसी हैं? मुझे कुछ अच्छी बातें बताइए",
    "I need a little positivity & motivation right now",
    "Dil khol kar baat karte hain — ask me something curious!",
  ],
};

export const RobotCompanionBox: React.FC = () => {
  const { isDark } = useThemeMode();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [handsFree, setHandsFree] = useState<boolean>(false);
  const [robotConversationId, setRobotConversationId] = useState<string | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0); // 1.0 = base 1.20x fast

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const currentPersona = NOVA_PERSONA;

  // Initialize welcome message when opened
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: NOVA_PERSONA.greeting,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isSending]);

  // Handle Text-to-Speech using high, sweet Indian female voice
  const speakRobotMessage = (text: string) => {
    if (!autoSpeak) return;

    speakWithIndianFemaleVoice(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
        if (handsFree && !isListening) {
          startVoiceRecognition();
        }
      },
      onError: () => setIsSpeaking(false),
      pitchMultiplier: 1.02,
      rateMultiplier: speedMultiplier,
    });
  };

  // Toggle Voice Recognition with en-IN (Indian English, Hinglish, & Hindi phonetics)
  const startVoiceRecognition = () => {
    const windowWithSpeech = window as any;
    const SpeechRecognitionClass =
      windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome/Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN"; // Tuned for Indian English, Hinglish, & Hindi accents

      recognition.onstart = () => {
        setIsListening(true);
        stopSpeaking();
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
          handleSendMessage(transcript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.debug("Robot mic error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("Mic start failed", e);
      setIsListening(false);
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputValue).trim();
    if (!textToSend || isSending) return;

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Append user message
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: textToSend, time: nowStr },
    ];
    setMessages(newMessages);
    setInputValue("");
    setIsSending(true);

    try {
      // Call backend with the robot persona agent!
      const data = await sendChatRequest(
        textToSend,
        undefined,
        robotConversationId || undefined,
        "nova"
      );

      if (data?.conversationId) {
        setRobotConversationId(data.conversationId);
      }

      const replyContent =
        data?.chats && data.chats.length > 0
          ? data.chats[data.chats.length - 1].content
          : "I hear you loud and clear! Tell me more about that.";

      const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: replyContent, time: replyTime },
      ]);

      if (autoSpeak) {
        speakRobotMessage(replyContent);
      }
    } catch (err: any) {
      console.error("Robot chat error:", err);
      toast.error(err?.message || "Robot communication error. Please try again.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Beep... my neural link had a brief hiccup! Could you please repeat that? I'm right here listening.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const resetConversation = () => {
    stopSpeaking();
    setRobotConversationId(null);
    setMessages([
      {
        role: "assistant",
        content: currentPersona.greeting,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    toast.success("New conversation started with your Robot Companion!", { icon: "🤖" });
  };

  return (
    <>
      <style>{`
        @keyframes robot3DSpin {
          0% {
            transform: perspective(600px) rotateY(0deg) rotateX(12deg) translateY(0px);
          }
          25% {
            transform: perspective(600px) rotateY(90deg) rotateX(-8deg) translateY(-6px);
          }
          50% {
            transform: perspective(600px) rotateY(180deg) rotateX(12deg) translateY(0px);
          }
          75% {
            transform: perspective(600px) rotateY(270deg) rotateX(-8deg) translateY(-6px);
          }
          100% {
            transform: perspective(600px) rotateY(360deg) rotateX(12deg) translateY(0px);
          }
        }

        @keyframes robotGlowPulse {
          0%, 100% {
            box-shadow: 0 0 16px rgba(0, 255, 252, 0.45), 0 0 32px rgba(168, 85, 247, 0.35);
          }
          50% {
            box-shadow: 0 0 26px rgba(0, 255, 252, 0.8), 0 0 48px rgba(168, 85, 247, 0.6);
          }
        }

        @keyframes ringRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes eyeBlink {
          0%, 45%, 55%, 100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(0.1);
          }
        }

        @keyframes floatBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }

        @keyframes soundWaveBar {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
      `}</style>

      {/* FLOATING SPINNING ROBOT BOX (Does not clash with anything, positioned neatly) */}
      {!isOpen && (
        <Box
          sx={{
            position: "fixed",
            bottom: {
              xs: "calc(env(safe-area-inset-bottom, 0px) + 82px)",
              sm: 96,
              md: 104,
            },
            right: { xs: 14, sm: 24, md: 32 },
            zIndex: 1250,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            cursor: "pointer",
            userSelect: "none",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
            animation: "floatBounce 4s ease-in-out infinite",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => {
            setIsOpen(true);
            setIsHovered(false);
          }}
        >
          {/* Short clean callout */}
          <Fade in={isHovered} timeout={200}>
            <Box
              sx={{
                mb: 1,
                bgcolor: isDark ? "rgba(13, 22, 33, 0.95)" : "rgba(255, 255, 255, 0.98)",
                backdropFilter: "blur(12px)",
                border: "1.5px solid #a855f7",
                color: isDark ? "white" : "#0f172a",
                px: 1.2,
                py: 0.4,
                borderRadius: 2,
                boxShadow: "0 6px 20px rgba(168, 85, 247, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: 0.8,
                fontSize: "12px",
                fontWeight: 700,
                whiteSpace: "nowrap",
                transform: "translateY(-4px)",
                transition: "all 0.2s ease",
              }}
            >
              <span>✨</span>
              <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#a855f7" }}>
                Nova AI
              </Typography>
            </Box>
          </Fade>

          {/* THE SPINNING 3D ROBOT BOX */}
          <Box
            sx={{
              position: "relative",
              width: { xs: 62, sm: 70 },
              height: { xs: 62, sm: 70 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transformStyle: "preserve-3d",
              transition: "transform 0.3s ease",
              ":hover": {
                transform: "scale(1.12)",
              },
            }}
          >
            {/* Spinning Holographic Outer Orbital Ring */}
            <Box
              sx={{
                position: "absolute",
                inset: -6,
                borderRadius: "50%",
                border: "2px dashed #00fffc",
                opacity: 0.8,
                animation: "ringRotate 10s linear infinite",
                pointerEvents: "none",
              }}
            />

            {/* Glowing Aura Ring */}
            <Box
              sx={{
                position: "absolute",
                inset: -2,
                borderRadius: "22px",
                background: "linear-gradient(135deg, #a855f7, #00fffc)",
                opacity: 0.8,
                filter: "blur(6px)",
                animation: "robotGlowPulse 2.5s infinite ease-in-out",
              }}
            />

            {/* Main Robot Box Body with 3D Continuous Spin */}
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: "18px",
                background: isDark
                  ? "linear-gradient(135deg, #1e1035 0%, #0d2238 100%)"
                  : "linear-gradient(135deg, #f3e8ff 0%, #e0f2fe 100%)",
                border: "2px solid #00fffc",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(0, 255, 252, 0.35)",
                overflow: "hidden",
                animation: isHovered
                  ? "none"
                  : "robot3DSpin 12s linear infinite",
              }}
            >
              {/* Antenna on top */}
              <Box
                sx={{
                  position: "absolute",
                  top: 3,
                  width: 3,
                  height: 6,
                  bgcolor: "#00fffc",
                  borderRadius: 1,
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    top: -4,
                    left: -2.5,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "#ec4899",
                    boxShadow: "0 0 8px #ec4899",
                  },
                }}
              />

              {/* Robot Digital Visor */}
              <Box
                sx={{
                  width: "72%",
                  height: "36%",
                  bgcolor: "#050b14",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  border: "1px solid rgba(0, 255, 252, 0.4)",
                  boxShadow: "inset 0 0 8px rgba(0, 255, 252, 0.6)",
                  mt: 0.8,
                }}
              >
                {/* Left LED Eye */}
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    bgcolor: "#00fffc",
                    boxShadow: "0 0 6px #00fffc",
                    animation: "eyeBlink 3.6s infinite ease-in-out",
                  }}
                />
                {/* Right LED Eye */}
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    bgcolor: "#00fffc",
                    boxShadow: "0 0 6px #00fffc",
                    animation: "eyeBlink 3.6s infinite ease-in-out",
                  }}
                />
              </Box>

              {/* Robot Speaker / Smile Grill */}
              <Box
                sx={{
                  display: "flex",
                  gap: "2px",
                  mt: "5px",
                }}
              >
                <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "#a855f7" }} />
                <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "#a855f7" }} />
                <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "#a855f7" }} />
              </Box>
            </Box>

            {/* Online Live Status Indicator Pip */}
            <Box
              sx={{
                position: "absolute",
                bottom: -2,
                right: -2,
                bgcolor: "#10b981",
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: "2.5px solid #050b14",
                boxShadow: "0 0 8px #10b981",
              }}
            />
          </Box>

          {/* Micro text label */}
          <Typography
            sx={{
              mt: 0.6,
              fontSize: "10.5px",
              fontWeight: 800,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: isDark ? "#00fffc" : "#0284c7",
              textShadow: "0 0 8px rgba(0, 255, 252, 0.4)",
              bgcolor: isDark ? "rgba(5, 11, 20, 0.75)" : "rgba(255, 255, 255, 0.8)",
              px: 0.8,
              py: 0.2,
              borderRadius: 1,
            }}
          >
            Nova
          </Typography>
        </Box>
      )}

      {/* EXPANDED INTERACTIVE ROBOT COMPANION WINDOW */}
      <Dialog
        open={isOpen}
        onClose={() => {
          stopSpeaking();
          setIsSpeaking(false);
          stopVoiceRecognition();
          setIsOpen(false);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 3, sm: 4 },
            bgcolor: isDark ? "rgba(10, 16, 26, 0.96)" : "#ffffff",
            backdropFilter: "blur(20px)",
            border: isDark
              ? "1.5px solid rgba(0, 255, 252, 0.3)"
              : "1.5px solid rgba(168, 85, 247, 0.3)",
            boxShadow: isDark
              ? "0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 255, 252, 0.15)"
              : "0 20px 60px rgba(15, 23, 42, 0.18)",
            maxHeight: { xs: "calc(100dvh - 16px)", sm: "88vh" },
            height: { xs: "min(92dvh, 620px)", sm: "640px" },
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            m: { xs: 1, sm: 2 },
          },
        }}
      >
        {/* Top Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 1.5, sm: 2.5 },
            py: { xs: 1.2, sm: 1.5 },
            borderBottom: isDark
              ? "1px solid rgba(255, 255, 255, 0.08)"
              : "1px solid rgba(15, 23, 42, 0.08)",
            background: isDark
              ? "linear-gradient(90deg, rgba(168, 85, 247, 0.12) 0%, rgba(0, 255, 252, 0.1) 100%)"
              : "linear-gradient(90deg, rgba(168, 85, 247, 0.08) 0%, rgba(2, 132, 199, 0.06) 100%)",
          }}
        >
          {/* Robot Avatar & Title */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Box
              sx={{
                width: { xs: 36, sm: 42 },
                height: { xs: 36, sm: 42 },
                borderRadius: "50%",
                background: currentPersona.glowColor,
                border: `2px solid ${currentPersona.accentColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: { xs: "17px", sm: "20px" },
                boxShadow: `0 0 16px ${currentPersona.glowColor}`,
                animation: isSpeaking ? "ringRotate 6s linear infinite" : "none",
              }}
            >
              {currentPersona.avatarIcon}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "14px", sm: "15px" },
                  color: isDark ? "white" : "#0f172a",
                  letterSpacing: 0.3,
                }}
              >
                {currentPersona.name}
              </Typography>
              {(isSpeaking || isListening) && (
                <Box
                  sx={{
                    bgcolor: isSpeaking ? "#ec4899" : "#0284c7",
                    color: "white",
                    px: 0.7,
                    py: 0.15,
                    borderRadius: 1,
                    fontSize: { xs: "9px", sm: "10px" },
                    fontWeight: 800,
                    letterSpacing: 0.5,
                  }}
                >
                  {isSpeaking ? "SPEAKING 🔊" : "LISTENING 🎙️"}
                </Box>
              )}
            </Box>
          </Box>

          {/* Action Controls */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 0.8 } }}>
            {/* Speed Pill */}
            <Tooltip title="Voice Speed">
              <Box
                onClick={() => {
                  setSpeedMultiplier((prev) => {
                    const next = prev === 1.0 ? 1.08 : prev === 1.08 ? 0.92 : 1.0;
                    const label =
                      next === 1.0 ? "1.2x (Fast)" : next === 1.08 ? "1.3x (Faster)" : "1.1x (Brisk)";
                    toast.success(`Speed: ${label}`, { icon: "⚡" });
                    return next;
                  });
                }}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.3,
                  px: { xs: 0.7, sm: 0.8 },
                  py: { xs: 0.4, sm: 0.3 },
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "10px",
                  fontWeight: 700,
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                  bgcolor: isDark ? "rgba(0, 255, 252, 0.12)" : "rgba(2, 132, 199, 0.1)",
                  border: isDark
                    ? "1px solid rgba(0, 255, 252, 0.35)"
                    : "1px solid rgba(2, 132, 199, 0.3)",
                  color: isDark ? "#00fffc" : "#0284c7",
                  transition: "all 0.15s ease",
                  "&:hover": { transform: "scale(1.04)" },
                }}
              >
                <span>⚡</span>
                <span>
                  {speedMultiplier === 1.0
                    ? "1.2x"
                    : speedMultiplier === 1.08
                    ? "1.3x"
                    : "1.1x"}
                </span>
              </Box>
            </Tooltip>

            {/* Test Voice Button */}
            <Tooltip title={isSpeaking ? "Stop" : "Test Voice"}>
              <Box
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                    setIsSpeaking(false);
                    return;
                  }
                  previewIndianFemaleVoice(
                    "Namaste, main aapki kaise madad kar sakti hoon? Hello, how may I help you?",
                    {
                      onStart: () => setIsSpeaking(true),
                      onEnd: () => setIsSpeaking(false),
                      onError: () => setIsSpeaking(false),
                      pitchMultiplier: 1.02,
                      rateMultiplier: speedMultiplier,
                    }
                  );
                }}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.3,
                  px: { xs: 0.7, sm: 0.8 },
                  py: { xs: 0.4, sm: 0.3 },
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "10px",
                  fontWeight: 700,
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                  bgcolor: isSpeaking
                    ? "rgba(236, 72, 153, 0.2)"
                    : isDark
                    ? "rgba(168, 85, 247, 0.12)"
                    : "rgba(168, 85, 247, 0.1)",
                  border: isSpeaking
                    ? "1px solid #ec4899"
                    : "1px solid rgba(168, 85, 247, 0.35)",
                  color: isSpeaking ? "#ec4899" : "#a855f7",
                  transition: "all 0.15s ease",
                  "&:hover": { transform: "scale(1.04)" },
                }}
              >
                <span>{isSpeaking ? "⏹️" : "🌸"}</span>
                <span>{isSpeaking ? "Stop" : "Test"}</span>
              </Box>
            </Tooltip>

            {/* Auto-Speak Toggle */}
            <Tooltip title={autoSpeak ? "Voice ON" : "Voice OFF"}>
              <IconButton
                size="small"
                onClick={() => {
                  setAutoSpeak((prev) => {
                    const next = !prev;
                    if (!next) stopSpeaking();
                    toast.success(next ? "Voice ON" : "Voice OFF", {
                      icon: next ? "🔊" : "🔇",
                    });
                    return next;
                  });
                }}
                sx={{
                  color: autoSpeak ? "#a855f7" : isDark ? "rgba(255,255,255,0.4)" : "#94a3b8",
                  bgcolor: autoSpeak ? "rgba(168, 85, 247, 0.12)" : "transparent",
                  p: { xs: 0.6, sm: 0.7 },
                  borderRadius: 1.5,
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {autoSpeak ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
              </IconButton>
            </Tooltip>

            {/* Clear / Reset Chat */}
            <Tooltip title="Reset">
              <IconButton
                size="small"
                onClick={resetConversation}
                sx={{
                  color: isDark ? "rgba(255,255,255,0.7)" : "#64748b",
                  p: { xs: 0.6, sm: 0.7 },
                  borderRadius: 1.5,
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                  ":hover": { color: "#00fffc" },
                }}
              >
                <FiRotateCcw size={15} />
              </IconButton>
            </Tooltip>

            {/* Close / Minimize */}
            <Tooltip title="Close">
              <IconButton
                size="small"
                onClick={() => {
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                  stopVoiceRecognition();
                  setIsOpen(false);
                }}
                sx={{
                  color: isDark ? "rgba(255,255,255,0.8)" : "#475569",
                  p: { xs: 0.6, sm: 0.7 },
                  borderRadius: 1.5,
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                  ":hover": { color: "#ef4444", bgcolor: "rgba(239, 68, 68, 0.1)" },
                }}
              >
                <FiX size={17} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Conversation Stream Container */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            bgcolor: isDark ? "rgba(5, 11, 20, 0.6)" : "#f8fafc",
          }}
        >
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  flexDirection: isUser ? "row-reverse" : "row",
                  alignItems: "flex-start",
                  gap: 1.2,
                }}
              >
                {/* Avatar Icon */}
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "15px",
                    bgcolor: isUser
                      ? isDark
                        ? "#0284c7"
                        : "#0284c7"
                      : currentPersona.accentColor,
                    color: "white",
                    boxShadow: isUser
                      ? "none"
                      : `0 0 10px ${currentPersona.glowColor}`,
                  }}
                >
                  {isUser ? "👤" : "🤖"}
                </Box>

                {/* Message Bubble */}
                <Box
                  sx={{
                    maxWidth: "78%",
                    p: 1.6,
                    borderRadius: isUser
                      ? "16px 4px 16px 16px"
                      : "4px 16px 16px 16px",
                    bgcolor: isUser
                      ? isDark
                        ? "#0284c7"
                        : "#0284c7"
                      : isDark
                      ? "rgba(18, 28, 44, 0.95)"
                      : "#ffffff",
                    color: isUser
                      ? "white"
                      : isDark
                      ? "#f1f5f9"
                      : "#0f172a",
                    border: isUser
                      ? "none"
                      : isDark
                      ? "1px solid rgba(255, 255, 255, 0.08)"
                      : "1px solid rgba(15, 23, 42, 0.08)",
                    boxShadow: isDark
                      ? "0 4px 16px rgba(0,0,0,0.3)"
                      : "0 2px 10px rgba(15, 23, 42, 0.05)",
                    fontSize: "14px",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  <Typography sx={{ fontSize: "13.5px", lineHeight: 1.55 }}>
                    {msg.content}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: isUser ? "flex-end" : "space-between",
                      mt: 0.8,
                      pt: 0.4,
                      opacity: 0.65,
                      fontSize: "10.5px",
                    }}
                  >
                    {!isUser && (
                      <IconButton
                        size="small"
                        onClick={() => speakRobotMessage(msg.content)}
                        sx={{
                          p: 0.2,
                          color: "inherit",
                          ":hover": { color: "#a855f7" },
                        }}
                        title="Listen"
                      >
                        <FiVolume2 size={13} />
                      </IconButton>
                    )}
                    <span>{msg.time || ""}</span>
                  </Box>
                </Box>
              </Box>
            );
          })}

          {isSending && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                p: 1.2,
                width: "fit-content",
                borderRadius: 2,
                bgcolor: isDark ? "rgba(18, 28, 44, 0.7)" : "#ffffff",
              }}
            >
              <CircularProgress size={16} sx={{ color: currentPersona.accentColor }} />
              <Typography sx={{ fontSize: "12.5px", fontWeight: 600, color: currentPersona.accentColor }}>
                {currentPersona.name} is thinking & typing...
              </Typography>
            </Box>
          )}

          {/* Prompt Starters */}
          {messages.length <= 2 && (
            <Box sx={{ mt: 1 }}>
              <Typography
                sx={{
                  fontSize: "11.5px",
                  fontWeight: 700,
                  color: isDark ? "rgba(255,255,255,0.4)" : "#64748b",
                  mb: 1,
                }}
              >
                Suggested conversation starters:
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
                {currentPersona.starters.map((starter, idx) => (
                  <Box
                    key={idx}
                    onClick={() => handleSendMessage(starter)}
                    sx={{
                      px: 1.4,
                      py: 0.8,
                      borderRadius: 2,
                      bgcolor: isDark ? "rgba(255, 255, 255, 0.04)" : "#ffffff",
                      border: isDark
                        ? "1px solid rgba(255, 255, 255, 0.08)"
                        : "1px solid rgba(168, 85, 247, 0.18)",
                      cursor: "pointer",
                      fontSize: "12.5px",
                      color: isDark ? "#e2e8f0" : "#334155",
                      touchAction: "manipulation",
                      WebkitTapHighlightColor: "transparent",
                      transition: "all 0.2s ease",
                      ":hover": {
                        bgcolor: currentPersona.glowColor,
                        borderColor: currentPersona.accentColor,
                        transform: "translateX(4px)",
                      },
                    }}
                  >
                    💬 {starter}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* Input Bar with Mic and Send Button */}
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          sx={{
            p: { xs: 1.2, sm: 1.5 },
            borderTop: isDark
              ? "1px solid rgba(255, 255, 255, 0.08)"
              : "1px solid rgba(15, 23, 42, 0.08)",
            display: "flex",
            alignItems: "center",
            gap: 1,
            bgcolor: isDark ? "rgba(10, 16, 26, 0.9)" : "#ffffff",
          }}
        >
          {/* Microphone Voice Button */}
          <Tooltip title={isListening ? "Stop" : "Mic"}>
            <IconButton
              type="button"
              onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
              sx={{
                bgcolor: isListening ? "#ef4444" : currentPersona.glowColor,
                color: isListening ? "white" : currentPersona.accentColor,
                border: `1.5px solid ${isListening ? "#ef4444" : currentPersona.accentColor}`,
                p: { xs: 0.9, sm: 1 },
                minWidth: { xs: 38, sm: 42 },
                minHeight: { xs: 38, sm: 42 },
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                boxShadow: isListening ? "0 0 14px rgba(239, 68, 68, 0.8)" : "none",
                ":hover": {
                  bgcolor: isListening ? "#dc2626" : currentPersona.glowColor,
                },
              }}
            >
              <FiMic size={17} />
            </IconButton>
          </Tooltip>

          {/* Text Input - 16px on mobile prevents iOS Safari auto-zoom and cursor stuck bug */}
          <Box
            component="input"
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
            placeholder="Message Nova..."
            disabled={isSending}
            autoCapitalize="sentences"
            autoComplete="off"
            enterKeyHint="send"
            sx={{
              flex: 1,
              bgcolor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f1f5f9",
              border: isDark
                ? "1px solid rgba(255, 255, 255, 0.12)"
                : "1px solid rgba(15, 23, 42, 0.12)",
              borderRadius: 3,
              px: { xs: 1.4, sm: 1.8 },
              py: { xs: 0.9, sm: 1.1 },
              fontSize: { xs: "16px", sm: "14px" },
              color: isDark ? "white" : "#0f172a",
              outline: "none",
              fontFamily: "inherit",
              touchAction: "auto !important",
              WebkitUserSelect: "text !important",
              userSelect: "text !important",
              textRendering: "auto !important",
              fontFeatureSettings: "normal !important",
              caretColor: currentPersona.accentColor,
              ":focus": {
                borderColor: currentPersona.accentColor,
              },
              "&::placeholder": {
                color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8",
              },
            }}
          />

          {/* Send Button */}
          <IconButton
            type="submit"
            disabled={!inputValue.trim() || isSending}
            sx={{
              bgcolor: currentPersona.accentColor,
              color: "white",
              p: { xs: 0.9, sm: 1.1 },
              minWidth: { xs: 38, sm: 42 },
              minHeight: { xs: 38, sm: 42 },
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
              boxShadow: `0 0 14px ${currentPersona.glowColor}`,
              ":hover": {
                bgcolor: currentPersona.accentColor,
                opacity: 0.9,
              },
              "&.Mui-disabled": {
                bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0",
                color: isDark ? "rgba(255,255,255,0.3)" : "#94a3b8",
                boxShadow: "none",
              },
            }}
          >
            {isSending ? (
              <CircularProgress size={18} sx={{ color: "white" }} />
            ) : (
              <IoMdSend size={18} />
            )}
          </IconButton>
        </Box>
      </Dialog>
    </>
  );
};

export default RobotCompanionBox;
