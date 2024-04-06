import { Request, Response } from "express";
import { ILobby } from "../models/lobby";
import { Guard } from "../utils/error";
import { ObjectId } from "mongodb";
import {
  createLobbyRepo,
  deleteLobbyRepo,
  getAllLobbiesRepo,
  getLobbyByIdRepo,
  joinLobbyRepo,
  leaveLobbyRepo,
  setUserLobbyRepo,
  unsetUserLobbyRepo,
} from "../repository/lobby";

export async function getAllLobbies(req: Request, res: Response) {
  let { error: queryErr, value: lobbies } = await getAllLobbiesRepo();
  if (queryErr !== undefined)
    return res.status(500).send({ message: queryErr.message });

  return res.status(200).send(
    lobbies
      .filter((lobby) => lobby.is_public)
      .map((lobby) => ({
        id: lobby._id,
        owner: lobby._id,
        name: lobby.name,
        max_player: lobby.max_player,
        players: lobby.players,
      }))
  );
}

export async function getLobbyById(req: Request, res: Response) {
  let { error: lobbyIdErr, value: lobbyId } = Guard<ObjectId>(() => {
    return ObjectId.createFromHexString(req.params.lobbyId);
  });
  if (lobbyIdErr) return res.status(400).send({ message: "invalid lobby id" });

  let { error: queryErr, value: lobby } = await getLobbyByIdRepo(lobbyId);
  if (lobby === null)
    return res.status(404).send({ message: "lobby not found" });
  else if (queryErr !== undefined)
    return res.status(500).send({ message: queryErr.message });

  return res.status(200).send({
    id: lobby._id,
    owner: lobby._id,
    name: lobby.name,
    max_player: lobby.max_player,
    players: lobby.players,
  });
}

export async function createLobby(req: Request, res: Response) {
  let body = req.body as ILobby;

  if (
    body.name === undefined ||
    body.is_public === undefined ||
    body.max_player === undefined
  )
    return res.status(400).send({ message: "invalid fields" });

  let _id = ObjectId.createFromHexString(res.locals.userId);
  let { error: queryErr, value: newLobby } = await createLobbyRepo(_id, body);
  if (queryErr !== undefined)
    return res.status(500).send({ message: queryErr.message });

  let { error: updateUserQueryErr } = await setUserLobbyRepo(
    _id,
    newLobby.insertedId
  );
  if (updateUserQueryErr !== undefined)
    return res.status(500).send({ message: updateUserQueryErr.message });

  return res
    .status(201)
    .send({ message: "success", lobby_id: newLobby.insertedId });
}

export async function joinLobby(req: Request, res: Response) {
  let _id = ObjectId.createFromHexString(res.locals.userId);

  let { error: lobbyIdErr, value: lobbyId } = Guard<ObjectId>(() => {
    return ObjectId.createFromHexString(req.params.lobbyId);
  });
  if (lobbyIdErr) return res.status(400).send({ message: "invalid lobby id" });

  let { error: lobbyQueryErr, value: lobby } = await getLobbyByIdRepo(lobbyId);
  if (lobby === null)
    return res.status(404).send({ message: "lobby not found" });
  else if (lobbyQueryErr !== undefined)
    return res.status(500).send({ message: lobbyQueryErr.message });

  if (lobby.players.length >= lobby.max_player)
    return res.status(400).send({ message: "lobby is full" });

  let { error: queryErr, value: updatedLobby } = await joinLobbyRepo(
    _id,
    lobbyId
  );
  if (updatedLobby === null)
    return res.status(404).send({ message: "lobby not found" });
  else if (queryErr !== undefined)
    return res.status(500).send({ message: queryErr.message });

  let { error: updateUserQueryErr } = await setUserLobbyRepo(_id, lobbyId);
  if (updateUserQueryErr !== undefined)
    return res.status(500).send({ message: updateUserQueryErr.message });

  return res.status(200).send({ message: "success" });
}

export async function leaveLobby(req: Request, res: Response) {
  let _id = ObjectId.createFromHexString(res.locals.userId);

  let { error: updateUserQueryErr, value: updatedUser } =
    await unsetUserLobbyRepo(_id);
  if (updateUserQueryErr !== undefined)
    return res.status(500).send({ message: updateUserQueryErr.message });

  let { error: queryErr, value: updatedLobby } = await leaveLobbyRepo(
    _id,
    updatedUser!.lobby_id
  );
  if (updatedLobby === null)
    return res.status(404).send({ message: "lobby not found" });
  else if (queryErr !== undefined)
    return res.status(500).send({ message: queryErr.message });

  if (updatedLobby.players.length === 1) {
    let { error: deleteQuery } = await deleteLobbyRepo(updatedLobby._id);
    if (deleteQuery !== undefined)
      return res.status(500).send({ message: deleteQuery.message });
  }

  return res.status(200).send({ message: "success" });
}

export async function deleteLobby(req: Request, res: Response) {
  let _id = ObjectId.createFromHexString(res.locals.userId);

  let { error: queryErr, value: deletedLobby } = await deleteLobbyRepo(_id);
  if (deletedLobby === null)
    return res.status(404).send({ message: "lobby not found" });
  else if (queryErr !== undefined)
    return res.status(500).send({ message: queryErr.message });

  return res.status(200).send({ message: "success" });
}
