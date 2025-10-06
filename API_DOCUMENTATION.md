# Expense Tracker API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [Authentication Endpoints](#authentication-endpoints)
   - [Expense Management Endpoints](#expense-management-endpoints)
   - [Dashboard Endpoints](#dashboard-endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Frontend Integration Guide](#frontend-integration-guide)

---

## Overview

The Expense Tracker API is a RESTful web service built with Spring Boot that provides comprehensive expense management functionality. The API supports user authentication via JWT tokens stored in httpOnly cookies and includes endpoints for managing expenses, user authentication, and dashboard analytics.

### Base URL
```
http://localhost:8080
```

### Authentication Method
- **JWT Token Authentication** via httpOnly cookies
- Tokens are automatically included in requests via browser cookies
- Token blacklisting implemented for secure logout

---

## Authentication

### Authentication Flow
1. **Register/Login** → Server sets httpOnly cookie with JWT token
2. **Subsequent Requests** → Browser automatically sends cookie
3. **Logout** → Token added to blacklist, cookie cleared
4. **Blacklisted Token Access** → Automatic redirect to login page

### Security Features
- httpOnly cookies (XSS protection)
- JWT token blacklisting
- Automatic token expiration (24 hours)
- Server-side authentication validation

---

## API Endpoints

## Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "password": "string", 
  "email": "string"
}
```

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** text/plain
- **Body:** `"Registration successful! Redirecting to dashboard..."`
- **Headers:** `Set-Cookie: authToken=<jwt_token>; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`

**Error Response:**
- **Status Code:** 400 Bad Request
- **Body:** `"Registration failed: <error_message>"`

**Example Request:**
```javascript
fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: "johndoe",
    password: "securePassword123",
    email: "john@example.com"
  })
});
```

---

### POST /api/auth/login
Authenticate an existing user.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** text/plain
- **Body:** `"Login successful! Redirecting to dashboard..."`
- **Headers:** `Set-Cookie: authToken=<jwt_token>; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`

**Error Response:**
- **Status Code:** 401 Unauthorized
- **Body:** `"Login failed: <error_message>"`

**Example Request:**
```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: "johndoe",
    password: "securePassword123"
  })
});
```

---

### POST /api/auth/logout
Logout user and blacklist JWT token.

**Request Headers (Optional):**
- `Authorization: Bearer <token>` (fallback if cookie unavailable)

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** text/plain
- **Body:** `"Logout successful"`
- **Headers:** `Set-Cookie: authToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`

**Example Request:**
```javascript
fetch('/api/auth/logout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
  // Cookie sent automatically by browser
});
```

---

## Expense Management Endpoints

### POST /api/expense/add
Create a new expense.

**Authentication:** Required (JWT cookie)

**Request Body:**
```json
{
  "description": "string",
  "amount": "number",
  "category": "FOOD|TRANSPORTATION|UTILITIES|ENTERTAINMENT|HEALTHCARE|OTHER",
  "createdAt": "2025-10-03T00:00:00"
}
```

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** application/json

```json
{
  "id": 1,
  "description": "Grocery shopping",
  "amount": 85.50,
  "category": "FOOD",
  "createdAt": "2025-10-03T10:30:00",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

**Example Request:**
```javascript
fetch('/api/expense/add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    description: "Grocery shopping",
    amount: 85.50,
    category: "FOOD",
    createdAt: "2025-10-03T00:00:00"
  })
});
```

---

### GET /api/expense/{id}
Retrieve a specific expense by ID.

**Authentication:** Required

**Path Parameters:**
- `id` (Long): Expense ID

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** application/json

```json
{
  "id": 1,
  "description": "Grocery shopping",
  "amount": 85.50,
  "category": "FOOD",
  "createdAt": "2025-10-03T10:30:00",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

---

### GET /api/expense/get
Retrieve all expenses for the current authenticated user.

**Authentication:** Required

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** application/json

```json
[
  {
    "id": 1,
    "description": "Grocery shopping",
    "amount": 85.50,
    "category": "FOOD",
    "createdAt": "2025-10-03T10:30:00",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com"
    }
  },
  {
    "id": 2,
    "description": "Gas station",
    "amount": 45.00,
    "category": "TRANSPORTATION",
    "createdAt": "2025-10-02T15:20:00",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com"
    }
  }
]
```

---

### PUT /api/expense/update/{id}
Update an existing expense.

**Authentication:** Required

**Path Parameters:**
- `id` (Long): Expense ID to update

**Request Body:**
```json
{
  "description": "string",
  "amount": "number",
  "category": "FOOD|TRANSPORTATION|UTILITIES|ENTERTAINMENT|HEALTHCARE|OTHER",
  "createdAt": "2025-10-03T00:00:00"
}
```

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** application/json

```json
{
  "id": 1,
  "description": "Updated expense description",
  "amount": 95.75,
  "category": "FOOD",
  "createdAt": "2025-10-03T10:30:00",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

---

### DELETE /api/expense/{expenseId}
Delete an expense.

**Authentication:** Required

**Path Parameters:**
- `expenseId` (Long): Expense ID to delete

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** application/json
- **Body:** Empty

---

### GET /api/expense/CategoryFilter
Get expenses filtered by category.

**Authentication:** Required

**Query Parameters:**
- `category` (String): Category to filter by (FOOD, TRANSPORTATION, etc.)

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** application/json

```json
[
  {
    "id": 1,
    "description": "Grocery shopping",
    "amount": 85.50,
    "category": "FOOD",
    "createdAt": "2025-10-03T10:30:00",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com"
    }
  }
]
```

**Example Request:**
```javascript
fetch('/api/expense/CategoryFilter?category=FOOD', {
  method: 'GET'
});
```

---

### GET /api/expense/total
Get total expenses for the current user.

**Authentication:** Required

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** application/json
- **Body:** `145.75` (number)

---

### GET /api/expense/week
Get expenses from the current week.

**Authentication:** Required

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** application/json

```json
[
  {
    "id": 1,
    "description": "Grocery shopping",
    "amount": 85.50,
    "category": "FOOD",
    "createdAt": "2025-10-03T10:30:00",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com"
    }
  }
]
```

---

### GET /api/expense/totalByCategory
Get total expenses by category.

**Authentication:** Required

**Query Parameters:**
- `category` (String): Category to get total for

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** application/json
- **Body:** `85.50` (number)

---

## Dashboard Endpoints

### GET /api/dashboard/statistics
Get dashboard statistics overview.

**Authentication:** Required

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** application/json

```json
{
  "totalExpenses": 1250.75,
  "expenseCount": 25,
  "averageExpense": 50.03,
  "thisMonthTotal": 385.50,
  "lastMonthTotal": 420.25,
  "percentageChange": -8.26,
  "topCategory": "FOOD",
  "topCategoryAmount": 450.00
}
```

---

### GET /api/dashboard/recent-expenses
Get recent expenses (last 10).

**Authentication:** Required

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** application/json

```json
[
  {
    "id": 25,
    "description": "Coffee shop",
    "amount": 4.50,
    "category": "FOOD",
    "createdAt": "2025-10-03T14:30:00",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com"
    }
  }
]
```

---

### GET /api/dashboard/category-breakdown
Get expense breakdown by category.

**Authentication:** Required

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** application/json

```json
[
  {
    "category": "FOOD",
    "amount": 450.00,
    "count": 12,
    "percentage": 36.0
  },
  {
    "category": "TRANSPORTATION",
    "amount": 280.50,
    "count": 8,
    "percentage": 22.4
  },
  {
    "category": "UTILITIES",
    "amount": 320.25,
    "count": 5,
    "percentage": 25.6
  }
]
```

---

### GET /api/dashboard/monthly-expenses
Get monthly expense data for charts.

**Authentication:** Required

**Response:**
- **Status Code:** 200 OK
- **Content-Type:** application/json

```json
[
  {
    "month": "2025-01",
    "amount": 1200.50,
    "count": 28
  },
  {
    "month": "2025-02", 
    "amount": 980.75,
    "count": 22
  },
  {
    "month": "2025-03",
    "amount": 1450.25,
    "count": 35
  }
]
```

---

## Data Models

### ExpenseDto (Request)
Used for creating and updating expenses.

```typescript
interface ExpenseDto {
  description: string;          // Required
  amount: number;              // Required (BigDecimal)
  category: Category;          // Required (enum)
  createdAt: string;          // Required (ISO DateTime)
}
```

### Expense (Response)
Complete expense object returned by the API.

```typescript
interface Expense {
  id: number;                  // Auto-generated
  description: string;
  amount: number;
  category: Category;
  createdAt: string;          // ISO DateTime
  user: User;                 // Associated user object
}
```

### User Object
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  // password field not included in responses
}
```

### Category Enum
```typescript
enum Category {
  "FOOD" = "Food",
  "TRANSPORTATION" = "Transportation", 
  "UTILITIES" = "Utilities",
  "ENTERTAINMENT" = "Entertainment",
  "HEALTHCARE" = "Healthcare",
  "OTHER" = "Other"
}
```

### RegisterDTO
```typescript
interface RegisterDTO {
  username: string;    // Required, unique
  password: string;    // Required
  email: string;       // Required, unique
}
```

### UserDto (Login)
```typescript
interface UserDto {
  username: string;    // Required
  password: string;    // Required
}
```

---

## Error Handling

### Common HTTP Status Codes

| Status Code | Description | When It Occurs |
|-------------|-------------|----------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request data or validation failed |
| 401 | Unauthorized | Authentication required or invalid credentials |
| 403 | Forbidden | Authenticated but not authorized for resource |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server-side error |

### Error Response Format
```json
{
  "timestamp": "2025-10-03T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed for request",
  "path": "/api/expense/add"
}
```

### Authentication Errors
- **No JWT Token:** 401 Unauthorized
- **Invalid JWT Token:** 401 Unauthorized  
- **Blacklisted Token:** Automatic redirect to `/auth/login`
- **Expired Token:** 401 Unauthorized

---

## Frontend Integration Guide

### Setting Up Authentication

#### 1. Login Flow
```javascript
async function login(credentials) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    if (response.ok) {
      const message = await response.text();
      console.log(message); // "Login successful! Redirecting to dashboard..."
      window.location.href = '/dashboard';
    } else {
      const error = await response.text();
      alert(error);
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
}
```

#### 2. Making Authenticated Requests
```javascript
// No special headers needed - cookies sent automatically
async function addExpense(expenseData) {
  try {
    const response = await fetch('/api/expense/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(expenseData)
    });
    
    if (response.ok) {
      const expense = await response.json();
      return expense;
    } else if (response.status === 401) {
      // Token expired or invalid - redirect to login
      window.location.href = '/auth/login';
    }
  } catch (error) {
    console.error('Failed to add expense:', error);
  }
}
```

#### 3. Logout Flow
```javascript
async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Always redirect to login regardless of response
    window.location.href = '/auth/login';
  } catch (error) {
    // Still redirect on error
    window.location.href = '/auth/login';
  }
}
```

### Working with Expenses

#### 1. Loading Expenses
```javascript
async function loadExpenses() {
  try {
    const response = await fetch('/api/expense/get');
    if (response.ok) {
      const expenses = await response.json();
      return expenses;
    }
  } catch (error) {
    console.error('Failed to load expenses:', error);
  }
}
```

#### 2. Adding Expense
```javascript
async function addExpense(formData) {
  const expenseData = {
    description: formData.get('description'),
    amount: parseFloat(formData.get('amount')),
    category: formData.get('category'),
    createdAt: formData.get('date') + 'T00:00:00'
  };
  
  try {
    const response = await fetch('/api/expense/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(expenseData)
    });
    
    if (response.ok) {
      const expense = await response.json();
      console.log('Expense added:', expense);
      return expense;
    }
  } catch (error) {
    console.error('Failed to add expense:', error);
  }
}
```

#### 3. Loading Dashboard Data
```javascript
async function loadDashboardData() {
  try {
    const [stats, recentExpenses, categoryBreakdown] = await Promise.all([
      fetch('/api/dashboard/statistics').then(r => r.json()),
      fetch('/api/dashboard/recent-expenses').then(r => r.json()),
      fetch('/api/dashboard/category-breakdown').then(r => r.json())
    ]);
    
    return { stats, recentExpenses, categoryBreakdown };
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  }
}
```

### Error Handling Best Practices

```javascript
async function makeAuthenticatedRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (response.status === 401) {
      // Authentication failed - redirect to login
      window.location.href = '/auth/login';
      return null;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}
```

### Security Considerations

1. **Automatic Authentication:** Cookies are sent automatically - no need to manage tokens in JavaScript
2. **XSS Protection:** JWT tokens stored in httpOnly cookies cannot be accessed by JavaScript
3. **CSRF Protection:** SameSite=Lax cookie setting provides CSRF protection
4. **Token Blacklisting:** Logout properly invalidates tokens server-side
5. **Automatic Redirects:** Blacklisted tokens automatically redirect to login page

### Development Tips

1. **Browser DevTools:** Check Application tab → Cookies to see JWT token
2. **Network Tab:** Monitor API requests and responses
3. **Console Logs:** Authentication errors will show in browser console
4. **Server Logs:** Backend authentication details logged on server

---

## Conclusion

This API provides a complete backend solution for expense tracking with secure JWT authentication, comprehensive expense management, and dashboard analytics. The httpOnly cookie approach ensures security while maintaining ease of use for frontend development.

For questions or issues, refer to the application logs or contact the development team.