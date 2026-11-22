
import "dotenv/config";
import app from "./app.js";
import { connectToMongoDB } from "./config/db.js";

const PORT = process.env.PORT || 8000;


const startServer = async () => {
    try {
        await connectToMongoDB();

        app.listen(PORT, () => {
            console.log(
                `Server running on http://localhost:${PORT}`
            );
        });

    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
};

startServer();
