# SiloKrate: Integrated Logistics & Sales Management System

SiloKrate is a robust, full-stack platform designed to bridge the gap
between sales operations and logistics coordination. It provides
real-time tracking, inventory management, and streamlined order
fulfillment to optimize supply chain efficiency.

------------------------------------------------------------------------

## 🚀 Key Features

### Unified Dashboard

A centralized hub for monitoring sales metrics and logistics statuses.

### Order Lifecycle Management

Automated transitions from order placement to final delivery.

### Inventory Tracking

Real-time stock level updates with low-stock alerts.

### Logistics Optimization

Tools for route planning and carrier management to reduce transit times.

### Secure Authentication

Role-based access control (RBAC) for admins, sales reps, and warehouse
staff.

------------------------------------------------------------------------

## 🛠️ Tech Stack

  Layer      Technology
  ---------- -----------------------------------------
  Frontend   React.js, Tailwind CSS
  Backend    Node.js, Express.js
  Database   Azure SQL Database

------------------------------------------------------------------------

## 🏗️ System Architecture

SiloKrate follows a decoupled architecture to ensure scalability and ease of
maintenance.\
The frontend communicates with backend APIs, which handle business
logic, authentication, and database operations.

------------------------------------------------------------------------

## 🏁 Getting Started

### Prerequisites

-   Node.js (v18.x or higher)
-   npm or yarn
-   An active Azure Subscription.
-   Azure Data Studio or SQL Server Management Studio (SSMS) for local debugging.

------------------------------------------------------------------------

## Installation

### 1. Clone the repository

``` bash
git clone https://github.com/Crystlfly/SiloKrate-logistics-orchestrator.git
cd SiloKrate-logistics-orchestrator
```

### 2. Install dependencies

``` bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 3. Environment Variables

Create a `.env` file in the **server** directory and add your
credentials:

    DB_SERVER=your-server-name.database.windows.net
    DB_NAME=SiloKrateDB
    DB_PASSWORD=your_secure_password
    DB_USER=your_username
    JWT_SECRET=your_secret_key

### 4. Run the application

``` bash
# From the root directory

# To run the server
cd server && node server.js

# To run the client
cd client && npm run dev
```

------------------------------------------------------------------------

## 📈 Future Roadmap

-   **AI Analytics** -- Predictive modeling for demand forecasting
-   **Mobile App** -- React Native application for field agents
-   **Global Tracking** -- Integration with GPS APIs for live vehicle
    tracking

------------------------------------------------------------------------

## 📄 License

This project is intended for educational and development purposes.
