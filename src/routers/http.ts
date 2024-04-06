import express from "express";

import { login, register, rename } from "../controllers/auth";
import { getAllUsers } from "../controllers/user";
import { withAuth } from "../middlewares/auth";
import {
  acceptFriend,
  getAllFriends,
  getRequestingFriends,
  rejectFriend,
  requestFriend,
} from "../controllers/social";
import {
  createLobby,
  deleteLobby,
  getAllLobbies,
  getLobbyById,
  joinLobby,
  leaveLobby,
  ready,
} from "../controllers/lobby";
import { withParams } from "../middlewares/params";
import path from "path";
import { readFile, readFileSync } from "fs";
import { routeHTML } from "../controllers/route";

const api = express.Router();
api.post("/auth/login", login);
api.post("/auth/register", register);
api.patch("/user", withAuth(rename));
api.get("/users", getAllUsers);

api.post("/social/add/:userId", withAuth(requestFriend));
api.post("/social/accept/:userId", withAuth(acceptFriend));
api.post("/social/reject/:userId", withAuth(rejectFriend));
api.get("/social/requests", withAuth(getRequestingFriends));
api.get("/social/friends", withAuth(getAllFriends));

api.get("/lobbies", getAllLobbies);
api.get("/lobby/:lobbyId", getLobbyById);
api.post("/lobby/create", withAuth(createLobby));
api.post("/lobby/join/:lobbyId", withAuth(joinLobby));
api.post("/lobby/leave", withAuth(leaveLobby));
api.delete("/lobby/delete", withAuth(deleteLobby));
api.post("/lobby/ready", withAuth(withParams(ready, true)));
api.post("/lobby/unready", withAuth(withParams(ready, false)));

const routes = api.stack.map((r: any) => ({
  path: `/api${r.route.path}`,
  method: String(r.route.stack[0].method).toUpperCase(),
}));

api.get("/routes", withParams(routeHTML, routes));

export default api;
