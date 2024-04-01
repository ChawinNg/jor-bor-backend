import { ObjectId } from "mongodb";

export interface IUserCredential {
  username: string;
  password: string;
}

export interface IUser {
  _id: ObjectId;
  username: string;
  password: string;
  score: number;
}
