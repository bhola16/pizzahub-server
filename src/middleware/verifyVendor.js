
import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

export const verifyVendor = async (req, res, next) => {
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

        const vendor = await db.collection("user").findOne({
            $or: conditions,
        });

        if (!vendor) {
            return res.status(401).json({
                success: false,
                message: "User account not found.",
            });
        }

        if (vendor.role !== "vendor") {
            return res.status(403).json({
                success: false,
                message: "Forbidden. Vendor access required.",
            });
        }

        req.dbUser = vendor;
        req.vendor = vendor;

        next();
    } catch (error) {
        console.error("Vendor authorization error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};
