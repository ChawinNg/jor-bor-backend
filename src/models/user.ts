import { ObjectId } from "mongodb";

export interface ILoginCredential {
  username: string;
  password: string;
}

export interface IRegisterCredential {
  username: string;
  password: string;
  score: number;
}

export interface IUser {
  _id: ObjectId;
  username: string;
  password: string;
  score: number;
}
