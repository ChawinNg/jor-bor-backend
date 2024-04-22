import { ObjectId } from "mongodb";
import { IPlayer } from "./player";
import { Role } from "./player";

export interface IGame {
    _id: ObjectId;
    players: IPlayer[];
    villagers: IPlayer[];
    werewolves: IPlayer[];
    seers: IPlayer[];
    totalPlayers: number;
    villager_side_left: number;
    werewolf_side_left: number;
}