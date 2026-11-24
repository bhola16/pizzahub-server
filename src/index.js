import "dotenv/config";
import { connectToMongoDB } from "./config/db.js";

const startServer = async () => {
    try {
        await connectToMongoDB();

        const { default: app } = await import("./app.js");

        const PORT = process.env.PORT || 8000;

        app.listen(PORT, () => {
            console.log(`Server running on PORT: ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed: ", error);
        process.exit(1);
    }
};


startServer();