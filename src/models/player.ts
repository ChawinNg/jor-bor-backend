import { ObjectId } from "mongodb";

export enum Role {
    Werewolf,
    Villager,
    Seer,
    // add more roles here
}

export interface IPlayer {
    _id: ObjectId;
    name: string;
    role: Role;
    alive: boolean;
}