import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "../.env") });

import express, { Express } from "express";
import cors from "cors";
import http from "http";
import { login, register } from "./controllers/auth";
import { Return } from "./utils/async";
import { MongoDB } from "./database/mongo";
import { Server, Socket } from "socket.io";

async function main() {
  const app: Express = express();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer);

  const PORT = process.env.PORT || 3000;
  const MONGO_URI = process.env.MONGO_URI || "";

  let dbConnect = MongoDB.connect(MONGO_URI, "database");
  let { error: dbErr } = await Return(dbConnect);
  if (dbErr !== undefined) {
    console.error("[server] Failed to connect to MongoDB:", dbErr);
    process.exit();
  }

  io.on("connection", (socket: Socket) => {
    socket.emit("hello", "world");
  });

  app.use(cors());
  app.use(express.json());
  app.use("/", express.static(path.join(__dirname, "../public/")));

  const api = express.Router();
  api.post("/auth/login", login);
  api.post("/auth/register", register);

  app.use("/api", api);

  httpServer.listen(PORT, () => {
    console.log(`[server] Server is running at http://localhost:${PORT}`);
  });
}

main();
