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
import { onSocketConnect } from "./routers/socket";
import 'reflect-metadata'

import { ObjectId } from "mongodb";
import { WerewolfGame } from "./controllers/game";
import { SocketControllers } from "socket-controllers";


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
  io.on("connection", onSocketConnect);

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

interface IUser {
  _id: ObjectId;
  name: string;
}

main();
