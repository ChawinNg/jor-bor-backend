import { Request, Response } from "express";
import { MongoDB } from "../database/mongo";
import { IUser } from "../models/user";
import { Guard, PromiseGuard } from "../utils/error";
import { ObjectId } from "mongodb";

export async function getAllUsers(req: Request, res: Response) {
  let usersQuery = MongoDB.db().collection<IUser>("users").find().toArray();
  let { error: usersErr, value: users } = await PromiseGuard<IUser[]>(
    usersQuery
  );
  if (usersErr !== undefined)
    return res.status(500).send({ message: usersErr });

  return res.send(
    users.map((user) => ({
      id: user._id.toString(),
      username: user.username,
      score: user.score,
    }))
  );
}

export async function getMe(req: Request, res: Response) {
  let { error: idErr, value: _id } = Guard(() => ObjectId.createFromHexString(res.locals.userId));
  if (idErr !== undefined)
    return res.status(401).send({ message: "required login" });

  let query = MongoDB.db().collection<IUser>("users").findOne({ _id })
  let { error: userErr, value: user } = await PromiseGuard(query)
  if (userErr !== undefined)
    return res.status(500).send({ message: userErr.message });
  else if (user === null)
    return res.status(404).send({ message: "user not found" });

  return res.status(200).send({ data: { _id: user._id, username: user.username } })
};