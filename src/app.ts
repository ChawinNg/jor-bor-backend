import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "../.env") });

import express, { Express } from "express";
import cors from "cors";
import { login } from "./controllers/auth";
import { Return } from "./utils/async";
import { MongoDB } from "./database/mongo";

async function main() {
  const app: Express = express();

  const PORT = process.env.PORT || 3000;
  const MONGO_URI = process.env.MONGO_URI || "";

  let dbConnect = MongoDB.connect(MONGO_URI, "database");
  let { error: dbErr } = await Return(dbConnect);
  if (dbErr !== undefined) {
    console.error("[server] Failed to connect to MongoDB:", dbErr);
    process.exit();
  }

  app.use(cors());
  app.use(express.json());

  const api = express.Router();
  api.post("/auth/login", login);

  app.use("/api", api);

  app.listen(PORT, () => {
    console.log(`[server] Server is running at http://localhost:${PORT}`);
  });
}

main();
