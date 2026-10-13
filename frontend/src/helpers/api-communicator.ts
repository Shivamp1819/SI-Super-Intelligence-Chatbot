import axios from "axios";

export const loginUser = async (
  email: string,
  password: string,
  confirmPassword?: string
) => {
  const res = await axios.post("/user/login", {
    email,
    password,
    confirmPassword,
  });
  if (res.status !== 200) {
    throw new Error("Unable to login");
  }
  return res.data;
};

export const signupUser = async (
  name: string,
  email: string,
  password: string,
  confirmPassword?: string
) => {
  const res = await axios.post("/user/signup", {
    name,
    email,
    password,
    confirmPassword,
  });
  if (res.status !== 201) {
    throw new Error("Unable to Signup");
  }
  return res.data;
};

export const sendOtp = async (
  email: string,
  purpose: "signup" | "reset_password"
) => {
  const res = await axios.post("/user/send-otp", { email, purpose });
  if (res.status !== 200) {
    throw new Error("Unable to send OTP");
  }
  return res.data;
};

export const verifyOtp = async (
  email: string,
  otp: string,
  purpose: "signup" | "reset_password"
) => {
  const res = await axios.post("/user/verify-otp", { email, otp, purpose });
  if (res.status !== 200) {
    throw new Error("Unable to verify OTP");
  }
  return res.data;
};

export const resetUserPassword = async (
  email: string,
  password: string,
  confirmPassword: string
) => {
  const res = await axios.post("/user/reset-password", {
    email,
    password,
    confirmPassword,
  });
  if (res.status !== 200) {
    throw new Error("Unable to reset password");
  }
  return res.data;
};

export const checkAuthStatus = async () => {
  const res = await axios.get("/user/auth-status");
  if (res.status !== 200) {
    throw new Error("Unable to authenticate");
  }
  return res.data;
};

export interface ChatFile {
  name: string;
  type: string;
  base64: string;
}

export interface ConversationItem {
  _id: string;
  topic: string;
  createdAt: string;
  updatedAt: string;
  messages?: { id: string; role: "user" | "assistant"; content: string }[];
}

export const sendChatRequest = async (
  message: string,
  file?: ChatFile | null,
  conversationId?: string | null
) => {
  const res = await axios.post("/chat/new", {
    message,
    file,
    conversationId,
  });
  if (res.status !== 200) {
    throw new Error("Unable to send chat");
  }
  return res.data;
};

export const getUserChats = async () => {
  const res = await axios.get("/chat/all-chats");
  if (res.status !== 200) {
    throw new Error("Unable to get chats");
  }
  return res.data;
};

export const getConversations = async () => {
  const res = await axios.get("/chat/conversations");
  if (res.status !== 200) {
    throw new Error("Unable to get conversations");
  }
  return res.data;
};

export const getConversationById = async (id: string) => {
  const res = await axios.get(`/chat/conversation/${id}`);
  if (res.status !== 200) {
    throw new Error("Unable to get conversation");
  }
  return res.data;
};

export const deleteConversationById = async (id: string) => {
  const res = await axios.delete(`/chat/conversation/${id}`);
  if (res.status !== 200) {
    throw new Error("Unable to delete conversation");
  }
  return res.data;
};

export const deleteUserChats = async () => {
  const res = await axios.delete("/chat/delete");
  if (res.status !== 200) {
    throw new Error("Unable to delete chats");
  }
  return res.data;
};

export const logoutUser = async () => {
  const res = await axios.get("/user/logout");
  if (res.status !== 200) {
    throw new Error("Unable to logout");
  }
  return res.data;
};
