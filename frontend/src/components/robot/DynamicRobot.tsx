import React, { useEffect, useState, useRef } from "react";
import { Box, Typography } from "@mui/material";

interface DynamicRobotProps {
  width?: string | { xs?: string; sm?: string; md?: string; lg?: string };
  maxHeight?: string;
  showBubble?: boolean;
  bubbleText?: string;
  enableScrollReaction?: boolean;
  enableMouseTracking?: boolean;
}

const GREETINGS = [
  "⚡ Ready! Sub-second responses are live.",
  "👋 Hi there! Ask me any question.",
  "📄 Attach PDFs, code, or images anytime!",
  "🚀 Powered by Multi-Model Parallel Intelligence.",
  "✨ Fast, private, and always available.",
];

export const DynamicRobot: React.FC<DynamicRobotProps> = ({
  width = { xs: "220px", sm: "280px", md: "360px" },
  maxHeight = "520px",
  showBubble = true,
  bubbleText,
  enableScrollReaction = true,
  enableMouseTracking = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollY, setScrollY] = useState<number>(0);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isWaving, setIsWaving] = useState<boolean>(false);
  const [greetingIdx, setGreetingIdx] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Passive, throttled scroll listener for 60fps dynamic motion
  useEffect(() => {
    if (!enableScrollReaction) return;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [enableScrollReaction]);

  // Interactive 3D cursor tracking
  useEffect(() => {
    if (!enableMouseTracking) return;
    let ticking = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          // Normalized offset (-1 to 1)
          const normX = Math.max(-1, Math.min(1, (e.clientX - centerX) / (window.innerWidth / 2)));
          const normY = Math.max(-1, Math.min(1, (e.clientY - centerY) / (window.innerHeight / 2)));

          setMousePos({ x: normX, y: normY });
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [enableMouseTracking]);

  const handleRobotClick = () => {
    setIsWaving(true);
    setGreetingIdx((prev) => (prev + 1) % GREETINGS.length);
    setTimeout(() => setIsWaving(false), 1200);
  };

  // Dynamic calculations based on scroll and mouse
  // Floating offset: gentle harmonic oscillation + scroll parallax
  const scrollOffset = enableScrollReaction ? Math.sin(scrollY * 0.005) * 16 - Math.min(scrollY * 0.12, 45) : 0;
  const scrollRotate = enableScrollReaction ? Math.sin(scrollY * 0.004) * 4 : 0;

  // 3D Tilt angles (limited to 14 degrees for classy, realistic perspective)
  const tiltX = -mousePos.y * 12;
  const tiltY = mousePos.x * 14;

  const currentGreeting = bubbleText || GREETINGS[greetingIdx];

  return (
    <Box
      ref={containerRef}
      onClick={handleRobotClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        userSelect: "none",
        perspective: "1000px",
      }}
    >
      {/* Speech Bubble / Status Tag */}
      {showBubble && (
        <Box
          sx={{
            mb: 1.5,
            px: 2,
            py: 0.9,
            borderRadius: "20px",
            bgcolor: "rgba(11, 25, 38, 0.88)",
            border: "1px solid rgba(0, 255, 252, 0.45)",
            boxShadow: isHovered
              ? "0 0 24px rgba(0, 255, 252, 0.4)"
              : "0 4px 16px rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            transform: `translate3d(0, ${scrollOffset * 0.4}px, 0)`,
            transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
            maxWidth: "320px",
            textAlign: "center",
            zIndex: 3,
            animation: "pulseBadge 3s infinite ease-in-out",
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: "12px", sm: "13px" },
              fontWeight: 700,
              color: "#00fffc",
              letterSpacing: 0.3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.8,
            }}
          >
            {currentGreeting}
          </Typography>
        </Box>
      )}

      {/* Radiant Aura Backdrop */}
      <Box
        sx={{
          position: "absolute",
          width: "120%",
          height: "120%",
          top: "-10%",
          left: "-10%",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0, 255, 252, 0.22) 0%, rgba(0, 255, 252, 0.05) 50%, transparent 72%)",
          filter: "blur(28px)",
          pointerEvents: "none",
          transform: `scale(${isHovered ? 1.15 : 1}) translate3d(0, ${scrollOffset * 0.6}px, 0)`,
          transition: "transform 0.4s ease, filter 0.4s ease",
          zIndex: 1,
        }}
      />

      {/* 3D Animated Robot Image Container */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          willChange: "transform",
          transformStyle: "preserve-3d",
          transform: `
            translate3d(0, ${scrollOffset}px, 0)
            rotateX(${tiltX}deg)
            rotateY(${tiltY}deg)
            rotateZ(${scrollRotate}deg)
            scale3d(${isHovered ? 1.03 : 1}, ${isHovered ? 1.03 : 1}, 1)
          `,
          transition: isHovered
            ? "transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)"
            : "transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
          filter: isHovered
            ? "drop-shadow(0 16px 36px rgba(0, 255, 252, 0.35))"
            : "drop-shadow(0 10px 25px rgba(0, 255, 252, 0.22))",
        }}
      >
        <Box
          component="img"
          src="airobot.png"
          alt="SI Super Intelligence 3D Robot"
          sx={{
            width,
            maxHeight,
            objectFit: "contain",
            display: "block",
            pointerEvents: "none",
            animation: isWaving
              ? "robotWave 1.2s ease-in-out"
              : "robotFloat 4s infinite ease-in-out",
          }}
        />
      </Box>

      {/* Futuristic Floor Shadow & Levitation Pad */}
      <Box
        sx={{
          width: "55%",
          height: "16px",
          mt: -1,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(0, 255, 252, 0.35) 0%, rgba(0, 0, 0, 0.7) 60%, transparent 80%)",
          filter: "blur(4px)",
          transform: `scale(${1 - Math.abs(scrollOffset) * 0.008})`,
          transition: "transform 0.3s ease",
          zIndex: 1,
        }}
      />
    </Box>
  );
};

export default DynamicRobot;
