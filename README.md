# 🍕 PizzaHub — Server Side

### Delicious Food. Seamless Experience.

**PizzaHub** is a full-stack food ordering and restaurant management platform. The server-side application provides RESTful APIs for managing users, menu items, food orders, vendor operations, customer dashboards, administrative activities, and subscription payments.

Built with **Node.js, Express.js, MongoDB, Better Auth, JWT verification, and Stripe**, the backend connects the PizzaHub client application with its database, authentication system, and payment services.

---

## 🚀 Live Application

🔗 **Client-side Website:** [Visit PizzaHub](https://pizzshub-client.vercel.app/)

## 📂 GitHub Repositories

- **Client-side:** [PizzaHub Client Repository](https://github.com/bhola16/pizzahub-client)
- **Server-side:** [PizzaHub Server Repository](https://github.com/bhola16/pizzahub-server)

---

## ✨ Features

### 1. 🚀 Express.js REST API

The backend is built using Express.js 5 and provides RESTful endpoints for the PizzaHub application.

- Handle HTTP requests and responses.
- Process JSON request bodies.
- Connect the frontend with MongoDB.
- Organize APIs using Express routers and controllers.
- Handle API errors with appropriate HTTP status codes.

### 2. 🗄️ MongoDB Database Integration

PizzaHub uses MongoDB to store and manage application data.

**Database name:**

`pizzahub`

The application uses the following main collections:

| Collection  | Purpose                                   |
| ----------- | ----------------------------------------- |
| `user`      | Stores user accounts and role information |
| `menuItems` | Stores restaurant menu items              |
| `orders`    | Stores customer food orders               |
| `payments`  | Stores payment transaction information    |

MongoDB is connected using the official MongoDB Node.js driver.

### 3. 🍕 Menu Management

**Public Endpoints:**

- `GET /menuItems`
- `GET /menuItems/featured`
- `GET /menuItems/:id`

Features include:

- Retrieve approved and active menu items.
- Search menu items by name.
- Filter menu items by category and location.
- Retrieve the latest six featured menu items.
- Retrieve individual menu item details.

### 4. 🏪 Vendor Menu Management

**Base Endpoint:** `/menuItems`

Authenticated vendors can manage their restaurant menu items.

- `POST /menuItems` — Add a new menu item.
- `PUT /menuItems/:id` — Update menu information.
- `DELETE /menuItems/:id` — Delete a menu item.
- `PATCH /menuItems/:id/availability` — Update menu availability.
- `GET /menuItems/count/:email` — Retrieve vendor menu item count.

**Vendor Menu Endpoint:**

`GET /vendor-menu-items/:email`

- Retrieve menu items belonging to a specific vendor.
- Verify vendor authentication and authorization.
- Manage vendor-specific menu information.

New menu items are submitted for administrative review before approval.

### 5. 👨‍💼 Admin Management

**Base Endpoint:** `/admin`

Administrative APIs allow authorized administrators to manage the platform.

**User Management:**

- `GET /admin/users` — Retrieve all users.
- `PATCH /admin/users/:id/block` — Block a user.
- `PATCH /admin/users/:id/unblock` — Unblock a user.

**Menu Management:**

- `GET /admin/menu-items` — Retrieve all menu items.
- `PATCH /admin/menu-items/:id/review` — Review and approve or reject menu items.
- `PATCH /admin/menu-items/:id/availability` — Update menu availability.
- `DELETE /admin/menu-items/:id` — Delete menu items.

**Dashboard and Transactions:**

- `GET /admin/dashboard/stats` — Retrieve administrative dashboard statistics.
- `GET /admin/transactions` — Retrieve payment transactions.

All administrative endpoints require JWT authentication and admin role verification.

### 6. 🛒 Customer Order Management

**Base Endpoint:** `/orders`

Customers can place and manage their food orders.

- `POST /orders` — Place a new order.
- `GET /orders/check` — Check whether an existing order exists.
- `GET /orders/customer/:email` — Retrieve customer orders.
- `PATCH /orders/:id/withdraw` — Withdraw a pending order.
- `DELETE /orders/:id/rejected` — Delete a rejected order.

The API supports:

- Customer authentication and authorization.
- Menu item validation.
- Order creation and storage.
- Existing order verification.
- Pending order withdrawal.
- Rejected order deletion.

### 7. 📦 Vendor Order Management

Vendors can manage incoming customer orders.

**Endpoints:**

- `GET /orders/vendor/:email` — Retrieve vendor orders.
- `PATCH /orders/:id/vendor-status` — Update order status.

Features include:

- Retrieve orders associated with a vendor.
- Manage incoming orders.
- Update order processing status.
- Verify vendor authentication and authorization.

### 8. 📊 Vendor Dashboard

**Endpoint:**

`GET /vendor-dashboard/:email`

The vendor dashboard provides:

- Total menu items.
- Active menu items.
- Pending orders.
- Accepted orders.
- Subscription plan.
- Subscription status.

The information is retrieved from MongoDB and returned as JSON.

### 9. 📈 Customer Dashboard

**Endpoints:**

- `GET /customer-dashboard/:email`
- `POST /customer-dashboard`

The customer dashboard provides order-related statistics.

- Total orders.
- Pending orders.
- Accepted orders.
- Rejected orders.

Authenticated customers can retrieve their dashboard information.

### 10. 💳 Stripe Subscription and Payment Integration

PizzaHub integrates Stripe to support premium vendor subscriptions.

**Base Endpoint:** `/api/payments`

Available endpoints:

- `POST /api/payments/create-checkout-session` — Create a Stripe Checkout session.
- `GET /api/payments/subscription` — Retrieve subscription information.
- `POST /api/payments/cancel-subscription` — Cancel a subscription.

**Subscription Features:**

- Stripe Checkout integration.
- Monthly Premium Vendor subscription.
- Subscription status management.
- Free and Premium subscription plans.
- Subscription information retrieval.
- Subscription cancellation.
- Payment transaction processing.

**Premium Subscription:**

| Plan    | Price     |
| ------- | --------- |
| Free    | $0        |
| Premium | $20/month |

### 11. 🔔 Stripe Webhook Integration

**Endpoint:**

`POST /api/payments/webhook`

The backend handles Stripe webhook events to synchronize payment and subscription information.

- Receive Stripe webhook events.
- Verify webhook signatures.
- Process subscription-related events.
- Update vendor subscription information.
- Maintain payment transaction records.

The webhook uses raw request body parsing to verify Stripe signatures correctly.

### 12. 🔐 Authentication and Authorization

PizzaHub uses **Better Auth** for authentication and JWT verification for protecting backend APIs.

The backend uses:

- `jose` for JWT verification.
- `createRemoteJWKSet` for retrieving public verification keys.
- `jwtVerify` for verifying JWT tokens.
- Better Auth for session and authentication management.

**Authentication Middleware:**

`verifyToken`

The middleware:

1. Checks the authorization header.
2. Extracts the Bearer token.
3. Retrieves the client's public JWKS endpoint.
4. Verifies the JWT signature.
5. Validates the token payload.
6. Attaches the verified user information to `req.user`.
7. Allows authenticated requests to continue.

### 13. 🛡️ Role-Based Authorization

PizzaHub implements separate authorization middleware for different user roles.

| Middleware       | Responsibility                     |
| ---------------- | ---------------------------------- |
| `verifyAdmin`    | Restricts access to administrators |
| `verifyVendor`   | Restricts access to vendors        |
| `verifyCustomer` | Restricts access to customers      |
| `verifyToken`    | Verifies JWT authentication        |

The role verification middleware retrieves the authenticated user from MongoDB and checks their assigned role.

Protected endpoints require the following authorization header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### 14. 🌐 CORS and JSON Middleware

The backend uses Express middleware to support frontend communication.

- `cors()` enables cross-origin requests.
- `express.json()` parses incoming JSON request bodies.
- `dotenv/config` loads environment variables.
- MongoDB connection middleware ensures database connectivity before processing API requests.

### 15. ☁️ Vercel Deployment

The backend is intended to be deployed using Vercel.

Deployment configuration should support:

- Express.js application routing.
- Serverless request handling.
- Environment variable configuration.
- MongoDB connectivity.
- Stripe webhook integration.

---

## 🛠️ Technologies Used

| Technology             | Purpose                               |
| ---------------------- | ------------------------------------- |
| Node.js                | JavaScript runtime                    |
| Express.js 5           | Backend web framework                 |
| MongoDB                | NoSQL database                        |
| MongoDB Node.js Driver | Database operations                   |
| Better Auth            | Authentication and session management |
| jose                   | JWT verification                      |
| JSON Web Token         | Token-based authentication            |
| Stripe                 | Subscription and payment processing   |
| CORS                   | Cross-origin resource sharing         |
| dotenv                 | Environment variable management       |
| Vercel                 | Backend deployment                    |

---

## 🔗 API Endpoints

The following table summarizes the backend routes.

| Method | Endpoint                                | Authentication      |
| ------ | --------------------------------------- | ------------------- |
| GET    | `/`                                     | Public              |
| GET    | `/menuItems`                            | Public              |
| GET    | `/menuItems/featured`                   | Public              |
| GET    | `/menuItems/:id`                        | JWT                 |
| POST   | `/menuItems`                            | Vendor              |
| PUT    | `/menuItems/:id`                        | Vendor              |
| DELETE | `/menuItems/:id`                        | Vendor              |
| PATCH  | `/menuItems/:id/availability`           | Vendor              |
| GET    | `/menuItems/count/:email`               | Vendor              |
| GET    | `/vendor-menu-items/:email`             | Vendor              |
| GET    | `/admin/users`                          | Admin               |
| PATCH  | `/admin/users/:id/block`                | Admin               |
| PATCH  | `/admin/users/:id/unblock`              | Admin               |
| GET    | `/admin/menu-items`                     | Admin               |
| PATCH  | `/admin/menu-items/:id/review`          | Admin               |
| PATCH  | `/admin/menu-items/:id/availability`    | Admin               |
| DELETE | `/admin/menu-items/:id`                 | Admin               |
| GET    | `/admin/dashboard/stats`                | Admin               |
| GET    | `/admin/transactions`                   | Admin               |
| POST   | `/orders`                               | Customer            |
| GET    | `/orders/check`                         | JWT                 |
| GET    | `/orders/customer/:email`               | Customer            |
| PATCH  | `/orders/:id/withdraw`                  | Customer            |
| DELETE | `/orders/:id/rejected`                  | Customer            |
| GET    | `/orders/vendor/:email`                 | Vendor              |
| PATCH  | `/orders/:id/vendor-status`             | Vendor              |
| GET    | `/vendor-dashboard/:email`              | Vendor              |
| GET    | `/customer-dashboard/:email`            | Customer            |
| POST   | `/customer-dashboard`                   | Customer            |
| POST   | `/api/payments/create-checkout-session` | Better Auth session |
| GET    | `/api/payments/subscription`            | Better Auth session |
| POST   | `/api/payments/cancel-subscription`     | Better Auth session |
| POST   | `/api/payments/webhook`                 | Stripe signature    |

**Authentication:** Protected endpoints require valid authentication and the appropriate user role where applicable.

---

## 📂 Project Structure

The server-side project is organized as follows:

```text
pizzahub-server/
│
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── stripe.js
│   │
│   ├── controllers/
│   │   ├── admin.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── menu.controller.js
│   │   ├── order.controller.js
│   │   └── payment.controller.js
│   │
│   ├── lib/
│   │   └── auth.js
│   │
│   ├── middleware/
│   │   ├── verifyAPI.js
│   │   ├── verifyAdmin.js
│   │   ├── verifyCustomer.js
│   │   └── verifyVendor.js
│   │
│   ├── routes/
│   │   ├── admin.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── menu.routes.js
│   │   ├── order.routes.js
│   │   └── payment.routes.js
│   │
│   ├── app.js
│   └── index.js
│
├── package.json
├── package-lock.json
└── .gitignore
```

### Important Files

**`src/app.js`**

Configures the Express application, CORS, MongoDB connection middleware, Stripe webhook, and API routes.

**`src/index.js`**

Connects to MongoDB and starts the Express server.

**`src/config/db.js`**

Manages MongoDB connection and database access.

**`src/config/stripe.js`**

Initializes the Stripe client.

**`src/lib/auth.js`**

Configures Better Auth, MongoDB integration, and JWT functionality.

**`src/middleware/`**

Contains JWT verification and role-based authorization middleware.

**`src/controllers/`**

Contains business logic for administrative operations, menus, orders, dashboards, and payments.

**`src/routes/`**

Defines the API endpoints and connects them with their corresponding controllers and middleware.

---

## ⚙️ Installation and Setup

Follow these steps to run the PizzaHub backend locally.

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- npm
- Git
- MongoDB Atlas account or a MongoDB database.
- Stripe account.
- PizzaHub client application with Better Auth configured.

### 1. Clone the Server Repository

```bash
git clone https://github.com/bhola16/pizzahub-server.git
```

### 2. Navigate to the Project Directory

```bash
cd pizzahub-server
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root.

Configure the following environment variables:

```env
# Server configuration
PORT=8000

# MongoDB connection
MONGODB_URL=your_mongodb_connection_string

# Frontend URL
CLIENT_URL=http://localhost:3000

# Better Auth configuration
BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:8000

# Stripe configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Vendor menu item upgrade limit (optional)
UPGRADE_LIMIT=3
```

Replace the placeholder values with your actual configuration.

**Important:**

- `MONGODB_URL` must contain a valid MongoDB connection string.
- `CLIENT_URL` must point to the frontend application.
- `BETTER_AUTH_SECRET` must contain a secure authentication secret.
- `BETTER_AUTH_URL` must point to the backend authentication base URL.
- `STRIPE_SECRET_KEY` is required for Stripe operations.
- `STRIPE_WEBHOOK_SECRET` is required for webhook signature verification.
- `UPGRADE_LIMIT` controls the configured menu item limit.

Never commit your `.env` file or sensitive credentials to GitHub.

### 5. Start the Backend Server

Run:

```bash
node src/index.js
```

The server will run at:

```text
http://localhost:8000
```

### 6. Verify the Server

Open your browser or API testing tool and visit:

[http://localhost:8000/](http://localhost:8000/)

Expected response:

```text
Pizza-Hub is running!
```

The backend is now ready to receive API requests.

---

## 🗄️ Database Configuration

PizzaHub uses MongoDB as its primary database.

**Database:**

`pizzahub`

### Main Collections

**1. user**

Stores user account information, including:

- User ID.
- Name and email.
- User role.
- Account status.
- Subscription plan and status.

**2. menuItems**

Stores restaurant menu information, including:

- Menu item name.
- Category.
- Description.
- Price.
- Images.
- Location.
- Vendor information.
- Approval status.
- Availability status.

**3. orders**

Stores customer order information, including:

- Customer information.
- Vendor information.
- Ordered menu item.
- Order details.
- Order status.
- Order timestamps.

**4. payments**

Stores payment transaction information associated with subscription processing.

---

## 🔐 Authentication Flow

PizzaHub uses Better Auth and JWT-based authentication to secure backend APIs.

### JWT Verification Process

```text
User logs in through the client
          |
          v
Better Auth authenticates the user
          |
          v
Client obtains authentication JWT
          |
          v
Client sends JWT with API request
          |
          v
Express verifyToken middleware
          |
          v
Server retrieves public JWKS
          |
          v
JWT signature is verified
          |
          v
Verified payload is attached to req.user
          |
          v
Role-based authorization middleware
          |
          v
Protected API endpoint processes request
```

The backend uses the client's JWKS endpoint to verify JWT signatures.

---

## 💳 Stripe Payment Flow

PizzaHub uses Stripe Checkout for Premium Vendor subscriptions.

```text
Vendor selects Premium Plan
          |
          v
Client requests checkout session
          |
          v
Backend verifies vendor session
          |
          v
Stripe Checkout Session is created
          |
          v
Vendor completes payment
          |
          v
Stripe sends webhook event
          |
          v
Backend verifies webhook signature
          |
          v
Subscription information is updated
          |
          v
Vendor Premium status is synchronized
```

---

## 📡 Client-Server Communication

The PizzaHub client communicates with the backend through HTTP requests.

**Local Development:**

```text
Client:  http://localhost:3000
Server:  http://localhost:8000
```

Configure the frontend environment variable:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production, replace the local backend URL with the deployed server URL.

The backend uses:

```env
CLIENT_URL=http://localhost:3000
```

For production, update it to the deployed frontend URL.

---

## ☁️ Deployment

The PizzaHub backend is intended for deployment on Vercel.

### Deployment Steps

1. Push the server-side project to GitHub.
2. Import the repository into Vercel.
3. Configure the required environment variables in Vercel project settings.
4. Configure the Express application for Vercel serverless execution.
5. Set `MONGODB_URL` to the production MongoDB connection string.
6. Set `CLIENT_URL` to the deployed frontend URL.
7. Configure Stripe production credentials and webhook endpoint.
8. Deploy the server.
9. Test the API endpoints and frontend integration.

**Important:** Ensure that the Express entry point is configured for Vercel serverless execution. The local `src/index.js` starts the server using `app.listen()`, so deployment requires a Vercel-compatible entry point and routing configuration.

---

## 🧪 API Testing

You can test the backend API using:

- [Postman](https://www.postman.com/)
- [Thunder Client](https://www.thunderclient.com/)
- Browser developer tools.
- `curl` commands.

### Example: Check Server Status

```bash
curl http://localhost:8000/
```

### Example: Retrieve Menu Items

```bash
curl http://localhost:8000/menuItems
```

### Example: Retrieve Featured Menu Items

```bash
curl http://localhost:8000/menuItems/featured
```

### Example: Retrieve Customer Orders

```bash
curl -X GET http://localhost:8000/orders/customer/customer@example.com \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Replace the example values with valid information and an actual authentication token.

---

## 🐛 Troubleshooting

### 1. MongoDB Connection Errors

- Verify the `MONGODB_URL` value.
- Check MongoDB credentials.
- Confirm database network access.
- Check MongoDB Atlas IP access settings.

### 2. JWT Verification Errors

- Verify the frontend `CLIENT_URL`.
- Confirm the client's JWKS endpoint is accessible.
- Check whether the JWT is valid and not expired.
- Ensure the authentication configurations match.

### 3. CORS Errors

- Verify the frontend and backend URLs.
- Check the browser network requests.
- Ensure the frontend origin is allowed by the backend.

### 4. Stripe Payment Errors

- Verify `STRIPE_SECRET_KEY`.
- Check `STRIPE_WEBHOOK_SECRET`.
- Confirm the webhook endpoint is correctly configured.
- Ensure the webhook receives the raw request body.

### 5. API Returns 401 Unauthorized

- Check whether the endpoint requires authentication.
- Ensure the request contains a valid Bearer token.
- Verify that the JWT has not expired.

### 6. API Returns 403 Forbidden

- Check whether the authenticated user's role matches the required role.
- Verify the user's role information in MongoDB.

---

## 🤝 Contributing

Suggestions and improvements are welcome.

If you want to contribute:

1. Fork the repository.
2. Create a new branch for your changes.
3. Make your changes.
4. Test the API endpoints.
5. Submit a pull request.

---

## 👨‍💻 Author

**Bholanath Bala**

- **GitHub:** [@bhola16](https://github.com/bhola16)
- **Client Repository:** [PizzaHub Client](https://github.com/bhola16/pizzahub-client)
- **Server Repository:** [PizzaHub Server](https://github.com/bhola16/pizzahub-server)
- **Live Website:** [PizzaHub](https://pizzshub-client.vercel.app/)

Electronics & Communication Engineering Graduate  
Khulna University, Bangladesh

---

## 📄 License

This project was developed for educational and portfolio purposes.

---

<p align="center">
  Made with ❤️ for food lovers.
  <br />
  <strong>PizzaHub — Delicious Food. Seamless Experience.</strong>
</p>
