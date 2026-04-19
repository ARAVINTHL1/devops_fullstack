# CHAPTER 2: GENERAL DESCRIPTION

## 2.1 Project Perspective

The Dharani Jewellery App is positioned as an **internal business management system** for small-scale retail operations in the jewellery domain.

### Position in Market

Unlike customer-oriented e-commerce platforms, this application focuses on:
- Improving efficiency of **internal shop activities**
- Inventory management
- Product tracking
- Sales recording
- Employee operations management

### Target Users

**Exclusively designed for:**
- Shop owner
- Shop workers
- Sales assistants
- Internal staff

### Business Context

By transforming traditional manual processes into a digital system, the application:
- Enhances accuracy
- Reduces workload
- Supports real-time decision-making
- Improves day-to-day operations

---

## 2.2 Technical Architecture

### Frontend Development (React)

**Technology:** React.js  
**Purpose:** User Interface Development

**Characteristics:**
- Responsive and interactive interface
- Easy navigation for owner and workers
- Simple and clean design
- Mobile-friendly layout
- Efficient component state management

**Key Capabilities:**
- Quick product management access
- Inventory updates
- Sales recording
- Dashboard analytics
- Real-time data display

### Backend Processing (Node.js)

**Technology:** Node.js with Express.js  
**Purpose:** Server-side Logic and Processing

**Responsibilities:**
- Handle user requests efficiently
- Process business logic
- Manage database operations
- Real-time data synchronization
- API endpoint management

**Features:**
- Efficient request-response handling
- Asynchronous processing
- Middleware support for authentication
- Error handling and logging

### Database Management (MongoDB)

**Technology:** MongoDB  
**Purpose:** Data Storage and Management

**Data Stored:**
- Product details and descriptions
- Stock information and quantities
- Sales records
- Customer information
- Loan details
- User authentication data

**Advantages:**
- Flexible schema design
- Scalable data storage
- Real-time data access
- Easy expansion capabilities
- JSON-like document structure

### Integration Services: WhatsApp API

**Purpose:** Customer Communication

**Features:**
- Send promotional messages to customers
- Share offers and discounts
- Announce new arrivals
- Regular customer engagement
- Maintain brand loyalty

**Implementation:**
- API-based integration
- Bulk messaging capability
- Message templates
- Delivery confirmation

---

## 2.3 System Components Overview

### Sales and Analytics Module

**Functionality:**
- Provides insights into business performance
- Weekly sales charts
- Yearly sales analysis
- Location-based sales reports

**Benefits:**
- Understand sales trends
- Improve decision-making
- Identify high-performing locations
- Track business growth

### Loan Management Module

**Functionality:**
- Track customer loans associated with jewellery
- Monitor repayment status
- Calculate interest and penalties
- Track pending balances

**Features:**
- Loan creation and tracking
- Payment recording
- Due date management
- Active and overdue loan categorization

**Importance:**
- Essential for jewellery shops offering credit
- Installment-based purchases support
- Financial record management

---

## 2.4 User Characteristics

### Shop Owner

**Role:** Primary Administrator  
**Technical Knowledge:** Moderate

**Responsibilities:**
- Manage product details
- Monitor inventory levels
- Track daily sales performance
- View business analytics
- Customer engagement
- System administration

**Requirements:**
- Real-time data access
- Comprehensive business insights
- Easy decision-making tools
- Customer communication tools

**User Type:** Decision-maker and administrator

---

### Shop Workers

**Role:** Operational Staff  
**Technical Knowledge:** Basic

**Responsibilities:**
- Check product availability
- Update stock levels
- Record sales transactions
- Assist customers
- Daily operations management

**Requirements:**
- Simple user interface
- Quick access to product information
- Easy stock updates
- Minimal complexity
- Fast transaction processing

**User Type:** Daily operations executor

---

### Sales Assistants

**Role:** Customer Interaction  
**Technical Knowledge:** Basic

**Responsibilities:**
- Direct customer interaction
- Provide product information
- Check product availability
- Assist in purchasing decisions

**Requirements:**
- Quick access to product details
- Real-time stock information
- Customer-friendly interface
- Minimal training needed

**User Type:** Customer-facing staff

---

### Owner for Customer Engagement

**Role:** Marketing and Communication  
**Technical Knowledge:** Basic to Moderate

**Responsibilities:**
- Send promotional messages
- Maintain customer relationships
- Share offers and discounts
- New arrival announcements

**Requirements:**
- Simple WhatsApp integration
- Bulk messaging capability
- Customer list management
- Message template support

**User Type:** Customer relationship manager

---

## 2.5 Design and Implementation Constraints

### Technology and Resource Constraints

| Constraint | Impact | Mitigation |
|-----------|--------|-----------|
| Open-source technologies only | Limited advanced features | Efficient use of available tools |
| Academic environment resources | No expensive infrastructure | Cloud-based free tier services |
| Limited budget | Minimal paid services | Focus on core functionality |

**Management:**
- Use open-source tech stack (React, Node.js, MongoDB)
- Implement efficient code practices
- Optimize database queries
- Minimize API calls

---

### Data Privacy and Security Constraints

**Requirements:**
- Handle sensitive business data
- Protect product details
- Secure stock information
- Safeguard sales records

**Implementation:**
- Secure authentication system
- Role-based access control
- Authorization validation
- Data encryption for sensitive fields

**Measures:**
- Password hashing
- Session management
- Input validation
- Secure API endpoints

---

### Scalability and Performance Constraints

**Challenge:** Handle increasing data as business grows

**Requirements:**
- Fast data retrieval
- Efficient database operations
- Minimal response delays
- Smooth performance with large datasets

**Solutions:**
- Optimized database indexing
- Query optimization
- Caching mechanisms
- Efficient backend processing
- Proper server configuration

---

### Frontend Responsiveness and Usability Constraints

**Challenge:** Must work seamlessly on mobile devices

**Requirements:**
- Responsive design across screen sizes
- Easy navigation for basic technical users
- Minimal load time
- Consistent user experience

**Implementation:**
- Mobile-first design approach
- Responsive CSS/UI framework
- Touch-friendly interface
- Simplified navigation
- Cross-device testing

---

### Internet Dependency Constraint

**Challenge:** Relies on internet connectivity

**Issues:**
- Network downtime impacts access
- Slow connectivity affects performance
- Real-time sync requires stable connection

**Solutions:**
- Proper error handling
- Fallback mechanisms
- Timeout management
- User feedback for connectivity issues
- Offline capability planning

---

### WhatsApp Integration Constraints

**Limitations:**
- External service dependency
- Message delivery restrictions
- API rate limits
- Service availability concerns

**Management:**
- Reliable API integration
- Rate limiting handling
- Error recovery mechanisms
- Service status monitoring

---

## 2.6 Project Architecture Summary

### Three-Tier Architecture

```
┌─────────────────────────────────────────┐
│      Presentation Layer (React)         │
│  - Dashboard, Inventory, Sales, etc.    │
└──────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────┐
│      Business Logic Layer (Node.js)      │
│  - User Auth, Data Processing, Logic     │
└──────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────┐
│      Data Layer (MongoDB)                │
│  - Data Storage, Retrieval, Management   │
└──────────────────────────────────────────┘
```

### Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React.js | User Interface |
| Backend | Node.js + Express | Business Logic |
| Database | MongoDB | Data Storage |
| Integration | WhatsApp API | Communication |
| Mobile | React Native/Web | Accessibility |

---

## Summary

Chapter 2 provides:
- Project positioning and context
- Technical architecture overview
- User characteristics and roles
- Design and implementation constraints
- System components description
- Technology stack details
- Quality and performance considerations
