# My Shop UI - API Documentation

This document outlines the API endpoints consumed by the `my-shop-ui` React application. All URLs are relative to `process.env.REACT_APP_API_URL`.

---

## 1. Products

### `GET /products`

*   **Description**: Fetches a list of products.
*   **Query Params**:
    *   `?status=available`: Filters for products that are available for sale.
*   **Used In**: `ProductListingPage.js`, `AdminDashboardPage.js`

---

## 2. Users & Authentication

### `GET /users`

*   **Description**: Fetches user records.
*   **Query Params**:
    *   `?id={id1}&id={id2}...`: Fetches multiple specific users by their IDs.
*   **Used In**: `AdminDashboardPage.js`, `ProductListingPage.js`, `MyOrdersPage.js`

---

## 3. Orders

### `POST /orders`

*   **Description**: Creates a new order.
*   **Used In**: `CheckoutPage.js`

### `GET /orders`

*   **Description**: Fetches a list of orders.
*   **Query Params**:
    *   `?userId={userId}`: Fetches all orders for a specific user.
    *   `?deliveryPartnerId={partnerId}`: Fetches all orders assigned to a specific delivery partner.
*   **Used In**: `AdminDashboardPage.js`, `MyOrdersPage.js`, `DeliveryPartnerDashboardPage.js`

### `GET /orders/{orderId}`

*   **Description**: Fetches the details for a single order.
*   **Query Params**:
    *   `?_expand=deliveryPartner`: Includes the full `deliveryPartner` object in the response.
*   **Used In**: `AdminOrderDetailsPage.js`, `OrderTrackingPage.js`

### `PATCH /orders/{orderId}`

*   **Description**: Updates the status or `deliveryPartnerId` of an order.
*   **Used In**: `DeliveryPartnerDashboardPage.js`, `AdminDashboardPage.js`

---

## 4. Delivery Partners & Fleet

### `GET /deliveryPartners`

*   **Description**: Fetches all delivery partner records.
*   **Query Params**:
    *   `?userId={userId}`: Fetches the partner profile associated with a specific user ID.
*   **Used In**: `AdminDashboardPage.js`, `DeliveryPartnerDashboardPage.js`

### `GET /deliveryVehicles/{vehicleId}`

*   **Description**: Fetches the details for a specific delivery vehicle.
*   **Used In**: `AdminOrderDetailsPage.js`, `OrderTrackingPage.js`

### `PATCH /deliveryPartners/{partnerId}`

*   **Description**: Updates a delivery partner's profile, typically their `isAvailable` status.
*   **Used In**: `DeliveryPartnerDashboardPage.js`

---

## 5. Reports

### `GET /reports`
*   **Description**: Fetches all report records for the admin dashboard.
*   **Used In**: `AdminDashboardPage.js`