
import cors from "cors";
import "dotenv/config";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
// import { auth } from "./auth";

const app = express();
const port = process.env.PORT || 8000;
const totalLimit = Number(process.env.NEXT_PUBLIC_UPGRADE_LIMIT) || 8;

// Middleware
app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
    })
);

app.use(express.json());
app.use(express.json());


// MongoDB
if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from environment variables");
}

const client = new MongoClient(process.env.MONGODB_URI);

const database = client.db("pizzahub");
const pizzaMenusItems = database.collection("menuItems");

const ordersCollection = database.collection("orders");





export async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");
        return database;
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        throw error;
    }
}

// Get all approved and active menu items
app.get("/menuItems", async (req, res) => {
    try {
        const { search, category, location } = req.query;

        const query = {
            status: "approved",
            isActive: true,
        };

        if (search && String(search).trim()) {
            query.name = {
                $regex: String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                $options: "i",
            };
        }

        if (category && category !== "All Categories") {
            query.category = String(category);
        }

        if (location && location !== "All Locations") {
            query.location = String(location);
        }

        const pizzas = await pizzaMenusItems
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json({
            success: true,
            count: pizzas.length,
            data: pizzas,
        });
    } catch (error) {
        console.error("Failed to fetch menu items:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch menu items",
        });
    }
});

// Check whether a customer has already ordered a menu item


// Convert MongoDB document to frontend order format
const formatOrder = (order) => {
    const { _id, ...orderData } = order;

    return {
        ...orderData,
        id: _id.toString(),
    };
};

// Check existing active order
app.get("/orders/check", async (req, res) => {
    try {
        const { itemId, customerEmail } = req.query;

        const order = await ordersCollection.findOne({
            itemId,
            customerEmail: customerEmail.toLowerCase(),
            status: { $in: ["pending", "accepted"] },
        });

        res.send({
            alreadyOrdered: !!order,
            orderId: order?._id.toString(),
            status: order?.status,
        });
    } catch (error) {
        res.status(500).send({
            message: "Failed to check existing order.",
        });
    }
});


// Customer cancels and deletes their pending order
app.patch("/orders/:id/withdraw", async (req, res) => {
    try {
        const { customerEmail } = req.body;

        if (
            !ObjectId.isValid(req.params.id) ||
            !customerEmail?.trim()
        ) {
            return res.status(400).send({
                success: false,
                message: "Valid order ID and customer email are required.",
            });
        }

        const result = await ordersCollection.deleteOne({
            _id: new ObjectId(req.params.id),
            customerEmail: customerEmail.trim().toLowerCase(),
            status: "pending",
        });

        if (result.deletedCount === 0) {
            return res.status(404).send({
                success: false,
                message: "Order not found or can no longer be cancelled.",
            });
        }

        res.send({
            success: true,
            message: "Order cancelled successfully.",
        });
    } catch (error) {
        console.error("Cancel order error:", error);

        res.status(500).send({
            success: false,
            message: "Failed to cancel order.",
        });
    }
});

// Place new order

app.post("/orders", async (req, res) => {
    try {
        const {
            itemId,
            customerName,
            customerEmail,
            deliveryDate,
            deliveryAddress,
            customerMessage,
        } = req.body;

        // Validate required fields
        if (
            !itemId ||
            !ObjectId.isValid(itemId) ||
            typeof customerName !== "string" ||
            !customerName.trim() ||
            typeof customerEmail !== "string" ||
            !customerEmail.trim() ||
            typeof deliveryAddress !== "string" ||
            !deliveryAddress.trim() ||
            typeof deliveryDate !== "string"
        ) {
            return res.status(400).send({
                success: false,
                message: "Please provide all required order information.",
            });
        }

        // Validate delivery date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
            return res.status(400).send({
                success: false,
                message: "Invalid delivery date.",
            });
        }

        // Validate actual calendar date
        const [year, month, day] = deliveryDate.split("-").map(Number);

        const selectedDate = new Date(year, month - 1, day);

        if (
            selectedDate.getFullYear() !== year ||
            selectedDate.getMonth() !== month - 1 ||
            selectedDate.getDate() !== day
        ) {
            return res.status(400).send({
                success: false,
                message: "Invalid delivery date.",
            });
        }

        // Get today's date using server local time
        const now = new Date();

        const todayString = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0"),
        ].join("-");

        // Allow today or future dates
        if (deliveryDate < todayString) {
            return res.status(400).send({
                success: false,
                message: "Please select today or a future delivery date.",
            });
        }

        const normalizedEmail = customerEmail.trim().toLowerCase();

        // Find menu item
        const menuItem = await pizzaMenusItems.findOne({
            _id: new ObjectId(itemId),
        });

        if (!menuItem) {
            return res.status(404).send({
                success: false,
                message: "Menu item not found.",
            });
        }

        // Check menu item availability
        if (
            menuItem.status !== "approved" ||
            menuItem.isActive !== true
        ) {
            return res.status(400).send({
                success: false,
                message: "This menu item is currently unavailable.",
            });
        }

        // Prevent vendors from ordering their own menu items
        if (
            menuItem.vendorEmail?.trim().toLowerCase() === normalizedEmail
        ) {
            return res.status(403).send({
                success: false,
                message: "You cannot order your own menu item.",
            });
        }

        // Prevent duplicate active orders
        const existingOrder = await ordersCollection.findOne({
            itemId,
            customerEmail: normalizedEmail,
            status: { $in: ["pending", "accepted"] },
        });

        if (existingOrder) {
            return res.status(409).send({
                success: false,
                alreadyOrdered: true,
                message: "You already have an active order for this item.",
            });
        }

        // Create new order
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

        // Save order
        const result = await ordersCollection.insertOne(newOrder);

        // Send response
        res.status(201).send({
            success: true,
            message: "Order placed successfully.",
            data: {
                ...newOrder,
                id: result.insertedId.toString(),
            },
        });
    } catch (error) {
        console.error("Place order error:", error);

        res.status(500).send({
            success: false,
            message: error.message || "Failed to place order.",
        });
    }
});



// Get customer's orders
app.get("/orders/customer/:email", async (req, res) => {
    try {
        const orders = await ordersCollection
            .find({
                customerEmail: req.params.email.toLowerCase(),
            })
            .sort({ createdAt: -1 })
            .toArray();

        res.send(
            orders.map(({ _id, ...order }) => ({
                ...order,
                id: _id.toString(),
            })),
        );
    } catch (error) {
        res.status(500).send({
            message: "Failed to fetch customer orders.",
        });
    }
});






// Get vendor's orders
app.get("/orders/vendor/:email", async (req, res) => {
    try {
        const vendorEmail = decodeURIComponent(req.params.email).toLowerCase();

        const orders = await ordersCollection
            .find({ vendorEmail })
            .sort({ createdAt: -1 })
            .toArray();

        res.send(orders.map(formatOrder));
    } catch (error) {
        console.error("Vendor orders error:", error);
        res.status(500).send({
            message: "Failed to fetch vendor orders.",
        });
    }
});

// Vendor accepts or rejects their own pending order
app.patch("/orders/:id/vendor-status", async (req, res) => {
    try {
        const { vendorEmail, status } = req.body;

        if (!ObjectId.isValid(req.params.id) || !vendorEmail?.trim()) {
            return res.status(400).send({
                message: "Valid order ID and vendor email are required.",
            });
        }

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).send({
                message: "Status must be accepted or rejected.",
            });
        }

        const result = await ordersCollection.updateOne(
            {
                _id: new ObjectId(req.params.id),
                vendorEmail: vendorEmail.trim().toLowerCase(),
                status: "pending",
            },
            {
                $set: {
                    status,
                    updatedAt: new Date(),
                },
            },
        );

        if (result.matchedCount === 0) {
            return res.status(400).send({
                message: "Order not found or it has already been processed.",
            });
        }

        res.send({
            success: true,
            message: `Order ${status} successfully.`,
        });
    } catch (error) {
        console.error("Vendor order update error:", error);
        res.status(500).send({
            message: "Failed to update order status.",
        });
    }
});









// Add menu items
app.post("/menuItems", async (req, res) => {
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

        // Required field validation
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

        // Check vendor's existing menu items
        const totalItems = await pizzaMenusItems.countDocuments({
            vendorEmail: vendorEmail,
        });

        // Free plan limit
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

        // New menu item
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

        const result = await pizzaMenusItems.insertOne(newMenuItem);

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
});

app.get("/menuItems/count/:email", async (req, res) => {
    try {
        const totalItems = await pizzaMenusItems.countDocuments({
            vendorEmail: req.params.email,
        });

        res.send({ totalItems });
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch menu item count." });
    }
});



app.get("/vendor-menu-items/:email", async (req, res) => {
    try {
        const items = await pizzaMenusItems
            .find({ vendorEmail: req.params.email })
            .sort({ createdAt: -1 })
            .toArray();

        res.send(items);
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch menu items." });
    }
});

// update a menu item
app.put("/menuItems/:id", async (req, res) => {
    try {
        const { name, category, description, price, location, images, vendorEmail } =
            req.body;

        const result = await pizzaMenusItems.updateOne(
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
            return res.status(404).send({ message: "Menu item not found." });
        }

        res.send({ success: true, message: "Menu item updated successfully." });
    } catch (error) {
        res.status(500).send({ message: "Failed to update menu item." });
    }
});

// delete a menu item 
app.delete("/menuItems/:id", async (req, res) => {
    try {
        const result = await pizzaMenusItems.deleteOne({
            _id: new ObjectId(req.params.id),
            vendorEmail: req.body.vendorEmail,
        });

        if (result.deletedCount === 0) {
            return res.status(404).send({ message: "Menu item not found." });
        }

        res.send({ success: true, message: "Menu item deleted successfully." });
    } catch (error) {
        res.status(500).send({ message: "Failed to delete menu item." });
    }
});

// manage availability 
app.patch("/menuItems/:id/availability", async (req, res) => {
    try {
        const { vendorEmail, isActive } = req.body;

        const result = await pizzaMenusItems.updateOne(
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
            return res.status(404).send({
                message: "Approved menu item not found.",
            });
        }

        res.send({
            success: true,
            message: "Availability updated successfully.",
        });
    } catch (error) {
        res.status(500).send({ message: "Failed to update availability." });
    }
});

// Get a single menu item by ID
app.get("/menuItems/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid menu item ID",
            });
        }

        const pizza = await pizzaMenusItems.findOne({
            _id: new ObjectId(id),
            status: "approved",
            isActive: true,
        });

        if (!pizza) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found or unavailable",
            });
        }

        res.status(200).json({
            success: true,
            data: pizza,
        });
    } catch (error) {
        console.error("Failed to fetch menu item:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch menu item",
        });
    }
});


//vendor dashboard
app.get("/vendor-dashboard/:email", async (req, res) => {
    try {
        const vendorEmail = decodeURIComponent(req.params.email).toLowerCase();

        const pizzaMenusItems = database.collection("menuItems");
        const ordersCollection = database.collection("orders");
        const usersCollection = database.collection("users");

        const [menuItems, orders, vendor] = await Promise.all([
            pizzaMenusItems
                .find({ vendorEmail })
                .toArray(),

            ordersCollection
                .find({ vendorEmail })
                .toArray(),

            usersCollection.findOne({
                email: vendorEmail,
            }),
        ]);

        const totalMenuItems = menuItems.length;

        const activeMenuItems = menuItems.filter(
            (item) =>
                item.status?.toLowerCase() === "approved" &&
                item.isActive === true,
        ).length;

        const pendingOrders = orders.filter(
            (order) => order.status?.toLowerCase() === "pending",
        ).length;

        const acceptedOrders = orders.filter(
            (order) => order.status?.toLowerCase() === "accepted",
        ).length;

        res.send({
            totalMenuItems,
            activeMenuItems,
            pendingOrders,
            acceptedOrders,
            subscriptionPlan: vendor?.subscriptionPlan || "free",
        });
    } catch (error) {
        console.error("Vendor dashboard error:", error);

        res.status(500).send({
            message: "Failed to fetch vendor dashboard data.",
        });
    }
});



// customer dashboard
app.get("/customer-dashboard/:email", async (req, res) => {
  try {
    const customerEmail = decodeURIComponent(req.params.email).toLowerCase();

    const ordersCollection = database.collection("orders");

    const orders = await ordersCollection
      .find({ customerEmail })
      .toArray();

    const totalOrders = orders.length;

    const pendingOrders = orders.filter(
      (order) => order.status?.toLowerCase() === "pending"
    ).length;

    const acceptedOrders = orders.filter(
      (order) => order.status?.toLowerCase() === "accepted"
    ).length;

    const rejectedOrders = orders.filter(
      (order) => order.status?.toLowerCase() === "rejected"
    ).length;

    res.send({
      totalOrders,
      pendingOrders,
      acceptedOrders,
      rejectedOrders,
    });
  } catch (error) {
    console.error("Customer dashboard error:", error);

    res.status(500).send({
      message: "Failed to fetch customer dashboard data.",
    });
  }
});

// Home route
app.get("/", (req, res) => {
    res.send("Pizza-Hub is running!");
});


// Start Server
async function startServer() {
    try {
        await connectToMongoDB();

        

        app.listen(port, () => {
            console.log(`Pizza-Hub is listening on port ${port}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
}

startServer();

export default app
