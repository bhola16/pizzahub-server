
import cors from "cors";
import "dotenv/config";
import express from "express";
import { MongoClient } from "mongodb";

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB
if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from environment variables");
}

const client = new MongoClient(process.env.MONGODB_URI);

const database = client.db("pizzahub");

export async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");
        return database;
    } catch (err) {
        console.error("MongoDB connection failed:", err);
        throw err;
    }
}

// Routes
app.get("/", (req, res) => {
    res.send("Pizza-Hub is running!");
});

// Start Server
async function startServer() {
    try {
        await connectToMongoDB();

        app.listen(port, () => {
            console.log(`Pizza-Hub is listening on port ${port}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
}

startServer();
