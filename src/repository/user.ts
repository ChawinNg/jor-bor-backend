import { ObjectId } from "mongodb";
import { PromiseGuard } from "../utils/error";
import { MongoDB } from "../database/mongo";
import { IUser } from "../models/user";

export async function getUserByIdRepo(userId: ObjectId) {
  let query = MongoDB.db().collection<IUser>("users").findOne({ _id: userId });
  return PromiseGuard(query);
}
