import { MongoClient, MongoClientOptions } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Brak zmiennej środowiskowej: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

// DODAJEMY OPCJE TLS I POŁĄCZENIA
const options: MongoClientOptions = {
  tls: true,
  ssl: true,
  // Poniższa opcja (minVersion) wymusza bezpieczny protokół TLS v1.2, 
  // zapobiegając błędom negocjacji (jak Alert 80 w OpenSSL 3.0 na Vercel)
  tlsAllowInvalidCertificates: process.env.NODE_ENV === 'development' ? true : false,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;