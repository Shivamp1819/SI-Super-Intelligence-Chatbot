import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { FiCopy, FiCheck, FiRotateCcw, FiZap } from "react-icons/fi";
import { useThemeMode } from "../../context/ThemeContext";

interface CodeBlockProps {
  code: string;
  isStreaming?: boolean;
}

const SyntaxCodeBlock: React.FC<CodeBlockProps> = ({ code, isStreaming }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Ultra-crisp custom syntax colorizer for JavaScript
  const renderHighlightedCode = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      // Split tokens by space/semicolon/equals while preserving them
      const tokens = line.split(/(\s+|;|=|"[^"]*"|'[^']*')/g);

      return (
        <Box key={lineIdx} component="div" sx={{ minHeight: "20px" }}>
          {tokens.map((token, tokIdx) => {
            if (/^(var|let|const|function|return|if|else)$/.test(token)) {
              return (
                <Box
                  key={tokIdx}
                  component="span"
                  sx={{ color: "#00fffc", fontWeight: 700 }}
                >
                  {token}
                </Box>
              );
            }
            if (/^"[^"]*"|'[^']*'$/.test(token)) {
              return (
                <Box
                  key={tokIdx}
                  component="span"
                  sx={{ color: "#34d399", fontWeight: 500 }}
                >
                  {token}
                </Box>
              );
            }
            if (/^\d+$/.test(token)) {
              return (
                <Box
                  key={tokIdx}
                  component="span"
                  sx={{ color: "#f59e0b", fontWeight: 600 }}
                >
                  {token}
                </Box>
              );
            }
            if (/^(true|false|null|undefined)$/.test(token)) {
              return (
                <Box
                  key={tokIdx}
                  component="span"
                  sx={{ color: "#ec4899", fontWeight: 600 }}
                >
                  {token}
                </Box>
              );
            }
            if (token === "=" || token === ";") {
              return (
                <Box
                  key={tokIdx}
                  component="span"
                  sx={{ color: "rgba(255, 255, 255, 0.55)" }}
                >
                  {token}
                </Box>
              );
            }
            return (
              <Box
                key={tokIdx}
                component="span"
                sx={{ color: "#e2e8f0" }}
              >
                {token}
              </Box>
            );
          })}
          {lineIdx === lines.length - 1 && isStreaming && (
            <Box
              component="span"
              sx={{
                display: "inline-block",
                width: "2px",
                height: "15px",
                bgcolor: "#00fffc",
                ml: "2px",
                verticalAlign: "middle",
                animation: "blinkCursor 0.8s infinite",
              }}
            />
          )}
        </Box>
      );
    });
  };

  return (
    <Box
      sx={{
        my: 1.5,
        borderRadius: "10px",
        overflow: "hidden",
        bgcolor: "#07111c",
        border: "1px solid rgba(0, 255, 252, 0.2)",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
      }}
    >
      {/* Code Header Bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 0.8,
          bgcolor: "rgba(0, 255, 252, 0.05)",
          borderBottom: "1px solid rgba(0, 255, 252, 0.12)",
        }}
      >
        <Typography
          sx={{
            color: "#00fffc",
            fontSize: "12px",
            fontFamily: "monospace",
            fontWeight: 700,
            textTransform: "lowercase",
            letterSpacing: 0.5,
          }}
        >
          javascript
        </Typography>

        <Tooltip title={copied ? "Copied!" : "Copy code"} placement="left">
          <IconButton
            size="small"
            onClick={handleCopy}
            sx={{
              color: copied ? "#00fffc" : "rgba(255, 255, 255, 0.6)",
              p: 0.5,
              "&:hover": { color: "#00fffc", bgcolor: "rgba(0, 255, 252, 0.1)" },
            }}
          >
            {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Code Body */}
      <Box
        sx={{
          p: 2,
          fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
          fontSize: { xs: "12.5px", sm: "13.5px" },
          lineHeight: 1.7,
          overflowX: "auto",
        }}
      >
        {renderHighlightedCode(code)}
      </Box>
    </Box>
  );
};

export const LiveWorkspacePreview: React.FC = () => {
  const { isDark } = useThemeMode();

  // Full script content segments for automatic generation
  const FULL_DATA = {
    intro:
      "Sure! In JavaScript, you can declare variables using the 'var', 'let', or 'const' keywords. Here are a few examples:",
    varLabel: "Using 'var':",
    varCode: `var age = 25;\nvar name = "John";\nvar isStudent = true;`,
    letLabel: "Using 'let':",
    letCode: `let age = 25;\nlet name = "John";\nlet isStudent = true;`,
    constLabel: "Using 'const':",
    constCode: `const age = 25;\nconst name = "John";\nconst isStudent = true;`,
    explanation:
      "'var' is used for declaring variables with function scope or global scope, 'let' is used for declaring variables with block scope (limited to a block of code), and 'const' is used for declaring constants, which cannot be reassigned after initialization. Note that JavaScript is dynamically-typed, so you don't need to explicitly state the variable type. The type is determined by the value assigned to it.",
  };

  // Calculate segment boundaries in a single continuous character timeline
  const fullTextLength =
    FULL_DATA.intro.length +
    FULL_DATA.varLabel.length +
    FULL_DATA.varCode.length +
    FULL_DATA.letLabel.length +
    FULL_DATA.letCode.length +
    FULL_DATA.constLabel.length +
    FULL_DATA.constCode.length +
    FULL_DATA.explanation.length;

  const [charCount, setCharCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<any>(null);

  const resetAnimation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsCompleted(false);
    setCharCount(0);
  };

  useEffect(() => {
    if (isPaused) return;

    if (charCount >= fullTextLength) {
      setIsCompleted(true);
      // Wait for 8 seconds after completion so users can admire the output, then smoothly loop
      const loopTimer = setTimeout(() => {
        resetAnimation();
      }, 8000);
      return () => clearTimeout(loopTimer);
    }

    // Auto-typing speed: 2-3 characters every 18ms gives an authentic high-speed AI streaming feel
    timerRef.current = setInterval(() => {
      setCharCount((prev) => {
        const next = prev + 3;
        return next > fullTextLength ? fullTextLength : next;
      });
    }, 18);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [charCount, fullTextLength, isPaused]);

  // Compute what is visible based on charCount
  let cursor = charCount;

  // 1. Intro
  const introVisibleLen = Math.min(cursor, FULL_DATA.intro.length);
  const displayedIntro = FULL_DATA.intro.slice(0, introVisibleLen);
  cursor = Math.max(0, cursor - FULL_DATA.intro.length);

  // 2. varLabel
  const varLabelVisibleLen = Math.min(cursor, FULL_DATA.varLabel.length);
  const displayedVarLabel = FULL_DATA.varLabel.slice(0, varLabelVisibleLen);
  cursor = Math.max(0, cursor - FULL_DATA.varLabel.length);

  // 3. varCode
  const varCodeVisibleLen = Math.min(cursor, FULL_DATA.varCode.length);
  const displayedVarCode = FULL_DATA.varCode.slice(0, varCodeVisibleLen);
  const isVarCodeStreaming = varCodeVisibleLen > 0 && varCodeVisibleLen < FULL_DATA.varCode.length;
  cursor = Math.max(0, cursor - FULL_DATA.varCode.length);

  // 4. letLabel
  const letLabelVisibleLen = Math.min(cursor, FULL_DATA.letLabel.length);
  const displayedLetLabel = FULL_DATA.letLabel.slice(0, letLabelVisibleLen);
  cursor = Math.max(0, cursor - FULL_DATA.letLabel.length);

  // 5. letCode
  const letCodeVisibleLen = Math.min(cursor, FULL_DATA.letCode.length);
  const displayedLetCode = FULL_DATA.letCode.slice(0, letCodeVisibleLen);
  const isLetCodeStreaming = letCodeVisibleLen > 0 && letCodeVisibleLen < FULL_DATA.letCode.length;
  cursor = Math.max(0, cursor - FULL_DATA.letCode.length);

  // 6. constLabel
  const constLabelVisibleLen = Math.min(cursor, FULL_DATA.constLabel.length);
  const displayedConstLabel = FULL_DATA.constLabel.slice(0, constLabelVisibleLen);
  cursor = Math.max(0, cursor - FULL_DATA.constLabel.length);

  // 7. constCode
  const constCodeVisibleLen = Math.min(cursor, FULL_DATA.constCode.length);
  const displayedConstCode = FULL_DATA.constCode.slice(0, constCodeVisibleLen);
  const isConstCodeStreaming = constCodeVisibleLen > 0 && constCodeVisibleLen < FULL_DATA.constCode.length;
  cursor = Math.max(0, cursor - FULL_DATA.constCode.length);

  // 8. explanation
  const expVisibleLen = Math.min(cursor, FULL_DATA.explanation.length);
  const displayedExplanation = FULL_DATA.explanation.slice(0, expVisibleLen);
  const isExplanationStreaming = expVisibleLen > 0 && expVisibleLen < FULL_DATA.explanation.length;

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "1000px",
        borderRadius: { xs: 3, md: 4 },
        bgcolor: isDark ? "#050d18" : "#ffffff",
        border: isDark
          ? "1px solid rgba(0, 255, 252, 0.35)"
          : "1px solid rgba(2, 132, 199, 0.25)",
        boxShadow: isDark
          ? "0 25px 70px rgba(0, 0, 0, 0.8), 0 0 50px rgba(0, 255, 252, 0.18)"
          : "0 20px 60px rgba(15, 23, 42, 0.08), 0 0 35px rgba(2, 132, 199, 0.08)",
        overflow: "hidden",
        position: "relative",
        transition: "all 0.4s ease",
        "&:hover": {
          borderColor: isDark ? "rgba(0, 255, 252, 0.6)" : "rgba(2, 132, 199, 0.5)",
          boxShadow: isDark
            ? "0 30px 90px rgba(0, 0, 0, 0.9), 0 0 70px rgba(0, 255, 252, 0.28)"
            : "0 25px 75px rgba(15, 23, 42, 0.12), 0 0 45px rgba(2, 132, 199, 0.15)",
        },
      }}
      onMouseEnter={() => setIsPaused(false)}
    >
      {/* Top Window Chrome / IDE Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2, sm: 2.5 },
          py: 1.5,
          bgcolor: isDark ? "rgba(10, 22, 36, 0.95)" : "#f1f5f9",
          borderBottom: isDark
            ? "1px solid rgba(0, 255, 252, 0.15)"
            : "1px solid rgba(15, 23, 42, 0.08)",
          backdropFilter: "blur(12px)",
          transition: "all 0.3s ease",
        }}
      >
        {/* macOS Traffic Lights */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 11, height: 11, borderRadius: "50%", bgcolor: "#ff5f56" }} />
          <Box sx={{ width: 11, height: 11, borderRadius: "50%", bgcolor: "#ffbd2e" }} />
          <Box sx={{ width: 11, height: 11, borderRadius: "50%", bgcolor: "#27c93f" }} />
          <Typography
            sx={{
              display: { xs: "none", sm: "block" },
              ml: 1.5,
              fontSize: "12px",
              color: isDark ? "rgba(255, 255, 255, 0.7)" : "#475569",
              fontWeight: 600,
              fontFamily: "monospace",
              letterSpacing: 0.5,
            }}
          >
            SI-Studio • variable_declaration.js
          </Typography>
        </Box>

        {/* Live Status Indicators */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.8,
              px: 1.5,
              py: 0.4,
              borderRadius: "20px",
              bgcolor: isCompleted
                ? isDark
                  ? "rgba(39, 201, 63, 0.12)"
                  : "rgba(16, 185, 129, 0.12)"
                : isDark
                ? "rgba(0, 255, 252, 0.12)"
                : "rgba(2, 132, 199, 0.12)",
              border: `1px solid ${
                isCompleted
                  ? isDark
                    ? "rgba(39, 201, 63, 0.4)"
                    : "rgba(16, 185, 129, 0.4)"
                  : isDark
                  ? "rgba(0, 255, 252, 0.4)"
                  : "rgba(2, 132, 199, 0.4)"
              }`,
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: isCompleted
                  ? isDark
                    ? "#27c93f"
                    : "#10b981"
                  : isDark
                  ? "#00fffc"
                  : "#0284c7",
                boxShadow: isCompleted
                  ? "0 0 8px #27c93f"
                  : isDark
                  ? "0 0 8px #00fffc"
                  : "0 0 8px #0284c7",
                animation: isCompleted ? "none" : "blinkCursor 1s infinite",
              }}
            />
            <Typography
              sx={{
                fontSize: "11px",
                fontWeight: 700,
                color: isCompleted
                  ? isDark
                    ? "#27c93f"
                    : "#10b981"
                  : isDark
                  ? "#00fffc"
                  : "#0284c7",
                letterSpacing: 0.4,
              }}
            >
              {isCompleted ? "✓ Generated in 320ms" : "⚡ Auto-Generating..."}
            </Typography>
          </Box>

          <Tooltip title="Replay code generation" placement="bottom">
            <IconButton
              size="small"
              onClick={resetAnimation}
              sx={{
                color: isDark ? "#00fffc" : "#0284c7",
                bgcolor: isDark ? "rgba(0, 255, 252, 0.08)" : "rgba(2, 132, 199, 0.08)",
                border: isDark
                  ? "1px solid rgba(0, 255, 252, 0.25)"
                  : "1px solid rgba(2, 132, 199, 0.25)",
                p: 0.6,
                "&:hover": {
                  bgcolor: isDark ? "rgba(0, 255, 252, 0.2)" : "rgba(2, 132, 199, 0.18)",
                  transform: "rotate(-45deg)",
                },
                transition: "all 0.3s ease",
              }}
            >
              <FiRotateCcw size={13} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Chat Workspace Content */}
      <Box sx={{ p: { xs: 2, sm: 3.5 }, display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* User Query Pill */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: { xs: 1.2, sm: 1.6 },
            px: { xs: 1.5, sm: 2.2 },
            borderRadius: "14px",
            bgcolor: isDark ? "rgba(0, 60, 72, 0.65)" : "rgba(2, 132, 199, 0.08)",
            border: isDark
              ? "1px solid rgba(0, 255, 252, 0.3)"
              : "1px solid rgba(2, 132, 199, 0.2)",
            boxShadow: isDark
              ? "0 4px 18px rgba(0, 0, 0, 0.3)"
              : "0 2px 8px rgba(15, 23, 42, 0.04)",
            transition: "all 0.3s ease",
          }}
        >
          {/* User Avatar Initial */}
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              bgcolor: isDark ? "#001b22" : "#e0f2fe",
              border: isDark ? "1.5px solid #00fffc" : "1.5px solid #0284c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isDark ? "#00fffc" : "#0284c7",
              fontWeight: 800,
              fontSize: "12px",
              flexShrink: 0,
              boxShadow: isDark
                ? "0 0 10px rgba(0, 255, 252, 0.3)"
                : "0 0 8px rgba(2, 132, 199, 0.25)",
            }}
          >
            MH
          </Box>
          <Typography
            sx={{
              color: isDark ? "#ffffff" : "#0f172a",
              fontSize: { xs: "13.5px", sm: "15px" },
              fontWeight: 600,
              letterSpacing: 0.2,
              transition: "color 0.3s ease",
            }}
          >
            Can you show how can I declare variable in JavaScript
          </Typography>
        </Box>

        {/* AI Assistant Output Card */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: { xs: 1.5, sm: 2 },
            p: { xs: 1.5, sm: 2.5 },
            borderRadius: "16px",
            bgcolor: isDark ? "rgba(10, 20, 32, 0.7)" : "#f8fafc",
            border: isDark
              ? "1px solid rgba(0, 255, 252, 0.15)"
              : "1px solid rgba(15, 23, 42, 0.08)",
            transition: "all 0.3s ease",
          }}
        >
          {/* SI Logo Avatar (Completely replacing ChatGPT logo) */}
          <Box
            sx={{
              width: { xs: 34, sm: 40 },
              height: { xs: 34, sm: 40 },
              borderRadius: "50%",
              overflow: "hidden",
              border: isDark ? "2px solid #00fffc" : "2px solid #0284c7",
              boxShadow: isDark
                ? "0 0 14px rgba(0, 255, 252, 0.5)"
                : "0 0 12px rgba(2, 132, 199, 0.4)",
              flexShrink: 0,
              mt: 0.5,
              bgcolor: isDark ? "#000814" : "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              component="img"
              src="/si-logo.png"
              alt="SI Super Intelligence Logo"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </Box>

          {/* Dynamic Generated Output Stream */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Assistant Header Name */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography
                sx={{
                  color: isDark ? "#00fffc" : "#0284c7",
                  fontWeight: 700,
                  fontSize: { xs: "13px", sm: "14px" },
                  letterSpacing: 0.5,
                  transition: "color 0.3s ease",
                }}
              >
                SI Super Intelligence
              </Typography>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.4,
                  bgcolor: isDark ? "rgba(0, 255, 252, 0.1)" : "rgba(2, 132, 199, 0.1)",
                  border: isDark
                    ? "1px solid rgba(0, 255, 252, 0.25)"
                    : "1px solid rgba(2, 132, 199, 0.25)",
                  px: 0.8,
                  py: 0.2,
                  borderRadius: "6px",
                }}
              >
                <FiZap size={11} color={isDark ? "#00fffc" : "#0284c7"} />
                <Typography
                  sx={{
                    color: isDark ? "#00fffc" : "#0284c7",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  Flash Multi-Model
                </Typography>
              </Box>
            </Box>

            {/* Intro text */}
            {displayedIntro && (
              <Typography
                sx={{
                  color: isDark ? "rgba(255, 255, 255, 0.9)" : "#1e293b",
                  fontSize: { xs: "13.5px", sm: "14.5px" },
                  lineHeight: 1.6,
                  mb: 1.5,
                  transition: "color 0.3s ease",
                }}
              >
                {displayedIntro}
                {introVisibleLen < FULL_DATA.intro.length && (
                  <Box
                    component="span"
                    sx={{
                      display: "inline-block",
                      width: "2px",
                      height: "14px",
                      bgcolor: isDark ? "#00fffc" : "#0284c7",
                      ml: "2px",
                      verticalAlign: "middle",
                      animation: "blinkCursor 0.8s infinite",
                    }}
                  />
                )}
              </Typography>
            )}

            {/* Section 1: Using 'var': */}
            {displayedVarLabel && (
              <Typography
                sx={{
                  color: isDark ? "#ffffff" : "#0f172a",
                  fontSize: { xs: "13px", sm: "14px" },
                  fontWeight: 600,
                  mt: 1.5,
                  mb: 0.5,
                  transition: "color 0.3s ease",
                }}
              >
                {displayedVarLabel}
              </Typography>
            )}
            {displayedVarCode && (
              <SyntaxCodeBlock code={displayedVarCode} isStreaming={isVarCodeStreaming} />
            )}

            {/* Section 2: Using 'let': */}
            {displayedLetLabel && (
              <Typography
                sx={{
                  color: isDark ? "#ffffff" : "#0f172a",
                  fontSize: { xs: "13px", sm: "14px" },
                  fontWeight: 600,
                  mt: 2,
                  mb: 0.5,
                  transition: "color 0.3s ease",
                }}
              >
                {displayedLetLabel}
              </Typography>
            )}
            {displayedLetCode && (
              <SyntaxCodeBlock code={displayedLetCode} isStreaming={isLetCodeStreaming} />
            )}

            {/* Section 3: Using 'const': */}
            {displayedConstLabel && (
              <Typography
                sx={{
                  color: isDark ? "#ffffff" : "#0f172a",
                  fontSize: { xs: "13px", sm: "14px" },
                  fontWeight: 600,
                  mt: 2,
                  mb: 0.5,
                  transition: "color 0.3s ease",
                }}
              >
                {displayedConstLabel}
              </Typography>
            )}
            {displayedConstCode && (
              <SyntaxCodeBlock code={displayedConstCode} isStreaming={isConstCodeStreaming} />
            )}

            {/* Section 4: Concluding Explanation */}
            {displayedExplanation && (
              <Box
                sx={{
                  mt: 2.5,
                  p: 2,
                  borderRadius: "10px",
                  bgcolor: isDark ? "rgba(0, 255, 252, 0.03)" : "rgba(2, 132, 199, 0.04)",
                  border: isDark
                    ? "1px solid rgba(0, 255, 252, 0.12)"
                    : "1px solid rgba(2, 132, 199, 0.15)",
                  transition: "all 0.3s ease",
                }}
              >
                <Typography
                  sx={{
                    color: isDark ? "rgba(255, 255, 255, 0.85)" : "#334155",
                    fontSize: { xs: "13px", sm: "14px" },
                    lineHeight: 1.7,
                    transition: "color 0.3s ease",
                  }}
                >
                  {displayedExplanation}
                  {isExplanationStreaming && (
                    <Box
                      component="span"
                      sx={{
                        display: "inline-block",
                        width: "2px",
                        height: "14px",
                        bgcolor: isDark ? "#00fffc" : "#0284c7",
                        ml: "3px",
                        verticalAlign: "middle",
                        animation: "blinkCursor 0.8s infinite",
                      }}
                    />
                  )}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Embedded CSS for pulsing cursor */}
      <style>
        {`
          @keyframes blinkCursor {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}
      </style>
    </Box>
  );
};

export default LiveWorkspacePreview;
