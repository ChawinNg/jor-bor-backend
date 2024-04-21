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
import { getMessagesRepo, saveMessageRepo } from "./repository/message";

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

  io.on("connection", (socket) => {
    console.log(`Socket ${socket.id} connected.`);

    let users: { [key: string]: any } = {};
    for (let [id, socket] of io.of("/").sockets) {
      users[id] = {
        socketID: id,
        username: socket.handshake.auth.username,
        userId: socket.handshake.auth.user_id,
      };
    }
    io.emit("users", Object.values(users));
    console.log(Object.values(users));

    // Init chat messages
    socket.on("init chat", async ({ to }) => {
      // console.log({ from: users[socket.id].username, ...credential });
      let { value, error } = await getMessagesRepo(users[socket.id].username, to);
      if (error !== undefined) return;

      value.forEach((msg) => {
        io.emit("private message", msg);
      });
    });

    //Private Message
    socket.on("private message", async (message) => {
      let { error } = await saveMessageRepo(message);
      if (error !== undefined) return;

      io.emit("private message", message);
    });

    //Lobby message
    socket.on("lobby message", (message, lobby_id) => {
      console.log(lobby_id, message);
      if (lobby_id.length) {
        io.to(lobby_id).emit("lobby message", message);
      } else {
        io.emit("lobby message", message);
      }
    });

    //Join lobby
    socket.on("joinLobby", (lobby_id) => {
      console.log("Joining lobby", lobby_id);
      socket.join(lobby_id);
    });

    //Game message
    socket.on("game message", (message, lobby_id) => {
      if (lobby_id.length) {
        io.to(lobby_id).emit("game message", message);
      } else {
        io.emit("game message", message);
      }
    });

    //Join game
    socket.on("joinGame", (lobby_id) => {
      console.log("Joining Game", lobby_id);
      socket.join(lobby_id);
    });

    //Ghost message
    socket.on("ghost message", (message, lobby_id) => {
      if (lobby_id.length) {
        io.to(lobby_id).emit("ghost message", message);
      } else {
        io.emit("ghost message", message);
      }
    });

    //Join ghost chat
    socket.on("joinGhost", (lobby_id) => {
      console.log("Joining Ghost", lobby_id);
      socket.join(lobby_id);
    });

    // Clean up the socket on disconnect
    socket.on("disconnect", () => {
      console.log(`Socket ${socket.id} disconnected.`);
      users = {};
      for (let [id, socket] of io.of("/").sockets) {
        users[id] = {
          socketID: id,
          username: socket.handshake.auth.username,
          userId: socket.handshake.auth.user_id,
        };
      }
      io.emit("users", Object.values(users));
      console.log(Object.values(users));
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`[server] Server is running at http://localhost:${PORT}`);
  });
}

main();
