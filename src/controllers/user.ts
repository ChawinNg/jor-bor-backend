import { Request, Response } from "express";
import { MongoDB } from "../database/mongo";
import { IUser } from "../models/user";
import { PromiseGuard } from "../utils/error";

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
