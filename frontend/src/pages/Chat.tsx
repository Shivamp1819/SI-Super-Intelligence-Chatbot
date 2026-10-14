import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Box,
  Avatar,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Tooltip,
  Chip,
  Drawer,
} from "@mui/material";
import red from "@mui/material/colors/red";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeContext";
import ChatItem from "../components/chat/ChatItem";
import { IoMdSend } from "react-icons/io";
import {
  FiPaperclip,
  FiX,
  FiFileText,
  FiImage,
  FiArchive,
  FiChevronLeft,
  FiChevronRight,
  FiMessageSquare,
  FiTrash2,
  FiPlus,
  FiLogOut,
  FiZap,
  FiCode,
  FiCompass,
  FiArrowDown,
  FiArrowUp,
  FiMenu,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import {
  deleteUserChats,
  deleteConversationById,
  getConversationById,
  getUserChats,
  sendChatRequest,
  ChatFile,
  ConversationItem,
} from "../helpers/api-communicator";
import toast from "react-hot-toast";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const getFileIcon = (fileName: string) => {
  if (/\.(png|jpe?g|webp|gif|bmp|heic)$/i.test(fileName)) {
    return <FiImage size={16} />;
  }
  if (/\.(zip|tar|gz|rar|7z)$/i.test(fileName)) {
    return <FiArchive size={16} />;
  }
  return <FiFileText size={16} />;
};

const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

/**
 * Ensures chat history never displays raw full questions, but rather a
 * clean, spell-checked, capitalized 2 to 5 word reference topic.
 */
const formatDisplayTopic = (topic?: string): string => {
  if (!topic) return "New Chat";

  // Remove markdown quotes, symbols, or prefixes
  let cleaned = topic
    .replace(/^\[File:\s*[^\]]+\]\n?/i, "")
    .replace(/^["'`#*\s]+|["'`#*\s]+$/g, "")
    .replace(/^(topic|title|reference|subject):\s*/i, "")
    .replace(/[?!.:;]+$/g, "")
    .trim();

  // Strip conversational question starters (including common typo variations)
  cleaned = cleaned.replace(
    /^((can|cn)\s+(you|u)\s+(please\s+)?(writ\w*|tel{1,2}\s+me|help\s+me\s+with|give\s+me\s+)?|could\s+you\s+(please\s+)?|please\s+|tel{1,2}\s+me\s+(about\s+)?(wh?at\s+is\s+)?|explain\s+(to\s+me\s+)?|wh?at\s+(is|are)\s+(the\s+)?|how\s+(to|do\s+i|can\s+i|we\s+can)\s+|help\s+me\s+(with\s+)?|writ\w*\s+(a\s+|an\s+)?|creat\w*\s+(a\s+|an\s+)?|give\s+me\s+(a\s+|an\s+)?|i('?m|\s+am)?\s+(having|facing)\s+(an?\s+)?(issu\w*|probl\w*|er{1,2}or\w*)\s+(wit\w*|in)?|i\s+want\s+to\s+|i\s+need\s+to\s+|show\s+me\s+|is\s+there\s+any\s+|why\s+(is|are|does|do)\s+|who\s+(is|are)\s+)/i,
    ""
  );


  const corrections: Record<string, string> = {
    reatc: "React",
    reactjs: "React.js",
    nodjs: "Node.js",
    nodejs: "Node.js",
    mongdb: "MongoDB",
    mongodb: "MongoDB",
    exprss: "Express",
    expressjs: "Express.js",
    pythn: "Python",
    pyton: "Python",
    javascrpt: "JavaScript",
    js: "JavaScript",
    typesscript: "TypeScript",
    ts: "TypeScript",
    htlm: "HTML",
    html: "HTML",
    css: "CSS",
    jwt: "JWT",
    jwts: "JWT",
    api: "API",
    apis: "APIs",
    ai: "AI",
    ml: "Machine Learning",
    sql: "SQL",
    nosql: "NoSQL",
    maek: "Make",
    mak: "Make",
    creat: "Create",
    buld: "Build",
    buid: "Build",
    quatum: "Quantum",
    computng: "Computing",
    capitl: "Capital",
    franch: "France",
    binarry: "Binary",
    seach: "Search",
    implemntation: "Implementation",
    conection: "Connection",
    eror: "Error",
    erors: "Errors",
    functioanlity: "Functionality",
    functionalty: "Functionality",
    scraller: "Scroller",
    scroler: "Scroller",
    botton: "Bottom",
  };

  const words = cleaned.split(/\s+/).filter(Boolean).slice(0, 5);
  if (words.length === 0) return "New Conversation";

  const formatted = words.map((w) => {
    const lower = w.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, "");
    if (corrections[lower]) return corrections[lower];
    return w.charAt(0).toUpperCase() + w.slice(1);
  });

  const res = formatted.join(" ");
  return res.length > 45 ? res.substring(0, 42).trim() + "..." : res;
};

const SUGGESTIONS = [

  {
    icon: <FiZap size={16} color="#00fffc" />,
    title: "Explain Concept",
    prompt: "Can you explain how useEffect hook works in React with examples?",
  },
  {
    icon: <FiCode size={16} color="#00fffc" />,
    title: "Write Code",
    prompt: "Write a clean Node.js Express middleware for error handling.",
  },
  {
    icon: <FiCompass size={16} color="#00fffc" />,
    title: "Architecture & Design",
    prompt: "What are the best practices for structuring a MERN stack project?",
  },
  {
    icon: <FiPaperclip size={16} color="#00fffc" />,
    title: "Document / File Analysis",
    prompt: "Attach a PDF, Image, ZIP or source code file to analyze its contents.",
  },
];

const Chat = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const auth = useAuth();
  const { isDark } = useThemeMode();

  // Conversations & active chat states
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [currentTopic, setCurrentTopic] = useState<string>("New Chat");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(false);

  const [selectedFile, setSelectedFile] = useState<
    (ChatFile & { size: number }) | null
  >(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const sidebarScrollRef = useRef<HTMLDivElement | null>(null);
  const mobileSidebarScrollRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState<boolean>(false);
  const [showMobileScrollBottomBtn, setShowMobileScrollBottomBtn] = useState<boolean>(false);

  const handleSidebarScroll = (isMobile = false) => {
    const ref = isMobile ? mobileSidebarScrollRef.current : sidebarScrollRef.current;
    if (!ref) return;
    const { scrollTop, scrollHeight, clientHeight } = ref;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 60;
    if (isMobile) {
      setShowMobileScrollBottomBtn(isFarFromBottom);
    } else {
      setShowScrollBottomBtn(isFarFromBottom);
    }
  };

  const scrollToBottomSidebar = (isMobile = false) => {
    const ref = isMobile ? mobileSidebarScrollRef.current : sidebarScrollRef.current;
    if (ref) {
      ref.scrollTo({
        top: ref.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const scrollToTopSidebar = (isMobile = false) => {
    const ref = isMobile ? mobileSidebarScrollRef.current : sidebarScrollRef.current;
    if (ref) {
      ref.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const toggleVoiceInput = () => {
    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: new () => {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onstart: () => void;
        onresult: (event: {
          results: {
            [key: number]: {
              [key: number]: { transcript: string };
              isFinal: boolean;
            };
            length: number;
          };
        }) => void;
        onerror: (event: { error: string }) => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onstart: () => void;
        onresult: (event: {
          results: {
            [key: number]: {
              [key: number]: { transcript: string };
              isFinal: boolean;
            };
            length: number;
          };
        }) => void;
        onerror: (event: { error: string }) => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      };
    };

    const SpeechRecognitionClass =
      windowWithSpeech.SpeechRecognition ||
      windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      toast.error(
        "Voice recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge."
      );
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.debug("Voice stop error:", e);
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      const existingText = inputRef.current?.value || "";

      recognition.onstart = () => {
        setIsListening(true);
        toast.success("Listening... Speak now", { id: "voice-toast", icon: "🎙️" });
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript + " ";
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        if (inputRef.current) {
          const base = existingText ? existingText.trim() + " " : "";
          const fullSpoken = (finalTranscript + interimTranscript).trim();
          inputRef.current.value = (base + fullSpoken).trimStart();
          inputRef.current.focus();
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          toast.error("Microphone access blocked. Please allow mic permission in browser.");
        } else if (event.error !== "no-speech") {
          toast.error(`Voice error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      toast.error("Failed to start voice recognition");
      setIsListening(false);
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.debug("Voice cleanup stop error:", e);
        }
      }
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error("File is too large! Maximum allowed size is 25MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        type: file.type,
        base64: reader.result as string,
        size: file.size,
      });
      toast.success(`Attached ${file.name}`);
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * Starts a brand new fresh chat:
   * - Clears current chat messages so the existing conversation is no longer visible
   * - Resets currentConversationId to null
   * - Clears input field and file attachment
   * - Focuses input field
   */
  const handleNewChat = () => {
    setCurrentConversationId(null);
    setCurrentTopic("New Chat");
    setChatMessages([]);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
    toast.success("Fresh new chat started! What can I help you with?", {
      icon: "✨",
    });
  };

  /**
   * Opens a previous chat when clicked from the left box:
   * - Loads all messages belonging to that conversation
   * - Highlights the conversation in the left box
   */
  const handleSelectConversation = async (convId: string) => {
    if (convId === currentConversationId) return;

    try {
      setIsLoadingSession(true);
      const data = await getConversationById(convId);
      setCurrentConversationId(data.conversationId);
      setCurrentTopic(formatDisplayTopic(data.topic));
      setChatMessages(data.chats || []);

      setSelectedFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (error: unknown) {
      console.error(error);
      toast.error("Failed to open previous chat");
    } finally {
      setIsLoadingSession(false);
    }
  };

  /**
   * Deletes a single conversation from the left box
   */
  const handleDeleteConversation = async (
    convId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      await deleteConversationById(convId);
      setConversations((prev) => prev.filter((c) => c._id !== convId));

      // If the currently open conversation was deleted, start a fresh chat
      if (currentConversationId === convId) {
        handleNewChat();
      }
      toast.success("Chat removed");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete chat");
    }
  };

  /**
   * Sends user message / file and receives AI response:
   * - Backend observes the topic and attaches it to the conversation
   * - Updates left box list with observed topic
   */
  const handleSubmit = async (overridePrompt?: string) => {
    if (isSending) return;
    const content =
      typeof overridePrompt === "string"
        ? overridePrompt
        : inputRef.current?.value || "";

    if (!content.trim() && !selectedFile) {
      return;
    }

    const fileToSend = selectedFile
      ? {
          name: selectedFile.name,
          type: selectedFile.type,
          base64: selectedFile.base64,
        }
      : null;

    if (inputRef.current) {
      inputRef.current.value = "";
    }
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.debug("Voice stop error on submit:", e);
      }
      setIsListening(false);
    }
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    const displayContent = fileToSend
      ? `[File: ${fileToSend.name}]\n${
          content.trim() || "Please analyze this file."
        }`
      : content;

    const newMessage: Message = { role: "user", content: displayContent };
    setChatMessages((prev) => [...prev, newMessage]);
    setIsSending(true);

    try {
      const chatData = await sendChatRequest(
        content,
        fileToSend,
        currentConversationId
      );

      // Update active conversation
      const cleanTopic = formatDisplayTopic(chatData.topic);
      setCurrentConversationId(chatData.conversationId);
      setCurrentTopic(cleanTopic);
      setChatMessages([...chatData.chats]);

      // Update conversations list in left box with newly observed topic
      setConversations((prev) => {
        const existingIdx = prev.findIndex(
          (c) => c._id === chatData.conversationId
        );
        const updatedItem: ConversationItem = {
          _id: chatData.conversationId,
          topic: cleanTopic,
          updatedAt: new Date().toISOString(),
          createdAt:
            existingIdx >= 0 ? prev[existingIdx].createdAt : new Date().toISOString(),
        };


        if (existingIdx >= 0) {
          const rest = prev.filter((_, idx) => idx !== existingIdx);
          return [updatedItem, ...rest];
        }
        return [updatedItem, ...prev];
      });
    } catch (error: unknown) {
      console.error(error);
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || "Failed to receive AI response");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  /**
   * Deletes all conversations for this user
   */
  const handleDeleteAllChats = async () => {
    if (
      conversations.length === 0 &&
      chatMessages.length === 0
    ) {
      return;
    }

    const confirmClear = window.confirm(
      "Are you sure you want to clear all chat history? This cannot be undone."
    );
    if (!confirmClear) return;

    try {
      toast.loading("Clearing All Chats", { id: "deletechats" });
      await deleteUserChats();
      setConversations([]);
      setCurrentConversationId(null);
      setCurrentTopic("New Chat");
      setChatMessages([]);
      toast.success("All chats cleared successfully", { id: "deletechats" });
    } catch (error) {
      console.log(error);
      toast.error("Deleting chats failed", { id: "deletechats" });
    }
  };

  // Initial load of previous conversations & chat
  useLayoutEffect(() => {
    if (auth?.isLoggedIn && auth.user) {
      toast.loading("Loading Previous Chats", { id: "loadchats" });
      getUserChats()
        .then((data) => {
          const convs = (data.conversations || []) as ConversationItem[];
          setConversations(convs);

          if (convs.length > 0) {
            // Load the most recent conversation by default
            const latest = convs[0];
            setCurrentConversationId(latest._id);
            setCurrentTopic(formatDisplayTopic(latest.topic || "Conversation"));
            setChatMessages(data.chats || []);

          } else {
            setCurrentConversationId(null);
            setCurrentTopic("New Chat");
            setChatMessages([]);
          }
          toast.success("Chats ready", { id: "loadchats" });
        })
        .catch((err) => {
          console.log(err);
          toast.error("Loading Failed", { id: "loadchats" });
        });
    }
  }, [auth]);

  useEffect(() => {
    if (!auth?.isLoading && !auth?.user) {
      navigate("/login");
    }
  }, [auth, navigate]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isSending, isLoadingSession]);

  // User initials for avatar
  // User initials for avatar
  const userInitials = auth?.user?.name
    ? (auth.user.name.split(" ")[0]?.[0] || "") +
      (auth.user.name.split(" ")[1]?.[0] || "")
    : "SP";

  const renderSidebarContent = (isMobileDrawer = false) => {
    const scrollRef = isMobileDrawer ? mobileSidebarScrollRef : sidebarScrollRef;
    const showBottomBtn = isMobileDrawer ? showMobileScrollBottomBtn : showScrollBottomBtn;

    return (
      <Box
        sx={{
          display: "flex",
          width: isMobileDrawer ? "100%" : "320px",
          height: "100%",
          bgcolor: isMobileDrawer ? "transparent" : isDark ? "rgb(17,29,39)" : "#ffffff",
          borderRadius: isMobileDrawer ? 0 : 4,
          flexDirection: "column",
          p: isMobileDrawer ? 1 : 2,
          boxSizing: "border-box",
          border: isMobileDrawer ? "none" : isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(15, 23, 42, 0.08)",
          boxShadow: isMobileDrawer ? "none" : isDark ? "0 8px 32px rgba(0, 0, 0, 0.35)" : "0 10px 30px rgba(15, 23, 42, 0.06)",
          transition: "all 0.3s ease",
        }}
      >
        {/* Top Row: New Chat Button + Collapse/Close Button */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 1.5,
          }}
        >
          <Button
            onClick={() => {
              handleNewChat();
              if (isMobileDrawer) setIsMobileDrawerOpen(false);
            }}
            startIcon={<FiPlus size={18} />}
            fullWidth
            sx={{
              py: 1.1,
              px: 2,
              color: "#ffffff",
              bgcolor: isDark ? "rgba(0, 255, 252, 0.12)" : "#0284c7",
              border: isDark ? "1px solid rgba(0, 255, 252, 0.35)" : "1px solid #0284c7",
              borderRadius: 3,
              fontWeight: 700,
              fontSize: "14px",
              textTransform: "none",
              justifyContent: "flex-start",
              gap: 1,
              boxShadow: isDark
                ? "0 2px 10px rgba(0, 255, 252, 0.15)"
                : "0 4px 14px rgba(2, 132, 199, 0.32)",
              transition: "all 0.25s ease",
              ":hover": {
                bgcolor: isDark ? "rgba(0, 255, 252, 0.22)" : "#0369a1",
                borderColor: isDark ? "#00fffc" : "#0369a1",
                transform: "translateY(-1px)",
                boxShadow: isDark
                  ? "0 4px 16px rgba(0, 255, 252, 0.25)"
                  : "0 6px 18px rgba(2, 132, 199, 0.45)",
              },
            }}
          >
            New Chat
          </Button>

          <Tooltip title={isMobileDrawer ? "Close menu" : "Collapse sidebar"}>
            <IconButton
              onClick={() => {
                if (isMobileDrawer) {
                  setIsMobileDrawerOpen(false);
                } else {
                  setIsSidebarOpen(false);
                }
              }}
              sx={{
                color: isDark ? "rgba(255, 255, 255, 0.7)" : "#475569",
                p: 1,
                borderRadius: 2.5,
                bgcolor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(15, 23, 42, 0.05)",
                border: isDark
                  ? "1px solid rgba(255, 255, 255, 0.08)"
                  : "1px solid rgba(15, 23, 42, 0.12)",
                flexShrink: 0,
                ":hover": {
                  color: isDark ? "#00fffc" : "#0284c7",
                  bgcolor: isDark ? "rgba(0, 255, 252, 0.12)" : "rgba(2, 132, 199, 0.1)",
                  borderColor: isDark ? "rgba(0, 255, 252, 0.3)" : "rgba(2, 132, 199, 0.3)",
                },
              }}
            >
              {isMobileDrawer ? <FiX size={18} /> : <FiChevronLeft size={18} />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Previous Chats Title with Count & Quick Scroller Buttons */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
            px: 0.5,
          }}
        >
          <Typography
            sx={{
              fontSize: "11px",
              color: isDark ? "rgba(255, 255, 255, 0.6)" : "#64748b",
              textTransform: "uppercase",
              letterSpacing: 1,
              fontWeight: 700,
            }}
          >
            Previous Chats ({conversations.length})
          </Typography>

          {conversations.length > 3 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Tooltip title="Scroll to top questions">
                <IconButton
                  size="small"
                  onClick={() => scrollToTopSidebar(isMobileDrawer)}
                  sx={{
                    p: 0.4,
                    color: isDark ? "rgba(255, 255, 255, 0.6)" : "#64748b",
                    bgcolor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(15, 23, 42, 0.05)",
                    borderRadius: "6px",
                    transition: "all 0.2s ease",
                    ":hover": {
                      color: isDark ? "#00fffc" : "#0284c7",
                      bgcolor: isDark ? "rgba(0, 255, 252, 0.15)" : "rgba(2, 132, 199, 0.12)",
                    },
                  }}
                >
                  <FiArrowUp size={12} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Scroll to bottom questions">
                <IconButton
                  size="small"
                  onClick={() => scrollToBottomSidebar(isMobileDrawer)}
                  sx={{
                    p: 0.4,
                    color: isDark ? "rgba(255, 255, 255, 0.6)" : "#64748b",
                    bgcolor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(15, 23, 42, 0.05)",
                    borderRadius: "6px",
                    transition: "all 0.2s ease",
                    ":hover": {
                      color: isDark ? "#00fffc" : "#0284c7",
                      bgcolor: isDark ? "rgba(0, 255, 252, 0.15)" : "rgba(2, 132, 199, 0.12)",
                    },
                  }}
                >
                  <FiArrowDown size={12} />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        {/* Middle: Scrollable Previous Chats List with Visible Modern Scrollbar */}
        <Box
          sx={{
            position: "relative",
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            ref={scrollRef}
            onScroll={() => handleSidebarScroll(isMobileDrawer)}
            sx={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              display: "flex",
              flexDirection: "column",
              gap: 0.8,
              pr: 0.8,
              /* Highly visible, modern, sleek scrollbar */
              "::-webkit-scrollbar": {
                width: "6px",
              },
              "::-webkit-scrollbar-track": {
                bgcolor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(15, 23, 42, 0.05)",
                borderRadius: "8px",
              },
              "::-webkit-scrollbar-thumb": {
                bgcolor: isDark ? "rgba(0, 255, 252, 0.4)" : "rgba(2, 132, 199, 0.4)",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                ":hover": {
                  bgcolor: isDark ? "#00fffc" : "#0284c7",
                  boxShadow: isDark
                    ? "0 0 10px rgba(0, 255, 252, 0.7)"
                    : "0 0 10px rgba(2, 132, 199, 0.5)",
                },
              },
              scrollbarWidth: "thin",
              scrollbarColor: isDark
                ? "rgba(0, 255, 252, 0.4) rgba(255, 255, 255, 0.04)"
                : "rgba(2, 132, 199, 0.4) rgba(15, 23, 42, 0.05)",
            }}
          >
            {conversations.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  px: 2,
                  color: isDark ? "rgba(255, 255, 255, 0.4)" : "#64748b",
                }}
              >
                <FiMessageSquare
                  size={26}
                  style={{ marginBottom: 8, opacity: 0.5 }}
                />
                <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>
                  No previous chats yet
                </Typography>
                <Typography sx={{ fontSize: "11px", mt: 0.5 }}>
                  Ask a question above to create your first conversation!
                </Typography>
              </Box>
            ) : (
              conversations.map((conv) => {
                const isActive = conv._id === currentConversationId;
                const displayTopic = formatDisplayTopic(conv.topic);

                return (
                  <Box
                    key={conv._id}
                    onClick={() => {
                      handleSelectConversation(conv._id);
                      if (isMobileDrawer) setIsMobileDrawerOpen(false);
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1.2,
                      px: 1.6,
                      py: 1.1,
                      borderRadius: 2.5,
                      bgcolor: isActive
                        ? isDark
                          ? "rgba(0, 255, 252, 0.12)"
                          : "rgba(2, 132, 199, 0.12)"
                        : isDark
                        ? "rgba(255, 255, 255, 0.03)"
                        : "#f8fafc",
                      border: "1px solid",
                      borderColor: isActive
                        ? isDark
                          ? "rgba(0, 255, 252, 0.45)"
                          : "#0284c7"
                        : isDark
                        ? "rgba(255, 255, 255, 0.06)"
                        : "rgba(15, 23, 42, 0.08)",
                      boxShadow: isActive
                        ? isDark
                          ? "0 0 12px rgba(0, 255, 252, 0.15)"
                          : "0 2px 8px rgba(2, 132, 199, 0.15)"
                        : "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      position: "relative",
                      ":hover": {
                        bgcolor: isActive
                          ? isDark
                            ? "rgba(0, 255, 252, 0.16)"
                            : "rgba(2, 132, 199, 0.18)"
                          : isDark
                          ? "rgba(0, 255, 252, 0.08)"
                          : "rgba(2, 132, 199, 0.08)",
                        borderColor: isDark
                          ? "rgba(0, 255, 252, 0.3)"
                          : "rgba(2, 132, 199, 0.35)",
                        transform: "translateX(3px)",
                        "& .delete-btn": {
                          opacity: 1,
                        },
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.2,
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <FiMessageSquare
                        size={15}
                        style={{
                          color: isActive
                            ? isDark
                              ? "#00fffc"
                              : "#0284c7"
                            : isDark
                            ? "rgba(255,255,255,0.6)"
                            : "#64748b",
                          flexShrink: 0,
                        }}
                      />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          sx={{
                            fontSize: "13px",
                            fontWeight: isActive ? 700 : 600,
                            color: isActive
                              ? isDark
                                ? "#00fffc"
                                : "#0284c7"
                              : isDark
                              ? "white"
                              : "#0f172a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={displayTopic}
                        >
                          {displayTopic}
                        </Typography>
                        {conv.updatedAt && (
                          <Typography
                            sx={{
                              fontSize: "10.5px",
                              color: isDark
                                ? "rgba(255, 255, 255, 0.4)"
                                : "#64748b",
                              mt: 0.2,
                            }}
                          >
                            {formatRelativeTime(conv.updatedAt)}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Delete conversation icon */}
                    <Tooltip title="Delete this chat">
                      <IconButton
                        size="small"
                        className="delete-btn"
                        onClick={(e) => handleDeleteConversation(conv._id, e)}
                        sx={{
                          color: isDark ? "rgba(255, 255, 255, 0.4)" : "#94a3b8",
                          opacity: isActive ? 0.8 : 0.3,
                          p: 0.5,
                          transition: "all 0.2s ease",
                          ":hover": {
                            color: "#ff5252",
                            bgcolor: "rgba(255, 82, 82, 0.15)",
                          },
                        }}
                      >
                        <FiTrash2 size={13} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                );
              })
            )}
          </Box>

          {/* Floating Jump to Bottom Button with down sign only (no text) */}
          {showBottomBtn && conversations.length > 3 && (
            <Tooltip title="Scroll to bottom questions">
              <IconButton
                size="small"
                onClick={() => scrollToBottomSidebar(isMobileDrawer)}
                sx={{
                  position: "absolute",
                  bottom: 10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  bgcolor: isDark ? "rgba(13, 22, 31, 0.95)" : "#ffffff",
                  backdropFilter: "blur(8px)",
                  border: isDark
                    ? "1px solid rgba(0, 255, 252, 0.6)"
                    : "1.5px solid rgba(2, 132, 199, 0.5)",
                  color: isDark ? "#00fffc" : "#0284c7",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 0,
                  boxShadow: isDark
                    ? "0 4px 16px rgba(0, 0, 0, 0.6), 0 0 10px rgba(0, 255, 252, 0.25)"
                    : "0 4px 16px rgba(15, 23, 42, 0.12), 0 0 10px rgba(2, 132, 199, 0.2)",
                  transition: "all 0.25s ease",
                  ":hover": {
                    bgcolor: isDark ? "rgba(0, 255, 252, 0.22)" : "rgba(2, 132, 199, 0.12)",
                    transform: "translateX(-50%) translateY(-2px)",
                    boxShadow: isDark
                      ? "0 6px 20px rgba(0, 255, 252, 0.5)"
                      : "0 6px 20px rgba(2, 132, 199, 0.4)",
                    borderColor: isDark ? "#00fffc" : "#0284c7",
                  },
                  zIndex: 10,
                }}
              >
                <FiArrowDown size={15} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Clear All Chats Button */}
        {conversations.length > 0 && (
          <Box sx={{ pt: 1.5, pb: 1.5 }}>
            <Button
              onClick={() => {
                handleDeleteAllChats();
                if (isMobileDrawer) setIsMobileDrawerOpen(false);
              }}
              startIcon={<FiTrash2 size={14} />}
              fullWidth
              sx={{
                py: 0.8,
                color: "white",
                fontWeight: "600",
                fontSize: "12px",
                borderRadius: 2.5,
                bgcolor: red[400],
                textTransform: "none",
                ":hover": {
                  bgcolor: red[600],
                },
              }}
            >
              Clear All Chats
            </Button>
          </Box>
        )}

        {/* Bottom Card: User Profile + Logout */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pt: 1.5,
            borderTop: isDark
              ? "1px solid rgba(255, 255, 255, 0.1)"
              : "1px solid rgba(15, 23, 42, 0.08)",
          }}
        >
          {/* User Info */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              overflow: "hidden",
              flex: 1,
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: isDark ? "#00fffc" : "#0284c7",
                color: isDark ? "#001a1c" : "#ffffff",
                fontWeight: 800,
                fontSize: "13px",
                boxShadow: isDark
                  ? "0 0 10px rgba(0, 255, 252, 0.3)"
                  : "0 2px 8px rgba(2, 132, 199, 0.3)",
                flexShrink: 0,
              }}
            >
              {userInitials}
            </Avatar>
            <Box sx={{ overflow: "hidden", flex: 1 }}>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: isDark ? "white" : "#0f172a",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                {auth?.user?.name || "Shivam Patel"}
              </Typography>
              <Typography
                sx={{
                  fontSize: "11px",
                  color: isDark ? "rgba(255, 255, 255, 0.5)" : "#475569",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                {auth?.user?.email || "shivam@example.com"}
              </Typography>
            </Box>
          </Box>

          {/* Logout Button */}
          <Tooltip title="Logout">
            <IconButton
              onClick={auth?.logout}
              sx={{
                color: "#ff5252",
                bgcolor: isDark ? "rgba(255, 82, 82, 0.08)" : "rgba(239, 68, 68, 0.08)",
                border: isDark ? "1px solid rgba(255, 82, 82, 0.25)" : "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: 2,
                p: 0.9,
                ml: 1,
                flexShrink: 0,
                ":hover": {
                  bgcolor: "rgba(255, 82, 82, 0.2)",
                  color: "#ff7b7b",
                },
              }}
            >
              <FiLogOut size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        width: "100%",
        height: { xs: "calc(100dvh - 65px)", md: "calc(100vh - 80px)" },
        px: { xs: 1, sm: 1.5, md: 2 },
        pb: { xs: 1, md: 2 },
        gap: { xs: 1, md: 2 },
        boxSizing: "border-box",
        alignItems: "stretch",
        bgcolor: isDark ? "transparent" : "#e8eff8",
      }}
    >
      {/* Mobile Slide-Over Drawer for Previous Chats */}
      <Drawer
        anchor="left"
        open={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        sx={{ display: { md: "none", xs: "block" } }}
        PaperProps={{
          sx: {
            width: { xs: "86vw", sm: "330px" },
            maxWidth: "340px",
            height: "100%",
            bgcolor: isDark ? "#0d161f" : "#ffffff",
            backgroundImage: "none",
            borderRight: isDark
              ? "1px solid rgba(0, 255, 252, 0.25)"
              : "1px solid rgba(15, 23, 42, 0.1)",
            p: 1.5,
            boxSizing: "border-box",
          },
        }}
      >
        {renderSidebarContent(true)}
      </Drawer>

      {/* 1. Desktop Left Box: Collapsible Full-Height Previous Chats Sidebar */}
      <Box
        sx={{
          display: { md: "flex", xs: "none", sm: "none" },
          width: isSidebarOpen ? "320px" : "0px",
          minWidth: isSidebarOpen ? "320px" : "0px",
          maxWidth: isSidebarOpen ? "320px" : "0px",
          height: "100%",
          opacity: isSidebarOpen ? 1 : 0,
          transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        {renderSidebarContent(false)}
      </Box>

      {/* 2. Right Box: Main Chat Window with Topic Header and Fresh Chat State */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          height: "100%",
          flexDirection: "column",
          minWidth: 0,
          bgcolor: isDark ? "rgb(17,29,39)" : "#ffffff",
          borderRadius: { xs: 2.5, md: 4 },
          border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(15, 23, 42, 0.08)",
          boxShadow: isDark ? "0 8px 32px rgba(0, 0, 0, 0.35)" : "0 10px 30px rgba(15, 23, 42, 0.06)",
          p: { xs: 1.2, sm: 1.6, md: 2 },
          boxSizing: "border-box",
          transition: "all 0.3s ease",
        }}
      >
        {/* Top bar with Current Topic Badge & Sidebar Toggle */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1.2,
            mb: 1.2,
            borderBottom: isDark
              ? "1px solid rgba(255, 255, 255, 0.06)"
              : "1px solid rgba(15, 23, 42, 0.08)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            {/* Mobile View: Chat History Drawer Toggle Button */}
            <Tooltip title="View previous questions & chats">
              <IconButton
                onClick={() => setIsMobileDrawerOpen(true)}
                sx={{
                  display: { md: "none", xs: "inline-flex" },
                  color: isDark ? "#00fffc" : "#0284c7",
                  bgcolor: isDark ? "rgba(0, 255, 252, 0.1)" : "rgba(2, 132, 199, 0.1)",
                  border: isDark
                    ? "1px solid rgba(0, 255, 252, 0.3)"
                    : "1px solid rgba(2, 132, 199, 0.3)",
                  p: 0.8,
                  borderRadius: 2,
                  ":hover": {
                    bgcolor: isDark ? "rgba(0, 255, 252, 0.2)" : "rgba(2, 132, 199, 0.18)",
                  },
                }}
              >
                <FiMenu size={18} />
              </IconButton>
            </Tooltip>

            {/* Desktop View: Open Chat History Button */}
            {!isSidebarOpen && (
              <Tooltip title="Open Chat History">
                <IconButton
                  onClick={() => setIsSidebarOpen(true)}
                  sx={{
                    display: { xs: "none", md: "inline-flex" },
                    color: isDark ? "#00fffc" : "#0284c7",
                    bgcolor: isDark ? "rgba(0, 255, 252, 0.08)" : "rgba(2, 132, 199, 0.08)",
                    border: isDark
                      ? "1px solid rgba(0, 255, 252, 0.25)"
                      : "1px solid rgba(2, 132, 199, 0.25)",
                    p: 0.8,
                    ":hover": {
                      bgcolor: isDark ? "rgba(0, 255, 252, 0.18)" : "rgba(2, 132, 199, 0.16)",
                    },
                  }}
                >
                  <FiChevronRight size={18} />
                </IconButton>
              </Tooltip>
            )}

            {/* Observed Topic Badge */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <Chip
                icon={
                  currentConversationId ? (
                    <FiMessageSquare size={13} color={isDark ? "#00fffc" : "#0284c7"} />
                  ) : (
                    <FiZap size={13} color={isDark ? "#00fffc" : "#0284c7"} />
                  )
                }
                label={
                  currentConversationId
                    ? `Topic: ${formatDisplayTopic(currentTopic)}`
                    : "Fresh New Chat"
                }
                sx={{
                  bgcolor: isDark ? "rgba(0, 255, 252, 0.08)" : "rgba(2, 132, 199, 0.1)",
                  border: isDark
                    ? "1px solid rgba(0, 255, 252, 0.25)"
                    : "1.5px solid rgba(2, 132, 199, 0.4)",
                  color: isDark ? "white" : "#0284c7",
                  fontWeight: 700,
                  fontSize: "12.5px",
                  maxWidth: { md: "500px", xs: "220px" },
                  "& .MuiChip-label": {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  },
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Chat message history container (Full Vertical Height) */}
        <Box
          ref={chatContainerRef}
          sx={{
            width: "100%",
            flex: 1,
            borderRadius: 3,
            bgcolor: isDark ? "rgba(10, 18, 26, 0.4)" : "#edf2f7",
            border: isDark ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(15, 23, 42, 0.08)",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            overflow: "scroll",
            overflowX: "hidden",
            overflowY: "auto",
            scrollBehavior: "smooth",
            p: 2,
            transition: "all 0.3s ease",
          }}
        >
          {isLoadingSession ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                gap: 2,
              }}
            >
              <CircularProgress size={32} sx={{ color: isDark ? "#00fffc" : "#0284c7" }} />
              <Typography sx={{ color: isDark ? "rgba(255,255,255,0.7)" : "#475569", fontSize: "14px" }}>
                Opening previous chat...
              </Typography>
            </Box>
          ) : chatMessages.length === 0 ? (
            /* Fresh New Chat Hero State */
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                textAlign: "center",
                px: 2,
                py: 4,
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  bgcolor: isDark ? "rgba(0, 255, 252, 0.08)" : "rgba(2, 132, 199, 0.08)",
                  border: isDark
                    ? "2px solid rgba(0, 255, 252, 0.35)"
                    : "2px solid rgba(2, 132, 199, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2.5,
                  boxShadow: isDark
                    ? "0 0 28px rgba(0, 255, 252, 0.2)"
                    : "0 4px 20px rgba(2, 132, 199, 0.2)",
                }}
              >
                <img
                  src="/si-logo.png"
                  alt="SI Super Intelligence Avatar"
                  width="44px"
                  height="44px"
                  style={{
                    borderRadius: "50%",
                    filter: isDark
                      ? "drop-shadow(0 0 10px rgba(0, 255, 252, 0.6))"
                      : "drop-shadow(0 2px 10px rgba(2, 132, 199, 0.5))",
                  }}
                />
              </Box>

              <Typography
                sx={{
                  fontSize: { md: "24px", xs: "20px" },
                  fontWeight: 800,
                  color: isDark ? "white" : "#0f172a",
                  mb: 1,
                  letterSpacing: 0.5,
                }}
              >
                Fresh New Chat
              </Typography>
              <Typography
                sx={{
                  fontSize: { md: "14.5px", xs: "13px" },
                  color: isDark ? "rgba(255, 255, 255, 0.65)" : "#475569",
                  maxWidth: "520px",
                  lineHeight: 1.6,
                  mb: 4,
                }}
              >
                Ask any question or attach files. SI Super Intelligence will observe the topic
                of your questions and save it automatically in the left box history.
              </Typography>

              {/* Suggestions Grid */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { md: "repeat(2, 1fr)", xs: "1fr" },
                  gap: 1.8,
                  width: "100%",
                  maxWidth: "680px",
                }}
              >
                {SUGGESTIONS.map((item, idx) => (
                  <Box
                    key={idx}
                    onClick={() => {
                      if (inputRef.current) {
                        inputRef.current.value = item.prompt;
                        inputRef.current.focus();
                      }
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      p: 2,
                      bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "#ffffff",
                      border: isDark
                        ? "1px solid rgba(255, 255, 255, 0.07)"
                        : "1px solid rgba(15, 23, 42, 0.08)",
                      borderRadius: 3,
                      boxShadow: isDark ? "none" : "0 2px 8px rgba(15, 23, 42, 0.04)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.25s ease",
                      ":hover": {
                        bgcolor: isDark
                          ? "rgba(0, 255, 252, 0.08)"
                          : "rgba(2, 132, 199, 0.06)",
                        borderColor: isDark
                          ? "rgba(0, 255, 252, 0.35)"
                          : "rgba(2, 132, 199, 0.35)",
                        transform: "translateY(-2px)",
                        boxShadow: isDark
                          ? "0 4px 16px rgba(0, 0, 0, 0.3)"
                          : "0 4px 16px rgba(2, 132, 199, 0.12)",
                      },
                    }}
                  >
                    <Box sx={{ mt: 0.3 }}>{item.icon}</Box>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: isDark ? "white" : "#0f172a",
                          mb: 0.4,
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          color: isDark ? "rgba(255, 255, 255, 0.55)" : "#64748b",
                          lineHeight: 1.4,
                        }}
                      >
                        {item.prompt}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            chatMessages.map((chat, index) => (
              <ChatItem
                id={`chat-msg-${index}`}
                content={chat.content}
                role={chat.role}
                key={index}
              />
            ))
          )}

          {isSending && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1.2,
                my: 0.8,
                bgcolor: isDark ? "rgba(17, 29, 39, 0.7)" : "#ffffff",
                border: isDark ? "none" : "1px solid rgba(2, 132, 199, 0.25)",
                boxShadow: isDark ? "none" : "0 2px 10px rgba(2, 132, 199, 0.1)",
                borderRadius: 2,
                width: "fit-content",
              }}
            >
              <CircularProgress size={16} sx={{ color: isDark ? "#00fffc" : "#0284c7" }} />
              <Typography sx={{ color: isDark ? "#00fffc" : "#0284c7", fontSize: "14px", fontWeight: 600 }}>
                SI Super Intelligence is analyzing and typing...
              </Typography>
            </Box>
          )}
        </Box>

        {/* Input box with Enter key handling and File Upload */}
        <Box
          component="form"
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            handleSubmit();
          }}
          sx={{
            width: "100%",
            borderRadius: 3,
            backgroundColor: isDark ? "rgb(13,22,31)" : "#ffffff",
            display: "flex",
            flexDirection: "column",
            mt: 1.5,
            border: isDark
              ? "1px solid rgba(255,255,255,0.08)"
              : "1.5px solid rgba(2, 132, 199, 0.35)",
            boxShadow: isDark
              ? "0 4px 20px rgba(0,0,0,0.3)"
              : "0 4px 16px rgba(2, 132, 199, 0.08)",
            transition: "all 0.3s ease",
          }}
        >
          {/* Selected File Chip */}
          {selectedFile && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                alignSelf: "flex-start",
                gap: 1,
                bgcolor: isDark ? "rgba(0, 255, 252, 0.12)" : "rgba(2, 132, 199, 0.1)",
                color: isDark ? "#00fffc" : "#0284c7",
                border: isDark
                  ? "1px solid rgba(0, 255, 252, 0.3)"
                  : "1px solid rgba(2, 132, 199, 0.3)",
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                mx: { xs: 1, sm: 2 },
                mt: 1.2,
                fontSize: "13px",
              }}
            >
              {getFileIcon(selectedFile.name)}
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 600,
                  maxWidth: { xs: "130px", sm: "280px" },
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selectedFile.name}
              </Typography>
              <Typography sx={{ fontSize: "11px", opacity: 0.7 }}>
                ({formatFileSize(selectedFile.size)})
              </Typography>
              <IconButton
                size="small"
                onClick={handleRemoveFile}
                sx={{
                  color: "#ff5252",
                  p: 0.2,
                  ml: 0.5,
                  ":hover": { bgcolor: "rgba(255, 82, 82, 0.2)" },
                }}
              >
                <FiX size={14} />
              </IconButton>
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
            }}
          >
            {/* Attachment Button */}
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              sx={{
                color: selectedFile
                  ? isDark
                    ? "#00fffc"
                    : "#0284c7"
                  : isDark
                  ? "rgba(255,255,255,0.7)"
                  : "#64748b",
                mx: { xs: 0.2, sm: 0.8 },
                p: { xs: 0.8, sm: 1 },
                ":hover": { color: isDark ? "#00fffc" : "#0284c7" },
              }}
              title="Upload PDF, Image, or ZIP"
            >
              <FiPaperclip size={19} />
            </IconButton>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf,.zip,application/pdf,application/zip,.txt,.md,.json,.js,.ts,.py"
              style={{ display: "none" }}
            />

            <Box
              component="input"
              ref={inputRef}
              type="text"
              onKeyDown={handleKeyDown}
              placeholder={
                selectedFile
                  ? `Ask about ${selectedFile.name}...`
                  : currentConversationId
                  ? `Continue in "${currentTopic}" (Press Enter)...`
                  : "Ask a question (Press Enter to send)..."
              }
              sx={{
                width: "100%",
                bgcolor: "transparent",
                py: { xs: 1.2, sm: 1.6 },
                px: { xs: 0.5, sm: 0.8 },
                border: "none",
                outline: "none",
                color: isDark ? "white" : "#0f172a",
                fontSize: "16px",
                fontFamily: "inherit",
                "&::placeholder": {
                  color: isDark ? "rgba(255, 255, 255, 0.45)" : "#64748b",
                  opacity: 1,
                },
              }}
            />

            {/* Voice Input (Speech-to-Text) Button */}
            <Tooltip
              title={
                isListening
                  ? "Listening... Click to stop"
                  : "Start voice typing (Speak to write in search box)"
              }
            >
              <IconButton
                type="button"
                onClick={toggleVoiceInput}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  bgcolor: isListening ? "#ef4444" : "#1d72f2",
                  color: "white",
                  mx: { xs: 0.3, sm: 0.6 },
                  p: 0,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isListening
                    ? "0 0 12px rgba(239, 68, 68, 0.7)"
                    : "0 2px 8px rgba(29, 114, 242, 0.4)",
                  animation: isListening ? "pulseVoice 1.4s infinite" : "none",
                  transition: "all 0.25s ease-in-out",
                  ":hover": {
                    bgcolor: isListening ? "#dc2626" : "#1565c0",
                    transform: "scale(1.06)",
                    boxShadow: isListening
                      ? "0 0 16px rgba(239, 68, 68, 0.9)"
                      : "0 2px 12px rgba(29, 114, 242, 0.55)",
                  },
                }}
              >
                {/* 4-bar waveform icon proportionally scaled down */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1.8px",
                    height: "15px",
                  }}
                >
                  <Box
                    sx={{
                      width: "2px",
                      height: isListening ? "10px" : "6px",
                      bgcolor: "white",
                      borderRadius: "1.5px",
                      transition: "height 0.2s ease",
                      animation: isListening
                        ? "waveBar 0.8s ease-in-out infinite alternate 0.1s"
                        : "none",
                    }}
                  />
                  <Box
                    sx={{
                      width: "2px",
                      height: isListening ? "15px" : "13px",
                      bgcolor: "white",
                      borderRadius: "1.5px",
                      transition: "height 0.2s ease",
                      animation: isListening
                        ? "waveBar 0.8s ease-in-out infinite alternate 0.3s"
                        : "none",
                    }}
                  />
                  <Box
                    sx={{
                      width: "2px",
                      height: isListening ? "12px" : "9px",
                      bgcolor: "white",
                      borderRadius: "1.5px",
                      transition: "height 0.2s ease",
                      animation: isListening
                        ? "waveBar 0.8s ease-in-out infinite alternate 0.2s"
                        : "none",
                    }}
                  />
                  <Box
                    sx={{
                      width: "2px",
                      height: isListening ? "9px" : "5px",
                      bgcolor: "white",
                      borderRadius: "1.5px",
                      transition: "height 0.2s ease",
                      animation: isListening
                        ? "waveBar 0.8s ease-in-out infinite alternate 0.4s"
                        : "none",
                    }}
                  />
                </Box>
              </IconButton>
            </Tooltip>

            <IconButton
              onClick={() => handleSubmit()}
              disabled={isSending}
              sx={{
                color: isDark ? "#00fffc" : "#0284c7",
                mx: { xs: 0.2, sm: 0.8 },
                p: { xs: 0.8, sm: 1 },
                ":hover": {
                  bgcolor: isDark
                    ? "rgba(0, 255, 252, 0.1)"
                    : "rgba(2, 132, 199, 0.1)",
                },
              }}
            >
              {isSending ? (
                <CircularProgress size={18} sx={{ color: isDark ? "#00fffc" : "#0284c7" }} />
              ) : (
                <IoMdSend size={20} />
              )}
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Chat;
