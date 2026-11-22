import express from "express";
import cors from "cors";
import adminRoutes from "./routes/admin.routes.js";
import menuRoutes, { vendorRouter } from "./routes/menu.routes.js";
import orderRoutes from "./routes/order.routes.js";
import {
    vendorRouter as vendorDashboardRoutes,
    customerRouter as customerDashboardRoutes,
} from "./routes/dashboard.routes.js";





const app = express();

const origin_url = process.env.CLIENT_URL;

// Middleware
app.use(
    cors({
        origin: origin_url,
        credentials: true,
    })
);

app.use(express.json());






// Routes
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