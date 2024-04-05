import { Socket } from "socket.io";
import { parseCookie } from "../utils/cookie";

let conn: { [key: string]: Socket } = {};

export function userSocket(userId: string): Socket | undefined {
  return conn[userId];
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
