import { Server, Socket } from "socket.io";
import { parseCookie } from "../utils/cookie";
import { getLobbyByIdRepo } from "../repository/lobby";
import { ObjectId } from "mongodb";

let conn: { [key: string]: Socket } = {};

let i: number = 0;

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
  console.log(socket.request.headers.cookie)
  let cookies = parseCookie(socket.request.headers.cookie || "");
  if (!cookies["session"]) {
    console.log("no cookies")
    socket.disconnect();
    return;
  }

  console.log('cookie verified')
  console.log("Connection:", socket.id);
  conn[cookies["session"]] = socket;

  socket.on("custom_event", (data: any) => {
    console.log("Data: ", data)
  })

  socket.conn.on("custom_event", (data: any) => {
    console.log("Data: ", data);
  })

  socket.conn.on("session", (arg) => {
    console.log(arg);
  });

  socket.conn.on("close", () => {
    console.log("Disconnect:", socket.id);
    delete conn[socket.id];
  });

  
}
