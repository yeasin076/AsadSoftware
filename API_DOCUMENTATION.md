# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 🔐 Authentication Endpoints

### Login
**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@phoneinventory.com",
      "full_name": "System Administrator",
      "role": "admin"
    }
  }
}
```

### Get Current User
**GET** `/auth/me` 🔒

Get currently authenticated user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@phoneinventory.com",
    "full_name": "System Administrator",
    "role": "admin",
    "created_at": "2026-03-01T00:00:00.000Z"
  }
}
```

### Register User
**POST** `/auth/register` 🔒 (Admin Only)

Register a new user account.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "full_name": "New User",
  "role": "admin"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 2,
    "username": "newuser",
    "email": "newuser@example.com",
    "role": "admin"
  }
}
```

---

## 📊 Dashboard Endpoints

### Get Dashboard Statistics
**GET** `/dashboard/stats` 🔒

Retrieve comprehensive dashboard statistics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalInStock": 7,
    "totalSold": 3,
    "totalProfit": "448.00",
    "lowStockAlerts": [
      {
        "brand": "Google",
        "count": 2
      }
    ],
    "recentSales": [
      {
        "id": 1,
        "phone_id": 8,
        "customer_name": "John Smith",
        "customer_phone": "+1-555-0101",
        "selling_price": "699.00",
        "buying_price": "550.00",
        "profit": "149.00",
        "sale_date": "2026-03-01T12:00:00.000Z",
        "brand": "Apple",
        "model": "iPhone 13",
        "imei": "351234567890130"
      }
    ],
    "topBrands": [
      {
        "brand": "Apple",
        "sales_count": 2,
        "total_profit": "298.00"
      }
    ]
  }
}
```

---

## 📦 Inventory (Phones) Endpoints

### Get All Phones
**GET** `/phones` 🔒

Retrieve paginated list of phones with optional filters.

**Query Parameters:**
- `search` (optional): Search by brand, model, or IMEI
- `brand` (optional): Filter by brand
- `status` (optional): Filter by status (In Stock / Sold)
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Example:**
```
GET /phones?search=iPhone&brand=Apple&status=In Stock&page=1&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "brand": "Apple",
      "model": "iPhone 15 Pro",
      "storage": "256GB",
      "color": "Natural Titanium",
      "imei": "351234567890123",
      "buying_price": "950.00",
      "selling_price": "1199.00",
      "supplier_name": "Tech Distributors Inc",
      "status": "In Stock",
      "created_at": "2026-03-01T00:00:00.000Z",
      "updated_at": "2026-03-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 7,
    "itemsPerPage": 10
  }
}
```

### Get Phone by ID
**GET** `/phones/:id` 🔒

Retrieve a single phone by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "brand": "Apple",
    "model": "iPhone 15 Pro",
    "storage": "256GB",
    "color": "Natural Titanium",
    "imei": "351234567890123",
    "buying_price": "950.00",
    "selling_price": "1199.00",
    "supplier_name": "Tech Distributors Inc",
    "status": "In Stock",
    "created_at": "2026-03-01T00:00:00.000Z",
    "updated_at": "2026-03-01T00:00:00.000Z"
  }
}
```

### Add New Phone
**POST** `/phones` 🔒

Add a new phone to inventory.

**Request Body:**
```json
{
  "brand": "Apple",
  "model": "iPhone 15 Pro Max",
  "storage": "512GB",
  "color": "Blue Titanium",
  "imei": "351234567890999",
  "buying_price": 1100.00,
  "selling_price": 1399.00,
  "supplier_name": "Apple Direct",
  "status": "In Stock"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Phone added successfully",
  "data": {
    "id": 11,
    "brand": "Apple",
    "model": "iPhone 15 Pro Max",
    "storage": "512GB",
    "color": "Blue Titanium",
    "imei": "351234567890999",
    "buying_price": 1100.00,
    "selling_price": 1399.00,
    "supplier_name": "Apple Direct",
    "status": "In Stock"
  }
}
```

### Update Phone
**PUT** `/phones/:id` 🔒

Update an existing phone.

**Request Body:** (same as Add Phone)

**Response (200):**
```json
{
  "success": true,
  "message": "Phone updated successfully"
}
```

### Delete Phone
**DELETE** `/phones/:id` 🔒

Delete a phone from inventory.

**Response (200):**
```json
{
  "success": true,
  "message": "Phone deleted successfully"
}
```

### Get All Brands
**GET** `/phones/brands/list` 🔒

Retrieve list of all unique brands.

**Response (200):**
```json
{
  "success": true,
  "data": [
    "Apple",
    "Google",
    "OnePlus",
    "Samsung",
    "Xiaomi"
  ]
}
```

---

## 💰 Sales Endpoints

### Sell a Phone
**POST** `/sales` 🔒

Process a phone sale.

**Request Body:**
```json
{
  "phone_id": 1,
  "customer_name": "John Doe",
  "customer_phone": "+1-555-1234",
  "notes": "Customer requested express shipping"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Phone sold successfully",
  "data": {
    "sale_id": 4,
    "profit": "249.00"
  }
}
```

**Notes:**
- Phone status automatically changes to "Sold"
- Profit is calculated automatically (selling_price - buying_price)
- Sale date is set to current timestamp

### Get All Sales
**GET** `/sales` 🔒

Retrieve paginated list of sales with optional filters.

**Query Parameters:**
- `brand` (optional): Filter by brand
- `startDate` (optional): Filter by start date (YYYY-MM-DD)
- `endDate` (optional): Filter by end date (YYYY-MM-DD)
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Example:**
```
GET /sales?brand=Apple&startDate=2026-03-01&page=1&limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "phone_id": 8,
      "customer_name": "John Smith",
      "customer_phone": "+1-555-0101",
      "selling_price": "699.00",
      "buying_price": "550.00",
      "profit": "149.00",
      "sale_date": "2026-03-01T12:00:00.000Z",
      "notes": "First time customer",
      "brand": "Apple",
      "model": "iPhone 13",
      "storage": "128GB",
      "color": "Midnight",
      "imei": "351234567890130"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 3,
    "itemsPerPage": 10
  }
}
```

### Get Sale by ID
**GET** `/sales/:id` 🔒

Retrieve a single sale by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "phone_id": 8,
    "customer_name": "John Smith",
    "customer_phone": "+1-555-0101",
    "selling_price": "699.00",
    "buying_price": "550.00",
    "profit": "149.00",
    "sale_date": "2026-03-01T12:00:00.000Z",
    "notes": "First time customer",
    "brand": "Apple",
    "model": "iPhone 13",
    "storage": "128GB",
    "color": "Midnight",
    "imei": "351234567890130"
  }
}
```

---

## 📈 Reports Endpoints

### Get Daily Report
**GET** `/reports/daily` 🔒

Retrieve sales report for a specific date.

**Query Parameters:**
- `date` (optional, default: today): Date in YYYY-MM-DD format

**Example:**
```
GET /reports/daily?date=2026-03-01
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "date": "2026-03-01",
    "summary": {
      "totalSales": 3,
      "totalRevenue": "2097.00",
      "totalProfit": "448.00"
    },
    "sales": [
      {
        "id": 1,
        "phone_id": 8,
        "customer_name": "John Smith",
        "customer_phone": "+1-555-0101",
        "selling_price": "699.00",
        "buying_price": "550.00",
        "profit": "149.00",
        "sale_date": "2026-03-01T12:00:00.000Z",
        "brand": "Apple",
        "model": "iPhone 13",
        "imei": "351234567890130"
      }
    ]
  }
}
```

### Get Monthly Report
**GET** `/reports/monthly` 🔒

Retrieve sales report for a specific month.

**Query Parameters:**
- `month` (optional, default: current month): Month number (1-12)
- `year` (optional, default: current year): Year (YYYY)

**Example:**
```
GET /reports/monthly?month=3&year=2026
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "month": 3,
    "year": 2026,
    "summary": {
      "totalSales": 3,
      "totalRevenue": "2097.00",
      "totalProfit": "448.00"
    },
    "dailyBreakdown": [
      {
        "date": "2026-03-01",
        "sales_count": 3,
        "revenue": "2097.00",
        "profit": "448.00"
      }
    ],
    "brandBreakdown": [
      {
        "brand": "Apple",
        "sales_count": 2,
        "revenue": "1498.00",
        "profit": "298.00"
      },
      {
        "brand": "Samsung",
        "sales_count": 1,
        "revenue": "799.00",
        "profit": "199.00"
      }
    ]
  }
}
```

### Get Brand Report
**GET** `/reports/brand` 🔒

Retrieve all-time sales report for a specific brand.

**Query Parameters:**
- `brand` (required): Brand name

**Example:**
```
GET /reports/brand?brand=Apple
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "brand": "Apple",
    "summary": {
      "totalSales": 2,
      "totalRevenue": "1498.00",
      "totalProfit": "298.00"
    },
    "sales": [
      {
        "id": 1,
        "phone_id": 8,
        "customer_name": "John Smith",
        "customer_phone": "+1-555-0101",
        "selling_price": "699.00",
        "buying_price": "550.00",
        "profit": "149.00",
        "sale_date": "2026-03-01T12:00:00.000Z",
        "brand": "Apple",
        "model": "iPhone 13",
        "imei": "351234567890130"
      }
    ]
  }
}
```

---

## Error Responses

All endpoints return standardized error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Duplicate entry. Record already exists."
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Phone not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Server error"
}
```

---

## Status Codes

- `200` - OK (Success)
- `201` - Created (Resource created successfully)
- `400` - Bad Request (Validation error or duplicate entry)
- `401` - Unauthorized (Missing or invalid token)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found (Resource not found)
- `500` - Internal Server Error (Server-side error)

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Get Phones (with token)
```bash
curl -X GET http://localhost:5000/api/phones \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Add Phone
```bash
curl -X POST http://localhost:5000/api/phones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "brand": "Apple",
    "model": "iPhone 15",
    "storage": "256GB",
    "color": "Black",
    "imei": "123456789012345",
    "buying_price": 800,
    "selling_price": 999,
    "supplier_name": "Apple Store"
  }'
```

### Sell Phone
```bash
curl -X POST http://localhost:5000/api/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "phone_id": 1,
    "customer_name": "John Doe",
    "customer_phone": "+1-555-1234"
  }'
```

---

## Rate Limiting

Currently, there is no rate limiting implemented. For production deployment, consider implementing rate limiting using packages like `express-rate-limit`.

## CORS Configuration

The API allows cross-origin requests from all origins. For production, update the CORS configuration in `server.js` to allow only specific origins.

---

**API Version:** 1.0.0  
**Last Updated:** March 1, 2026
