import { Socket } from "socket.io";
import { parseCookie } from "../utils/cookie";
import { getLobbyByIdRepo } from "../repository/lobby";
import { ObjectId } from "mongodb";

let conn: { [key: string]: Socket } = {};

export function sendMessage(
  userId: ObjectId,
  channelName: string,
  message: string
) {
  let id = userId.toString();
  if (!conn[id]) return;
  conn[id].conn.emit(channelName, message);
}

export async function broadcastLobby(
  lobbyId: ObjectId,
  channelName: string,
  message: string
) {
  let { error: err, value: lobby } = await getLobbyByIdRepo(lobbyId);
  if (err !== undefined || lobby === null)
    console.error("could not broadcast over lobby", err);

  lobby!.players.forEach((user) => {
    sendMessage(user._id, channelName, message);
  });
}

export function onSocketConnect(socket: Socket) {
  let cookies = parseCookie(socket.request.headers.cookie || "");
  if (!cookies["session"]) {
    socket.disconnect();
    return;
  }

  console.log("Connection", socket.id);
  conn[cookies["session"]] = socket;

  socket.conn.on("session", (arg) => {
    console.log(arg);
  });

  socket.conn.on("close", () => {
    console.log("Disconnect", socket.id);
    delete conn[socket.id];
  });
}
