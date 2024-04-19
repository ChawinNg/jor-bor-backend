import { ObjectId } from "mongodb";
import { PromiseGuard } from "../utils/error";
import { ILobby } from "../models/lobby";
import { MongoDB } from "../database/mongo";
import { IUser } from "../models/user";
import { getUserByIdRepo } from "./user";
import { error } from "console";

export async function getAllLobbiesRepo() {
  let query = MongoDB.db().collection<ILobby>("lobbies").find().toArray();
  return PromiseGuard(query);
}

export async function getLobbyByIdRepo(lobbyId: ObjectId) {
  let query = MongoDB.db()
    .collection<ILobby>("lobbies")
    .findOne({ _id: lobbyId });

  return PromiseGuard(query);
}

export async function getLobbyByCodeRepo(lobby_code: string) {
  let query = MongoDB.db()
    .collection<ILobby>("lobbies")
    .findOne({ lobby_code: lobby_code });

  return PromiseGuard(query);
}

export async function createLobbyRepo(ownerId: ObjectId, lobbyInfo: ILobby) {
  const owner = await getUserByIdRepo(ownerId);
  console.log(owner)
  let lobby: ILobby = {
    ...lobbyInfo,
    _id: ownerId,
    players: [
      {
        _id: ownerId,
        player_name: owner.value?.username,
        is_ready: false,
      },
    ],
  };
  let query = MongoDB.db().collection<ILobby>("lobbies").insertOne(lobby);
  return PromiseGuard(query);
}

export async function deleteLobbyRepo(userId: ObjectId) {
  let query = MongoDB.db()
    .collection<ILobby>("lobbies")
    .findOneAndDelete({ _id: userId });

  return PromiseGuard(query);
}

export async function setUserLobbyRepo(userId: ObjectId, lobbyId: ObjectId) {
  let query = MongoDB.db()
    .collection<IUser>("users")
    .findOneAndUpdate({ _id: userId }, { $set: { lobby_id: lobbyId } });

  return PromiseGuard(query);
}

export async function unsetUserLobbyRepo(userId: ObjectId) {
  let query = MongoDB.db()
    .collection<IUser>("users")
    .findOneAndUpdate({ _id: userId }, { $unset: { lobby_id: 1 } });

  return PromiseGuard(query);
}

export async function joinLobbyRepo(userId: ObjectId, lobbyId: ObjectId) {
  const user = await getUserByIdRepo(userId);
  console.log(user);
  let query = MongoDB.db()
  .collection<ILobby>("lobbies")
  .updateOne(
    { _id: lobbyId },
    {
      $addToSet: {
        players: {
          _id: userId,
          player_name: user.value?.username,
          is_ready: false,
        },
      },
    }
  );
  return PromiseGuard(query);
}

export async function leaveLobbyRepo(userId: ObjectId, lobbyId: ObjectId) {
  let query = MongoDB.db()
    .collection<ILobby>("lobbies")
    .findOneAndUpdate(
      { _id: lobbyId },
      {
        $pull: {
          players: {
            _id: userId,
          },
        },
      }
    );

  return PromiseGuard(query);
}

export async function setReadyStatusRepo(
  userId: ObjectId,
  lobbyId: ObjectId,
  isReady: boolean
) {
  let query = MongoDB.db()
    .collection<ILobby>("lobbies")
    .findOneAndUpdate(
      { _id: lobbyId, "players._id": userId },
      {
        $set: {
          "players.$.is_ready": isReady,
        },
      }
    );

  return PromiseGuard(query);
}
