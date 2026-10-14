import { NextFunction, Request, Response } from "express";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import { configureOpenAI } from "../config/openai-config.js";
import { OpenAIApi, ChatCompletionRequestMessage } from "openai";
import { configureGemini, getGeminiAPIKey } from "../config/gemini-config.js";
import {
  generateFallbackTopic,
  observeTopicFromQuestion,
  sanitizeDisplayTopic,
} from "../utils/topic-observer.js";
import JSZip from "jszip";

interface UploadedFile {
  name: string;
  type: string;
  base64: string;
}

export const generateChatCompletion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { message, file, conversationId } = req.body as {
    message?: string;
    file?: UploadedFile;
    conversationId?: string;
  };

  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user)
      return res
        .status(401)
        .json({ message: "User not registered OR Token malfunctioned" });

    const rawUserPrompt = message?.trim() || "";
    let finalPromptText = rawUserPrompt;
    if (!finalPromptText && file) {
      finalPromptText = `Please analyze and summarize the attached file: "${file.name}".`;
    }

    const recordedMessage = file
      ? `[File: ${file.name}]\n${finalPromptText}`
      : finalPromptText;

    // Retrieve or create conversation session
    let conversation: any = null;
    let isNewSession = false;

    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        user: user._id,
      });
    }

    if (!conversation) {
      isNewSession = true;
      // Instant Title Generation using local parser (0ms delay)
      const instantTopic = generateFallbackTopic(rawUserPrompt, file?.name);
      conversation = new Conversation({
        user: user._id,
        topic: instantTopic,
        messages: [],
      });

      // Background AI topic refinement (completely non-blocking, zero wait for user)
      if (rawUserPrompt.length > 3) {
        observeTopicFromQuestion(rawUserPrompt, file?.name)
          .then(async (aiTopic) => {
            if (aiTopic && aiTopic !== "New Conversation" && conversation?._id) {
              await Conversation.findByIdAndUpdate(conversation._id, {
                topic: sanitizeDisplayTopic(aiTopic),
              }).catch(() => {});
            }
          })
          .catch(() => {});
      }
    } else {
      const isGenericOrRawQuestion =
        !conversation.topic ||
        conversation.topic === "New Chat" ||
        conversation.topic === "New Conversation" ||
        conversation.topic.length > 45 ||
        conversation.topic.includes("?") ||
        /^(can you|could you|tell me|explain|what is|how to|help me|write a|i want to)/i.test(
          conversation.topic
        );

      if (isGenericOrRawQuestion) {
        conversation.topic = generateFallbackTopic(rawUserPrompt, file?.name);
        if (rawUserPrompt.length > 3) {
          observeTopicFromQuestion(rawUserPrompt, file?.name)
            .then(async (aiTopic) => {
              if (aiTopic && aiTopic !== "New Conversation" && conversation?._id) {
                await Conversation.findByIdAndUpdate(conversation._id, {
                  topic: sanitizeDisplayTopic(aiTopic),
                }).catch(() => {});
              }
            })
            .catch(() => {});
        }
      }
    }

    const geminiKey = getGeminiAPIKey();
    if (geminiKey) {
      const genAI = configureGemini();
      // Fast, active models prioritized (gemini-3.1-flash-lite provides sub-second responses)
      const modelNames = [
        process.env.GEMINI_MODEL,
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash-lite",
        "gemini-3.5-flash",
        "gemini-flash-latest",
      ];
      const uniqueModels = [...new Set(modelNames.filter(Boolean))] as string[];

      // Keep only recent 20 messages for context (prevents huge payloads from slowing generation)
      const recentMessages = conversation.messages.slice(-20);
      const history: { role: string; parts: { text: string }[] }[] = [];
      for (const chat of recentMessages) {
        const geminiRole = chat.role === "assistant" ? "model" : "user";
        if (history.length === 0 && geminiRole !== "user") {
          continue;
        }
        if (
          history.length > 0 &&
          history[history.length - 1].role === geminiRole
        ) {
          history[history.length - 1].parts[0].text += `\n${chat.content}`;
        } else {
          history.push({
            role: geminiRole,
            parts: [{ text: chat.content }],
          });
        }
      }
      if (history.length > 0 && history[history.length - 1].role === "user") {
        history.pop();
      }

      // Prepare parts for the current message
      const currentParts: any[] = [];
      let extraPromptContext = "";

      if (file && file.base64) {
        const rawBase64 = file.base64.replace(/^data:.*?;base64,/, "");
        const fileNameLower = (file.name || "").toLowerCase();
        const fileTypeLower = (file.type || "").toLowerCase();

        const isImage =
          fileTypeLower.startsWith("image/") ||
          /\.(png|jpe?g|webp|gif|bmp|heic)$/i.test(fileNameLower);

        const isPdf =
          fileTypeLower === "application/pdf" ||
          /\.pdf$/i.test(fileNameLower);

        const isZip =
          fileTypeLower.includes("zip") ||
          /\.zip$/i.test(fileNameLower);

        if (isImage) {
          const mimeType =
            file.type ||
            (fileNameLower.endsWith(".png") ? "image/png" : "image/jpeg");
          currentParts.push({
            inlineData: {
              mimeType,
              data: rawBase64,
            },
          });
        } else if (isPdf) {
          currentParts.push({
            inlineData: {
              mimeType: "application/pdf",
              data: rawBase64,
            },
          });
        } else if (isZip) {
          try {
            const buffer = Buffer.from(rawBase64, "base64");
            const zip = await JSZip.loadAsync(buffer);
            const allFiles = Object.keys(zip.files).filter(
              (fn) => !zip.files[fn].dir
            );
            extraPromptContext += `\n\n[Uploaded ZIP Archive: "${file.name}"]\nContains ${allFiles.length} file(s):\n${allFiles
              .slice(0, 30)
              .map((f) => `- ${f}`)
              .join("\n")}`;
            if (allFiles.length > 30) {
              extraPromptContext += `\n...and ${allFiles.length - 30} more files`;
            }

            const codeExtRegex =
              /\.(txt|md|js|ts|jsx|tsx|json|html|css|py|java|c|cpp|h|cs|go|rs|sql|xml|yaml|yml|sh|env)$/i;
            const textFiles = allFiles
              .filter((fn) => codeExtRegex.test(fn))
              .slice(0, 8);
            for (const tf of textFiles) {
              try {
                const content = await zip.files[tf].async("string");
                const snippet =
                  content.length > 10000
                    ? content.slice(0, 10000) + "\n...[truncated]"
                    : content;
                extraPromptContext += `\n\n--- Content of ${tf} ---\n${snippet}`;
              } catch (_) {}
            }
          } catch (zipErr: any) {
            extraPromptContext += `\n\n[Could not unpack ZIP: ${
              zipErr?.message || "Invalid archive"
            }]`;
          }
        } else {
          // Plain text or code file
          try {
            const textContent = Buffer.from(rawBase64, "base64").toString(
              "utf-8"
            );
            const snippet =
              textContent.length > 30000
                ? textContent.slice(0, 30000) + "\n...[truncated]"
                : textContent;
            extraPromptContext += `\n\n[Uploaded File Content: "${file.name}"]\n${snippet}`;
          } catch (_) {}
        }
      }

      currentParts.push(finalPromptText + extraPromptContext);

      // Ultra-Fast Multi-Model Parallel Racing Engine:
      // Fires concurrent requests across multiple Gemini models simultaneously.
      // Promise.any returns the fastest response the exact millisecond it is ready.
      const modelPromises = uniqueModels.map(async (mName) => {
        const model = genAI.getGenerativeModel({
          model: mName,
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
          },
        });
        const chatSession = model.startChat({ history });
        const result = await chatSession.sendMessage(
          currentParts.length === 1 ? currentParts[0] : currentParts
        );
        const text = result.response.text();
        if (!text || !text.trim()) {
          throw new Error(`Empty response from ${mName}`);
        }
        return { model: mName, text };
      });

      let replyText = "";
      try {
        const winner = await Promise.any(modelPromises);
        replyText = winner.text;
        console.log(`[Gemini Race Engine] Winner: ${winner.model} delivered fastest response.`);
      } catch (raceErr: any) {
        console.error("[Gemini Race Engine] All models failed in race:", raceErr?.errors || raceErr);
        throw new Error("Failed to receive response from Gemini models");
      }

      // Save messages in conversation and user profile concurrently
      conversation.messages.push({ content: recordedMessage, role: "user" });
      conversation.messages.push({ content: replyText, role: "assistant" });

      user.chats.push({ content: recordedMessage, role: "user" });
      user.chats.push({ content: replyText, role: "assistant" });

      await Promise.all([conversation.save(), user.save()]);

      return res.status(200).json({
        conversationId: conversation._id,
        topic: conversation.topic,
        chats: conversation.messages,
      });
    }

    if (process.env.OPEN_AI_SECRET) {
      const chats = conversation.messages.map(({ role, content }: any) => ({
        role,
        content,
      })) as ChatCompletionRequestMessage[];
      chats.push({ content: recordedMessage, role: "user" });

      const config = configureOpenAI();
      const openai = new OpenAIApi(config);
      const chatResponse = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: chats,
      });

      const replyContent =
        chatResponse.data.choices[0].message?.content || "";

      conversation.messages.push({ content: recordedMessage, role: "user" });
      conversation.messages.push({
        content: replyContent,
        role: "assistant",
      });
      await conversation.save();

      user.chats.push({ content: recordedMessage, role: "user" });
      user.chats.push({
        content: replyContent,
        role: "assistant",
      });
      await user.save();

      return res.status(200).json({
        conversationId: conversation._id,
        topic: conversation.topic,
        chats: conversation.messages,
      });
    }

    return res
      .status(400)
      .json({ message: "No API key configured for Gemini or OpenAI" });
  } catch (error: any) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Something went wrong", cause: error?.message });
  }
};

export const getAllConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).send("User not registered OR Token malfunctioned");
    }

    let conversations = await Conversation.find({ user: user._id })
      .sort({ updatedAt: -1 })
      .lean();

    // Migration for legacy user chats
    if (conversations.length === 0 && user.chats && user.chats.length > 0) {
      const firstUserMsg = user.chats.find((c) => c.role === "user");
      const topic = await observeTopicFromQuestion(
        firstUserMsg?.content || "",
        undefined
      );

      const newConv = new Conversation({
        user: user._id,
        topic,
        messages: user.chats.map((c) => ({
          role: c.role,
          content: c.content,
        })),
      });
      await newConv.save();
      conversations = [newConv.toObject() as any];
    }

    const sanitizedConversations = conversations.map((conv: any) => ({
      ...conv,
      topic: sanitizeDisplayTopic(conv.topic || "Conversation"),
    }));

    return res
      .status(200)
      .json({ message: "OK", conversations: sanitizedConversations });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "ERROR", cause: error?.message });
  }
};

export const getConversationById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).send("User not registered OR Token malfunctioned");
    }

    const { id } = req.params;
    const conversation = await Conversation.findOne({
      _id: id,
      user: user._id,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    return res.status(200).json({
      message: "OK",
      conversationId: conversation._id,
      topic: sanitizeDisplayTopic(conversation.topic || "Conversation"),
      chats: conversation.messages,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "ERROR", cause: error?.message });
  }
};

export const deleteConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).send("User not registered OR Token malfunctioned");
    }

    const { id } = req.params;
    await Conversation.deleteOne({ _id: id, user: user._id });

    return res.status(200).json({ message: "OK", deletedId: id });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "ERROR", cause: error?.message });
  }
};

export const sendChatsToUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).send("User not registered OR Token malfunctioned");
    }
    if (user._id.toString() !== res.locals.jwtData.id) {
      return res.status(401).send("Permissions didn't match");
    }

    let conversations = await Conversation.find({ user: user._id })
      .sort({ updatedAt: -1 })
      .lean();

    if (conversations.length === 0 && user.chats && user.chats.length > 0) {
      const firstUserMsg = user.chats.find((c) => c.role === "user");
      const topic = await observeTopicFromQuestion(
        firstUserMsg?.content || "",
        undefined
      );

      const newConv = new Conversation({
        user: user._id,
        topic,
        messages: user.chats.map((c) => ({
          role: c.role,
          content: c.content,
        })),
      });
      await newConv.save();
      conversations = [newConv.toObject() as any];
    }

    const sanitizedConversations = conversations.map((conv: any) => ({
      ...conv,
      topic: sanitizeDisplayTopic(conv.topic || "Conversation"),
    }));

    const latestConv = sanitizedConversations[0];

    return res.status(200).json({
      message: "OK",
      conversations: sanitizedConversations,
      currentConversationId: latestConv?._id || null,
      topic: latestConv ? sanitizeDisplayTopic(latestConv.topic) : "New Chat",
      chats: latestConv ? latestConv.messages : user.chats || [],
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error?.message });
  }
};

export const deleteChats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      return res.status(401).send("User not registered OR Token malfunctioned");
    }
    if (user._id.toString() !== res.locals.jwtData.id) {
      return res.status(401).send("Permissions didn't match");
    }

    await Conversation.deleteMany({ user: user._id });
    //@ts-ignore
    user.chats = [];
    await user.save();

    return res.status(200).json({ message: "OK" });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ message: "ERROR", cause: error?.message });
  }
};
