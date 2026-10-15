import React, { useState, useEffect } from "react";
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useThemeMode } from "../../context/ThemeContext";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  FiPaperclip,
  FiCopy,
  FiCheck,
  FiThumbsUp,
  FiThumbsDown,
  FiVolume2,
  FiVolumeX,
  FiShare2,
} from "react-icons/fi";
import { AiOutlineFilePdf } from "react-icons/ai";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";
import {
  speakWithIndianFemaleVoice,
  stopSpeaking,
} from "../../helpers/indianVoiceSynthesizer";

function extractCodeFromString(message: string) {
  if (message.includes("```")) {
    const blocks = message.split("```");
    return blocks;
  }
}

function isCodeBlock(str: string) {
  if (
    str.includes("=") ||
    str.includes(";") ||
    str.includes("[") ||
    str.includes("]") ||
    str.includes("{") ||
    str.includes("}") ||
    str.includes("#") ||
    str.includes("//")
  ) {
    return true;
  }
  return false;
}

const CodeBlockItem = ({ code, isDark }: { code: string; isDark: boolean }) => {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success("Code copied to clipboard!", { icon: "📋" });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <Box sx={{ position: "relative", my: 1.2, width: "100%" }}>
      <Box
        component="button"
        type="button"
        onClick={handleCopyCode}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 2,
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          px: 1,
          py: 0.35,
          borderRadius: 1.5,
          border: isDark
            ? "1px solid rgba(255, 255, 255, 0.18)"
            : "1px solid rgba(0, 0, 0, 0.18)",
          bgcolor: isDark
            ? "rgba(17, 29, 39, 0.88)"
            : "rgba(241, 245, 249, 0.95)",
          color: copiedCode
            ? "#10b981"
            : isDark
            ? "rgba(255, 255, 255, 0.85)"
            : "#334155",
          fontSize: "11px",
          fontWeight: 600,
          cursor: "pointer",
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
          backdropFilter: "blur(6px)",
          transition: "all 0.2s ease",
          ":hover": {
            bgcolor: isDark ? "rgba(0, 255, 252, 0.15)" : "rgba(2, 132, 199, 0.15)",
            borderColor: isDark ? "#00fffc" : "#0284c7",
          },
        }}
      >
        {copiedCode ? <FiCheck size={12} /> : <FiCopy size={12} />}
        <span>{copiedCode ? "Copied" : "Copy"}</span>
      </Box>
      <SyntaxHighlighter
        style={coldarkDark}
        language="javascript"
        customStyle={{
          fontSize: "13px",
          borderRadius: "8px",
          margin: 0,
          padding: "12px 14px",
          paddingTop: "34px",
          maxWidth: "100%",
          overflowX: "auto",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </Box>
  );
};

const ChatItem = ({
  content,
  role,
  id,
  agent,
}: {
  content: string;
  role: "user" | "assistant";
  id?: string;
  agent?: string;
}) => {
  const auth = useAuth();
  const { isDark } = useThemeMode();
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fileMatch = content.match(/^\[File:\s*([^\]]+)\]\n?([\s\S]*)$/);
  const attachedFileName = fileMatch ? fileMatch[1] : null;
  const actualContent = fileMatch ? fileMatch[2] : content;

  const messageBlocks = extractCodeFromString(actualContent);

  const handleCopy = () => {
    navigator.clipboard.writeText(actualContent);
    setCopied(true);
    toast.success("Copied response to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    if (liked === true) {
      setLiked(null);
    } else {
      setLiked(true);
      toast.success("Thanks for the feedback!");
    }
  };

  const handleDislike = () => {
    if (liked === false) {
      setLiked(null);
    } else {
      setLiked(false);
      toast("Feedback noted", { icon: "👍" });
    }
  };

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/chat${id ? `#${id}` : ""}`
      : "";

  const shareText =
    "Check out this AI response from SI Super Intelligence:\n" +
    actualContent.slice(0, 160) +
    (actualContent.length > 160 ? "..." : "");

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "SI Super Intelligence AI Response",
          text: shareText,
          url: shareUrl,
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Share error:", err);
          navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied to clipboard!", { icon: "🔗" });
        }
      }
    } else {
      // Direct copy link fallback on browsers without native share support
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!", { icon: "🔗" });
    }
  };

  // Pre-load voices on component mount so the browser caches them immediately
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      const onVoices = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener("voiceschanged", onVoices);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
      };
    }
  }, []);







  const handleSpeech = async () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Text-to-speech not supported on this browser");
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    speakWithIndianFemaleVoice(actualContent, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  useEffect(() => {
    return () => {
      if (isSpeaking) {
        stopSpeaking();
      }
    };
  }, [isSpeaking]);

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Helper to load logo as base64 DataURL for PDF embedding
  const loadLogoBase64 = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => {
        fetch("/si-logo.png")
          .then((res) => res.blob())
          .then((blob) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          })
          .catch(() => resolve(null));
      };
      img.src = "/si-logo.png";
    });
  };

  // Helper to clean inline markdown markers for clean PDF typography
  const cleanMarkdownText = (str: string): string => {
    return str
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();
  };

  // Helper to parse raw markdown text into semantic blocks
  const parseMarkdownBlocks = (rawText: string) => {
    const blocks: Array<{
      type:
        | "h1"
        | "h2"
        | "h3"
        | "divider"
        | "bullet"
        | "numbered"
        | "quote"
        | "code"
        | "paragraph";
      text?: string;
    }> = [];
    const lines = rawText.split(/\r?\n/);
    let inCodeBlock = false;
    let codeBuffer: string[] = [];
    let currentParagraph: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(" ").trim();
        if (text) {
          blocks.push({ type: "paragraph", text });
        }
        currentParagraph = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith("```")) {
        if (inCodeBlock) {
          blocks.push({ type: "code", text: codeBuffer.join("\n") });
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          flushParagraph();
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      if (!trimmed) {
        flushParagraph();
        continue;
      }

      if (/^#{1}\s+(.*)/.test(trimmed)) {
        flushParagraph();
        blocks.push({ type: "h1", text: trimmed.replace(/^#{1}\s+/, "") });
        continue;
      }
      if (/^#{2}\s+(.*)/.test(trimmed)) {
        flushParagraph();
        blocks.push({ type: "h2", text: trimmed.replace(/^#{2}\s+/, "") });
        continue;
      }
      if (/^#{3,6}\s+(.*)/.test(trimmed)) {
        flushParagraph();
        blocks.push({ type: "h3", text: trimmed.replace(/^#{3,6}\s+/, "") });
        continue;
      }
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        flushParagraph();
        blocks.push({ type: "divider" });
        continue;
      }
      if (/^[-*+]\s+(.*)/.test(trimmed)) {
        flushParagraph();
        blocks.push({ type: "bullet", text: trimmed.replace(/^[-*+]\s+/, "") });
        continue;
      }
      if (/^\d+\.\s+(.*)/.test(trimmed)) {
        flushParagraph();
        blocks.push({ type: "numbered", text: trimmed });
        continue;
      }
      if (/^>\s+(.*)/.test(trimmed)) {
        flushParagraph();
        blocks.push({ type: "quote", text: trimmed.replace(/^>\s+/, "") });
        continue;
      }

      currentParagraph.push(trimmed);
    }

    flushParagraph();
    if (codeBuffer.length > 0) {
      blocks.push({ type: "code", text: codeBuffer.join("\n") });
    }

    return blocks;
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const doc = new jsPDF({
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 18;
      const contentWidth = pageWidth - margin * 2;
      const bottomMargin = 20;
      const topMarginSubsequent = 19;

      // Load logo image
      const logoBase64 = await loadLogoBase64();

      const dateStr = new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      // Running Header for pages 2+
      const renderRunningHeader = () => {
        doc.setFillColor(15, 23, 42); // Dark slate
        doc.rect(0, 0, pageWidth, 10, "F");

        doc.setFillColor(0, 255, 252); // Cyan accent line
        doc.rect(0, 9.4, pageWidth, 0.6, "F");

        if (logoBase64) {
          try {
            doc.addImage(logoBase64, "PNG", margin, 1.8, 6.5, 6.5);
          } catch (e) {
            console.debug("Running header logo load error:", e);
          }
        }

        const titleX = logoBase64 ? margin + 9 : margin;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        doc.text("SI SUPER INTELLIGENCE", titleX, 6.8);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(226, 232, 240);
        doc.text(`Generated: ${dateStr}`, pageWidth - margin, 6.8, {
          align: "right",
        });

        // Explicitly reset body text color to solid dark charcoal
        doc.setTextColor(17, 24, 39);
      };

      // Space checking helper for page overflow
      const ensureSpace = (neededHeight: number) => {
        if (currentY + neededHeight > pageHeight - bottomMargin) {
          doc.addPage();
          renderRunningHeader();
          currentY = topMarginSubsequent;
          doc.setTextColor(17, 24, 39);
        }
      };

      // ----------------------------------------------------
      // PAGE 1: CLEAN HEADER WITH LOGO
      // ----------------------------------------------------
      doc.setFillColor(15, 23, 42); // Dark slate header banner
      doc.rect(0, 0, pageWidth, 22, "F");

      doc.setFillColor(0, 255, 252); // Cyan accent rule
      doc.rect(0, 21.2, pageWidth, 0.8, "F");

      // Draw Logo on Page 1 Header
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, "PNG", margin, 3.5, 15, 15);
        } catch (e) {
          console.debug("Page 1 logo load error:", e);
        }
      }

      const headerTextX = logoBase64 ? margin + 18 : margin;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13.5);
      doc.setTextColor(255, 255, 255);
      doc.text("SI SUPER INTELLIGENCE", headerTextX, 13.5);

      // Right: Timestamp only (Clean & neat)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`Generated: ${dateStr}`, pageWidth - margin, 13.5, {
        align: "right",
      });

      let currentY = 30;

      // Attachment chip if a file was uploaded
      if (attachedFileName) {
        doc.setFillColor(240, 249, 255);
        doc.setDrawColor(186, 230, 253);
        doc.roundedRect(margin, currentY, contentWidth, 8, 1, 1, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(2, 132, 199);
        doc.text(`Attached File: ${attachedFileName}`, margin + 3.5, currentY + 5.2);
        currentY += 12;
      }

      // ----------------------------------------------------
      // PARSE & RENDER STRUCTURED CONTENT BLOCKS
      // ----------------------------------------------------
      const blocks = parseMarkdownBlocks(actualContent);

      for (const block of blocks) {
        if (block.type === "divider") {
          ensureSpace(7);
          currentY += 2;
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.35);
          doc.line(margin, currentY, pageWidth - margin, currentY);
          currentY += 5;
        } else if (block.type === "h1") {
          const cleanText = cleanMarkdownText(block.text || "");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12.5);
          const h1Lines = doc.splitTextToSize(cleanText, contentWidth - 6);

          ensureSpace(h1Lines.length * 5.8 + 20);
          currentY += 2;

          // Cyan indicator pill
          doc.setFillColor(0, 210, 211);
          doc.roundedRect(
            margin,
            currentY - 3.8,
            2.5,
            h1Lines.length * 5.8,
            0.5,
            0.5,
            "F"
          );

          doc.setTextColor(15, 23, 42);
          doc.text(h1Lines, margin + 5, currentY);
          currentY += h1Lines.length * 5.8 + 2;

          // Underline divider rule
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.line(margin, currentY, pageWidth - margin, currentY);
          currentY += 4.5;
        } else if (block.type === "h2") {
          const cleanText = cleanMarkdownText(block.text || "");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          const h2Lines = doc.splitTextToSize(cleanText, contentWidth);

          ensureSpace(h2Lines.length * 5.2 + 15);
          currentY += 2;

          doc.setTextColor(30, 41, 59);
          doc.text(h2Lines, margin, currentY);
          currentY += h2Lines.length * 5.2 + 3.5;
        } else if (block.type === "h3") {
          const cleanText = cleanMarkdownText(block.text || "");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          const h3Lines = doc.splitTextToSize(cleanText, contentWidth);

          ensureSpace(h3Lines.length * 4.8 + 12);
          doc.setTextColor(51, 65, 85);
          doc.text(h3Lines, margin, currentY);
          currentY += h3Lines.length * 4.8 + 3;
        } else if (block.type === "bullet") {
          const cleanText = cleanMarkdownText(block.text || "");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          const lines = doc.splitTextToSize(cleanText, contentWidth - 6);
          const itemHeight = lines.length * 5.2;

          ensureSpace(itemHeight + 4);

          // Cyan bullet symbol
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(0, 180, 216);
          doc.text("•", margin + 1, currentY);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(17, 24, 39);
          doc.text(lines, margin + 6, currentY, {
            maxWidth: contentWidth - 6,
            align: "justify",
          });
          currentY += itemHeight + 3;
        } else if (block.type === "numbered") {
          const cleanText = cleanMarkdownText(block.text || "");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(17, 24, 39);
          const lines = doc.splitTextToSize(cleanText, contentWidth - 4);
          const itemHeight = lines.length * 5.2;

          ensureSpace(itemHeight + 4);
          doc.text(lines, margin + 4, currentY, {
            maxWidth: contentWidth - 4,
            align: "justify",
          });
          currentY += itemHeight + 3;
        } else if (block.type === "quote") {
          const cleanText = cleanMarkdownText(block.text || "");
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9.5);
          const lines = doc.splitTextToSize(cleanText, contentWidth - 8);
          const boxHeight = lines.length * 4.8 + 2;

          ensureSpace(boxHeight + 5);

          // Left quote bar
          doc.setFillColor(0, 210, 211);
          doc.rect(margin, currentY - 2.8, 1.2, boxHeight, "F");

          doc.setTextColor(71, 85, 105);
          doc.text(lines, margin + 5, currentY);
          currentY += boxHeight + 3.5;
        } else if (block.type === "code") {
          doc.setFont("courier", "normal");
          doc.setFontSize(8.5);
          const codeLines = doc.splitTextToSize(block.text || "", contentWidth - 8);
          const boxHeight = codeLines.length * 4.2 + 6;

          ensureSpace(Math.min(boxHeight, 40));

          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(margin, currentY - 3, contentWidth, boxHeight, 1.5, 1.5, "FD");

          doc.setTextColor(15, 23, 42);
          doc.text(codeLines, margin + 4, currentY + 1.5);
          currentY += boxHeight + 4;
        } else if (block.type === "paragraph") {
          // -------------------------------------------------------------
          // KEEP ENTIRE PARAGRAPH TOGETHER ON THE PAGE (NO BROKEN LINES)
          // -------------------------------------------------------------
          const cleanText = cleanMarkdownText(block.text || "");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(17, 24, 39);

          const lines: string[] = doc.splitTextToSize(cleanText, contentWidth);
          const lineHeight = 5.4;
          const totalParagraphHeight = lines.length * lineHeight;

          // If the entire paragraph cannot fit on the current page, move it cleanly to the next page!
          if (currentY + totalParagraphHeight > pageHeight - bottomMargin) {
            doc.addPage();
            renderRunningHeader();
            currentY = topMarginSubsequent;
          }

          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(17, 24, 39); // Solid dark charcoal - NEVER faded!
          doc.text(lines, margin, currentY, {
            maxWidth: contentWidth,
            align: "justify",
          });
          currentY += totalParagraphHeight + 4.5;
        }
      }

      // ----------------------------------------------------
      // CLEAN FOOTER ON ALL PAGES
      // ----------------------------------------------------
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);

        // Footer top dividing rule
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        // Footer Left
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("SI Super Intelligence", margin, pageHeight - 7);

        // Footer Right
        doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 7, {
          align: "right",
        });
      }

      // Clean file naming
      const firstWords =
        actualContent
          .replace(/[^\w\s]/gi, "")
          .trim()
          .split(/\s+/)
          .slice(0, 4)
          .join("_")
          .toLowerCase() || "response";
      const fileName = `SI_Response_${firstWords}_${Date.now()}.pdf`;

      doc.save(fileName);
      toast.success("PDF exported successfully!", { icon: "📄" });
    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return role === "assistant" ? (
    <Box
      id={id}
      sx={{
        display: "flex",
        alignSelf: "flex-start",
        maxWidth: { xs: "98%", sm: "92%", md: "85%" },
        width: "fit-content",
        px: { xs: 1.2, sm: 2 },
        py: { xs: 1.2, sm: 1.5 },
        bgcolor: isDark ? "rgba(17, 29, 39, 0.7)" : "#ffffff",
        border: isDark
          ? "1px solid rgba(0, 255, 252, 0.12)"
          : "1px solid rgba(2, 132, 199, 0.16)",
        gap: { xs: 1, sm: 1.5 },
        borderRadius: "16px 16px 16px 4px",
        my: 0.8,
        alignItems: "flex-start",
        boxShadow: isDark
          ? "0 2px 10px rgba(0, 0, 0, 0.2)"
          : "0 4px 16px rgba(15, 23, 42, 0.05)",
        transition: "all 0.3s ease",
      }}
    >
      {agent === "nova" ? (
        <Box
          sx={{
            width: { xs: 28, sm: 34 },
            height: { xs: 28, sm: 34 },
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #06b6d4 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "14px",
            boxShadow: "0 0 14px rgba(168, 85, 247, 0.5)",
            flexShrink: 0,
          }}
        >
          ✨
        </Box>
      ) : agent === "aura" ? (
        <Box
          sx={{
            width: { xs: 28, sm: 34 },
            height: { xs: 28, sm: 34 },
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "14px",
            boxShadow: "0 0 14px rgba(245, 158, 11, 0.5)",
            flexShrink: 0,
          }}
        >
          🎨
        </Box>
      ) : agent === "sage" ? (
        <Box
          sx={{
            width: { xs: 28, sm: 34 },
            height: { xs: 28, sm: 34 },
            borderRadius: "50%",
            background: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "14px",
            boxShadow: "0 0 14px rgba(16, 185, 129, 0.5)",
            flexShrink: 0,
          }}
        >
          🌿
        </Box>
      ) : (
        <Avatar
          sx={{
            width: { xs: 28, sm: 32 },
            height: { xs: 28, sm: 32 },
            ml: 0,
            bgcolor: "transparent",
            flexShrink: 0,
          }}
        >
          <img
            src="/si-logo.png"
            alt="SI Super Intelligence"
            width="28px"
            height="28px"
            style={{
              borderRadius: "50%",
              filter: "drop-shadow(0 0 5px rgba(0, 255, 252, 0.5))",
            }}
          />
        </Avatar>
      )}
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        {agent && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.6 }}>
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 700,
                color:
                  agent === "nova"
                    ? isDark ? "#c084fc" : "#7e22ce"
                    : agent === "aura"
                    ? isDark ? "#fbbf24" : "#d97706"
                    : agent === "sage"
                    ? isDark ? "#34d399" : "#059669"
                    : isDark ? "#00fffc" : "#0284c7",
              }}
            >
              {agent === "nova"
                ? "Nova (Conversational Companion)"
                : agent === "aura"
                ? "Aura (Creative & Storyteller)"
                : agent === "sage"
                ? "Sage (Life & Wisdom Mentor)"
                : "Nexus (Super Intelligence)"}
            </Typography>
          </Box>
        )}
        {attachedFileName && (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.8,
              bgcolor: "rgba(0, 255, 252, 0.12)",
              color: "#00fffc",
              px: 1.2,
              py: 0.3,
              borderRadius: 1.5,
              mb: 0.8,
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            <FiPaperclip size={13} /> {attachedFileName}
          </Box>
        )}
        {!messageBlocks && (
          <Typography
            sx={{
              fontSize: { xs: "14px", sm: "15px" },
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              color: isDark ? "#e6e6e6" : "#0f172a",
              wordBreak: "break-word",
              transition: "color 0.3s ease",
            }}
          >
            {actualContent}
          </Typography>
        )}
        {messageBlocks &&
          messageBlocks.length &&
          messageBlocks.map((block, idx) =>
            isCodeBlock(block) ? (
              <CodeBlockItem key={idx} code={block} isDark={isDark} />
            ) : (
              <Typography
                key={idx}
                sx={{
                  fontSize: { xs: "14px", sm: "15px" },
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  color: isDark ? "#e6e6e6" : "#0f172a",
                  wordBreak: "break-word",
                  transition: "color 0.3s ease",
                }}
              >
                {block}
              </Typography>
            )
          )}

        {/* Action Bar: Copy, Read Aloud (Female Voice), Like, Dislike, Share, Export PDF */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: { xs: 0.6, sm: 1 },
            rowGap: 0.6,
            mt: 1.2,
            pt: 0.8,
            borderTop: isDark
              ? "1px solid rgba(255, 255, 255, 0.06)"
              : "1px solid rgba(15, 23, 42, 0.08)",
          }}
        >
          {/* Copy Button */}
          <Tooltip title={copied ? "Copied!" : "Copy response"}>
            <IconButton
              size="small"
              onClick={handleCopy}
              sx={{
                color: copied
                  ? isDark ? "#00fffc" : "#0284c7"
                  : isDark ? "rgba(255, 255, 255, 0.55)" : "#64748b",
                p: 0.5,
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                ":hover": {
                  color: isDark ? "#00fffc" : "#0284c7",
                  bgcolor: isDark ? "rgba(0, 255, 252, 0.1)" : "rgba(2, 132, 199, 0.1)",
                },
              }}
            >
              {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
            </IconButton>
          </Tooltip>

          {/* Read aloud */}
          <Tooltip
            title={
              isSpeaking
                ? "Stop reading"
                : "Read aloud"
            }
          >
            <IconButton
              size="small"
              onClick={handleSpeech}
              sx={{
                color: isSpeaking
                  ? isDark ? "#00fffc" : "#0284c7"
                  : isDark ? "rgba(255, 255, 255, 0.55)" : "#64748b",
                p: 0.5,
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                ":hover": {
                  color: isDark ? "#00fffc" : "#0284c7",
                  bgcolor: isDark ? "rgba(0, 255, 252, 0.1)" : "rgba(2, 132, 199, 0.1)",
                },
              }}
            >
              {isSpeaking ? (
                <FiVolumeX size={15} style={{ color: isDark ? "#00fffc" : "#0284c7" }} />
              ) : (
                <FiVolume2 size={15} />
              )}
            </IconButton>
          </Tooltip>

          {/* Like Button */}
          <Tooltip title={liked === true ? "Liked" : "Like"}>
            <IconButton
              size="small"
              onClick={handleLike}
              sx={{
                color: liked === true
                  ? isDark ? "#00fffc" : "#0284c7"
                  : isDark ? "rgba(255, 255, 255, 0.55)" : "#64748b",
                p: 0.5,
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                ":hover": {
                  color: isDark ? "#00fffc" : "#0284c7",
                  bgcolor: isDark ? "rgba(0, 255, 252, 0.1)" : "rgba(2, 132, 199, 0.1)",
                },
              }}
            >
              <FiThumbsUp size={14} />
            </IconButton>
          </Tooltip>

          {/* Dislike Button */}
          <Tooltip title={liked === false ? "Disliked" : "Dislike"}>
            <IconButton
              size="small"
              onClick={handleDislike}
              sx={{
                color: liked === false
                  ? "#ff5252"
                  : isDark ? "rgba(255, 255, 255, 0.55)" : "#64748b",
                p: 0.5,
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                ":hover": {
                  color: "#ff5252",
                  bgcolor: "rgba(255, 82, 82, 0.1)",
                },
              }}
            >
              <FiThumbsDown size={14} />
            </IconButton>
          </Tooltip>

          {/* Share Button - directly launches detected device apps */}
          <Tooltip title="Share with device apps">
            <IconButton
              size="small"
              onClick={handleShare}
              sx={{
                color: isDark ? "rgba(255, 255, 255, 0.55)" : "#64748b",
                p: 0.5,
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                transition: "all 0.2s ease",
                ":hover": {
                  color: isDark ? "#00fffc" : "#0284c7",
                  bgcolor: isDark ? "rgba(0, 255, 252, 0.1)" : "rgba(2, 132, 199, 0.1)",
                },
              }}
            >
              <FiShare2 size={14} />
            </IconButton>
          </Tooltip>

          {/* Export PDF Button - directly after share option */}
          <Tooltip title="Export this response as PDF document">
            <Box
              component="button"
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.6,
                ml: 0.8,
                px: 1.1,
                py: 0.35,
                borderRadius: "6px",
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                border: isDark
                  ? "1px solid rgba(255, 255, 255, 0.16)"
                  : "1px solid rgba(15, 23, 42, 0.15)",
                bgcolor: isDark
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(15, 23, 42, 0.04)",
                color: isDark
                  ? "rgba(255, 255, 255, 0.78)"
                  : "#334155",
                fontSize: "12px",
                fontWeight: 600,
                cursor: isExportingPdf ? "not-allowed" : "pointer",
                transition: "all 0.2s ease-in-out",
                outline: "none",
                ":hover": {
                  color: isDark ? "#00fffc" : "#0284c7",
                  borderColor: isDark
                    ? "rgba(0, 255, 252, 0.45)"
                    : "rgba(2, 132, 199, 0.45)",
                  bgcolor: isDark
                    ? "rgba(0, 255, 252, 0.1)"
                    : "rgba(2, 132, 199, 0.1)",
                  boxShadow: isDark
                    ? "0 0 10px rgba(0, 255, 252, 0.15)"
                    : "0 2px 8px rgba(2, 132, 199, 0.15)",
                  transform: "translateY(-1px)",
                },
                ":active": {
                  transform: "translateY(0px)",
                },
              }}
            >
              {isExportingPdf ? (
                <CircularProgress size={12} sx={{ color: isDark ? "#00fffc" : "#0284c7" }} />
              ) : (
                <AiOutlineFilePdf size={14} style={{ color: "#ff5252" }} />
              )}
              <Typography
                component="span"
                sx={{
                  fontSize: "12px",
                  fontWeight: 600,
                  lineHeight: 1,
                  letterSpacing: "0.2px",
                }}
              >
                Export PDF
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  ) : (
    <Box
      id={id}
      sx={{
        display: "flex",
        alignSelf: "flex-end",
        maxWidth: { xs: "94%", sm: "85%", md: "78%" },
        width: "fit-content",
        ml: "auto",
        px: { xs: 1.4, sm: 2 },
        py: { xs: 1.2, sm: 1.5 },
        bgcolor: isDark ? "#004d56" : "#0284c7",
        background: isDark
          ? "linear-gradient(135deg, #005c66, #004d56)"
          : "linear-gradient(135deg, #0284c7, #0369a1)",
        gap: { xs: 1, sm: 1.5 },
        borderRadius: "16px 16px 4px 16px",
        my: 0.8,
        alignItems: "flex-start",
        boxShadow: isDark
          ? "0 3px 12px rgba(0, 77, 86, 0.4)"
          : "0 4px 14px rgba(2, 132, 199, 0.25)",
        border: isDark
          ? "1px solid rgba(0, 255, 252, 0.2)"
          : "1px solid rgba(2, 132, 199, 0.3)",
        transition: "all 0.3s ease",
      }}
    >
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        {attachedFileName && (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.8,
              bgcolor: "rgba(255, 255, 255, 0.2)",
              color: "white",
              px: 1.2,
              py: 0.3,
              borderRadius: 1.5,
              mb: 0.8,
              fontSize: "12px",
              fontWeight: 500,
            }}
          >
            <FiPaperclip size={13} /> {attachedFileName}
          </Box>
        )}
        {!messageBlocks && (
          <Typography
            sx={{
              fontSize: { xs: "14px", sm: "15px" },
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              color: "#ffffff",
              wordBreak: "break-word",
            }}
          >
            {actualContent}
          </Typography>
        )}
        {messageBlocks &&
          messageBlocks.length &&
          messageBlocks.map((block, idx) =>
            isCodeBlock(block) ? (
              <SyntaxHighlighter
                key={idx}
                style={coldarkDark}
                language="javascript"
                customStyle={{
                  fontSize: "13px",
                  borderRadius: "8px",
                  margin: "8px 0",
                  padding: "10px",
                  maxWidth: "100%",
                  overflowX: "auto",
                }}
              >
                {block}
              </SyntaxHighlighter>
            ) : (
              <Typography
                key={idx}
                sx={{
                  fontSize: { xs: "14px", sm: "15px" },
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  color: "#ffffff",
                  wordBreak: "break-word",
                }}
              >
                {block}
              </Typography>
            )
          )}
      </Box>
      <Avatar
        sx={{
          width: { xs: 28, sm: 32 },
          height: { xs: 28, sm: 32 },
          bgcolor: "#002a2f",
          color: "#00fffc",
          fontSize: { xs: "11px", sm: "13px" },
          fontWeight: 700,
          border: "1px solid rgba(0, 255, 252, 0.3)",
          flexShrink: 0,
        }}
      >
        {auth?.user?.name?.[0] || "S"}
        {auth?.user?.name?.split(" ")?.[1]?.[0] || "P"}
      </Avatar>
    </Box>
  );
};

export default ChatItem;
