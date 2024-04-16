import { Request, Response } from "express";
import { MongoDB } from "../database/mongo";
import { IUser } from "../models/user";
import { Guard, PromiseGuard } from "../utils/error";
import { ObjectId } from "mongodb";
import { getUserByIdRepo } from "../repository/user";

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
  console.log(req.params)
  let { error: userIdErr, value: userId } = Guard<ObjectId>(() => {
    return ObjectId.createFromHexString(req.params.userId);
  });
  if (userIdErr) return res.status(400).send({ message: "invalid user id" });

  let { error: queryErr, value: user } = await getUserByIdRepo(userId);
  if (user === null)
    return res.status(404).send({ message: "user not found" });
  else if (queryErr !== undefined)
    return res.status(500).send({ message: queryErr.message });

  return res.status(200).send({
    user
  });
}
