# Phone Inventory and Sales Management System

A complete full-stack mobile phone inventory and sales management dashboard built with React.js, Node.js/Express.js, MySQL, and JWT authentication.

## 🚀 Features

### Authentication System
- ✅ Admin login with JWT tokens
- ✅ Secure password hashing with bcrypt
- ✅ Role-based access control
- ✅ Protected routes and API endpoints

### Dashboard
- 📊 Total phones in stock
- 📈 Total sold phones
- 💰 Total profit calculation
- ⚠️ Low stock alerts
- 📉 Top selling brands visualization
- 🔄 Recent sales tracking

### Inventory Management
- ➕ Add new phones with complete details:
  - Brand, Model, Storage, Color
  - IMEI (unique identifier)
  - Buying price & Selling price
  - Supplier information
  - Stock status
- ✏️ Edit existing phone records
- 🗑️ Delete phones
- 🔍 Search and filter by brand, status, or keyword
- 📄 Pagination support

### Sales Module
- 🛒 Sell phones with customer information
- 🔄 Automatic status update to "Sold"
- 💵 Automatic profit calculation
- 👤 Customer name and phone tracking
- 📝 Optional notes for each sale

### Reports
- 📅 Daily sales reports
- 📆 Monthly sales reports with charts
- 🏷️ Brand-specific performance reports
- 📊 Visual analytics with Recharts
- 💹 Revenue and profit tracking

### UI/UX Design
- 🎨 Modern, clean, professional interface
- 📱 Fully responsive design (mobile, tablet, desktop)
- 🧭 Sidebar navigation
- 🌈 Tailwind CSS styling
- 🔔 Toast notifications
- ⚡ Fast and intuitive user experience

## 🛠️ Tech Stack

**Frontend:**
- React.js 18
- React Router DOM 6
- Tailwind CSS 3
- Axios
- Recharts (for data visualization)
- React Icons
- React Toastify
- Vite (build tool)

**Backend:**
- Node.js
- Express.js 4
- MySQL 2
- JWT (jsonwebtoken)
- Bcrypt.js
- CORS
- Express Validator
- Dotenv

**Database:**
- MySQL 8+

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- npm or yarn
- MySQL Server (v8.0 or higher)
- Git

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AsadSoftware
```

### 2. Database Setup

**Start MySQL Server and create the database:**

```bash
# Login to MySQL
mysql -u root -p

# Run the database setup script
mysql -u root -p < backend/config/database.sql
```

**Or manually execute:**

```sql
CREATE DATABASE phone_inventory;
USE phone_inventory;
-- Then copy and paste the SQL from backend/config/database.sql
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Edit .env file with your database credentials
# Update: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET
```

**Backend .env configuration:**
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=phone_inventory
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d
```

**Start the backend server:**

```bash
# Development mode with auto-reload
npm run dev

# OR Production mode
npm start
```

Backend will run on: `http://localhost:5000`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend will run on: `http://localhost:3000`

## 🎯 Usage

### Default Login Credentials

```
Username: admin
Password: admin123
```

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register` - Register new user (admin only)

#### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

#### Phones/Inventory
- `GET /api/phones` - Get all phones (with filters & pagination)
- `GET /api/phones/:id` - Get single phone
- `POST /api/phones` - Add new phone
- `PUT /api/phones/:id` - Update phone
- `DELETE /api/phones/:id` - Delete phone
- `GET /api/phones/brands/list` - Get all brands

#### Sales
- `POST /api/sales` - Sell a phone
- `GET /api/sales` - Get all sales (with filters & pagination)
- `GET /api/sales/:id` - Get single sale

#### Reports
- `GET /api/reports/daily?date=YYYY-MM-DD` - Daily sales report
- `GET /api/reports/monthly?month=MM&year=YYYY` - Monthly report
- `GET /api/reports/brand?brand=BrandName` - Brand report

## 📁 Project Structure

```
AsadSoftware/
├── backend/
│   ├── config/
│   │   ├── database.js          # Database connection
│   │   └── database.sql         # Database schema
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── dashboardController.js
│   │   ├── phoneController.js
│   │   ├── salesController.js
│   │   └── reportController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── phoneRoutes.js
│   │   ├── salesRoutes.js
│   │   └── reportRoutes.js
│   ├── .env                     # Environment variables
│   ├── .env.example
│   ├── server.js                # Entry point
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx       # Main layout with sidebar
│   │   │   └── PrivateRoute.jsx # Protected route wrapper
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Authentication context
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Inventory.jsx
│   │   │   ├── Sales.jsx
│   │   │   └── Reports.jsx
│   │   ├── utils/
│   │   │   └── api.js           # Axios configuration
│   │   ├── App.jsx              # Main app component
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Tailwind CSS
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
└── README.md
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt (10 rounds)
- Protected API endpoints
- CORS configuration
- Input validation
- SQL injection prevention (parameterized queries)
- XSS protection

## 🎨 Screenshots & Features Walkthrough

### Login Page
- Clean, modern login interface
- Default credentials provided
- JWT token generation on successful login

### Dashboard
- Overview statistics cards
- Bar charts showing top brands
- Pie chart for profit distribution
- Recent sales list
- Low stock alerts

### Inventory Management
- Complete CRUD operations
- Search by brand, model, or IMEI
- Filter by brand and status
- Responsive data table
- Modal forms for add/edit

### Sales Module
- Select phone from available inventory
- Auto-calculate profit
- Customer information capture
- Instant status update

### Reports
- Daily, Monthly, and Brand reports
- Interactive date/month selectors
- Line and bar charts
- Detailed sales breakdown

## 🚀 Production Deployment

### Backend

1. Set `NODE_ENV=production` in .env
2. Update JWT_SECRET with a strong secret key
3. Configure MySQL for production
4. Deploy to services like:
   - Heroku
   - DigitalOcean
   - AWS EC2
   - Railway

### Frontend

```bash
cd frontend
npm run build
```

Deploy the `dist` folder to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=phone_inventory
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
```

### Frontend (.env - optional)
```env
VITE_API_URL=http://localhost:5000/api
```

## 📝 API Response Format

All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

Created with ❤️ by Asad Software

## 🐛 Known Issues & Future Enhancements

### Future Enhancements:
- [ ] Export reports to PDF/Excel
- [ ] Email notifications for low stock
- [ ] Multi-user support with different roles
- [ ] Product images upload
- [ ] Barcode scanning
- [ ] Return/refund management
- [ ] Advanced analytics dashboard
- [ ] Invoice generation
- [ ] Dark mode theme

## 📞 Support

For support, email support@asadsoftware.com or open an issue in the repository.

## ⚙️ Troubleshooting

### Common Issues:

**Database connection failed:**
- Verify MySQL is running
- Check database credentials in .env
- Ensure database exists

**Cannot login:**
- Verify backend is running on port 5000
- Check browser console for errors
- Ensure database has default admin user

**CORS errors:**
- Verify backend CORS configuration
- Check API URL in frontend

**Port already in use:**
```bash
# Kill process on port 5000 (backend)
npx kill-port 5000

# Kill process on port 3000 (frontend)
npx kill-port 3000
```

---

**Made with React.js, Node.js, Express.js, and MySQL** 🚀
