import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { Guard } from "../utils/error";
import { requestFriend } from "../repository/social";

export async function addFriend(req: Request, res: Response) {
  let _idUser = ObjectId.createFromHexString(res.locals.userId);

  let { error: _idErr, value: _idFriend } = Guard<ObjectId>(() => {
    return ObjectId.createFromHexString(req.params.userId);
  });
  if (_idErr !== undefined)
    return res.status(400).send({ message: "invalid user id" });

  let { error: friendErr, value: updatedFriend } = await requestFriend(
    _idFriend,
    _idUser
  );
  if (updatedFriend === null)
    return res.status(404).send({ message: "user not found" });
  else if (friendErr !== undefined)
    return res.status(500).send({ message: friendErr.message });

  let { error: userErr, value: updatedUser } = await requestFriend(
    _idUser,
    _idFriend
  );
  if (updatedUser === null)
    return res.status(404).send({ message: "user not found" });
  else if (userErr !== undefined)
    return res.status(500).send({ message: userErr.message });

  return res.status(200).send({ message: "success" });
}
