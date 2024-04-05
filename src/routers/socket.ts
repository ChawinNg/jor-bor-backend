import { Socket } from "socket.io";

let conn: { [key: string]: Socket } = {};

export function onSocketConnect(socket: Socket) {
  conn[socket.id] = socket;

  console.log("Connection", socket.id);

  socket.emit("hello", "world");

  socket.conn.on("close", () => {
    console.log("Disconnect", socket.id);
    delete conn[socket.id];
  });
}
