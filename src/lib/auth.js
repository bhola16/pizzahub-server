
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";

import { db, client } from "../config/db.js";
import { jwt } from "better-auth/plugins";



export const auth = betterAuth({
    database: mongodbAdapter(db, {
        client,
    }),

    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,

    trustedOrigins: [
        process.env.CLIENT_URL,
    ],

    emailAndPassword: {
        enabled: true,
    },


    plugins: [
        jwt(),
    ],

    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "customer",
                input: false,
            },
            subscriptionPlan: {
                type: "string",
                required: false,
                defaultValue: "free",
                input: false,
            },
        },
    },
});
