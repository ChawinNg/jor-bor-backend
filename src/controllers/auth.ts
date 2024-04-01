import { Request, Response } from "express";
import { IUser, IUserCredential } from "../models/user";
import { MongoDB } from "../database/mongo";
import { Return } from "../utils/async";
import bcrypt from "bcrypt";

export async function login(req: Request, res: Response) {
  let body = req.body as IUserCredential;

  if (body.username === undefined || body.password === undefined)
    return res.status(200).send({ message: "invalid body" });

  let userQuery = MongoDB.db()
    .collection<IUser>("users")
    .findOne({ username: body.username });

  let { error: userErr, value: user } = await Return<IUser | null>(userQuery);
  if (userErr !== undefined)
    return res.status(500).send({ message: userErr.message });
  else if (user === null)
    return res.status(404).send({ message: "user not found" });

  let bcryptCompare = bcrypt.compare(body.password, user.password);
  let match = await Return<boolean>(bcryptCompare);
  if (!match)
    return res.status(401).send({ message: "user credential does not match" });

  res.cookie("session", user._id.toString(), {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
  });

  return res.status(200).send({ message: "success" });
}
