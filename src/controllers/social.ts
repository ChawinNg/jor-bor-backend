import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { Guard } from "../utils/error";
import {
  getRequestingFriendsRepo,
  requestFriendRepo,
  updateSocialStatusRepo,
} from "../repository/social";
import { ifError } from "assert";

export async function requestFriend(req: Request, res: Response) {
  let _idUser = ObjectId.createFromHexString(res.locals.userId);

  let { error: _idErr, value: _idFriend } = Guard<ObjectId>(() => {
    return ObjectId.createFromHexString(req.params.userId);
  });
  if (_idErr !== undefined)
    return res.status(400).send({ message: "invalid user id" });

  let { error: friendErr, value: updatedFriend } = await requestFriendRepo(
    _idFriend,
    _idUser,
    "REQUEST"
  );
  if (updatedFriend === null)
    return res.status(404).send({ message: "user not found" });
  else if (friendErr !== undefined)
    return res.status(500).send({ message: friendErr.message });

  let { error: userErr, value: updatedUser } = await requestFriendRepo(
    _idUser,
    _idFriend,
    "PENDING"
  );
  if (updatedUser === null)
    return res.status(404).send({ message: "user not found" });
  else if (userErr !== undefined)
    return res.status(500).send({ message: userErr.message });

  return res.status(200).send({ message: "success" });
}

export async function getRequestingFriends(req: Request, res: Response) {
  let _id = ObjectId.createFromHexString(res.locals.userId);

  let { error: queryErr, value: friends } = await getRequestingFriendsRepo(_id);
  if (queryErr !== undefined)
    return res.status(500).send({ message: queryErr.message });

  return res
    .status(200)
    .send(friends.map((val) => ({ id: val._id, username: val.username })));
}

export async function acceptFriend(req: Request, res: Response) {
  let _id = ObjectId.createFromHexString(res.locals.userId);

  let { error: _idErr, value: _idFriend } = Guard<ObjectId>(() => {
    return ObjectId.createFromHexString(req.params.userId);
  });
  if (_idErr !== undefined)
    return res.status(400).send({ message: "invalid user id" });

  let { error: userQueryErr } = await updateSocialStatusRepo(
    _id,
    _idFriend,
    "REQUEST",
    "ACCEPTED"
  );
  if (userQueryErr !== undefined)
    return res.status(500).send({ message: userQueryErr.message });

  let { error: friendQueryErr } = await updateSocialStatusRepo(
    _idFriend,
    _id,
    "PENDING",
    "ACCEPTED"
  );
  if (friendQueryErr !== undefined)
    return res.status(500).send({ message: friendQueryErr.message });

  return res.status(200).send({ message: "success" });
}
