# CHAPTER 3: REQUIREMENTS SPECIFICATION

## 3.1 Functional Requirements

Functional requirements define the key operations and features available to users of the Dharani Jewellery App.

### FR1: User Authentication and Access Control

**Requirement:** Secure user authentication  
**Description:** Users (owner and workers) can log in using valid credentials

**Specifications:**
- Login with username and password
- Session management after successful authentication
- Access restriction based on credentials
- Logout functionality
- Password reset mechanism
- Secure credential validation

**Benefits:**
- Protects business data
- Prevents unauthorized access
- Maintains data security and integrity
- Tracks user activities

**Related Constraints:** Security, Data Privacy

---

### FR2: Product Management

**Requirement:** Manage jewellery product inventory  
**Description:** Users can add, update, and delete jewellery products

**Specifications:**

#### Add New Product
- Enter product name, type, and description
- Input product price and other details
- Assign unique product identifier
- Store in database
- Immediate availability in system

#### Update Existing Products
- Modify product information
- Update pricing
- Change product status
- Edit descriptions
- Real-time updates reflected

#### Delete Products
- Remove discontinued items
- Archive option for historical data
- Prevent accidental deletion with confirmations
- Update inventory accordingly

**Product Information Stored:**
- Product name
- Product type/category
- Description
- Price
- Weight (for jewellery)
- Purity/Grade
- Stock quantity

**Benefits:**
- Centralized product management
- Easy product tracking
- Prevents data duplication
- Supports business growth

---

### FR3: Inventory Management

**Requirement:** Track and manage stock levels  
**Description:** Real-time inventory monitoring and control

**Specifications:**

#### Stock Level Tracking
- Monitor quantity available
- Track stock in real-time
- Display current inventory status
- Alert on low stock
- Prevent overstocking

#### Inventory Operations
- Add stock to inventory
- Reduce stock on sale
- Update stock quantities manually
- Check product availability
- Inventory adjustments

#### Search and Filter
- Search products by name or type
- Filter inventory by category
- Sort by stock level
- Quick product location

**Stock Management Features:**
- Real-time synchronization
- Accurate quantity tracking
- Stock availability check
- Prevent overselling
- Inventory history

**Benefits:**
- Efficient resource control
- Prevents stockouts
- Optimizes inventory levels
- Reduces unnecessary stock

---

### FR4: Sales Management

**Requirement:** Record and track daily sales  
**Description:** Complete sales transaction management

**Specifications:**

#### Record Sales Transactions
- Create new sales record
- Select product and quantity sold
- Calculate sale price
- Record customer information
- Apply discounts if applicable
- Calculate total amount

#### View Sales Data
- Display all sales transactions
- Filter by date range
- Search by customer
- View sale details
- Sales history access

#### Sales Analysis
- Track total sales amount
- Count items sold
- Monitor sales trends
- Generate sales reports
- Performance metrics

**Sales Information:**
- Product sold
- Quantity sold
- Sale price
- Date and time
- Customer details
- Payment information

**Benefits:**
- Accurate financial records
- Business performance tracking
- Customer purchase history
- Better decision-making
- Revenue monitoring

---

### FR5: Product Viewing and Search

**Requirement:** Easy product information access  
**Description:** Users can browse and search products quickly

**Specifications:**

#### Product List View
- Display all available products
- Show product details
- Show current stock status
- Visual product presentation

#### Search Functionality
- Search by product name
- Search by product type
- Filter by price range
- Quick product location

#### Product Details Display
- Product name and type
- Description
- Current price
- Stock availability
- Product images

**Benefits:**
- Quick product access
- Reduces search time
- Improves customer service
- Supports sales efficiency

---

### FR6: WhatsApp Communication Feature

**Requirement:** Customer engagement through WhatsApp  
**Description:** Communicate with customers for promotions and updates

**Specifications:**

#### Send Messages to Customers
- Select customer or group
- Compose message
- Send promotional content
- Share offers and discounts
- Announce new arrivals

#### Customer Favorites
- Mark frequent customers as favorites
- Bulk messaging to favorites
- Quick customer selection
- Targeted communication

#### Message Templates
- Pre-designed message templates
- Customizable templates
- Quick message sending
- Professional communication

**Features:**
- WhatsApp API integration
- Bulk messaging capability
- Message tracking
- Delivery confirmation

**Benefits:**
- Maintains customer relationships
- Improves sales opportunities
- Efficient communication
- Increases customer loyalty

---

### FR7: Data Management and Storage

**Requirement:** Centralized data storage and access  
**Description:** All business data stored in organized database

**Specifications:**

#### Data Storage
- Centralized database storage
- MongoDB implementation
- Structured data organization
- Real-time data synchronization

#### Data Access
- Retrieve data on demand
- Real-time access for authorized users
- Consistent data across system
- Quick data retrieval

#### Data Operations
- Create new records
- Read/retrieve data
- Update existing records
- Delete records safely
- Data backup mechanisms

**Data Integrity:**
- Prevents duplication
- Ensures accuracy
- Maintains consistency
- Supports audit trails

**Benefits:**
- Single source of truth
- Reduces data errors
- Enables better analysis
- Supports compliance

---

### FR8: Loan Management

**Requirement:** Track customer loans and repayments  
**Description:** Manage credit-based jewellery purchases

**Specifications:**

#### Loan Creation
- Select customer and product
- Input loan amount
- Set interest rate
- Define loan period
- Set due date
- Calculate monthly installment

#### Loan Repayment
- Record customer payments
- Update payment status
- Calculate remaining balance
- Track payment history
- Generate payment receipts

#### Loan Categorization
- Active loans
- Closed loans
- Overdue loans
- Easy status identification

**Loan Information:**
- Customer details
- Product description
- Loan amount
- Interest rate
- Due date
- Payment history
- Current status

**Benefits:**
- Efficient credit management
- Prevents payment delays
- Maintains customer relationships
- Improves cash flow visibility

---

### FR9: Dashboard and Analytics

**Requirement:** Business performance overview  
**Description:** Comprehensive dashboard with analytics

**Specifications:**

#### Key Metrics Display
- Total jewellery items
- Total inventory value
- Items sold
- Total sales amount
- Active loans count
- Total loan amount

#### Charts and Graphs
- Weekly sales analysis
- Yearly sales trends
- Customer location-based sales
- Bar charts for visualization
- Trend analysis

#### Performance Analytics
- Sales performance tracking
- Inventory status overview
- Loan portfolio analysis
- Business growth metrics

**Benefits:**
- Quick business overview
- Data-driven decisions
- Trend identification
- Performance monitoring

---

## 3.2 Non-Functional Requirements

Non-functional requirements ensure the system is efficient, reliable, secure, and user-friendly.

### NFR1: Performance

**Requirement:** Fast and responsive system operation

**Specifications:**
- **Response Time:** Product details load in < 2 seconds
- **Data Retrieval:** Quick access to inventory and sales data
- **Real-time Updates:** Minimal delay in data synchronization
- **Scalability:** Handle increasing data efficiently
- **Optimization:** Optimized queries and backend processing

**Metrics:**
- Page load time < 3 seconds
- Database query response < 500ms
- API response time < 1 second
- Concurrent users support: minimum 10 users

**Implementation:**
- Database indexing
- Query optimization
- Caching mechanisms
- Efficient code practices
- Server optimization

---

### NFR2: Usability

**Requirement:** Simple and user-friendly interface

**Specifications:**
- Simple and clean layout
- Readable fonts and colors
- Intuitive navigation
- Minimal user training required
- Touch-friendly mobile interface
- Clear instructions and labels
- Consistent design patterns

**Characteristics:**
- Accessible to users with basic technical knowledge
- Fast task completion
- Error prevention and recovery
- Help and support features

**Testing:**
- User acceptance testing
- Usability testing with target users
- Interface consistency
- Accessibility compliance

---

### NFR3: Reliability

**Requirement:** Consistent and dependable system

**Specifications:**
- **Availability:** System operational 99% of business hours
- **Downtime:** Minimal during peak usage
- **Error Handling:** Graceful error notification
- **Data Accuracy:** Correct data operations
- **Backup:** Regular data backups

**Features:**
- Error handling mechanisms
- User notification on issues
- System status monitoring
- Recovery procedures
- Data backup strategy

---

### NFR4: Scalability

**Requirement:** Support business growth

**Specifications:**
- Handle increasing product data
- Support growing inventory records
- Growing sales transactions
- More users and concurrent access
- Future feature additions
- Additional module integration

**Design Considerations:**
- Modular architecture
- Database scalability (MongoDB)
- Flexible data structure
- API extensibility
- Cloud deployment readiness

---

### NFR5: Security

**Requirement:** Protect sensitive business data

**Specifications:**
- **Authentication:** Secure login system
- **Authorization:** Role-based access control
- **Data Protection:** Encryption for sensitive data
- **Access Control:** Authorization validation
- **Session Management:** Secure session handling

**Measures:**
- Password hashing and salting
- Secure API endpoints
- Input validation
- SQL/NoSQL injection prevention
- CSRF protection
- Secure session tokens

**Compliance:**
- Data protection standards
- Security best practices
- Regular security audits

---

### NFR6: Data Privacy

**Requirement:** Protect business and customer data

**Specifications:**
- Authorized user access only
- No unauthorized modifications
- Confidential information protection
- Data integrity maintenance
- Audit trail support

**Implementation:**
- Access control lists
- Data encryption
- Secure storage
- Secure transmission (HTTPS)
- Privacy policies
- Data retention policies

---

### NFR7: Adaptability

**Requirement:** Support future enhancements

**Specifications:**
- Modular system design
- API-based architecture
- Integration capabilities
- Feature addition support
- Service integration
- Technology upgrade path

**Flexibility:**
- Add customer modules
- Implement online ordering
- Integrate payment gateways
- Add SMS notifications
- Expand to multiple branches

---

## 3.3 User Interface Specifications

### UI1: Dashboard Page

**Purpose:** Provide complete business overview

**Components:**
- Key metrics cards (total items, inventory value, sales, loans)
- Weekly sales chart
- Yearly sales graph
- Customer location bar chart
- Quick action buttons
- Navigation menu

**Features:**
- Real-time data updates
- Touch-friendly cards
- Responsive layout
- Clear data visualization
- Easy navigation to other modules

---

### UI2: Calculator Page

**Purpose:** Jewellery price calculation

**Components:**
- Input fields for calculations
- Calculate button
- Receipt display section
- Download/Print options
- Clear form button

**Input Fields:**
- Gold weight (grams)
- Gold rate (per gram)
- Stone price
- Making charges
- Wastage percentage
- GST percentage

**Output:**
- Itemized calculation breakdown
- Total price
- Detailed receipt
- Download option
- Print option

---

### UI3: Inventory Page

**Purpose:** Manage jewellery products

**Components:**
- Product list view
- Add product button
- Search/filter bar
- Product detail cards
- Edit and delete buttons
- Stock status display

**Features:**
- Add new items
- Update existing items
- Delete discontinued items
- Search by name or type
- Filter by category
- Real-time stock updates

---

### UI4: Customer Page

**Purpose:** Manage customer information

**Components:**
- Customer list view
- Add customer button
- Customer detail cards
- Favorite marking button
- Search bar
- WhatsApp messaging option

**Features:**
- Add new customers
- Edit customer information
- Delete customer records
- Mark as favorites
- View customer history
- Send WhatsApp messages

---

### UI5: Loan Page

**Purpose:** Track customer loans

**Components:**
- Loan list view
- Add loan button
- Loan detail cards
- Status indicators (Active/Overdue)
- Payment tracking
- Loan amount display

**Features:**
- Create new loans
- Record payments
- Update loan status
- Track repayment progress
- View loan details
- Filter by status

---

## 3.4 Requirement Traceability

| Functional Requirement | Module | Page | Status |
|------------------------|--------|------|--------|
| User Authentication | User Module | Login | Implemented |
| Product Management | Inventory | Inventory | Implemented |
| Inventory Management | Inventory | Inventory | Implemented |
| Sales Management | Sales | Dashboard | Implemented |
| Product Viewing/Search | Inventory | Inventory | Implemented |
| WhatsApp Communication | Customer | Customer | Implemented |
| Data Management | All Modules | Database | Implemented |
| Loan Management | Loan | Loan | Implemented |
| Dashboard Analytics | Dashboard | Dashboard | Implemented |

---

## Summary

Chapter 3 provides detailed requirements specifications including:
- 9 functional requirements with detailed specifications
- 7 non-functional requirements
- 5 user interface specifications
- Requirement traceability matrix
- Implementation status of all requirements
