import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "../.env") });

import express, { Express } from "express";
import { connect } from "./database/mongo";
import { Db } from "mongodb";
import { Return } from "./utils/async";

async function main() {
  const app: Express = express();

  const PORT = process.env.PORT || 3000;
  const MONGO_URI = process.env.MONGO_URI || "";

  let { value: db, error: dbErr } = await Return<Db>(
    connect(MONGO_URI, "database")
  );
  if (dbErr !== undefined) {
    console.error("[server] Failed to connect to MongoDB");
    process.exit();
  }

  app.listen(PORT, () => {
    console.log(`[server] Server is running at http://localhost:${PORT}`);
  });
}

main();
