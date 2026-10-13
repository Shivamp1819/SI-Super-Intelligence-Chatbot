import express from "express";
import { config } from "dotenv";
import morgan from "morgan";
import appRouter from "./routes/index.js";
import cookieParser from "cookie-parser";
import cors from "cors";
config();
const app = express();

// Trust reverse proxies (Render, Railway, Vercel, AWS, Nginx) so HTTPS cookies work properly
app.set("trust proxy", 1);

// Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
  ...(process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(",").map((s) => s.trim())
    : []),
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((s) => s.trim())
    : []),
];

// CORS middleware
app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      if (
        process.env.NODE_ENV !== "production" ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".netlify.app") ||
        origin.endsWith(".onrender.com") ||
        origin.endsWith(".railway.app")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || "default_cookie_secret_fallback"));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Health check endpoint for deployment monitoring
app.get("/health", (req: express.Request, res: express.Response) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/api/v1", appRouter);

export default app;
