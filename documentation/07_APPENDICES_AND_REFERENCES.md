# APPENDICES

## APPENDIX A: CODE SAMPLES

### A.1 Loan Model (Loan.js)

```javascript
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  note: {
    type: String,
  },
});

const loanSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  jewellery_description: {
    type: String,
    required: [true, 'Jewellery description is required'],
  },
  jewellery_weight: {
    type: Number,
    required: [true, 'Jewellery weight is required'],
  },
  jewellery_image_url: {
    type: String,
  },
  cloudinary_public_id: {
    type: String,
  },
  loan_amount: {
    type: Number,
    required: [true, 'Loan amount is required'],
  },
  interest_rate: {
    type: Number,
    required: [true, 'Interest rate is required'],
  },
  loan_start_date: {
    type: Date,
    required: [true, 'Loan start date is required'],
  },
  due_date: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  monthly_interest: {
    type: Number,
    required: true,
  },
  total_payable: {
    type: Number,
    required: true,
  },
  loan_status: {
    type: String,
    enum: ['Active', 'Closed', 'Overdue'],
    default: 'Active',
  },
  payments: [paymentSchema],
}, {
  timestamps: true,
});

const Loan = mongoose.model('Loan', loanSchema);
export default Loan;
```

**Purpose:** Defines the Loan data model with all required fields for loan management

**Key Features:**
- Customer reference for linking to specific customer
- Jewellery description and details
- Financial calculations (amount, interest, total payable)
- Payment tracking with multiple payment records
- Loan status management (Active, Closed, Overdue)
- Automatic timestamp tracking

---

### A.2 Analytics Routes (Inventory Analytics)

```javascript
import express from 'express';
import JewelleryItem from '../models/JewelleryItem.js';
import Loan from '../models/Loan.js';
import Customer from '../models/Customer.js';

const router = express.Router();

const getDateRanges = () => {
  const now = new Date();
  const weeklyStart = new Date(now);
  weeklyStart.setDate(now.getDate() - 6);
  weeklyStart.setHours(0, 0, 0, 0);
  
  const monthlyStart = new Date(now);
  monthlyStart.setDate(now.getDate() - 29);
  monthlyStart.setHours(0, 0, 0, 0);
  
  const yearlyStart = new Date(now);
  yearlyStart.setMonth(now.getMonth() - 11);
  yearlyStart.setDate(1);
  yearlyStart.setHours(0, 0, 0, 0);
  
  return { weeklyStart, monthlyStart, yearlyStart, now };
};

router.get('/analytics', async (req, res) => {
  try {
    const { weeklyStart, monthlyStart, yearlyStart, now } = getDateRanges();
    
    const loans = await Loan.find();
    const jewelleryItems = await JewelleryItem.find();
    
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      
      const dayLoans = loans.filter(loan => {
        const loanDate = new Date(loan.createdAt);
        return loanDate >= date && loanDate < nextDate;
      });
      
      const soldItems = jewelleryItems.filter(item => {
        const soldDate = item.sold_at ? new Date(item.sold_at) : new Date(item.updatedAt);
        return (item.status === 'sold' || item.sold_at) && !item.sale_removed && soldDate >= date && soldDate < nextDate;
      });
      
      weeklyData.push({
        name: date.toLocaleDateString('en-IN', { weekday: 'short' }),
        loans: dayLoans.length,
        loanAmount: dayLoans.reduce((sum, loan) => sum + loan.loan_amount, 0),
        sales: soldItems.reduce((sum, item) => sum + item.price, 0),
      });
    }
    
    res.json({ weeklyData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const jewelleryItems = await JewelleryItem.find();
    const totalJewellery = jewelleryItems.length;
    const availableItems = jewelleryItems.filter(item => (item.status || 'available') === 'available');
    const soldItems = jewelleryItems.filter(item => (item.status === 'sold' || item.sold_at) && !item.sale_removed);
    
    const totalInventoryValue = availableItems.reduce((sum, item) => sum + item.price, 0);
    const totalSoldItems = soldItems.length;
    const totalSalesValue = soldItems.reduce((sum, item) => sum + item.price, 0);
    
    const loans = await Loan.find();
    const activeLoans = loans.filter(loan => loan.loan_status === 'Active');
    const totalActiveLoans = activeLoans.length;
    const totalLoanAmount = activeLoans.reduce((sum, loan) => sum + loan.loan_amount, 0);
    
    res.json({
      totalJewellery,
      totalActiveLoans,
      totalLoanAmount,
      totalInventoryValue,
      totalSoldItems,
      totalSalesValue,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/customer-locations', async (req, res) => {
  try {
    const customers = await Customer.find({}, 'address');
    const locationMap = {};
    
    customers.forEach(customer => {
      const address = (customer.address || '').trim();
      const parts = address.split(',').map(p => p.trim()).filter(Boolean);
      const place = parts.length > 0 ? parts[parts.length - 1] : 'Unknown';
      
      if (locationMap[place]) {
        locationMap[place]++;
      } else {
        locationMap[place] = 1;
      }
    });
    
    const locations = Object.entries(locationMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    res.json(locations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
```

**Purpose:** Provides API endpoints for analytics and statistics calculation

**Key Functions:**
- `getDateRanges()` - Calculate date ranges for different periods
- `/analytics` - Get weekly analytics data
- `/stats` - Get comprehensive statistics including inventory, sales, and loan data
- `/customer-locations` - Get customer distribution by location

---

## APPENDIX B: PROJECT STRUCTURE

### Directory Structure

```
dharani-jewellery-app/
│
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Calculator.jsx
│   │   │   ├── Inventory.jsx
│   │   │   ├── Customer.jsx
│   │   │   ├── Loan.jsx
│   │   │   └── Auth/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── Home.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── auth.js
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Node.js Backend
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── JewelleryItem.js
│   │   │   ├── Customer.js
│   │   │   ├── Loan.js
│   │   │   └── Inventory.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── products.js
│   │   │   ├── customers.js
│   │   │   ├── loans.js
│   │   │   └── analytics.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── environment.js
│   │   └── index.js
│   ├── package.json
│   └── .env.example
│
├── documentation/                   # Documentation (This Project)
│   ├── 00_PROJECT_OVERVIEW.md
│   ├── 01_CHAPTER_1_INTRODUCTION.md
│   ├── 02_CHAPTER_2_GENERAL_DESCRIPTION.md
│   ├── 03_CHAPTER_3_REQUIREMENTS.md
│   ├── 04_CHAPTER_4_DETAILED_DESIGN.md
│   ├── 05_CHAPTER_5_TESTING.md
│   ├── 06_CHAPTER_6_CONCLUSION.md
│   └── APPENDICES_AND_REFERENCES.md
│
├── tests/                           # Test Suite
│   ├── unit/
│   │   ├── inventory.test.js
│   │   ├── customer.test.js
│   │   └── loan.test.js
│   ├── integration/
│   │   └── api.test.js
│   └── config/
│       └── test.setup.js
│
├── README.md
├── .gitignore
└── package.json
```

---

## APPENDIX C: API ENDPOINT REFERENCE

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login with credentials |
| POST | `/auth/signup` | New user registration |
| POST | `/auth/logout` | User logout |
| GET | `/auth/profile` | Get current user profile |
| POST | `/auth/refresh` | Refresh authentication token |

### Product Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | Get all products |
| GET | `/products/:id` | Get specific product |
| POST | `/products` | Create new product |
| PUT | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product |
| GET | `/products/search` | Search products |

### Customer Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers` | Get all customers |
| GET | `/customers/:id` | Get customer details |
| POST | `/customers` | Create new customer |
| PUT | `/customers/:id` | Update customer |
| DELETE | `/customers/:id` | Delete customer |
| POST | `/customers/:id/favorite` | Mark as favorite |
| POST | `/customers/whatsapp/send` | Send WhatsApp message |

### Loan Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/loans` | Get all loans |
| GET | `/loans/:id` | Get loan details |
| POST | `/loans` | Create new loan |
| PUT | `/loans/:id` | Update loan |
| DELETE | `/loans/:id` | Delete loan |
| POST | `/loans/:id/payment` | Record payment |
| GET | `/loans/status/active` | Get active loans |
| GET | `/loans/status/overdue` | Get overdue loans |

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/dashboard` | Dashboard metrics |
| GET | `/analytics/sales` | Sales analytics |
| GET | `/analytics/inventory` | Inventory analytics |
| GET | `/analytics/customers` | Customer analytics |
| GET | `/analytics/loans` | Loan analytics |

---

## APPENDIX D: DATABASE SCHEMA REFERENCE

### MongoDB Collections

#### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  password: String (hashed),
  email: String,
  role: String,
  fullName: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### JewelleryItem Collection
```javascript
{
  _id: ObjectId,
  name: String,
  type: String,
  description: String,
  price: Number,
  weight: Number,
  purity: String,
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Customer Collection
```javascript
{
  _id: ObjectId,
  name: String,
  phone: String,
  email: String,
  address: String,
  isFavorite: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Loan Collection
```javascript
{
  _id: ObjectId,
  customer: ObjectId,
  loan_amount: Number,
  interest_rate: Number,
  due_date: Date,
  loan_status: String,
  payments: Array,
  createdAt: Date,
  updatedAt: Date
}
```

---

## APPENDIX E: USER GUIDE QUICKSTART

### Getting Started

#### 1. Login
- Open the application
- Enter username and password
- Click "Login"

#### 2. Dashboard
- View key metrics
- Monitor inventory status
- Check sales performance
- Track loans

#### 3. Add Product
- Click "Add Product" button
- Enter product details
- Click "Save"

#### 4. Record Sale
- Select product from inventory
- Enter quantity sold
- Confirm sale
- Receipt automatically generated

#### 5. Manage Loan
- Click "Add Loan"
- Select customer
- Enter loan amount and duration
- Set due date
- Click "Create Loan"

---

## Summary

The appendices provide:
- Code samples from key modules
- Project directory structure
- Complete API endpoint reference
- Database schema specifications
- User guide quickstart
- Additional technical documentation
