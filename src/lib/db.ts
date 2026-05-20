import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Brak zmiennej środowiskowej: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // W trybie deweloperskim używamy zmiennej globalnej, 
  // aby zachować połączenie przy Hot Module Replacement (HMR).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // W produkcji najlepiej nie używać zmiennej globalnej.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;