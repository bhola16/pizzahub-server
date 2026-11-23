
import { createRemoteJWKSet, jwtVerify } from "jose";

const CLIENT_URL = process.env.CLIENT_URL;

const JWKS = createRemoteJWKSet(
    new URL(`${CLIENT_URL}/api/auth/jwks`)
);

export const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;


    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized. Please provide a valid Bearer token.",
        });
    }


    const token = authHeader.split(" ")[1];
    


    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized. Token is missing.",
        });
    }

    try {
        const { payload } = await jwtVerify(token, JWKS);


        if (!payload.sub) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token.",
            });
        }

        req.user = payload;

        next();
    } catch (error) {
        console.error("Token verification error:", error);


        return res.status(401).json({
            success: false,
            message: "Invalid or expired token.",
        });
    }
};
