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

  let query = MongoDB.db().collection("lobbies").insertOne(lobby);
  let { error: queryErr, value: newLobby } = await PromiseGuard(query);
  if (queryErr !== undefined)
    return res.status(500).send({ message: queryErr.message });

  console.log(newLobby);

  return res
    .status(200)
    .send({ message: "success", lobby_id: newLobby.insertedId });
}
