import { Request, Response } from "express";
import { MongoDB } from "../database/mongo";
import { ILobby } from "../models/lobby";
import { Guard, PromiseGuard } from "../utils/error";
import { ObjectId } from "mongodb";

export async function createLobby(req: Request, res: Response) {
  let body = req.body as ILobby;

  if (
    body.name === undefined ||
    body.is_public === undefined ||
    body.max_player === undefined
  )
    return res.status(400).send({ message: "invalid fields" });

  let _id = ObjectId.createFromHexString(res.locals.userId);
  let lobby: ILobby = {
    ...body,
    lobby_owner: _id,
    players: [
      {
        _id,
        is_ready: false,
      },
    ],
  };

  let query = MongoDB.db().collection<ILobby>("lobbies").insertOne(lobby);
  let { error: queryErr, value: newLobby } = await PromiseGuard(query);
  if (queryErr !== undefined)
    return res.status(500).send({ message: queryErr.message });

  return res
    .status(201)
    .send({ message: "success", lobby_id: newLobby.insertedId });
}

export async function getAllLobbies(req: Request, res: Response) {
  let query = MongoDB.db().collection<ILobby>("lobbies").find().toArray();
  let { error: queryErr, value: lobbies } = await PromiseGuard(query);
  if (queryErr !== undefined)
    return res.status(500).send({ message: queryErr.message });

  return res.status(200).send(
    lobbies
      .filter((lobby) => lobby.is_public)
      .map((lobby) => ({
        id: lobby._id,
        owner: lobby.lobby_owner,
        name: lobby.name,
        max_player: lobby.max_player,
        players: lobby.players,
      }))
  );
}

export async function joinLobby(req: Request, res: Response) {
  let _id = ObjectId.createFromHexString(res.locals.userId);

  let { error: lobbyIdErr, value: lobbyId } = Guard<ObjectId>(() => {
    return ObjectId.createFromHexString(req.params.lobbyId);
  });
  if (lobbyIdErr) return res.status(400).send({ message: "invalid lobby id" });

  let lobbyQuery = MongoDB.db()
    .collection<ILobby>("lobbies")
    .findOne({ _id: lobbyId });
  let { error: lobbyQueryErr, value: lobby } = await PromiseGuard(lobbyQuery);
  if (lobby === null)
    return res.status(404).send({ message: "lobby not found" });
  else if (lobbyQueryErr !== undefined)
    return res.status(500).send({ message: lobbyQueryErr.message });

  if (lobby.players.length >= lobby.max_player)
    return res.status(400).send({ message: "lobby is full" });

  let query = MongoDB.db()
    .collection<ILobby>("lobbies")
    .updateOne(
      { _id: lobbyId },
      {
        $addToSet: {
          players: {
            _id,
            is_ready: false,
          },
        },
      }
    );
  let { error: queryErr, value: updatedLobby } = await PromiseGuard(query);
  if (updatedLobby === null)
    return res.status(404).send({ message: "lobby not found" });
  else if (queryErr !== undefined)
    return res.status(500).send({ message: queryErr.message });

  return res.status(200).send({ message: "success" });
}

export async function leaveLobby(req: Request, res: Response) {
  let _id = ObjectId.createFromHexString(res.locals.userId);

  let { error: lobbyIdErr, value: lobbyId } = Guard<ObjectId>(() => {
    return ObjectId.createFromHexString(req.params.lobbyId);
  });
  if (lobbyIdErr) return res.status(400).send({ message: "invalid lobby id" });

  let query = MongoDB.db()
    .collection<ILobby>("lobbies")
    .findOneAndUpdate(
      { _id: lobbyId },
      {
        $pull: {
          players: {
            _id,
          },
        },
      }
    );
  let { error: queryErr, value: updatedLobby } = await PromiseGuard(query);
  if (updatedLobby === null)
    return res.status(404).send({ message: "lobby not found" });
  else if (queryErr !== undefined)
    return res.status(500).send({ message: queryErr.message });

  return res.status(200).send({ message: "success" });
}

export async function deleteLobby(req: Request, res: Response) {
  let _id = ObjectId.createFromHexString(res.locals.userId);

  let { error: lobbyIdErr, value: lobbyId } = Guard<ObjectId>(() => {
    return ObjectId.createFromHexString(req.params.lobbyId);
  });
  if (lobbyIdErr) return res.status(400).send({ message: "invalid lobby id" });

  let query = MongoDB.db()
    .collection<ILobby>("lobbies")
    .findOneAndDelete({ _id: lobbyId });
  let { error: queryErr, value: deletedLobby } = await PromiseGuard(query);
  if (deletedLobby === null)
    return res.status(404).send({ message: "lobby not found" });
  else if (queryErr !== undefined)
    return res.status(500).send({ message: queryErr.message });

  return res.status(200).send({ message: "success" });
}
