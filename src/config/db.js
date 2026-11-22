
import { MongoClient } from "mongodb";

let client;
let db;
let connectionPromise;

function initializeDatabase() {
    const uri = process.env.MONGODB_URL;

    if (!uri) {
        throw new Error("MONGODB_URL is missing from environment variables");
    }

    if (!client) {
        client = new MongoClient(uri);
        db = client.db("pizzahub");
    }
}

export { client, db };

export async function connectToMongoDB() {
    initializeDatabase();

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
    if (!db) {
        initializeDatabase();
    }

    return db;
}
