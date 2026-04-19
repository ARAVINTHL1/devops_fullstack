# CHAPTER 4: DETAILED DESIGN

## 4.1 Architectural Design

The Dharani Jewellery App follows a modular architecture with distinct components for different functionalities.

### 4.1.1 System Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                    Frontend Layer (React)                       │
│  Dashboard | Calculator | Inventory | Customers | Loans | Auth |
└────────────────┬─────────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │  REST API Calls │
        └────────┬────────┘
                 │
┌────────────────▼─────────────────────────────────────────────────┐
│                  Backend Layer (Node.js/Express)                  │
│  User Auth │ Product │ Inventory │ Sales │ Customer │ Loan │     │
│  WhatsApp Integration │ Analytics │ Payments                     │
└────────────────┬─────────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │  Database Calls │
        └────────┬────────┘
                 │
┌────────────────▼─────────────────────────────────────────────────┐
│                  Data Layer (MongoDB)                             │
│  Collections: Users │ Products │ Inventory │ Orders │             │
│  Customers │ Loans │ Transactions                                │
└────────────────────────────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │ External APIs   │
        └─────────────────┘
        WhatsApp Integration
```

---

## 4.2 Module Characteristics

### Module 1: Dashboard Module

**Purpose:** Provide comprehensive business overview

**Responsibilities:**
- Display key business metrics
- Generate sales analytics
- Show inventory status
- Loan portfolio visualization
- Real-time data updates

**Key Features:**
- Total jewellery items count
- Total inventory value calculation
- Items sold tracking
- Total sales amount
- Active loans monitoring
- Loan amount tracking
- Weekly sales analysis
- Yearly trends
- Customer location analytics

**Data Sources:**
- JewelleryItem collection
- Loan collection
- Sales transactions
- Customer data

**Components:**
- Metrics cards
- Chart components
- Analytics graphs
- Navigation controls

---

### Module 2: Calculator Module

**Purpose:** Jewellery price calculation and billing

**Responsibilities:**
- Process jewellery pricing inputs
- Calculate final amount
- Generate receipts
- Support printing/downloading

**Key Features:**
- Gold weight input (grams)
- Gold rate input (per gram)
- Stone/gemstone price
- Making charges
- Wastage calculation
- GST calculation
- Receipt generation
- Print capability
- Download option

**Calculation Logic:**
```
Gold Cost = Gold Weight × Gold Rate
Total Cost = Gold Cost + Stone Price + Making Charges
Wastage Amount = Total Cost × (Wastage % / 100)
Subtotal = Total Cost + Wastage Amount
GST Amount = Subtotal × (GST % / 100)
Final Amount = Subtotal + GST Amount
```

**Output:**
- Itemized breakdown
- Total price
- Receipt document
- Printable format

---

### Module 3: Inventory Module

**Purpose:** Manage jewellery product inventory

**Responsibilities:**
- Product data management
- Stock level tracking
- Real-time updates
- Search and filtering
- Stock analytics

**Key Features:**
- Add new jewellery items
- Update product information
- Delete discontinued items
- Track stock quantities
- Search functionality
- Filter by category
- Stock availability check
- Prevent overselling

**Database Collections:**
- JewelleryItem: Product details, prices, stock
- InventoryLog: Stock changes and movements

**Operations:**
- Create: Add new products
- Read: View products and stock
- Update: Modify product details and stock
- Delete: Remove discontinued items

---

### Module 4: Customer Module

**Purpose:** Manage customer relationships and information

**Responsibilities:**
- Customer data management
- Purchase history tracking
- Favorite customer management
- WhatsApp communication
- Customer relationship support

**Key Features:**
- Add new customer
- Edit customer details
- Mark favorite customers
- View purchase history
- Send WhatsApp messages
- Bulk messaging capability
- Customer search
- Contact information tracking

**Customer Information:**
- Name
- Phone number
- Address
- Email
- Purchase history
- Favorite status
- Last purchase date
- Loan status
- Notes

**Integrations:**
- WhatsApp API for messaging
- Customer preferences
- Communication history

---

### Module 5: Loan Module

**Purpose:** Track and manage customer loans

**Responsibilities:**
- Loan record creation
- Repayment tracking
- Interest calculations
- Status management
- Payment scheduling

**Key Features:**
- Create new loans
- Record customer payments
- Calculate interest
- Set due dates
- Track repayment status
- Active/Closed/Overdue categorization
- Payment reminders
- Balance tracking

**Loan Information:**
- Customer details
- Product description and weight
- Loan amount
- Interest rate (%)
- Loan start date
- Due date
- Monthly interest
- Total payable amount
- Payments array (multiple payments)
- Loan status
- Creation timestamp

**Status Management:**
- Active: Ongoing loan with pending payments
- Closed: Fully repaid loan
- Overdue: Payment past due date

---

### Module 6: User Authentication Module

**Purpose:** Secure system access control

**Responsibilities:**
- User login authentication
- Session management
- Access control
- Password validation
- Role-based access

**Key Features:**
- Username/password authentication
- Secure credential validation
- Session creation
- Logout functionality
- Password reset
- User role management (Owner/Worker)
- Access control lists

**Security Measures:**
- Password hashing (bcrypt)
- Secure session tokens
- JWT implementation
- Credential validation
- Unauthorized access prevention

---

## 4.3 Data Models

### User Schema

```javascript
{
  _id: ObjectId,
  username: String (required, unique),
  password: String (hashed, required),
  email: String,
  role: String (enum: ['owner', 'worker']),
  fullName: String,
  phone: String,
  created_at: Date,
  updated_at: Date
}
```

### JewelleryItem Schema

```javascript
{
  _id: ObjectId,
  name: String (required),
  type: String (enum: ['ring', 'necklace', 'bracelet', 'earring', 'pendant']),
  description: String,
  price: Number (required),
  weight: Number (grams),
  purity: String (enum: ['18K', '22K', '24K']),
  status: String (enum: ['available', 'sold'], default: 'available'),
  sold_at: Date,
  sale_removed: Boolean,
  quantity: Number (default: 1),
  created_at: Date,
  updated_at: Date
}
```

### Customer Schema

```javascript
{
  _id: ObjectId,
  name: String (required),
  phone: String (required),
  email: String,
  address: String,
  purchaseHistory: [ObjectId] (references to sales),
  totalPurchases: Number (default: 0),
  totalAmount: Number (default: 0),
  isFavorite: Boolean (default: false),
  lastPurchaseDate: Date,
  notes: String,
  created_at: Date,
  updated_at: Date
}
```

### Loan Schema

```javascript
{
  _id: ObjectId,
  customer: ObjectId (required, ref: Customer),
  jewellery_description: String (required),
  jewellery_weight: Number (required),
  jewellery_image_url: String,
  loan_amount: Number (required),
  interest_rate: Number (% per annum),
  loan_start_date: Date (required),
  due_date: Date (required),
  monthly_interest: Number,
  total_payable: Number,
  loan_status: String (enum: ['Active', 'Closed', 'Overdue']),
  payments: [
    {
      date: Date,
      amount: Number,
      note: String
    }
  ],
  created_at: Date,
  updated_at: Date
}
```

---

## 4.4 Use Case Diagram

### Main Actors

1. **Shop Owner** - Primary user with full system access
2. **Shop Worker** - Limited access for daily operations

### Primary Use Cases

#### Dashboard Access
- View total jewellery items
- Monitor inventory value
- Track items sold
- View total sales amount
- Monitor active loans
- Analyze sales trends
- View customer locations

#### Product Management (Owner)
- Add new jewellery products
- Update product details
- Delete discontinued products
- View product list
- Search products

#### Inventory Management (Owner/Worker)
- Check product availability
- Update stock levels
- View stock status
- Search inventory
- Filter by category

#### Sales Management (Owner/Worker)
- Record sales transaction
- View sales history
- Calculate price
- Generate receipt
- Track sales performance

#### Customer Management (Owner/Worker)
- Add new customer
- View customer details
- Edit customer information
- Mark favorite customers
- View purchase history

#### Loan Management (Owner)
- Create new loan
- Track loan details
- Record payments
- Update loan status
- View loan analytics

#### Communication (Owner)
- Send WhatsApp messages
- Share offers and discounts
- Announce new arrivals
- Bulk messaging to favorites

#### Authentication (All Users)
- Login to system
- Logout from system
- Session management

---

## 4.5 Sequence Diagram: User Interaction Flow

### Flow 1: Dashboard Access

```
User → Frontend → Backend → Database
  │       │          │          │
  │   Loads Page     │          │
  ├──────────────────┤          │
  │                  │ Requests │
  │                  ├─────────→│
  │                  │ Stats    │
  │                  │          │ Queries
  │                  │          │ Collections
  │                  │ Returns  │
  │                  │←─────────┤
  │  Displays Data   │          │
  │←──────────────────          │
  │                             │
```

### Flow 2: Product Sales Transaction

```
Worker → Frontend → Backend → Database
  │         │         │         │
  │ Selects │         │         │
  │ Product │         │         │
  ├────────→│         │         │
  │         │ Inputs  │         │
  │         │ Sale    │         │
  │         ├────────→│         │
  │         │         │ Validates│
  │         │         │ & Stores │
  │         │         ├─────────→│
  │         │         │          │ Updates
  │         │         │←─────────┤
  │         │ Confirms│          │
  │         │←────────┤          │
  │ Shows   │         │          │
  │ Receipt │         │          │
  │←────────┤         │          │
```

### Flow 3: Loan Creation and Payment

```
Owner → Frontend → Backend → Database
  │       │          │         │
  │ Fills │          │         │
  │ Loan  │          │         │
  │ Form  │          │         │
  ├──────→│          │         │
  │       │ Submits  │         │
  │       │ Loan     │         │
  │       ├─────────→│         │
  │       │          │Calculate│
  │       │          │Interest │
  │       │          │Validate │
  │       │          │Data     │
  │       │          ├────────→│
  │       │          │         │ Stores
  │       │          │         │ Loan
  │       │Response  │         │
  │       │←─────────┤←─────────┤
  │Displays Success  │         │
  │←───────┤         │         │
```

---

## 4.6 API Endpoints Design

### Authentication Endpoints

```
POST   /api/auth/login       - User login
POST   /api/auth/logout      - User logout
POST   /api/auth/signup      - New user signup
POST   /api/auth/refresh     - Refresh session token
```

### Product Endpoints

```
GET    /api/products         - Get all products
GET    /api/products/:id     - Get product details
POST   /api/products         - Create new product
PUT    /api/products/:id     - Update product
DELETE /api/products/:id     - Delete product
```

### Inventory Endpoints

```
GET    /api/inventory        - Get full inventory
GET    /api/inventory/search - Search products
POST   /api/inventory/add    - Add stock
PUT    /api/inventory/:id    - Update stock
```

### Sales Endpoints

```
POST   /api/sales            - Record new sale
GET    /api/sales            - Get all sales
GET    /api/sales/analytics  - Get sales analytics
GET    /api/sales/stats      - Get sales statistics
```

### Customer Endpoints

```
GET    /api/customers        - Get all customers
GET    /api/customers/:id    - Get customer details
POST   /api/customers        - Create new customer
PUT    /api/customers/:id    - Update customer
DELETE /api/customers/:id    - Delete customer
POST   /api/customers/whatsapp - Send WhatsApp message
```

### Loan Endpoints

```
GET    /api/loans            - Get all loans
GET    /api/loans/:id        - Get loan details
POST   /api/loans            - Create new loan
PUT    /api/loans/:id        - Update loan
POST   /api/loans/:id/payment - Record payment
```

---

## 4.7 Database Design

### Collections Structure

```
MongoDB Database: dharani_jewellery
│
├── users
│   └── User authentication and profile data
│
├── jewellery_items
│   └── Product inventory and details
│
├── customers
│   └── Customer information and preferences
│
├── loans
│   └── Loan records and repayments
│
├── sales
│   └── Sales transactions
│
└── inventory_logs
    └── Stock movement history
```

### Key Indexes

- `users.username` - Unique username indexing
- `jewellery_items.name` - Product name search
- `customers.phone` - Customer phone lookup
- `loans.customer` - Loans by customer
- `sales.created_at` - Sales by date

---

## Summary

Chapter 4 provides:
- System architecture overview
- Module characteristics and responsibilities
- Data models and schemas
- Use case diagrams
- Sequence diagrams for main flows
- API endpoint design
- Database structure and organization
- Design patterns and best practices
