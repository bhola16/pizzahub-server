
import { fromNodeHeaders } from "better-auth/node";
import { getDB } from "../config/db.js";
import stripe from "../config/stripe.js";
import { auth } from "../lib/auth.js";

// ------------------------------------------
// Helper: Get authenticated vendor
// ------------------------------------------

const getAuthenticatedVendor = async (req) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user?.email) {
        return null;
    }

    const db = getDB();

    const vendor = await db.collection("user").findOne({
        email: session.user.email,
        role: "vendor",
    });

    return vendor || null;
};

// ------------------------------------------
// Helper: Check subscription status
// ------------------------------------------

const isSubscriptionActive = (status) => {
    return ["active", "trialing"].includes(status);
};

// ------------------------------------------
// 1. Create Stripe Checkout Session
// ------------------------------------------

export const createCheckoutSession = async (req, res) => {
    try {
        const vendor = await getAuthenticatedVendor(req);

        if (!vendor) {
            return res.status(401).json({
                message: "Unauthorized vendor",
            });
        }

        if (
            vendor.subscriptionPlan === "premium" &&
            vendor.premium === true &&
            isSubscriptionActive(vendor.subscriptionStatus)
        ) {
            return res.status(400).json({
                message: "You already have an active Premium subscription.",
            });
        }

        const checkoutSession =
            await stripe.checkout.sessions.create({
                mode: "subscription",

                customer_email: vendor.email,

                line_items: [
                    {
                        price_data: {
                            currency: "usd",
                            product_data: {
                                name: "PizzaHub Premium",
                                description:
                                    "Monthly Premium Vendor Subscription",
                            },
                            unit_amount: 2000, // $20.00
                            recurring: {
                                interval: "month",
                            },
                        },
                        quantity: 1,
                    },
                ],

                metadata: {
                    vendorId: String(vendor._id),
                    vendorEmail: vendor.email,
                },

                subscription_data: {
                    metadata: {
                        vendorId: String(vendor._id),
                        vendorEmail: vendor.email,
                    },
                },

                success_url:
                    `${process.env.CLIENT_URL}/dashboard/payment/success?session_id={CHECKOUT_SESSION_ID}`,

                cancel_url:
                    `${process.env.CLIENT_URL}/dashboard/payment/cancel`,
            });

        return res.status(200).json({
            message: "Checkout session created successfully",
            url: checkoutSession.url,
        });

    } catch (error) {
        console.error("Stripe checkout error:", error);

        return res.status(500).json({
            message: "Unable to create checkout session",
        });
    }
};

// ------------------------------------------
// 2. Get Vendor Subscription
// ------------------------------------------

export const getSubscription = async (req, res) => {
    try {
        const vendor = await getAuthenticatedVendor(req);

        if (!vendor) {
            return res.status(401).json({
                message: "Unauthorized vendor",
            });
        }

        return res.status(200).json({
            subscription: {
                subscriptionPlan:
                    vendor.subscriptionPlan || "free",

                premium: vendor.premium === true,

                subscriptionStatus:
                    vendor.subscriptionStatus || "inactive",
            },
        });

    } catch (error) {
        console.error("Get subscription error:", error);

        return res.status(500).json({
            message: "Unable to retrieve subscription",
        });
    }
};

// ------------------------------------------
// 3. Stripe Webhook
// ------------------------------------------

export const stripeWebhook = async (req, res) => {
    const signature = req.headers["stripe-signature"];

    let event;

    // Verify Stripe webhook signature
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );

    } catch (error) {
        console.error(
            "Webhook signature error:",
            error.message
        );

        return res.status(400).send(
            `Webhook Error: ${error.message}`
        );
    }

    const db = getDB();

    try {
        switch (event.type) {

            // ======================================
            // CHECKOUT COMPLETED
            // ======================================

            case "checkout.session.completed": {
                const checkout = event.data.object;

                console.log(
                    "Checkout completed event received:",
                    checkout.id
                );

                const subscriptionId =
                    typeof checkout.subscription === "string"
                        ? checkout.subscription
                        : checkout.subscription?.id || null;

                if (!subscriptionId) {
                    throw new Error(
                        "Subscription ID missing from Checkout Session."
                    );
                }

                // Retrieve subscription details from Stripe
                const subscription =
                    await stripe.subscriptions.retrieve(
                        subscriptionId
                    );

                const vendorEmail =
                    checkout.metadata?.vendorEmail ||
                    subscription.metadata?.vendorEmail;

                const vendorId =
                    checkout.metadata?.vendorId ||
                    subscription.metadata?.vendorId;

                if (!vendorEmail) {
                    throw new Error(
                        "Vendor email missing from Stripe metadata."
                    );
                }

                const subscriptionStatus = subscription.status;

                const active =
                    isSubscriptionActive(subscriptionStatus);

                const customerId =
                    typeof checkout.customer === "string"
                        ? checkout.customer
                        : checkout.customer?.id || null;

                // Update vendor subscription
                if (active) {
                    const userResult =
                        await db.collection("user").updateOne(
                            {
                                email: vendorEmail,
                                role: "vendor",
                            },
                            {
                                $set: {
                                    subscriptionPlan: "premium",
                                    premium: true,
                                    subscriptionStatus,
                                    stripeCustomerId: customerId,
                                    stripeSubscriptionId: subscriptionId,
                                    updatedAt: new Date(),
                                },
                            }
                        );

                    console.log(
                        "Vendor subscription update:",
                        {
                            matchedCount: userResult.matchedCount,
                            modifiedCount: userResult.modifiedCount,
                        }
                    );

                    if (userResult.matchedCount === 0) {
                        throw new Error(
                            `Vendor not found: ${vendorEmail}`
                        );
                    }
                }

                // Convert Stripe cents into dollar amount
                const amountInDollars =
                    (checkout.amount_total ?? 0) / 100;

                const paymentData = {
                    vendorId: vendorId || null,
                    vendorEmail,

                    amount: `$${amountInDollars.toFixed(2)}`,
                    currency: (checkout.currency || "usd").toUpperCase(),

                    paymentStatus: checkout.payment_status,

                    stripeSessionId: checkout.id,

                    stripePaymentIntent:
                        typeof checkout.payment_intent === "string"
                            ? checkout.payment_intent
                            : checkout.payment_intent?.id || null,

                    stripeCustomerId: customerId,

                    stripeSubscriptionId: subscriptionId,

                    createdAt: new Date(),
                };

                // Idempotent payment creation
                const paymentResult =
                    await db.collection("payments").updateOne(
                        {
                            stripeSessionId: checkout.id,
                        },
                        {
                            $setOnInsert: paymentData,
                        },
                        {
                            upsert: true,
                        }
                    );

                console.log("Payment record result:", {
                    stripeSessionId: checkout.id,
                    matchedCount: paymentResult.matchedCount,
                    modifiedCount: paymentResult.modifiedCount,
                    upsertedId: paymentResult.upsertedId,
                    amount: paymentData.amount,
                    currency: paymentData.currency,
                    paymentStatus: paymentData.paymentStatus,
                });

                console.log(
                    `Checkout processed for ${vendorEmail}`
                );

                break;
            }

            // ======================================
            // SUBSCRIPTION UPDATED
            // ======================================

            case "customer.subscription.updated": {
                const subscription = event.data.object;

                const vendorEmail =
                    subscription.metadata?.vendorEmail;

                if (!vendorEmail) {
                    throw new Error(
                        "Vendor email missing from subscription metadata."
                    );
                }

                const active =
                    isSubscriptionActive(subscription.status);

                const customerId =
                    typeof subscription.customer === "string"
                        ? subscription.customer
                        : subscription.customer?.id || null;

                const userResult =
                    await db.collection("user").updateOne(
                        {
                            email: vendorEmail,
                            role: "vendor",
                        },
                        {
                            $set: {
                                subscriptionPlan: active
                                    ? "premium"
                                    : "free",

                                premium: active,

                                subscriptionStatus:
                                    subscription.status,

                                stripeCustomerId: customerId,

                                stripeSubscriptionId:
                                    subscription.id,

                                updatedAt: new Date(),
                            },
                        }
                    );

                console.log(
                    `Subscription updated for ${vendorEmail}:`,
                    {
                        status: subscription.status,
                        premium: active,
                        matchedCount: userResult.matchedCount,
                        modifiedCount: userResult.modifiedCount,
                    }
                );

                if (userResult.matchedCount === 0) {
                    throw new Error(
                        `Vendor not found: ${vendorEmail}`
                    );
                }

                break;
            }

            // ======================================
            // SUBSCRIPTION DELETED
            // ======================================

            case "customer.subscription.deleted": {
                const subscription = event.data.object;

                const vendorEmail =
                    subscription.metadata?.vendorEmail;

                if (!vendorEmail) {
                    throw new Error(
                        "Vendor email missing from deleted subscription metadata."
                    );
                }

                const userResult =
                    await db.collection("user").updateOne(
                        {
                            email: vendorEmail,
                            role: "vendor",
                        },
                        {
                            $set: {
                                subscriptionPlan: "free",
                                premium: false,
                                subscriptionStatus: "canceled",
                                stripeSubscriptionId: null,
                                updatedAt: new Date(),
                            },
                        }
                    );

                console.log(
                    `Subscription canceled for ${vendorEmail}:`,
                    {
                        matchedCount: userResult.matchedCount,
                        modifiedCount: userResult.modifiedCount,
                    }
                );

                if (userResult.matchedCount === 0) {
                    throw new Error(
                        `Vendor not found: ${vendorEmail}`
                    );
                }

                break;
            }

            // ======================================
            // OTHER EVENTS
            // ======================================

            default: {
                console.log(
                    `Unhandled Stripe event: ${event.type}`
                );
            }
        }

        return res.status(200).json({
            received: true,
        });

    } catch (error) {
        console.error("Webhook processing error:", error);

        return res.status(500).json({
            message: "Webhook processing failed",
        });
    }
};
