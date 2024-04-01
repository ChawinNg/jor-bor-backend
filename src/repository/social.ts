import { ObjectId } from "mongodb";
import { IReturn, PromiseGuard } from "../utils/error";
import { MongoDB } from "../database/mongo";
import { IRequestingFriend, IUser, SocialStatus } from "../models/user";

export async function requestFriendRepo(
  userId: ObjectId,
  friendId: ObjectId,
  status: SocialStatus
): Promise<IReturn<IUser | null>> {
  let updateFriendQuery = MongoDB.db()
    .collection<IUser>("users")
    .findOneAndUpdate(
      { _id: userId },
      {
        $addToSet: {
          friends: {
            user_id: friendId,
            status,
          },
        },
      }
    );
  return await PromiseGuard(updateFriendQuery);
}

export async function getRequestingFriendsRepo(
  _id: ObjectId
): Promise<IReturn<IRequestingFriend[]>> {
  let getAllRequestingFriendsQuery = MongoDB.db()
    .collection<IUser>("users")
    .aggregate([
      { $match: { _id } },
      { $unwind: "$friends" },
      { $match: { "friends.status": "REQUEST" } },
      {
        $lookup: {
          from: "users",
          localField: "friends.user_id",
          foreignField: "_id",
          as: "result",
        },
      },
      { $unwind: "$result" },
      {
        $project: {
          _id: "$result._id",
          username: "$result.username",
        },
      },
    ])
    .toArray()
    .then((docs) =>
      docs.map(
        (doc) =>
          ({
            _id: doc._id,
            username: doc["username"],
          } as IRequestingFriend)
      )
    );

  return PromiseGuard(getAllRequestingFriendsQuery);
}
