import { MongoClient } from "mongodb";

const dbName = process.env.MONGODB_DB || "speaking_lab";

// Lazily create the MongoClient/connection promise. Doing this eagerly at
// module scope breaks `next build`, which imports route modules to collect
// page data even when MONGODB_URI isn't set yet (e.g. in CI before env vars
// are configured).
let clientPromise = null;

function createClientPromise() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to your environment variables (see .env.example)."
    );
  }

  const client = new MongoClient(uri);

  if (process.env.NODE_ENV === "development") {
    // Reuse the client across HMR reloads in dev so we don't open a new
    // connection on every file save.
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  return client.connect();
}

function getClientPromise() {
  if (!clientPromise) {
    clientPromise = createClientPromise();
  }
  return clientPromise;
}

export async function getDb() {
  const client = await getClientPromise();
  return client.db(dbName);
}

export async function getScoresCollection() {
  const db = await getDb();
  return db.collection("scores");
}
