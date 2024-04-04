import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "../.env") });

import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { login, register, rename } from "./controllers/auth";
import { PromiseGuard } from "./utils/error";
import { MongoDB } from "./database/mongo";
import { Server, Socket } from "socket.io";
import { withAuth } from "./middlewares/auth";
import { getAllUsers } from "./controllers/user";
import {
  acceptFriend,
  getAllFriends,
  getRequestingFriends,
  requestFriend,
} from "./controllers/social";
import {
  createLobby,
  getAllLobbies,
  joinLobby,
  leaveLobby,
} from "./controllers/lobby";

async function main() {
  const app: Express = express();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer);

  const PORT = process.env.PORT || 3000;
  const MONGO_URI = process.env.MONGO_URI || "";

  let dbConnect = MongoDB.connect(MONGO_URI, "database");
  let { error: dbErr } = await PromiseGuard(dbConnect);
  if (dbErr !== undefined) {
    console.error("[server] Failed to connect to MongoDB:", dbErr);
    process.exit();
  }

  io.on("connection", (socket: Socket) => {
    socket.emit("hello", "world");
  });

  app.use(cors());
  app.use(cookieParser());
  app.use(express.json());
  app.use("/", express.static(path.join(__dirname, "../public/")));

  const api = express.Router();
  api.post("/auth/login", login);
  api.post("/auth/register", register);
  api.patch("/user", withAuth(rename));
  api.get("/users", getAllUsers);

  api.post("/social/add/:userId", withAuth(requestFriend));
  api.post("/social/accept/:userId", withAuth(acceptFriend));
  api.get("/social/requests", withAuth(getRequestingFriends));
  api.get("/social/friends", withAuth(getAllFriends));

  api.get("/lobbies", getAllLobbies);
  api.post("/lobby/create", withAuth(createLobby));
  api.post("/lobby/join/:lobbyId", withAuth(joinLobby));
  api.post("/lobby/leave/:lobbyId", withAuth(leaveLobby));

  app.use("/api", api);

  httpServer.listen(PORT, () => {
    console.log(`[server] Server is running at http://localhost:${PORT}`);
  });
}

main();
