import { fromNodeHeaders } from "better-auth/node";
import { ObjectId } from "mongodb";

import { getDB } from "../config/db.js";
import { auth } from "../lib/auth.js";

const totalLimit =
    Number(process.env.UPGRADE_LIMIT || process.env.NEXT_PUBLIC_UPGRADE_LIMIT) || 3;

const getAuthenticatedVendor = async (req) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user?.email) {
        return null;
    }

    return getDB().collection("user").findOne({
        email: session.user.email,
    });
};


// Get all approved and active menu items
export const getMenuItems = async (req, res) => {
    try {
        const { search, category, location } = req.query;

        const query = {
            status: "approved",
            isActive: true,
        };

        if (search && String(search).trim()) {
            const searchRegex = new RegExp(
                String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                "i"
            );

            query.name = searchRegex;
        }

        if (category && category !== "All Categories") {
            query.category = String(category);
        }

        if (location && location !== "All Locations") {
            query.location = String(location);
        }

        const items = await getDB()
            .collection("menuItems")
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json({
            success: true,
            count: items.length,
            data: items,
        });
    } catch (error) {
        console.error("Failed to fetch menu items:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch menu items",
        });
    }
};

// Get latest 6 approved and active menu items
export const getFeaturedMenuItems = async (req, res) => {
    try {
        const items = await getDB()
            .collection("menuItems")
            .find({
                status: "approved",
                isActive: true,
            })
            .sort({ createdAt: -1 })
            .limit(6)
            .toArray();

        res.status(200).json({
            success: true,
            count: items.length,
            data: items,
        });
    } catch (error) {
        console.error("Failed to fetch featured menu items:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch featured menu items",
        });
    }
};


// Add menu item
export const addMenuItem = async (req, res) => {
    try {
        const vendor = await getAuthenticatedVendor(req);

        if (!vendor) {
            return res.status(401).json({
                success: false,
                message: "Please log in to add a menu item.",
            });
        }

        const {
            name,
            category,
            description,
            price,
            location,
            images,
        } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof category !== "string" ||
            !category.trim() ||
            typeof description !== "string" ||
            !description.trim() ||
            price === undefined ||
            price === null ||
            price === "" ||
            !Number.isFinite(Number(price)) ||
            Number(price) <= 0 ||
            typeof location !== "string" ||
            !location.trim() ||
            !Array.isArray(images) ||
            images.length === 0 ||
            !images.every(
                (image) => typeof image === "string" && image.trim()
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid information for all fields.",
            });
        }

        const vendorEmail = vendor.email;
        const vendorName = vendor.name || "Vendor";

        // Check the actual subscription stored in MongoDB.
        const isPremium =
            vendor.subscriptionPlan === "premium" &&
            ["active", "trialing"].includes(vendor.subscriptionStatus);

        const menuItems = getDB().collection("menuItems");

        const totalItems = await menuItems.countDocuments({
            vendorEmail,
        });

        // Enforce the Free plan limit on the backend.
        if (!isPremium && totalItems >= totalLimit) {
            return res.status(403).json({
                success: false,
                upgradeRequired: true,
                message: `You have reached the ${totalLimit}-item limit. Upgrade to Premium to add more menu items.`,
            });
        }

        const newMenuItem = {
            name: name.trim(),
            category: category.trim(),
            description: description.trim(),
            price: Number(price),
            location: location.trim(),
            images: images.map((image) => image.trim()),
            vendorName,
            vendorEmail,
            status: "pending",
            isActive: false,
            createdAt: new Date(),
        };

        const result = await menuItems.insertOne(newMenuItem);

        return res.status(201).json({
            success: true,
            message: "Menu item submitted for admin approval.",
            data: {
                ...newMenuItem,
                _id: result.insertedId,
            },
        });
    } catch (error) {
        console.error("Failed to add menu item:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add menu item.",
        });
    }
};

// Get authenticated vendor's menu item count
export const getVendorMenuItemCount = async (req, res) => {
    try {
        const vendor = await getAuthenticatedVendor(req);

        if (!vendor) {
            return res.status(401).json({
                success: false,
                message: "Please log in.",
            });
        }

        // Prevent a user from requesting another vendor's count.
        if (
            req.params.email &&
            req.params.email.toLowerCase() !== vendor.email.toLowerCase()
        ) {
            return res.status(403).json({
                message: "You are not authorized to access this information.",
            });
        }

        const totalItems = await getDB()
            .collection("menuItems")
            .countDocuments({
                vendorEmail: vendor.email,
            });

        return res.status(200).json({ totalItems });
    } catch (error) {
        console.error("Failed to fetch menu item count:", error);

        return res.status(500).json({
            message: "Failed to fetch menu item count.",
        });
    }
};




// Get vendor's menu items
export const getVendorMenuItems = async (req, res) => {
    try {
        const items = await getDB()
            .collection("menuItems")
            .find({ vendorEmail: req.params.email })
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch menu items.",
        });
    }
};

// Update menu item
export const updateMenuItem = async (req, res) => {
    try {
        const {
            name,
            category,
            description,
            price,
            location,
            images,
            vendorEmail,
        } = req.body;

        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid menu item ID.",
            });
        }

        const result = await getDB()
            .collection("menuItems")
            .updateOne(
                {
                    _id: new ObjectId(req.params.id),
                    vendorEmail,
                },
                {
                    $set: {
                        name,
                        category,
                        description,
                        price: Number(price),
                        location,
                        images,
                    },
                }
            );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: "Menu item not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Menu item updated successfully.",
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update menu item.",
        });
    }
};

// Delete menu item
export const deleteVendorMenuItem = async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid menu item ID.",
            });
        }

        const result = await getDB()
            .collection("menuItems")
            .deleteOne({
                _id: new ObjectId(req.params.id),
                vendorEmail: req.body.vendorEmail,
            });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: "Menu item not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Menu item deleted successfully.",
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete menu item.",
        });
    }
};

// Update menu item availability
export const updateVendorMenuAvailability = async (req, res) => {
    try {
        const { vendorEmail, isActive } = req.body;

        if (
            !ObjectId.isValid(req.params.id) ||
            typeof isActive !== "boolean"
        ) {
            return res.status(400).json({
                message: "Invalid menu item information.",
            });
        }

        const result = await getDB()
            .collection("menuItems")
            .updateOne(
                {
                    _id: new ObjectId(req.params.id),
                    vendorEmail,
                    status: "approved",
                },
                {
                    $set: { isActive },
                }
            );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: "Approved menu item not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Availability updated successfully.",
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update availability.",
        });
    }
};

// Get a single approved and active menu item
export const getSingleMenuItem = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid menu item ID",
            });
        }

        const item = await getDB()
            .collection("menuItems")
            .findOne({
                _id: new ObjectId(id),
                status: "approved",
                isActive: true,
            });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found or unavailable",
            });
        }

        res.status(200).json({
            success: true,
            data: item,
        });
    } catch (error) {
        console.error("Failed to fetch menu item:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch menu item",
        });
    }
};
