
import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URL) {
    throw new Error("MONGODB_URL is missing from environment variables");
}

export const client = new MongoClient(process.env.MONGODB_URL);

export const db = client.db("pizzahub");

export async function connectToMongoDB() {
    try {
        await client.connect();

        console.log("You successfully connected to MongoDB!");

        return db;
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        throw error;
    }
}

export function getDB() {
    return db;
}
