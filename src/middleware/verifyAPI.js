import { createRemoteJWKSet, jwtVerify } from "jose";

const AUTH_URL = process.env.CLIENT_URL;

const JWKS = createRemoteJWKSet(
    new URL(`${AUTH_URL}/api/auth/jwks`)
);

export const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    console.log(authHeader)

    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized. Please provide a valid Bearer token.",
        });
    }

    const token = authHeader.slice(7);

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