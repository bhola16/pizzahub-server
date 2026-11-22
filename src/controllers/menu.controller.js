
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

const totalLimit = Number(process.env.NEXT_PUBLIC_UPGRADE_LIMIT) || 3;

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
        const {
            name,
            category,
            description,
            price,
            location,
            images,
            vendorName,
            vendorEmail,
            plan,
        } = req.body;

        if (
            !name?.trim() ||
            !category ||
            !description?.trim() ||
            !price ||
            Number(price) <= 0 ||
            !location?.trim() ||
            !Array.isArray(images) ||
            images.length === 0 ||
            !vendorName?.trim() ||
            !vendorEmail?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required.",
            });
        }

        const menuItems = getDB().collection("menuItems");

        const totalItems = await menuItems.countDocuments({
            vendorEmail: vendorEmail,
        });

        if (
            String(plan || "free").toLowerCase() === "free" &&
            totalItems >= totalLimit
        ) {
            return res.status(403).json({
                success: false,
                upgradeRequired: true,
                message: `You have reached the ${totalLimit}-item limit. Upgrade to Premium to add more menu items.`,
            });
        }

        const newMenuItem = {
            name: name.trim(),
            category,
            description: description.trim(),
            price: Number(price),
            location: location.trim(),
            images,
            vendorName: vendorName.trim(),
            vendorEmail: vendorEmail.trim(),
            status: "pending",
            isActive: false,
            createdAt: new Date(),
        };

        const result = await menuItems.insertOne(newMenuItem);

        res.status(201).json({
            success: true,
            message: "Menu item submitted for admin approval.",
            data: {
                ...newMenuItem,
                _id: result.insertedId,
            },
        });
    } catch (error) {
        console.error("Failed to add menu item:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add menu item.",
        });
    }
};

// Get vendor menu item count
export const getVendorMenuItemCount = async (req, res) => {
    try {
        const totalItems = await getDB()
            .collection("menuItems")
            .countDocuments({
                vendorEmail: req.params.email,
            });

        res.status(200).json({ totalItems });
    } catch (error) {
        res.status(500).json({
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
