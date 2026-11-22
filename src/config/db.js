
import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from environment variables");
}

const client = new MongoClient(process.env.MONGODB_URI);

let database;

export async function connectToMongoDB() {
    try {
        await client.connect();

        database = client.db("pizzahub");

        console.log("You successfully connected to MongoDB!");

        return database;
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        throw error;
    }
}

export function getDB() {
    if (!database) {
        throw new Error("Database is not connected yet.");
    }

    return database;
}
