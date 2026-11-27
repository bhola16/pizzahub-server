
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URL;

if (!uri) {
    throw new Error("MONGODB_URL is missing from environment variables");
}

const globalForMongo = globalThis;

export const client =
    globalForMongo.mongoClient ||
    new MongoClient(uri, {
        maxPoolSize: 10,
        minPoolSize: 0,
        maxIdleTimeMS: 0,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
    });

globalForMongo.mongoClient = client;

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
