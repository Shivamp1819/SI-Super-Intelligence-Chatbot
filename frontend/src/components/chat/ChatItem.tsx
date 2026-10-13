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

const ChatItem = ({
  content,
  role,
  id,
}: {
  content: string;
  role: "user" | "assistant";
  id?: string;
}) => {
  const auth = useAuth();
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

  // Async helper to guarantee voice list is fully loaded before first playback
  const getLoadedVoices = (): Promise<SpeechSynthesisVoice[]> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        resolve([]);
        return;
      }

      const immediateVoices = window.speechSynthesis.getVoices();
      if (immediateVoices && immediateVoices.length > 0) {
        resolve(immediateVoices);
        return;
      }

      let hasResolved = false;
      const onVoicesChanged = () => {
        if (!hasResolved) {
          hasResolved = true;
          window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
          resolve(window.speechSynthesis.getVoices());
        }
      };

      window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);

      // Timeout fallback in case voices are already cached or event doesn't fire
      setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
          resolve(window.speechSynthesis.getVoices());
        }
      }, 300);
    });
  };

  const getIndianFemaleVoice = (voicesList: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    if (!voicesList || voicesList.length === 0) return null;

    // Strict blacklist of male names/keywords to never pick a male voice
    const maleKeywords = [
      "david",
      "guy",
      "mark",
      "george",
      "ryan",
      "christopher",
      "james",
      "brian",
      "eric",
      "andrew",
      "stefan",
      "roger",
      "tom",
      "alex",
      "fred",
      "daniel",
      "oliver",
      "richard",
      "stephen",
      "male",
      "en-us-standard-b",
      "en-us-standard-d",
      "en-us-wavenet-b",
      "en-us-wavenet-d",
      "microsoft david",
      "microsoft mark",
      "microsoft guy",
      "microsoft ryan",
      "aarav",
      "prabhat",
      "madhav",
      "hemant",
      "ravi",
      "amit",
      "rohit",
      "rahul",
      "vikram",
      "suresh",
      "ajay",
      "anil",
      "raj",
      "kumar",
      "manoj",
      "sanjay",
      "deepak",
      "vijay",
      "karan",
    ];

    const isMale = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes("female") || lower.includes("woman")) return false;
      return maleKeywords.some((m) => lower.includes(m));
    };

    // Specific known authentic Indian female voices ranked by naturalness and sweet tone
    const indianFemaleNames = [
      "neerja online (natural)", // Azure Neural Neerja: top-tier natural Indian English female voice
      "neerja",
      "swara online (natural)", // Azure Neural Swara (India)
      "swara",
      "heera", // Microsoft Heera (English - India)
      "veena", // Apple & Microsoft Veena (English - India)
      "kalyani",
      "lekha",
      "ananya",
      "isha",
      "priya",
      "pooja",
      "shruti",
      "aditi",
      "chahat",
      "kalpana",
      "ravina",
      "sangeeta",
      "kanya",
      "geeta",
      "sunita",
      "meera",
    ];

    // Priority 1: High-quality named Indian female voices (e.g., Neerja, Swara, Heera, Veena)
    for (const femName of indianFemaleNames) {
      const match = voicesList.find((v) => {
        const name = v.name.toLowerCase();
        return name.includes(femName) && !isMale(name);
      });
      if (match) return match;
    }

    // Priority 2: Any voice with Indian English locale ('en-IN', 'en_IN') that is not male
    const enInVoice = voicesList.find((v) => {
      const lang = v.lang.toLowerCase().replace("_", "-");
      const name = v.name.toLowerCase();
      const isEnIn = lang === "en-in" || lang.startsWith("en-in");
      const isExplicitFemale = name.includes("female") || name.includes("woman");
      return isEnIn && (isExplicitFemale || !isMale(name));
    });
    if (enInVoice) return enInVoice;

    // Priority 3: Any voice with 'india' or 'indian' in its name that is not male
    const keywordIndiaVoice = voicesList.find((v) => {
      const name = v.name.toLowerCase();
      const hasIndian = name.includes("india") || name.includes("indian");
      return hasIndian && !isMale(name);
    });
    if (keywordIndiaVoice) return keywordIndiaVoice;

    // Priority 4: Any Hindi India locale voice ('hi-IN') that is not male
    const hiInVoice = voicesList.find((v) => {
      const lang = v.lang.toLowerCase().replace("_", "-");
      const isHiIn = lang === "hi-in" || lang.startsWith("hi-in");
      return isHiIn && !isMale(v.name);
    });
    if (hiInVoice) return hiInVoice;

    // Priority 5: Fallback to sweet female voices in case system has no Indian voice installed
    const sweetFemaleFallbacks = [
      "jenny online (natural)",
      "sonia online (natural)",
      "aria online (natural)",
      "libby online (natural)",
      "michelle online (natural)",
      "jenny",
      "sonia",
      "aria",
      "google uk english female",
      "samantha",
      "victoria",
      "karen",
      "zira",
      "female",
    ];

    for (const femName of sweetFemaleFallbacks) {
      const match = voicesList.find((v) => {
        const name = v.name.toLowerCase();
        const isEn = v.lang.toLowerCase().startsWith("en");
        return isEn && name.includes(femName) && !isMale(name);
      });
      if (match) return match;
    }

    // Priority 6: Any non-male English voice
    const nonMaleEnglish = voicesList.find((v) => {
      const isEn = v.lang.toLowerCase().startsWith("en");
      return isEn && !isMale(v.name);
    });
    if (nonMaleEnglish) return nonMaleEnglish;

    // Priority 7: Any non-male voice
    const anyNonMale = voicesList.find((v) => !isMale(v.name));
    return anyNonMale || voicesList[0] || null;
  };

  const handleSpeech = async () => {
    if (!window.speechSynthesis) {
      toast.error("Text-to-speech not supported on this browser");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean formatting and beautify text for natural, sweet, and melodious speech
    const cleanSpeech = actualContent
      .replace(/```[\s\S]*?```/g, "Code block omitted.")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^[-*+]\s+/gm, "")
      .replace(/^\d+\.\s+/gm, "")
      .replace(/\bAI\b/g, "A.I.")
      .replace(/\be\.g\.\b/gi, "for example")
      .replace(/\bi\.e\.\b/gi, "that is")
      .replace(/\betc\.\b/gi, "and so on")
      .replace(/&/g, " and ")
      .replace(/%/g, " percent ")
      .replace(/[*_~`>#|]/g, "")
      .replace(/[:;]\s*/g, ", ")
      .replace(/\n+/g, ". ")
      .replace(/\s+/g, " ")
      .replace(/\.\s*\./g, ".")
      .trim();

    if (!cleanSpeech) return;

    // Await loaded voices so the very first click ALWAYS has the voices populated!
    const availableVoices = await getLoadedVoices();
    const indianFemaleVoice = getIndianFemaleVoice(availableVoices);

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);

    // Explicitly target English (India) locale for authentic Indian accent & phonetics
    utterance.lang = "en-IN";

    if (indianFemaleVoice) {
      utterance.voice = indianFemaleVoice;
      if (indianFemaleVoice.lang) {
        utterance.lang = indianFemaleVoice.lang;
      }
    }

    // Melodious, clear, authentic Indian female voice parameters:
    utterance.volume = 1.0; // Crystal-clear, fully audible loudness
    utterance.pitch = 1.08; // Sweet, warm, authentic Indian feminine pitch
    utterance.rate = 0.95; // Articulate, pleasant, relaxed conversational tempo

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (isSpeaking && window.speechSynthesis) {
        window.speechSynthesis.cancel();
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
        bgcolor: "rgba(17, 29, 39, 0.7)",
        border: "1px solid rgba(0, 255, 252, 0.12)",
        gap: { xs: 1, sm: 1.5 },
        borderRadius: "16px 16px 16px 4px",
        my: 0.8,
        alignItems: "flex-start",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
      }}
    >
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
      <Box sx={{ width: "100%", overflowX: "auto" }}>
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
              color: "#e6e6e6",
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
                  color: "#e6e6e6",
                  wordBreak: "break-word",
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
            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          {/* Copy Button */}
          <Tooltip title={copied ? "Copied!" : "Copy response"}>
            <IconButton
              size="small"
              onClick={handleCopy}
              sx={{
                color: copied ? "#00fffc" : "rgba(255, 255, 255, 0.55)",
                p: 0.5,
                ":hover": {
                  color: "#00fffc",
                  bgcolor: "rgba(0, 255, 252, 0.1)",
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
                color: isSpeaking ? "#00fffc" : "rgba(255, 255, 255, 0.55)",
                p: 0.5,
                ":hover": {
                  color: "#00fffc",
                  bgcolor: "rgba(0, 255, 252, 0.1)",
                },
              }}
            >
              {isSpeaking ? (
                <FiVolumeX size={15} style={{ color: "#00fffc" }} />
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
                color: liked === true ? "#00fffc" : "rgba(255, 255, 255, 0.55)",
                p: 0.5,
                ":hover": {
                  color: "#00fffc",
                  bgcolor: "rgba(0, 255, 252, 0.1)",
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
                color: liked === false ? "#ff5252" : "rgba(255, 255, 255, 0.55)",
                p: 0.5,
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
                color: "rgba(255, 255, 255, 0.55)",
                p: 0.5,
                transition: "all 0.2s ease",
                ":hover": {
                  color: "#00fffc",
                  bgcolor: "rgba(0, 255, 252, 0.1)",
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
                border: "1px solid rgba(255, 255, 255, 0.16)",
                bgcolor: "rgba(255, 255, 255, 0.05)",
                color: "rgba(255, 255, 255, 0.78)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: isExportingPdf ? "not-allowed" : "pointer",
                transition: "all 0.2s ease-in-out",
                outline: "none",
                ":hover": {
                  color: "#00fffc",
                  borderColor: "rgba(0, 255, 252, 0.45)",
                  bgcolor: "rgba(0, 255, 252, 0.1)",
                  boxShadow: "0 0 10px rgba(0, 255, 252, 0.15)",
                  transform: "translateY(-1px)",
                },
                ":active": {
                  transform: "translateY(0px)",
                },
              }}
            >
              {isExportingPdf ? (
                <CircularProgress size={12} sx={{ color: "#00fffc" }} />
              ) : (
                <AiOutlineFilePdf size={14} style={{ color: "#ff5252" }} />
              )}
              <Typography
                component="span"
                sx={{
                  fontSize: "12px",
                  fontWeight: 500,
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
        bgcolor: "#004d56",
        background: "linear-gradient(135deg, #005c66, #004d56)",
        gap: { xs: 1, sm: 1.5 },
        borderRadius: "16px 16px 4px 16px",
        my: 0.8,
        alignItems: "flex-start",
        boxShadow: "0 3px 12px rgba(0, 77, 86, 0.4)",
        border: "1px solid rgba(0, 255, 252, 0.2)",
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
