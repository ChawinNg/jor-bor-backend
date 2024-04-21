import { MongoDB } from "../database/mongo";
import { PromiseGuard } from "../utils/error";

export async function saveMessageRepo(message: any) {
  let query = MongoDB.db().collection("messages").insertOne(message);

  return PromiseGuard(query);
}

export async function getMessagesRepo(user: any, to: any) {
  let query = MongoDB.db()
    .collection("messages")
    .find({
      $or: [
        { user, to },
        { user: to, to: user },
      ],
    })
    .toArray();

  return PromiseGuard(query);
}

export async function getLobbyMessagesRepo(lobby_id: any) {
  let query = MongoDB.db().collection("messages").find({ lobby_id }).toArray();

  return PromiseGuard(query);
}
