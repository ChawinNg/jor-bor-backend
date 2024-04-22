import { ObjectId } from "mongodb";

export interface ILobby {
  _id: ObjectId;
  name: string;
  max_player: number;
  is_public: boolean;
  lobby_code: string | undefined;
  players: {
    _id: ObjectId;
    player_name: string | undefined;
    is_ready: boolean;
  }[];
}
