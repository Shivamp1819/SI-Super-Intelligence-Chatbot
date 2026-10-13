import { Router } from "express";
import { verifyToken } from "../utils/token-manager.js";
import { chatCompletionValidator, validate } from "../utils/validators.js";
import {
  deleteChats,
  deleteConversation,
  generateChatCompletion,
  getAllConversations,
  getConversationById,
  sendChatsToUser,
} from "../controllers/chat-controllers.js";

// Protected API
const chatRoutes = Router();

chatRoutes.post(
  "/new",
  validate(chatCompletionValidator),
  verifyToken,
  generateChatCompletion
);
chatRoutes.get("/conversations", verifyToken, getAllConversations);
chatRoutes.get("/conversation/:id", verifyToken, getConversationById);
chatRoutes.delete("/conversation/:id", verifyToken, deleteConversation);
chatRoutes.get("/all-chats", verifyToken, sendChatsToUser);
chatRoutes.delete("/delete", verifyToken, deleteChats);

export default chatRoutes;
