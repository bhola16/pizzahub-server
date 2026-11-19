
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


await ordersCollection.createIndex(
    { itemId: 1, customerEmail: 1 },
    { unique: true }
);


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
app.get("/orders/check", async (req, res) => {
    try {
        const { itemId, customerEmail } = req.query;

        if (!itemId || !customerEmail) {
            return res.status(400).json({
                success: false,
                message: "Item ID and customer email are required",
            });
        }

        const order = await ordersCollection.findOne({
            itemId: String(itemId),
            customerEmail: String(customerEmail).trim().toLowerCase(),
        });

        res.status(200).json({
            success: true,
            alreadyOrdered: Boolean(order),
            data: order || null,
        });
    } catch (error) {
        console.error("Failed to check order:", error);
        res.status(500).json({
            success: false,
            message: "Failed to check order",
        });
    }
});

// Place an order
app.post("/orders", async (req, res) => {
    try {
        const { itemId, customerName, customerEmail } = req.body;

        if (!itemId || !customerEmail) {
            return res.status(400).json({
                success: false,
                message: "Item ID and customer email are required",
            });
        }

        if (!ObjectId.isValid(itemId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid menu item ID",
            });
        }

        const normalizedEmail = String(customerEmail).trim().toLowerCase();

        const item = await pizzaMenusItems.findOne({
            _id: new ObjectId(itemId),
            status: "approved",
            isActive: true,
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Menu item is unavailable",
            });
        }

        // Prevent a vendor from ordering their own item
        if (
            normalizedEmail ===
            String(item.vendorEmail || "").trim().toLowerCase()
        ) {
            return res.status(403).json({
                success: false,
                message: "You cannot order your own menu item",
            });
        }

        // Check for an existing order
        const existingOrder = await ordersCollection.findOne({
            itemId: String(item._id),
            customerEmail: normalizedEmail,
        });

        if (existingOrder) {
            return res.status(409).json({
                success: false,
                alreadyOrdered: true,
                message: "You have already ordered this item",
                data: existingOrder,
            });
        }

        const newOrder = {
            itemId: String(item._id),
            itemName: item.name,
            itemImage: item.images?.[0] || "",
            price: item.price,
            vendorName: item.vendorName,
            vendorEmail: item.vendorEmail,
            customerName: String(customerName || ""),
            customerEmail: normalizedEmail,
            status: "pending",
            createdAt: new Date(),
        };

        const result = await ordersCollection.insertOne(newOrder);

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: {
                ...newOrder,
                _id: result.insertedId,
            },
        });
    } catch (error) {
        // The unique index also protects against simultaneous duplicate requests
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                alreadyOrdered: true,
                message: "You have already ordered this item",
            });
        }

        console.error("Failed to place order:", error);
        res.status(500).json({
            success: false,
            message: "Failed to place order",
        });
    }
});

// add menu items
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

        const menuItemsCollection = database.collection("menuItems");
        const ordersCollection = database.collection("orders");
        const usersCollection = database.collection("users");

        const [menuItems, orders, vendor] = await Promise.all([
            menuItemsCollection
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


// Home route
app.get("/", (req, res) => {
    res.send("Pizza-Hub is running!");
});


// Start Server
async function startServer() {
    try {
        await connectToMongoDB();

        await ordersCollection.createIndex(
            { itemId: 1, customerEmail: 1 },
            { unique: true }
        );

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
