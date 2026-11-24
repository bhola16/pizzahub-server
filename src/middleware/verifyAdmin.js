
import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

export const verifyAdmin = async (req, res, next) => {
    try {
        const userId = req.user?.sub;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Authentication required.",
            });
        }

        const conditions = [
            { id: userId },
            { _id: userId },
        ];

        if (ObjectId.isValid(userId)) {
            conditions.push({ _id: new ObjectId(userId) });
        }

        const db = getDB();

        const admin = await db.collection("user").findOne({
            $or: conditions,
        });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "User account not found.",
            });
        }

        if (admin.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Forbidden. Admin access required.",
            });
        }

        req.dbUser = admin;
        req.admin = admin;

        next();
    } catch (error) {
        console.error("Admin authorization error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};
