import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "../.env") });

import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { PromiseGuard } from "./utils/error";
import { MongoDB } from "./database/mongo";
import { Server, Socket } from "socket.io";
import api from "./routers/http";
import {
  getLobbyMessagesRepo,
  getMessagesRepo,
  saveMessageRepo,
} from "./repository/message";
import { WerewolfGame } from "./controllers/game";

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

  const werewolfGame = new WerewolfGame(io);

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
      let { value, error } = await getMessagesRepo(
        users[socket.id].username,
        to
      );
      if (error !== undefined) return;

      value.forEach((msg) => {
        socket.emit("private message", msg);
      });
    });
    //Global Message
    socket.on("global message", async (message) => {
      io.emit("global message", message);
    });
    //Private Message
    socket.on("private message", async (message) => {
      let { error } = await saveMessageRepo(message);
      if (error !== undefined) return;

      io.emit("private message", message);
    });

    //Invite Message
    socket.on("invite message", (data) => {
      let { user, to, message, time } = data;
      let socketId;
      for (let [id, socket] of io.of("/").sockets) {
        if (socket.handshake.auth.username === to) {
          socketId = id;
        }
      }
      if (socketId) io.to(socketId).emit("invitation", data);
    });

    //Lobby message
    socket.on("lobby message", async (message, lobby_id) => {
      let { error } = await saveMessageRepo({ ...message, lobby_id });
      if (error !== undefined) return;

      if (lobby_id.length) {
        io.to(lobby_id).emit("lobby message", message);
      } else {
        io.emit("lobby message", message);
      }
    });

    //Join lobby
    socket.on("joinLobby", async (lobby_id) => {
      socket.data.isReady = false;
      console.log(`Socket ${socket.id} has joined the lobby ${lobby_id}`);
      socket.join(lobby_id);

      let { value, error } = await getLobbyMessagesRepo(lobby_id);
      if (error !== undefined) return;
      value.forEach((msg) => {
        socket.emit("lobby message", msg);
      });

      const users: any[] = [];
      let room = io.sockets.adapter.rooms.get(lobby_id);
      if (room) {
        console.log("room found");
        console.log(room);

        for (let [id, socket] of io.of("/").sockets) {
          if (socket.rooms.has(lobby_id)) {
            users.push({
              socketID: id,
              username: socket.handshake.auth.username,
              userId: socket.handshake.auth.user_id,
              ready: socket.data.isReady,
            });
          }
        }
      } else {
        console.log("not found");
      }
      console.log(users);
      io.in(lobby_id).emit("lobbyUsers", users);
    });

    socket.on("leaveLobby", (lobby_id) => {
      console.log(`Socket ${socket.id} has leaved the lobby ${lobby_id}`);
      socket.leave(lobby_id);

      const users: any[] = [];
      let room = io.sockets.adapter.rooms.get(lobby_id);
      if (room) {
        console.log("room found");
        console.log(room);

        for (let [id, socket] of io.of("/").sockets) {
          if (socket.rooms.has(lobby_id)) {
            users.push({
              socketID: id,
              username: socket.handshake.auth.username,
              userId: socket.handshake.auth.user_id,
              ready: socket.data.isReady,
            });
          }
        }
      } else {
        console.log("not found");
      }
      console.log(users);
      io.in(lobby_id).emit("lobbyUsers", users);
    });

    socket.on("ready", (lobby_id) => {
      socket.data.isReady = true;
      console.log(`Lobby: ${lobby_id}, Socket ${socket.id} is ready`);

      const users: any[] = [];
      let room = io.sockets.adapter.rooms.get(lobby_id);
      if (room) {
        console.log("room found");
        console.log(room);

        for (let [id, socket] of io.of("/").sockets) {
          if (socket.rooms.has(lobby_id)) {
            users.push({
              socketID: id,
              username: socket.handshake.auth.username,
              userId: socket.handshake.auth.user_id,
              ready: socket.data.isReady,
            });
          }
        }
      } else {
        console.log("not found");
      }
      console.log(users);
      io.in(lobby_id).emit("lobbyUsers", users);
    });

    socket.on("notReady", (lobby_id) => {
      socket.data.isReady = false;
      console.log(`Lobby: ${lobby_id}, Socket ${socket.id} is not ready`);

      const users: any[] = [];
      let room = io.sockets.adapter.rooms.get(lobby_id);
      if (room) {
        console.log("room found");
        console.log(room);

        for (let [id, socket] of io.of("/").sockets) {
          if (socket.rooms.has(lobby_id)) {
            users.push({
              socketID: id,
              username: socket.handshake.auth.username,
              userId: socket.handshake.auth.user_id,
              ready: socket.data.isReady,
            });
          }
        }
      } else {
        console.log("not found");
      }
      console.log(users);
      io.in(lobby_id).emit("lobbyUsers", users);
    });

    //Game message
    socket.on("game message", (message, lobby_id) => {
      if (lobby_id.length) {
        io.to(lobby_id).emit("game message", message);
      } else {
        io.emit("game message", message);
      }
    });

    // Start game
    socket.on("hostStart", (lobby_id) => {
      io.in(lobby_id).emit("startGame");
    });

    //Join game
    socket.on("joinGame", (lobby_id) => {
      werewolfGame.handleJoinGame(socket, lobby_id);
    });

    socket.on("start", (lobby_id) => {
      werewolfGame.handleStart(socket, lobby_id);
    });

    socket.on("nightVote", (lobby_id, targetSocketId) => {
      werewolfGame.handleWerewolfSelect(socket, lobby_id, targetSocketId);
    });

    socket.on("dayVote", (lobby_id, targetSocketId) => {
      werewolfGame.handleDayVote(socket, lobby_id, targetSocketId);
    });

    socket.on("seerSelected", (lobby_id, id) => {
      werewolfGame.handleSeer(socket, lobby_id, id);
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

  // add here ----------------------------

  // const users: IUser[] = [
  //   {_id: new ObjectId(), name: 'A'},
  //   {_id: new ObjectId(), name: 'B'},
  //   {_id: new ObjectId(), name: 'C'},
  //   {_id: new ObjectId(), name: 'D'},
  //   {_id: new ObjectId(), name: 'E'},
  //   {_id: new ObjectId(), name: 'F'},
  //   {_id: new ObjectId(), name: 'G'},
  //   {_id: new ObjectId(), name: 'H'},
  // ]
  // console.log(users.length)

  // const game = new WerewolfGame(users, httpServer);

  // return res.status(200).send({
  //   message: game.players
  // })

  // -------------------------------------
}

// interface IUser {
//   _id: ObjectId;
//   name: string;
// }

main();
