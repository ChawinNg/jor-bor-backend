import { ObjectId } from "mongodb";

export type LobbyHeader = {
  lobby_id: ObjectId;
};

export type DirectHeader = {
  sender_id: ObjectId;
  receiver_id: ObjectId;
};

export type Message = {
  _id: ObjectId;
  content: string;
  sent_at: Date;
} & (LobbyHeader | DirectHeader);

export type CreatingMessage = {
  content: string;
  sent_at: Date;
} & (LobbyHeader | DirectHeader);
