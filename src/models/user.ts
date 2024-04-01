import { ObjectId } from "mongodb";

export type SocialStatus = "REQUEST" | "PENDING" | "ACCEPTED";

export interface ILoginCredential {
  username: string;
  password: string;
}

export interface IRegisterCredential {
  username: string;
  password: string;
  score: number;
  friends: {
    user_id: ObjectId;
    status: SocialStatus;
  }[];
}

export interface IRenameCredential {
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
