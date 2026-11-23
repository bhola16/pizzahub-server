
import express from "express";
import cors from "cors";

import adminRoutes from "./routes/admin.routes.js";
import menuRoutes, { vendorRouter } from "./routes/menu.routes.js";
import orderRoutes from "./routes/order.routes.js";

import {
    vendorRouter as vendorDashboardRoutes,
    customerRouter as customerDashboardRoutes,
} from "./routes/dashboard.routes.js";

import paymentRoutes from "./routes/payment.routes.js";
import { stripeWebhook } from "./controllers/payment.controller.js";
import { connectToMongoDB } from "./config/db.js";

const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

// Connect to MongoDB before handling requests.
// This middleware does not consume the request body.
app.use(async (req, res, next) => {
    try {
        await connectToMongoDB();
        next();
    } catch (error) {
        console.error("MongoDB connection error:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed.",
        });
    }
});

// Stripe webhook MUST be before express.json()
app.post(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    stripeWebhook
);

app.use(express.json());

// Payment routes
app.use("/api/payments", paymentRoutes);

// Existing routes
app.use("/admin", adminRoutes);
app.use("/menuItems", menuRoutes);
app.use("/vendor-menu-items", vendorRouter);
app.use("/orders", orderRoutes);

app.use("/vendor-dashboard", vendorDashboardRoutes);
app.use("/customer-dashboard", customerDashboardRoutes);

// Home route
app.get("/", (req, res) => {
    res.send("Pizza-Hub is running!");
});

export default app;
