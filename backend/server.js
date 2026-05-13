import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import app from "./app.js";
import connectDB from "./src/db/index.js";

const PORT = process.env.PORT || 9000;
let server;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log("✅ MongoDB connected successfully.");

    // Start the server
    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.error("❌ Unhandled Rejection:", err.name, err.message);
      console.error(err.stack);
      server.close(() => {
        process.exit(1);
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// Handle SIGTERM
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received. Shutting down gracefully...");
  if (server) {
    server.close(() => {
      console.log("💻 Process terminated.");
    });
  }
});