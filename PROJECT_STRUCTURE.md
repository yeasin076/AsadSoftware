# Asad's Inventory - Project Structure

```
AsadSoftware/
│
├── 📄 index.html                    # Project landing page with setup guide
├── 📄 README.md                     # Complete documentation
├── 📄 QUICKSTART.md                 # Quick start guide
├── 📄 setup.ps1                     # Automated setup script (Windows)
│
├── 📁 backend/                      # Node.js/Express.js Backend
│   ├── 📁 config/
│   │   ├── database.js              # MySQL connection & pool setup
│   │   └── database.sql             # Database schema & sample data
│   │
│   ├── 📁 controllers/              # Business logic layer
│   │   ├── authController.js        # Login, register, JWT tokens
│   │   ├── dashboardController.js   # Dashboard statistics & analytics
│   │   ├── phoneController.js       # CRUD operations for phones
│   │   ├── salesController.js       # Sales processing & records
│   │   └── reportController.js      # Reports generation (daily/monthly/brand)
│   │
│   ├── 📁 middleware/               # Express middleware
│   │   ├── auth.js                  # JWT verification & role checking
│   │   └── errorHandler.js          # Centralized error handling
│   │
│   ├── 📁 routes/                   # API route definitions
│   │   ├── authRoutes.js            # /api/auth/*
│   │   ├── dashboardRoutes.js       # /api/dashboard/*
│   │   ├── phoneRoutes.js           # /api/phones/*
│   │   ├── salesRoutes.js           # /api/sales/*
│   │   └── reportRoutes.js          # /api/reports/*
│   │
│   ├── 📄 server.js                 # Express app entry point
│   ├── 📄 package.json              # Backend dependencies
│   ├── 📄 .env                      # Environment variables
│   ├── 📄 .env.example              # Environment template
│   └── 📄 .gitignore                # Git ignore rules
│
├── 📁 frontend/                     # React.js Frontend
│   ├── 📁 public/
│   │
│   ├── 📁 src/
│   │   ├── 📁 components/           # Reusable React components
│   │   │   ├── Layout.jsx           # Main layout with sidebar & navbar
│   │   │   └── PrivateRoute.jsx     # Protected route wrapper
│   │   │
│   │   ├── 📁 context/              # React Context API
│   │   │   └── AuthContext.jsx      # Authentication state management
│   │   │
│   │   ├── 📁 pages/                # Main application pages
│   │   │   ├── Login.jsx            # Login page with JWT auth
│   │   │   ├── Dashboard.jsx        # Dashboard with stats & charts
│   │   │   ├── Inventory.jsx        # Inventory management (CRUD)
│   │   │   ├── Sales.jsx            # Sales processing page
│   │   │   └── Reports.jsx          # Reports with analytics
│   │   │
│   │   ├── 📁 utils/                # Utility functions
│   │   │   └── api.js               # Axios instance with interceptors
│   │   │
│   │   ├── 📄 App.jsx               # Main app with routing
│   │   ├── 📄 main.jsx              # React entry point
│   │   └── 📄 index.css             # Tailwind CSS & custom styles
│   │
│   ├── 📄 index.html                # HTML template
│   ├── 📄 vite.config.js            # Vite build configuration
│   ├── 📄 tailwind.config.js        # Tailwind CSS configuration
│   ├── 📄 postcss.config.js         # PostCSS configuration
│   ├── 📄 package.json              # Frontend dependencies
│   ├── 📄 .env.example              # Environment template
│   └── 📄 .gitignore                # Git ignore rules
│
└── 📁 node_modules/                 # Dependencies (not committed)
```

## Component Relationships

### Backend Flow
```
Client Request
    ↓
Express Server (server.js)
    ↓
Routes (authRoutes, phoneRoutes, etc.)
    ↓
Middleware (auth.js - JWT verification)
    ↓
Controllers (authController, phoneController, etc.)
    ↓
Database (MySQL via pool)
    ↓
Response (JSON)
```

### Frontend Flow
```
User Access
    ↓
App.jsx (Router)
    ↓
PrivateRoute (Auth Check)
    ↓
Layout (Sidebar + Content)
    ↓
Page Component (Dashboard, Inventory, etc.)
    ↓
API Call (utils/api.js)
    ↓
Backend API
```

## Key Files Description

### Backend

**server.js**
- Express app initialization
- Middleware setup (CORS, JSON parser)
- Route registration
- Database connection test
- Server startup

**config/database.js**
- MySQL connection pool
- Database configuration
- Connection testing

**controllers/**
- Business logic for each module
- Request/response handling
- Data validation
- Error handling

**middleware/auth.js**
- JWT token verification
- User authentication
- Role-based access control

**routes/**
- RESTful API endpoints
- Route protection
- Request mapping to controllers

### Frontend

**main.jsx**
- React app bootstrap
- AuthProvider wrapper
- ToastContainer for notifications

**App.jsx**
- React Router setup
- Route definitions
- Protected route implementation

**components/Layout.jsx**
- Sidebar navigation
- Header bar
- Responsive menu
- User info display

**pages/**
- **Login.jsx**: Authentication form
- **Dashboard.jsx**: Stats cards, charts, recent activity
- **Inventory.jsx**: Phone CRUD operations, search, filters
- **Sales.jsx**: Sell phones, customer info, profit calculation
- **Reports.jsx**: Daily/Monthly/Brand reports with charts

**context/AuthContext.jsx**
- Global authentication state
- Login/logout functions
- User data management

**utils/api.js**
- Axios instance
- Request interceptor (add JWT token)
- Response interceptor (handle 401)
- Base URL configuration

## Database Schema

### users
- id (PK)
- username (unique)
- email (unique)
- password (hashed)
- full_name
- role (admin/manager)
- created_at, updated_at

### phones
- id (PK)
- brand
- model
- storage
- color
- imei (unique)
- buying_price
- selling_price
- supplier_name
- status (In Stock/Sold)
- created_at, updated_at

### sales
- id (PK)
- phone_id (FK → phones.id)
- customer_name
- customer_phone
- selling_price
- buying_price
- profit (computed)
- sale_date
- notes

## API Endpoints Summary

### Authentication
- POST   /api/auth/login
- GET    /api/auth/me
- POST   /api/auth/register

### Dashboard
- GET    /api/dashboard/stats

### Inventory
- GET    /api/phones
- GET    /api/phones/:id
- POST   /api/phones
- PUT    /api/phones/:id
- DELETE /api/phones/:id
- GET    /api/phones/brands/list

### Sales
- POST   /api/sales
- GET    /api/sales
- GET    /api/sales/:id

### Reports
- GET    /api/reports/daily
- GET    /api/reports/monthly
- GET    /api/reports/brand

## Technology Stack Details

### Backend
- **Express.js 4**: Web framework
- **MySQL2**: Database driver with promise support
- **jsonwebtoken**: JWT authentication
- **bcryptjs**: Password hashing
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variables
- **express-validator**: Input validation

### Frontend
- **React 18**: UI library
- **React Router DOM 6**: Client-side routing
- **Tailwind CSS 3**: Utility-first CSS
- **Axios**: HTTP client
- **Recharts**: Chart library
- **React Icons**: Icon components
- **React Toastify**: Toast notifications
- **Vite**: Build tool & dev server

### Database
- **MySQL 8+**: Relational database
- **Connection Pooling**: For performance
- **Indexes**: On IMEI, status, brand, dates
- **Foreign Keys**: Referential integrity
- **Generated Columns**: Auto profit calculation

## Development Workflow

1. **Start MySQL Server**
2. **Run Backend** (port 5000)
   - Database connection
   - API routes available
3. **Run Frontend** (port 3000)
   - Development server with HMR
   - Proxy API calls to backend
4. **Access Application**
   - Login with credentials
   - Manage inventory
   - Process sales
   - View reports

## Security Measures

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Protected API routes
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration
- ✅ Input validation
- ✅ Role-based access control
- ✅ Token expiration
- ✅ Secure password storage

## Best Practices Implemented

- ✅ Modular code structure
- ✅ Separation of concerns
- ✅ RESTful API design
- ✅ Error handling
- ✅ Environment variables
- ✅ Database connection pooling
- ✅ Response standardization
- ✅ Component reusability
- ✅ Context API for state management
- ✅ Protected routes
- ✅ Responsive design
- ✅ Code documentation
- ✅ Git ignore for sensitive files
