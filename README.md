# 🍕 PizzaHub — Server Side

### Discover. Order. Enjoy.

**PizzaHub** is a full-stack pizza ordering and management platform that connects customers with food vendors through an online marketplace. The server-side application provides RESTful APIs for managing menu items, processing customer orders, handling vendor subscriptions, managing users, and monitoring platform activities.

Built with **Node.js, Express.js, MongoDB, Better Auth, JWT verification, and Stripe**, the backend connects the PizzaHub client application with its database, authentication system, and payment infrastructure.

---

## 🚀 Live Application

🔗 **Client-side Website:** [Visit PizzaHub](https://pizzshub-client.vercel.app/)

## 📂 GitHub Repositories

- **Client-side:** [PizzaHub Client Repository](https://github.com/bhola16/pizzahub-client)
- **Server-side:** [PizzaHub Server Repository](https://github.com/bhola16/pizzahub-server)

---

## ✨ Features

### 1. 🚀 Express.js REST API

The backend is built with Express.js 5 and provides RESTful endpoints for the PizzaHub application.

- Handle HTTP requests and responses.
- Process JSON request bodies.
- Manage menu items and food categories.
- Handle customer orders and vendor operations.
- Manage administrative activities.
- Integrate MongoDB and Stripe.
- Handle API errors with appropriate HTTP status codes.

### 2. 🗄️ MongoDB Database Integration

PizzaHub uses MongoDB as its primary database.

**Database name:**

`pizzahub`

The application uses the following main collections:

| Collection | Purpose |
|---|---|
| `user` | Stores user accounts and role information |
| `menuItems` | Stores food and menu item information |
| `orders` | Stores customer order information |
| `payments` | Stores vendor subscription payment records |

MongoDB is connected using the official MongoDB Node.js driver.

### 3. 🔐 Authentication and Role-Based Authorization

PizzaHub uses Better Auth and JWT verification to protect its backend APIs.

The authentication system supports:

- Email and password authentication.
- JWT token generation through Better Auth.
- JWT verification using the `jose` package.
- Role-based authorization.
- Customer, vendor, and administrator access control.
- Protected API endpoints.

The backend uses separate middleware for:

- `verifyToken` — verifies JWT authentication.
- `verifyCustomer` — checks customer authorization.
- `verifyVendor` — checks vendor authorization.
- `verifyAdmin` — checks administrator authorization.

Protected endpoints require the following authorization header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### 4. 🍕 Menu Management

PizzaHub provides menu management functionality for customers, vendors, and administrators.

**Public Menu Endpoints:**

- `GET /menuItems` — Retrieve available menu items.
- `GET /menuItems/featured` — Retrieve featured menu items.

**Vendor Menu Management:**

- Add new menu items.
- Retrieve individual menu items.
- Update menu item information.
- Delete vendor menu items.
- Update menu item availability.
- Retrieve vendor-specific menu items.
- Retrieve vendor menu item counts.

Vendors must be authenticated and authorized to manage their menu items.

### 5. ⭐ Featured Menu Items

The backend provides a dedicated endpoint for retrieving featured food items.

**Endpoint:**

`GET /menuItems/featured`

This endpoint allows the client application to display featured menu items separately from the complete menu.

### 6. 📦 Customer Order Management

Authenticated customers can place and manage their food orders.

**Endpoint:**

`POST /orders`

The order management system supports:

- Placing new orders.
- Checking existing orders.
- Retrieving customer orders.
- Withdrawing placed orders.
- Deleting rejected orders.

Customer authorization is required for customer-specific order operations.

### 7. 🏪 Vendor Order Management

Vendors can manage orders associated with their business.

**Endpoints:**

- `GET /orders/vendor/:email`
- `PATCH /orders/:id/vendor-status`

The functionality includes:

- Retrieve vendor-specific orders.
- Update order status.
- Manage incoming customer orders.

Only authenticated and authorized vendors can access these operations.

### 8. 📊 Customer Dashboard

PizzaHub provides customer dashboard APIs for retrieving customer-related information.

**Endpoints:**

- `GET /customer-dashboard/:email`
- `POST /customer-dashboard`

The dashboard provides customer-related data through the backend, including order and account information.

### 9. 📈 Vendor Dashboard

Vendors can access their dashboard through a protected API.

**Endpoint:**

`GET /vendor-dashboard/:email`

The vendor dashboard integrates information from the user, menu item, and order collections to provide vendor-related statistics and information.

### 10. 👨‍💼 Admin Management

PizzaHub includes administrative functionality for managing platform users and menu items.

**User Management:**

- Retrieve all users.
- Block user accounts.
- Unblock user accounts.

**Menu Management:**

- Retrieve all menu items.
- Review submitted menu items.
- Update menu item approval status.
- Manage menu item availability.
- Delete menu items.

All administrative endpoints require JWT authentication and administrator authorization.

### 11. 📊 Admin Dashboard Statistics

**Endpoint:**

`GET /admin/dashboard/stats`

The administrator dashboard retrieves platform statistics, including:

- Total users.
- Total vendors.
- Total customers.
- Total menu items.
- Pending menu items.
- Total payment transactions.

### 12. 💳 Stripe Payment Integration

PizzaHub integrates Stripe Checkout to manage vendor Premium subscriptions.

The platform supports a monthly Premium subscription.

**Subscription Price:**

`$20.00 / month`

**Features:**

- Create Stripe Checkout sessions.
- Redirect vendors to Stripe Checkout.
- Retrieve subscription information.
- Cancel active subscriptions.
- Verify Stripe webhook signatures.
- Synchronize subscription information with MongoDB.
- Store subscription payment records.
- Manage Premium and Free subscription plans.

### 13. 🔄 Stripe Webhook Integration

**Endpoint:**

`POST /api/payments/webhook`

The backend processes Stripe webhook events to synchronize subscription and payment information.

The webhook implementation handles events including:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`

Webhook signature verification is performed using the Stripe webhook secret.

The webhook endpoint uses Express raw-body middleware and is registered before `express.json()` to support Stripe signature verification.

### 14. 💎 Vendor Subscription Management

PizzaHub supports two vendor subscription plans:

| Plan | Description |
|---|---|
| Free | Standard vendor subscription |
| Premium | Paid subscription with Premium status |

Vendors can:

- Create a Premium subscription.
- Retrieve their subscription status.
- Cancel an active subscription.

Subscription information is synchronized through Stripe webhooks and stored in the user collection.

### 15. 🌐 CORS and Middleware Configuration

The backend uses Express middleware to support secure communication between the client and server.

- `cors()` enables cross-origin requests.
- `express.json()` parses incoming JSON request bodies.
- `express.raw()` handles Stripe webhook payloads.
- `dotenv/config` loads environment variables.
- MongoDB connection middleware ensures database connectivity before processing requests.

### 16. ☁️ Deployment Configuration

The backend is structured for deployment using Node.js-compatible hosting platforms.

The application supports:

- Environment-based port configuration.
- MongoDB Atlas connectivity.
- Client-server communication.
- Stripe payment integration.
- Production environment variables.

---

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js 5 | Backend web framework |
| MongoDB | NoSQL database |
| MongoDB Node.js Driver | Database operations |
| Better Auth | Authentication system |
| jose | JWT verification |
| jsonwebtoken | JWT-related functionality |
| Stripe | Payment and subscription processing |
| Multer | File upload middleware dependency |
| CORS | Cross-origin resource sharing |
| dotenv | Environment variable management |
| Vercel | Client-side deployment |

---

## 🔗 API Endpoints

The following table summarizes the available backend routes.

### Menu APIs

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| GET | `/menuItems` | Public | Retrieve menu items |
| GET | `/menuItems/featured` | Public | Retrieve featured items |
| GET | `/menuItems/:id` | Protected | Retrieve individual menu item |
| POST | `/menuItems` | Vendor | Add a menu item |
| PUT | `/menuItems/:id` | Vendor | Update a menu item |
| DELETE | `/menuItems/:id` | Vendor | Delete a menu item |
| PATCH | `/menuItems/:id/availability` | Vendor | Update menu availability |
| GET | `/menuItems/count/:email` | Vendor | Retrieve vendor menu count |
| GET | `/vendor-menu-items/:email` | Vendor | Retrieve vendor menu items |

### Order APIs

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| POST | `/orders` | Customer | Place an order |
| GET | `/orders/check` | Protected | Check existing orders |
| GET | `/orders/customer/:email` | Customer | Retrieve customer orders |
| GET | `/orders/vendor/:email` | Vendor | Retrieve vendor orders |
| PATCH | `/orders/:id/withdraw` | Customer | Withdraw an order |
| DELETE | `/orders/:id/rejected` | Customer | Delete rejected order |
| PATCH | `/orders/:id/vendor-status` | Vendor | Update order status |

### Dashboard APIs

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| GET | `/customer-dashboard/:email` | Customer | Retrieve customer dashboard |
| POST | `/customer-dashboard` | Customer | Submit customer dashboard data |
| GET | `/vendor-dashboard/:email` | Vendor | Retrieve vendor dashboard |

### Admin APIs

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| GET | `/admin/users` | Admin | Retrieve all users |
| PATCH | `/admin/users/:id/block` | Admin | Block a user |
| PATCH | `/admin/users/:id/unblock` | Admin | Unblock a user |
| GET | `/admin/menu-items` | Admin | Retrieve all menu items |
| PATCH | `/admin/menu-items/:id/review` | Admin | Review a menu item |
| PATCH | `/admin/menu-items/:id/availability` | Admin | Update menu availability |
| DELETE | `/admin/menu-items/:id` | Admin | Delete a menu item |
| GET | `/admin/dashboard/stats` | Admin | Retrieve dashboard statistics |
| GET | `/admin/transactions` | Admin | Retrieve payment transactions |

### Payment APIs

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| POST | `/api/payments/create-checkout-session` | Vendor | Create Stripe Checkout session |
| GET | `/api/payments/subscription` | Vendor | Retrieve subscription information |
| POST | `/api/payments/cancel-subscription` | Vendor | Cancel Premium subscription |
| POST | `/api/payments/webhook` | Stripe signature | Process Stripe webhook events |

**Authentication:** Protected endpoints require a valid Bearer JWT token and the appropriate user role. The Stripe webhook endpoint uses Stripe signature verification instead of user JWT authentication.

---

## 📂 Project Structure

The server-side project is organized as follows:

```text
pizzahub-server/
│
├── src/
│   │
│   ├── app.js
│   ├── index.js
│   │
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
│   └── routes/
│       ├── admin.routes.js
│       ├── dashboard.routes.js
│       ├── menu.routes.js
│       ├── order.routes.js
│       └── payment.routes.js
│
├── package.json
├── package-lock.json
└── .gitignore
```

### Important Files

**`src/app.js`**

The main Express application file. It contains:

- Express application configuration.
- CORS configuration.
- MongoDB connection middleware.
- Stripe webhook configuration.
- JSON body parsing.
- API route registration.

**`src/index.js`**

The application entry point. It initializes the MongoDB connection and starts the Express server.

**`src/config/db.js`**

Handles MongoDB client initialization, database selection, and database connection management.

**`src/config/stripe.js`**

Initializes the Stripe SDK using the configured secret key.

**`src/lib/auth.js`**

Configures Better Auth with MongoDB integration, email and password authentication, JWT functionality, and user role fields.

**`src/middleware/**`**

Contains authentication and authorization middleware for customers, vendors, and administrators.

**`src/controllers/**`**

Contains the business logic for menu management, order processing, dashboards, administration, and payments.

**`src/routes/**`**

Defines the REST API endpoints and connects them with the corresponding controllers and middleware.

---

## ⚙️ Installation and Setup

Follow these steps to run the PizzaHub backend locally.

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- npm
- Git
- A MongoDB database or MongoDB Atlas account.
- A Stripe account for payment integration.
- A configured PizzaHub client application.

### 1. Clone the Server Repository

Open your terminal and run:

```bash
git clone https://github.com/bhola16/pizzahub-server.git
```

### 2. Navigate to the Project Directory

```bash
cd pizzahub-server
```

### 3. Install Dependencies

Install the required packages:

```bash
npm install
```

**Note:** The authentication configuration imports `@better-auth/mongo-adapter`. Ensure this package is installed and declared in `package.json` if it is not already available in your project dependencies.

### 4. Configure Environment Variables

Create a `.env` file in the project root.

Configure the following environment variables:

```env
# Server configuration
PORT=8000

# MongoDB connection string
MONGODB_URL=your_mongodb_connection_string

# Client application URL
CLIENT_URL=http://localhost:3000

# Better Auth configuration
BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:3000

# Stripe configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

Replace all placeholder values with your actual configuration.

**Important:**

- `MONGODB_URL` must contain a valid MongoDB connection string.
- `CLIENT_URL` must point to your frontend application.
- `BETTER_AUTH_SECRET` must be a secure authentication secret.
- `BETTER_AUTH_URL` must match the configured Better Auth base URL.
- `STRIPE_SECRET_KEY` must contain your Stripe secret API key.
- `STRIPE_WEBHOOK_SECRET` must contain your Stripe webhook signing secret.
- Never commit your `.env` file or secret credentials to GitHub.

### 5. Configure Stripe Webhooks

Configure your Stripe webhook endpoint:

```text
http://localhost:8000/api/payments/webhook
```

For local development, you can use the Stripe CLI to forward webhook events to your server.

Make sure the webhook signing secret matches `STRIPE_WEBHOOK_SECRET`.

Configure the relevant Stripe events handled by the backend:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`

### 6. Start the Backend Server

For development:

```bash
npm run dev
```

For production:

```bash
npm start
```

The server will start on port:

```text
8000
```

The application also supports a custom port through the `PORT` environment variable.

### 7. Verify the Server

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

- User information.
- Email address.
- Account role.
- Subscription plan.
- Premium subscription information.
- Stripe customer and subscription references.

**2. menuItems**

Stores food and menu item information managed by vendors and administrators.

**3. orders**

Stores customer order information and associated order management data.

**4. payments**

Stores vendor subscription payment records, including:

- Vendor ID.
- Vendor email.
- Payment amount.
- Currency.
- Payment status.
- Stripe Checkout session ID.
- Stripe payment intent.
- Stripe customer ID.
- Stripe subscription ID.
- Payment creation timestamp.

Better Auth also uses MongoDB for its authentication-related data through its MongoDB adapter.

---

## 🔐 Authentication and Authorization Flow

PizzaHub uses Better Auth and JWT verification to secure its protected API endpoints.

### Authentication Process

```text
User signs in through the client
          |
          v
Better Auth handles authentication
          |
          v
Client obtains a JWT
          |
          v
Client sends JWT with API request
          |
          v
Express verifyToken middleware
          |
          v
Server retrieves the client's JWKS
          |
          v
JWT signature is verified using jose
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

### Role-Based Access Control

PizzaHub supports three primary user roles:

| Role | Access |
|---|---|
| Customer | Customer dashboard and order operations |
| Vendor | Vendor dashboard, menu, orders, and subscriptions |
| Admin | User management, menu moderation, and platform statistics |

If the authentication token is missing, invalid, or expired, the server returns an unauthorized response.

If the user does not have the required role, the server returns a forbidden response.

---

## 💳 Stripe Subscription Flow

PizzaHub uses Stripe Checkout to process vendor Premium subscriptions.

### Subscription Process

```text
Vendor logs in
       |
       v
Vendor selects Premium Plan
       |
       v
Client requests Checkout Session
       |
       v
Backend verifies vendor authorization
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
MongoDB stores payment information
       |
       v
Vendor receives Premium status
```

### Subscription Plans

| Plan | Monthly Price |
|---|---:|
| Free | $0 |
| Premium | $20 |

The backend synchronizes subscription status with Stripe webhook events.

---

## 🌐 Client-Server Communication

The PizzaHub client communicates with the backend through HTTP requests.

**Local development:**

```text
Client:  http://localhost:3000
Server:  http://localhost:8000
```

The client should use the backend URL in its environment configuration.

For example:

```env
NEXT_PUBLIC_SERVER_API_URL=http://localhost:8000
```

The backend uses:

```env
CLIENT_URL=http://localhost:3000
```

For production deployment, update these URLs to match the deployed client and server environments.

---

## ☁️ Deployment

The backend can be deployed using a Node.js-compatible hosting platform.

### Deployment Steps

1. Push the server-side project to GitHub.
2. Import the repository into your hosting platform.
3. Configure the required environment variables.
4. Set `MONGODB_URL` to your production MongoDB connection string.
5. Set `CLIENT_URL` to your deployed client application URL.
6. Configure Better Auth production settings.
7. Configure Stripe production API credentials.
8. Register the production Stripe webhook endpoint.
9. Deploy the backend.
10. Verify the server status endpoint.
11. Test the API endpoints and frontend integration.

**Important:** Ensure that the production Stripe webhook signing secret is configured correctly and that the backend is accessible through the registered webhook URL.

---

## 🧪 API Testing

You can test the backend API using tools such as:

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

### Example: Place an Order

```bash
curl -X POST http://localhost:8000/orders \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{
  "example": "Replace with the order payload expected by the API"
}'
```

Replace the example payload with the actual order structure used by the client application.

---

## 🐛 Troubleshooting

### 1. MongoDB Connection Errors

- Verify the `MONGODB_URL` value.
- Check your MongoDB credentials.
- Confirm that the database is accessible.
- Check MongoDB Atlas network access settings.

### 2. JWT Verification Errors

- Verify that `CLIENT_URL` is correct.
- Confirm that the client JWKS endpoint is accessible.
- Check whether the token is valid and not expired.
- Ensure that the client and server authentication configurations match.

### 3. CORS Errors

- Verify the frontend and backend URLs.
- Check browser network requests.
- Ensure that the server's CORS configuration allows the client application.

### 4. Stripe Payment Errors

- Verify the `STRIPE_SECRET_KEY`.
- Check the Stripe API configuration.
- Confirm that the webhook endpoint is accessible.
- Verify the `STRIPE_WEBHOOK_SECRET`.
- Check Stripe webhook event delivery logs.

### 5. Unauthorized API Requests

- Check whether the endpoint requires authentication.
- Confirm that the request contains a Bearer token.
- Verify the JWT using the configured JWKS endpoint.
- Ensure that the authenticated user has the required role.

### 6. Port Already in Use

The server uses port `8000` by default.

If another application is already using that port, stop the conflicting process or configure another port using the `PORT` environment variable.

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

This project was developed as a web application project for educational and practical learning purposes.

---

<p align="center">
  Made with ❤️ for pizza lovers.
  <br />
  <strong>PizzaHub — Discover. Order. Enjoy.</strong>
</p>