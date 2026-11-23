
import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

export const verifyCustomer = async (req, res, next) => {
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

        const customer = await db.collection("user").findOne({
            $or: conditions,
        });

        if (!customer) {
            return res.status(401).json({
                success: false,
                message: "User account not found.",
            });
        }

        if (customer.role !== "customer") {
            return res.status(403).json({
                success: false,
                message: "Forbidden. Customer access required.",
            });
        }

        req.dbUser = customer;
        req.customer = customer;
        
        next();
    } catch (error) {
        console.error("Customer authorization error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};
