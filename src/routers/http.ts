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
} from "../controllers/lobby";

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

export default api;
