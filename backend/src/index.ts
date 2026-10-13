import { config } from "dotenv";
config();
import dns from "node:dns";
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}
import app from "./app.js";
import { connectToDatabase, disconnectFromDatabase } from "./db/connection.js";

const PORT = process.env.PORT || 5000;

// Prevent server crash from unhandled rejections or exceptions
process.on("unhandledRejection", (reason: unknown) => {
  console.error(
    "⚠️ Unhandled Promise Rejection:",
    reason instanceof Error ? reason.message : reason
  );
});

process.on("uncaughtException", (error: Error) => {
  console.error("⚠️ Uncaught Exception:", error.message);
});

// Startup and DB connection
connectToDatabase()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} & Connected to Database`);
    });

    // Graceful shutdown for cloud host platforms (Render, Railway, Fly.io, AWS)
    const gracefulShutdown = async (signal: string) => {
      console.log(`Received ${signal}. Closing server gracefully...`);
      server.close(async () => {
        try {
          await disconnectFromDatabase();
          console.log("Database disconnected. Server stopped cleanly.");
          process.exit(0);
        } catch (err) {
          console.error("Error disconnecting database during shutdown:", err);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  })
  .catch((err) => {
    console.error("❌ Failed to connect to database and start server:", err);
    process.exit(1);
  });
