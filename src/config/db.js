
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URL;

if (!uri) {
    throw new Error("MONGODB_URL is missing from environment variables");
}

export const client = new MongoClient(uri);
export const db = client.db("pizzahub");

let connectionPromise;

export async function connectToMongoDB() {
    if (!connectionPromise) {
        connectionPromise = client.connect()
            .then(() => {
                console.log("Successfully connected to MongoDB!");
                return db;
            })
            .catch((error) => {
                connectionPromise = null;
                console.error("MongoDB connection failed:", error);
                throw error;
            });
    }

    return connectionPromise;
}

export function getDB() {
    return db;
}
