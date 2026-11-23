import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { getDB } from "../config/db.js";

export const requireVendor = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session?.user?.email) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const db = getDB();

        const vendor = await db.collection("user").findOne({
            email: session.user.email,
            role: "vendor",
        });

        if (!vendor) {
            return res.status(403).json({
                success: false,
                message: "Vendor access required.",
            });
        }

        req.vendor = vendor;
        req.user = session.user;

        next();
    } catch (error) {
        console.error("Require vendor middleware error:", error);

        return res.status(500).json({
            success: false,
            message: "Vendor authentication failed.",
        });
    }
};