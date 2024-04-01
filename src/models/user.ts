import { ObjectId } from "mongodb";

export type SocialStatus = "REQUEST" | "PENDING" | "ACCEPTED";

export interface IUserCredential {
  username: string;
  password: string;
}

export interface IRenameCredential {
  username: string;
}

export interface IRequestingFriend {
  _id: ObjectId;
  username: string;
}

export interface IUser {
  _id: ObjectId;
  username: string;
  password: string;
  score: number;
  friends: {
    user_id: ObjectId;
    status: SocialStatus;
  }[];
}
