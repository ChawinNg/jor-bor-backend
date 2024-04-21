import { MongoDB } from "../database/mongo";
import { PromiseGuard } from "../utils/error";

export async function saveMessageRepo(message: any) {
  let query = MongoDB.db().collection("messages").insertOne(message);

  return PromiseGuard(query);
}
