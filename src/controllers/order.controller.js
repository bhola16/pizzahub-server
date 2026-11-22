
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

// Convert MongoDB document to frontend order format
const formatOrder = (order) => {
    const { _id, ...orderData } = order;

    return {
        ...orderData,
        id: _id.toString(),
    };
};

// Check whether the customer already has an active order
export const checkExistingOrder = async (req, res) => {
    try {
        const { itemId, customerEmail } = req.query;

        if (!itemId || !customerEmail?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Item ID and customer email are required.",
            });
        }

        const order = await getDB().collection("orders").findOne({
            itemId,
            customerEmail: customerEmail.trim().toLowerCase(),
            status: { $in: ["pending", "accepted"] },
        });

        return res.status(200).json({
            success: true,
            alreadyOrdered: Boolean(order),
            ...(order && {
                orderId: order._id.toString(),
                status: order.status,
            }),
        });
    } catch (error) {
        console.error("Check existing order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to check existing order.",
        });
    }
};

// This permanently deletes the order, matching your previous backend.
export const withdrawOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { customerEmail } = req.body;

        if (!ObjectId.isValid(id) || !customerEmail?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Valid order ID and customer email are required.",
            });
        }

        const result = await getDB().collection("orders").deleteOne({
            _id: new ObjectId(id),
            customerEmail: customerEmail.trim().toLowerCase(),
            status: "pending",
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found or can no longer be withdrawn.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Order withdrawn successfully.",
        });
    } catch (error) {
        console.error("Withdraw order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to withdraw order.",
        });
    }
};

// Customer permanently deletes a rejected order
export const deleteRejectedOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { customerEmail } = req.body;

        if (!ObjectId.isValid(id) || !customerEmail?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Valid order ID and customer email are required.",
            });
        }

        const result = await getDB().collection("orders").deleteOne({
            _id: new ObjectId(id),
            customerEmail: customerEmail.trim().toLowerCase(),
            status: "rejected",
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Rejected order not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Rejected order deleted successfully.",
        });
    } catch (error) {
        console.error("Delete rejected order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete rejected order.",
        });
    }
};

// Place a new order
export const placeOrder = async (req, res) => {
    try {
        const {
            itemId,
            customerName,
            customerEmail,
            deliveryDate,
            deliveryAddress,
            customerMessage,
        } = req.body;

        if (
            !ObjectId.isValid(itemId) ||
            !customerName?.trim() ||
            !customerEmail?.trim() ||
            !deliveryDate ||
            !deliveryAddress?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required order information.",
            });
        }

        // Validate date format and actual calendar date
        if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery date.",
            });
        }

        const [year, month, day] = deliveryDate.split("-").map(Number);
        const selectedDate = new Date(year, month - 1, day);

        if (
            selectedDate.getFullYear() !== year ||
            selectedDate.getMonth() !== month - 1 ||
            selectedDate.getDate() !== day
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery date.",
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            return res.status(400).json({
                success: false,
                message: "Delivery date cannot be in the past.",
            });
        }

        const normalizedEmail = customerEmail.trim().toLowerCase();
        const database = getDB();

        const menuItem = await database.collection("menuItems").findOne({
            _id: new ObjectId(itemId),
            status: "approved",
            isActive: true,
        });

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found or unavailable.",
            });
        }

        if (menuItem.vendorEmail?.trim().toLowerCase() === normalizedEmail) {
            return res.status(403).json({
                success: false,
                message: "You cannot order your own menu item.",
            });
        }

        const orders = database.collection("orders");

        // Prevent duplicate active orders
        const existingOrder = await orders.findOne({
            itemId,
            customerEmail: normalizedEmail,
            status: { $in: ["pending", "accepted"] },
        });

        if (existingOrder) {
            return res.status(409).json({
                success: false,
                alreadyOrdered: true,
                message: "You already have an active order for this item.",
            });
        }

        const newOrder = {
            itemId,
            itemName: menuItem.name,
            itemImage: menuItem.images?.[0] || "",
            price: Number(menuItem.price),
            vendorName: menuItem.vendorName || "",
            vendorEmail: menuItem.vendorEmail?.trim().toLowerCase() || "",
            customerName: customerName.trim(),
            customerEmail: normalizedEmail,
            deliveryDate,
            deliveryAddress: deliveryAddress.trim(),
            customerMessage:
                typeof customerMessage === "string"
                    ? customerMessage.trim()
                    : "",
            status: "pending",
            createdAt: new Date(),
        };

        const result = await orders.insertOne(newOrder);

        return res.status(201).json({
            success: true,
            message: "Order placed successfully.",
            data: {
                ...newOrder,
                id: result.insertedId.toString(),
            },
        });
    } catch (error) {
        console.error("Place order error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to place order.",
        });
    }
};

// Get customer's orders
export const getCustomerOrders = async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email)
            .trim()
            .toLowerCase();

        const orders = await getDB()
            .collection("orders")
            .find({ customerEmail: email })
            .sort({ createdAt: -1 })
            .toArray();

        return res.status(200).json(orders.map(formatOrder));
    } catch (error) {
        console.error("Customer orders error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch customer orders.",
        });
    }
};

// Get vendor's orders
export const getVendorOrders = async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email)
            .trim()
            .toLowerCase();

        const orders = await getDB()
            .collection("orders")
            .find({ vendorEmail: email })
            .sort({ createdAt: -1 })
            .toArray();

        return res.status(200).json(orders.map(formatOrder));
    } catch (error) {
        console.error("Vendor orders error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch vendor orders.",
        });
    }
};

// Vendor accepts or rejects a pending order
export const updateVendorOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { vendorEmail, status } = req.body;

        if (!ObjectId.isValid(id) || !vendorEmail?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Valid order ID and vendor email are required.",
            });
        }

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be accepted or rejected.",
            });
        }

        const result = await getDB().collection("orders").updateOne(
            {
                _id: new ObjectId(id),
                vendorEmail: vendorEmail.trim().toLowerCase(),
                status: "pending",
            },
            {
                $set: {
                    status,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found or it has already been processed.",
            });
        }

        return res.status(200).json({
            success: true,
            message: `Order ${status} successfully.`,
        });
    } catch (error) {
        console.error("Vendor order update error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update order status.",
        });
    }
};
