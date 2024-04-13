import { CreatingMessage, DirectHeader, LobbyHeader, Message } from "../models/message";
import { MongoDB } from "../database/mongo";
import { PromiseGuard } from "../utils/error";

export async function createMessageRepo(
  messageHeader: LobbyHeader | DirectHeader,
  content: string
) {
  let message: CreatingMessage = {
    ...messageHeader,
    content,
    sent_at: new Date(Date.now()),
  };

  let query = MongoDB.db().collection<CreatingMessage>("messages").insertOne(message);
  return PromiseGuard(query);
}

export async function getAllMessagesRepo(messageHeader: LobbyHeader | DirectHeader) {
  let query = MongoDB.db().collection<Message>("messages").find(messageHeader).toArray();
  return PromiseGuard(query);
}
