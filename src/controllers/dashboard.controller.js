
import { getDB } from "../config/db.js";

// Vendor dashboard
export const getVendorDashboard = async (req, res) => {
    try {
        const vendorEmail = decodeURIComponent(req.params.email)
            .trim()
            .toLowerCase();

        const database = getDB();

        const [menuItems, orders, vendor] = await Promise.all([
            database.collection("menuItems").find({ vendorEmail }).toArray(),

            database.collection("orders").find({ vendorEmail }).toArray(),

            database.collection("user").findOne({ email: vendorEmail }),
        ]);

        const totalMenuItems = menuItems.length;

        const activeMenuItems = menuItems.filter(
            (item) =>
                item.status?.toLowerCase() === "approved" &&
                item.isActive === true
        ).length;

        const pendingOrders = orders.filter(
            (order) => order.status?.toLowerCase() === "pending"
        ).length;

        const acceptedOrders = orders.filter(
            (order) => order.status?.toLowerCase() === "accepted"
        ).length;

        res.status(200).json({
            success: true,
            totalMenuItems,
            activeMenuItems,
            pendingOrders,
            acceptedOrders,
            subscriptionPlan: vendor?.subscriptionPlan || "free",
            subscriptionStatus: vendor?.subscriptionStatus || "inactive",
        });
    } catch (error) {
        console.error("Vendor dashboard error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch vendor dashboard data.",
        });
    }
};

// Shared customer dashboard calculation
const getCustomerDashboardData = async (customerEmail) => {
    const orders = await getDB()
        .collection("orders")
        .find({ customerEmail })
        .sort({ createdAt: -1 })
        .toArray();

    return {
        success: true,
        totalOrders: orders.length,
        pendingOrders: orders.filter(
            (order) => order.status?.toLowerCase() === "pending"
        ).length,
        acceptedOrders: orders.filter(
            (order) => order.status?.toLowerCase() === "accepted"
        ).length,
        rejectedOrders: orders.filter(
            (order) => order.status?.toLowerCase() === "rejected"
        ).length,
    };
};

// Customer dashboard GET
export const getCustomerDashboard = async (req, res) => {
    try {
        const customerEmail = decodeURIComponent(req.params.email)
            .trim()
            .toLowerCase();

        const dashboardData =
            await getCustomerDashboardData(customerEmail);

        res.status(200).send(dashboardData);
    } catch (error) {
        console.error("Customer dashboard error:", error);

        res.status(500).send({
            success: false,
            message: "Failed to fetch customer dashboard data.",
        });
    }
};

// Customer dashboard POST
export const postCustomerDashboard = async (req, res) => {
    try {
        const customerEmail = req.body.email?.trim().toLowerCase();

        if (!customerEmail) {
            return res.status(400).send({
                success: false,
                message: "Customer email is required.",
            });
        }

        const dashboardData =
            await getCustomerDashboardData(customerEmail);

        res.status(200).send(dashboardData);
    } catch (error) {
        console.error("Customer dashboard error:", error);

        res.status(500).send({
            success: false,
            message: "Failed to fetch customer dashboard data.",
        });
    }
};
