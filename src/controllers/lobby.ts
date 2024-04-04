import { Request, Response } from "express";
import { MongoDB } from "../database/mongo";
import { ILobby } from "../models/lobby";
import { PromiseGuard } from "../utils/error";
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

  console.log(newLobby);

  return res
    .status(200)
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
