
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

// Escape special regex characters in search input
const escapeRegex = (value) =>
    String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ==========================================
// GET ALL USERS
// ==========================================

export const getAllUsers = async (req, res) => {
    try {
        const { search = "", role = "all" } = req.query;

        const query = {};

        if (String(search).trim()) {
            const searchRegex = new RegExp(
                escapeRegex(search.trim()),
                "i"
            );

            query.$or = [
                { name: searchRegex },
                { email: searchRegex },
            ];
        }

        if (["admin", "vendor", "customer"].includes(role)) {
            query.role = role;
        }

        const users = await getDB()
            .collection("user")
            .find(query)
            .project({
                name: 1,
                email: 1,
                image: 1,
                role: 1,
                createdAt: 1,
                isBlocked: 1,
                subscriptionPlan: 1,
            })
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json({
            success: true,
            count: users.length,
            data: users.map((user) => ({
                ...user,
                _id: user._id.toString(),
                role: user.role || "customer",
                isBlocked: user.isBlocked || false,
            })),
        });
    } catch (error) {
        console.error("Fetch users error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch users.",
        });
    }
};

// ==========================================
// BLOCK USER
// ==========================================

export const blockUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID.",
            });
        }

        const users = getDB().collection("user");

        const user = await users.findOne({
            _id: new ObjectId(id),
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        if (user.role === "admin") {
            return res.status(403).json({
                success: false,
                message: "Admin accounts cannot be blocked.",
            });
        }

        if (user.isBlocked === true) {
            return res.status(200).json({
                success: true,
                message: "User is already blocked.",
            });
        }

        await users.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    isBlocked: true,
                    updatedAt: new Date(),
                },
            }
        );

        res.status(200).json({
            success: true,
            message: "User blocked successfully.",
        });
    } catch (error) {
        console.error("Block user error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to block user.",
        });
    }
};

// ==========================================
// UNBLOCK USER
// ==========================================

export const unblockUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID.",
            });
        }

        const users = getDB().collection("user");

        const result = await users.updateOne(
            {
                _id: new ObjectId(id),
                isBlocked: true,
            },
            {
                $set: {
                    isBlocked: false,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            const userExists = await users.findOne({
                _id: new ObjectId(id),
            });

            return res.status(userExists ? 200 : 404).json({
                success: Boolean(userExists),
                message: userExists
                    ? "User is already unblocked."
                    : "User not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: "User unblocked successfully.",
        });
    } catch (error) {
        console.error("Unblock user error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to unblock user.",
        });
    }
};

// ==========================================
// GET ALL MENU ITEMS
// ==========================================

export const getAllMenuItems = async (req, res) => {
    try {
        const {
            search = "",
            category = "all",
            status = "all",
        } = req.query;

        const query = {};

        if (String(search).trim()) {
            const searchRegex = new RegExp(
                escapeRegex(search.trim()),
                "i"
            );

            query.$or = [
                { name: searchRegex },
                { vendorName: searchRegex },
                { vendorEmail: searchRegex },
            ];
        }

        if (category !== "all") {
            query.category = String(category);
        }

        if (status !== "all") {
            query.status = String(status);
        }

        const items = await getDB()
            .collection("menuItems")
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json({
            success: true,
            count: items.length,
            data: items.map((item) => ({
                ...item,
                _id: item._id.toString(),
            })),
        });
    } catch (error) {
        console.error("Admin menu items error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch menu items.",
        });
    }
};

// ==========================================
// APPROVE OR REJECT MENU ITEM
// ==========================================

export const reviewMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (
            !ObjectId.isValid(id) ||
            !["approved", "rejected"].includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid menu item information.",
            });
        }

        const result = await getDB()
            .collection("menuItems")
            .updateOne(
                {
                    _id: new ObjectId(id),
                    status: "pending",
                },
                {
                    $set: {
                        status,
                        isActive: status === "approved",
                        reviewedAt: new Date(),
                        updatedAt: new Date(),
                    },
                }
            );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Pending menu item not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: `Menu item ${status} successfully.`,
        });
    } catch (error) {
        console.error("Review menu item error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to review menu item.",
        });
    }
};

// ==========================================
// UPDATE MENU ITEM AVAILABILITY
// ==========================================

export const updateMenuAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (
            !ObjectId.isValid(id) ||
            typeof isActive !== "boolean"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid menu item information.",
            });
        }

        const result = await getDB()
            .collection("menuItems")
            .updateOne(
                {
                    _id: new ObjectId(id),
                    status: "approved",
                },
                {
                    $set: {
                        isActive,
                        updatedAt: new Date(),
                    },
                }
            );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Approved menu item not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: `Menu item ${isActive ? "activated" : "deactivated"
                } successfully.`,
        });
    } catch (error) {
        console.error("Update menu availability error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update menu item availability.",
        });
    }
};

// ==========================================
// DELETE MENU ITEM
// ==========================================

export const deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid menu item ID.",
            });
        }

        const result = await getDB()
            .collection("menuItems")
            .deleteOne({
                _id: new ObjectId(id),
            });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Menu item deleted successfully.",
        });
    } catch (error) {
        console.error("Delete menu item error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete menu item.",
        });
    }
};

// ==========================================
// ADMIN DASHBOARD STATISTICS
// ==========================================

export const getAdminDashboardStats = async (req, res) => {
    try {
        const users = getDB().collection("user");
        const menuItems = getDB().collection("menuItems");

        const [
            totalUsers,
            totalVendors,
            totalCustomers,
            totalMenuItems,
            pendingMenuItems,
        ] = await Promise.all([
            users.countDocuments(),

            users.countDocuments({
                $or: [
                    { accountType: "vendor" },
                    { role: "vendor" },
                ],
            }),

            users.countDocuments({
                $or: [
                    { accountType: "customer" },
                    { role: "customer" },
                ],
            }),

            menuItems.countDocuments(),

            menuItems.countDocuments({
                status: "pending",
            }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalVendors,
                totalCustomers,
                totalMenuItems,
                pendingMenuItems,
            },
        });
    } catch (error) {
        console.error("Admin dashboard stats error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard statistics.",
        });
    }
};

// ==========================================
// GET ADMIN PAYMENT TRANSACTIONS
// ==========================================

export const getAdminTransactions = async (req, res) => {
    try {
        const {
            search = "",
            plan = "all",
            paymentStatus = "all",
        } = req.query;

        const paymentsCollection = getDB().collection("payments");

        const pipeline = [
            // Convert vendorId string into ObjectId for lookup
            {
                $addFields: {
                    vendorObjectId: {
                        $convert: {
                            input: "$vendorId",
                            to: "objectId",
                            onError: null,
                            onNull: null,
                        },
                    },
                },
            },

            // Find the associated vendor
            {
                $lookup: {
                    from: "user",
                    localField: "vendorObjectId",
                    foreignField: "_id",
                    as: "vendor",
                },
            },

            {
                $unwind: {
                    path: "$vendor",
                    preserveNullAndEmptyArrays: true,
                },
            },

            // Add vendor information
            {
                $addFields: {
                    vendorName: {
                        $ifNull: [
                            "$vendor.name",
                            "$vendorEmail",
                        ],
                    },

                    vendorSubscriptionStatus: {
                        $ifNull: [
                            "$vendor.subscriptionStatus",
                            "unknown",
                        ],
                    },
                },
            },
        ];

        // Search by vendor name, email, session ID or subscription ID
        const searchValue = String(search).trim();

        if (searchValue) {
            const searchRegex = new RegExp(
                escapeRegex(searchValue),
                "i"
            );

            pipeline.push({
                $match: {
                    $or: [
                        { vendorName: searchRegex },
                        { vendorEmail: searchRegex },
                        { stripeSessionId: searchRegex },
                        { stripeSubscriptionId: searchRegex },
                    ],
                },
            });
        }

        // These payment records represent premium subscription payments.
        if (plan !== "all") {
            if (plan !== "premium") {
                return res.status(200).json({
                    success: true,
                    count: 0,
                    data: [],
                });
            }
        }

        // Filter by payment status
        if (paymentStatus !== "all") {
            pipeline.push({
                $match: {
                    paymentStatus: String(paymentStatus),
                },
            });
        }

        pipeline.push(
            {
                $sort: {
                    createdAt: -1,
                },
            },

            {
                $project: {
                    _id: {
                        $toString: "$_id",
                    },

                    sessionId: "$stripeSessionId",
                    userId: "$vendorId",
                    vendorName: 1,
                    customer_email: "$vendorEmail",

                    plan: {
                        $literal: "premium",
                    },

                    // "$20.00" becomes 20.
                    // Legacy numeric values are treated as cents.
                    amount: {
                        $cond: [
                            {
                                $eq: [
                                    { $type: "$amount" },
                                    "string",
                                ],
                            },

                            {
                                $convert: {
                                    input: {
                                        $replaceAll: {
                                            input: "$amount",
                                            find: {
                                                $literal: "$",
                                            },
                                            replacement: "",
                                        },
                                    },
                                    to: "double",
                                    onError: 0,
                                    onNull: 0,
                                },
                            },

                            {
                                $divide: [
                                    {
                                        $convert: {
                                            input: "$amount",
                                            to: "double",
                                            onError: 0,
                                            onNull: 0,
                                        },
                                    },
                                    100,
                                ],
                            },
                        ],
                    },

                    currency: 1,

                    // Current vendor subscription status
                    status: "$vendorSubscriptionStatus",

                    // Actual payment status from payments collection
                    payment_status: "$paymentStatus",

                    payment_intent: "$stripePaymentIntent",
                    payment_date: "$createdAt",
                },
            }
        );

        const transactions = await paymentsCollection
            .aggregate(pipeline)
            .toArray();

        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions,
        });
    } catch (error) {
        console.error("Admin transactions error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch admin transactions.",
        });
    }
};
