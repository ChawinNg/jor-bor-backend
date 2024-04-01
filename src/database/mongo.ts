import { Db, MongoClient } from "mongodb";

export class MongoDB {
  private static dbClient: Db;

  private constructor() {}
  public static async connect(uri: string, database: string) {
    try {
      let client = new MongoClient(uri);
      await client.connect();

      this.dbClient = client.db(database);
    } catch (err) {
      throw err;
    }
  }

  public static db(): Db {
    return this.dbClient;
  }
}
