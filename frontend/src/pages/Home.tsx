import { Box, Typography, Button, Container } from "@mui/material";
import React from "react";
import { Link } from "react-router-dom";
import TypingAnim from "../components/typer/TypingAnim";
import Footer from "../components/footer/Footer";
import DynamicRobot from "../components/robot/DynamicRobot";
import LiveWorkspacePreview from "../components/home/LiveWorkspacePreview";
import { FiZap, FiShield, FiFileText, FiArrowRight, FiCpu } from "react-icons/fi";

const CAPABILITIES = [
  {
    icon: <FiZap size={24} color="#00fffc" />,
    title: "Sub-Second Multi-Model Engine",
    desc: "Speculative parallel execution across Google's fastest flash models delivers intelligent answers in milliseconds.",
  },
  {
    icon: <FiFileText size={24} color="#00fffc" />,
    title: "Multimodal Document Intelligence",
    desc: "Directly analyze PDFs, images, source code files, and ZIP archives with deep multi-file contextual understanding.",
  },
  {
    icon: <FiShield size={24} color="#00fffc" />,
    title: "Dual-Layer Enterprise Auth",
    desc: "Secured with verified OTP email delivery (via HTTPS API) and HTTP-only signed JWT session cookies.",
  },
  {
    icon: <FiCpu size={24} color="#00fffc" />,
    title: "Perpetual Context Memory",
    desc: "Instant zero-lag topic classification organizes your conversations neatly into persistent chat history.",
  },
];

const Home = () => {
  return (
    <Box width={"100%"} minHeight={"100%"} sx={{ overflowX: "hidden" }}>
      {/* Top Hero Section */}
      <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 5 }, pb: { xs: 4, md: 6 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* Futuristic Live Badge */}
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              px: 2.2,
              py: 0.8,
              mb: 3,
              borderRadius: "30px",
              bgcolor: "rgba(0, 255, 252, 0.08)",
              border: "1px solid rgba(0, 255, 252, 0.3)",
              boxShadow: "0 0 20px rgba(0, 255, 252, 0.15)",
              backdropFilter: "blur(8px)",
              animation: "pulseBadge 3s infinite ease-in-out",
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "#00fffc",
                boxShadow: "0 0 10px #00fffc",
              }}
            />
            <Typography
              sx={{
                fontSize: { xs: "12px", sm: "13px" },
                fontWeight: 700,
                color: "#00fffc",
                letterSpacing: 0.5,
              }}
            >
              Next-Gen Multi-Model Intelligence • Sub-Second Responses
            </Typography>
          </Box>

          {/* Typing Animation Hero Title */}
          <Box sx={{ mb: 2 }}>
            <TypingAnim />
          </Box>

          <Typography
            sx={{
              maxWidth: "680px",
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: { xs: "14px", sm: "16px", md: "17px" },
              lineHeight: 1.6,
              mb: 4,
              px: 2,
            }}
          >
            Experience lightning-fast conversational AI powered by speculative multi-model execution.
            Analyze code, documents, and concepts with zero latency.
          </Typography>

          {/* Call-to-Action Buttons */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: { xs: 2, sm: 2.5 },
              flexWrap: "wrap",
              mb: { xs: 4, md: 6 },
            }}
          >
            <Button
              component={Link}
              to="/chat"
              sx={{
                px: 3.8,
                py: 1.4,
                borderRadius: 2.5,
                bgcolor: "#00fffc",
                color: "#001a1c",
                fontWeight: 800,
                fontSize: "15px",
                textTransform: "none",
                boxShadow: "0 4px 24px rgba(0, 255, 252, 0.4)",
                transition: "all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
                ":hover": {
                  bgcolor: "white",
                  color: "black",
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 32px rgba(0, 255, 252, 0.6)",
                },
              }}
              endIcon={<FiArrowRight size={18} />}
            >
              Start Chatting Now
            </Button>
          </Box>

          {/* Dynamic Interactive Robot Showcase (Reacts to Scroll & Mouse Parallax) */}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              justifyContent: "center",
              gap: { xs: 4, md: 8 },
              my: { xs: 3, md: 5 },
            }}
          >
            {/* Dynamic 3D Robot with Scroll & Mouse Parallax */}
            <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <DynamicRobot
                width={{ xs: "220px", sm: "280px", md: "340px" }}
                maxHeight="480px"
                enableScrollReaction={true}
                enableMouseTracking={true}
                showBubble={true}
              />
            </Box>

            {/* Glowing Brand Orb & Quick Stats */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: { xs: "center", md: "flex-start" },
                textAlign: { xs: "center", md: "left" },
                maxWidth: "460px",
              }}
            >
              <Box
                component="img"
                src="si-logo.png"
                alt="SI Super Intelligence Logo"
                className="rotate"
                sx={{
                  width: { xs: "120px", sm: "140px", md: "160px" },
                  height: { xs: "120px", sm: "140px", md: "160px" },
                  mb: 3,
                  borderRadius: "50%",
                  filter: "drop-shadow(0 0 32px rgba(0, 255, 252, 0.5))",
                }}
              />

              <Typography
                variant="h4"
                sx={{
                  color: "white",
                  fontWeight: 800,
                  fontSize: { xs: "22px", md: "28px" },
                  mb: 1.5,
                  letterSpacing: 0.5,
                }}
              >
                Intelligent. Swift. Private.
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255, 255, 255, 0.65)",
                  fontSize: "14.5px",
                  lineHeight: 1.6,
                  mb: 3,
                }}
              >
                Designed for developers, creators, and professionals who demand instant answers with uncompromising quality and privacy.
              </Typography>

              {/* Quick Spec Pills */}
              <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap", justifyContent: { xs: "center", md: "flex-start" } }}>
                {["< 1s Latency", "100% Free", "OTP Verified", "Multimodal"].map((tag, i) => (
                  <Box
                    key={i}
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: "14px",
                      bgcolor: "rgba(0, 255, 252, 0.08)",
                      border: "1px solid rgba(0, 255, 252, 0.25)",
                      color: "#00fffc",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    ✓ {tag}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Feature Capabilities Grid */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
        <Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
          <Typography
            variant="h3"
            sx={{
              color: "white",
              fontWeight: 800,
              fontSize: { xs: "24px", md: "34px" },
              letterSpacing: 0.5,
            }}
          >
            Built for Modern AI Workflows
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            gap: 3,
          }}
        >
          {CAPABILITIES.map((cap, idx) => (
            <Box
              key={idx}
              sx={{
                p: { xs: 2.8, md: 3.5 },
                borderRadius: "16px",
                bgcolor: "rgba(17, 29, 39, 0.75)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(12px)",
                transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                ":hover": {
                  transform: "translateY(-4px)",
                  borderColor: "rgba(0, 255, 252, 0.4)",
                  boxShadow: "0 12px 40px rgba(0, 255, 252, 0.15)",
                },
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "12px",
                  bgcolor: "rgba(0, 255, 252, 0.1)",
                  border: "1px solid rgba(0, 255, 252, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cap.icon}
              </Box>
              <Typography
                variant="h6"
                sx={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: { xs: "17px", md: "19px" },
                }}
              >
                {cap.title}
              </Typography>
              <Typography
                sx={{
                  color: "rgba(255, 255, 255, 0.65)",
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              >
                {cap.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>

      {/* Interactive App Preview Showcase */}
      <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 10 } }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography
            variant="h4"
            sx={{
              color: "white",
              fontWeight: 800,
              fontSize: { xs: "22px", md: "30px" },
              mb: 1,
            }}
          >
            Clean, Intuitive Workspace
          </Typography>
          <Typography sx={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "14px" }}>
            Rich code syntax highlighting, document previewing, and seamless topic history.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            px: { xs: 1, sm: 2 },
          }}
        >
          <LiveWorkspacePreview />
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default Home;
