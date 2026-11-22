import "dotenv/config";
import app from "./app.js";
import { connectToMongoDB } from "./config/db.js";

const port = process.env.PORT || 8000;


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