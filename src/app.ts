import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "../.env") });

import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { PromiseGuard } from "./utils/error";
import { MongoDB } from "./database/mongo";
import { Server } from "socket.io";
import api from "./routers/http";
import { onSocketConnect } from "./routers/socket";

async function main() {
  const PORT = process.env.PORT || 3000;
  const MONGO_URI = process.env.MONGO_URI || "";

  let dbConnect = MongoDB.connect(MONGO_URI, "database");
  let { error: dbErr } = await PromiseGuard(dbConnect);
  if (dbErr !== undefined) {
    console.error("[server] Failed to connect to MongoDB:", dbErr);
    process.exit();
  }

  const app: Express = express();
  const httpServer = http.createServer(app);
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use("/", express.static(path.join(__dirname, "../public/")));
  app.use("/api", api);

  const io = new Server(httpServer, {
    cookie: true,
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });
  // io.on("connection", onSocketConnect);
  io.on("connection", (socket) => {
    console.log(`Socket ${socket.id} connected.`);

    // Listen for incoming messages and broadcast to all clients
    socket.on("message", (message) => {
      io.emit("message", message);
    });

    // Clean up the socket on disconnect
    socket.on("disconnect", () => {
      console.log(`Socket ${socket.id} disconnected.`);
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`[server] Server is running at http://localhost:${PORT}`);
  });
}

main();
