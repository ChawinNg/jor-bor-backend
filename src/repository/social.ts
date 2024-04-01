import { ObjectId } from "mongodb";
import { IReturn, PromiseGuard } from "../utils/error";
import { MongoDB } from "../database/mongo";
import { IUser } from "../models/user";

export async function requestFriend(
  userId: ObjectId,
  friendId: ObjectId
): Promise<IReturn<IUser | null>> {
  let updateFriendQuery = MongoDB.db()
    .collection<IUser>("users")
    .findOneAndUpdate(
      { _id: userId },
      {
        $push: {
          friends: {
            user_id: friendId,
            status: "REQUEST",
          },
        },
      }
    );
  return await PromiseGuard(updateFriendQuery);
}
