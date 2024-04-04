import { ObjectId } from "mongodb";

export interface ILobby {
  _id: ObjectId;
  lobby_owner: ObjectId;
  name: string;
  max_player: number;
  is_public: boolean;
  players: {
    _id: ObjectId;
    is_ready: boolean;
  }[];
}
