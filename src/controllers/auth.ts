import { Request, Response } from "express";
import { IUserCredential, IRenameCredential, IUser } from "../models/user";
import { MongoDB } from "../database/mongo";
import { PromiseGuard } from "../utils/error";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

export async function login(req: Request, res: Response) {
  let body = req.body as IUserCredential;
  if (body.username === undefined || body.password === undefined)
    return res.status(400).send({ message: "invalid body" });

  let userQuery = MongoDB.db()
    .collection<IUser>("users")
    .findOne({ username: body.username });

  let { error: userErr, value: user } = await PromiseGuard<IUser | null>(
    userQuery
  );
  if (userErr !== undefined)
    return res.status(500).send({ message: userErr.message });
  else if (user === null)
    return res.status(404).send({ message: "user not found" });

  let bcryptCompare = bcrypt.compare(body.password, user.password);
  let match = await PromiseGuard<boolean>(bcryptCompare);
  if (!match)
    return res.status(401).send({ message: "user credential does not match" });

  res.cookie("session", user._id.toString(), {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
  });

  return res.status(200).send({ message: "success" });
}

export async function register(req: Request, res: Response) {
  let body = req.body as IUserCredential;
  if (body.username === undefined || body.password === undefined)
    return res.status(200).send({ message: "invalid body" });

  let bcryptHash = bcrypt
    .genSalt()
    .then((salt) => bcrypt.hash(body.password, salt));

  let { error: hashErr, value: hash } = await PromiseGuard<string>(bcryptHash);
  if (hashErr !== undefined) {
    return res.status(500).send({ message: hashErr.message });
  }

  let registerQuery = MongoDB.db()
    .collection<IUserCredential>("users")
    .insertOne({
      ...body,
      password: hash,
    });

  let { error: userErr } = await PromiseGuard(registerQuery);
  if (userErr !== undefined)
    return res.status(500).send({ message: userErr.message });

  return res.status(201).send({ message: "success" });
}

export async function rename(req: Request, res: Response) {
  let body = req.body as IRenameCredential;
  if (body.username === undefined)
    return res.status(200).send({ message: "invalid body" });

  let _id = ObjectId.createFromHexString(res.locals.userId);
  let renameQuery = MongoDB.db()
    .collection<IRenameCredential>("users")
    .findOneAndUpdate(
      { _id },
      {
        $set: {
          username: body.username,
        },
      }
    );

  let { error: userErr, value: renameUser } = await PromiseGuard(renameQuery);
  if (userErr !== undefined)
    return res.status(500).send({ message: userErr.message });

  return res.status(200).send({ message: "success" });
}
