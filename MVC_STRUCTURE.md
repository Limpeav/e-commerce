# Professional MVC Architecture Structure

## Overview
This document outlines the professional MVC (Model-View-Controller) architecture for the E-commerce application, covering both backend (Node.js/Express) and frontend (React) implementations.

---

## Backend MVC Structure

```
ecommerce-backend/
├── config/                    # Configuration files
│   ├── db.js                  # Database configuration
│   └── env.js                 # Environment variables
│
├── models/                    # MODELS - Data schemas and business logic
│   ├── User.js
│   ├── Product.js
│   ├── Order.js
│   ├── Cart.js
│   └── Wishlist.js
│
├── services/                  # SERVICES - Business logic layer
│   ├── authService.js
│   ├── userService.js
│   ├── productService.js
│   ├── orderService.js
│   ├── cartService.js
│   ├── wishlistService.js
│   └── adminService.js
│
├── controllers/               # CONTROLLERS - Request/Response handling
│   ├── authController.js
│   ├── userController.js
│   ├── productController.js
│   ├── orderController.js
│   ├── cartController.js
│   ├── wishlistController.js
│   └── adminController.js
│
├── routes/                    # ROUTES - API endpoints
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── productRoutes.js
│   ├── orderRoutes.js
│   ├── cartRoutes.js
│   ├── wishlistRoutes.js
│   └── adminRoutes.js
│
├── middleware/                # Middleware functions
│   ├── authMiddleware.js
│   ├── errorHandler.js
│   ├── validation.js
│   └── upload.js
│
├── utils/                     # Utility functions
│   ├── helpers.js
│   ├── validators.js
│   ├── sendEmail.js
│   └── constants.js
│
├── validators/                # Request validation schemas
│   ├── authValidators.js
│   ├── productValidators.js
│   └── orderValidators.js
│
├── errors/                    # Custom error classes
│   ├── AppError.js
│   └── errorHandler.js
│
└── server.js                  # Application entry point
```

### Backend MVC Responsibilities

#### **Models** (`/models`)
- Define database schemas (Mongoose schemas)
- Define data validation rules
- Define relationships between entities
- Business logic related to data structure
- **NO** API calls or HTTP logic

#### **Services** (`/services`)
- Business logic implementation
- Data processing and transformation
- Complex calculations
- Database operations (through models)
- External API integrations
- **NO** HTTP request/response handling

#### **Controllers** (`/controllers`)
- Handle HTTP requests and responses
- Extract data from requests
- Call appropriate services
- Format responses
- Handle errors
- **NO** business logic

#### **Routes** (`/routes`)
- Define API endpoints
- Map URLs to controllers
- Apply middleware
- **NO** business logic or data manipulation

---

## Frontend MVC Structure

```
ecommerce-frontend/
├── src/
│   ├── models/                # MODELS - Data structures and validation
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Cart.js
│   │   └── Wishlist.js
│   │
│   ├── services/              # SERVICES - API communication
│   │   ├── api.js             # Base API configuration
│   │   ├── authService.js
│   │   ├── productService.js
│   │   ├── orderService.js
│   │   ├── cartService.js
│   │   ├── wishlistService.js
│   │   └── adminService.js
│   │
│   ├── controllers/           # CONTROLLERS - State and logic management
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── cartController.js
│   │   ├── wishlistController.js
│   │   └── adminController.js
│   │
│   ├── views/                 # VIEWS - Page components (MVC Views)
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── pages/
│   │   ├── user/
│   │   │   ├── Home.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Orders.jsx
│   │   │   └── Profile.jsx
│   │   └── admin/
│   │       ├── Dashboard.jsx
│   │       ├── Products.jsx
│   │       ├── Orders.jsx
│   │       └── Users.jsx
│   │
│   ├── components/            # Reusable UI Components
│   │   ├── common/            # Generic components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Loading.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   ├── layout/            # Layout components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── product/           # Product-specific components
│   │   │   └── ProductCard.jsx
│   │   ├── cart/              # Cart components
│   │   ├── order/             # Order components
│   │   └── admin/             # Admin components
│   │
│   ├── context/               # Context API for state management
│   │   ├── AuthContext.jsx
│   │   ├── CartContext.jsx
│   │   └── WishlistContext.jsx
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useCart.js
│   │   ├── useProduct.js
│   │   └── useOrder.js
│   │
│   ├── utils/                 # Utility functions
│   │   ├── helpers.js
│   │   ├── validators.js
│   │   ├── constants.js
│   │   └── formatters.js
│   │
│   ├── constants/             # Application constants
│   │   ├── routes.js
│   │   ├── api.js
│   │   └── messages.js
│   │
│   ├── assets/                # Static assets
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   ├── styles/                # Global styles
│   │   ├── globals.css
│   │   └── variables.css
│   │
│   ├── App.jsx                # Main App Component
│   └── main.jsx               # Entry Point
│
├── public/                    # Public files
├── package.json
└── vite.config.js
```

### Frontend MVC Responsibilities

#### **Models** (`/models`)
- Define data structures/types
- Data validation schemas
- Type definitions
- **NO** UI or API calls

#### **Services** (`/services`)
- API communication
- HTTP requests/responses
- Data transformation for API
- Error handling for API calls
- **NO** UI logic or state management

#### **Controllers** (`/controllers`)
- State management logic
- Business logic coordination
- Data processing
- Call services
- Update state/context
- **NO** UI rendering

#### **Views** (`/views`)
- Render UI components
- Handle user interactions
- Call controllers for actions
- Display data from state
- **NO** business logic or API calls directly

---

## MVC Flow Diagram

### Backend Flow:
```
Request → Routes → Middleware → Controller → Service → Model → Database
                                                      ↓
Response ← Routes ← Controller ← Service ← Model ← Database
```

### Frontend Flow:
```
User Action → View → Controller → Service → API
                                      ↓
UI Update ← View ← Controller ← Service ← API Response
```

---

## Key Principles

### 1. **Separation of Concerns**
- Each layer has a single responsibility
- Models handle data
- Services handle business logic
- Controllers handle HTTP/state
- Views handle presentation

### 2. **Dependency Direction**
- Views depend on Controllers
- Controllers depend on Services
- Services depend on Models
- Models are independent

### 3. **Single Responsibility**
- Each file/class has one reason to change
- Controllers only handle requests/responses
- Services only handle business logic
- Models only handle data structure

### 4. **DRY (Don't Repeat Yourself)**
- Reusable components
- Shared utilities
- Common services
- Base classes/interfaces

### 5. **Testability**
- Each layer can be tested independently
- Mock dependencies easily
- Clear interfaces between layers

---

## File Naming Conventions

### Backend:
- Models: `PascalCase.js` (e.g., `User.js`, `Product.js`)
- Services: `camelCaseService.js` (e.g., `userService.js`)
- Controllers: `camelCaseController.js` (e.g., `userController.js`)
- Routes: `camelCaseRoutes.js` (e.g., `userRoutes.js`)
- Middleware: `camelCase.js` (e.g., `authMiddleware.js`)

### Frontend:
- Models: `PascalCase.js` (e.g., `User.js`)
- Services: `camelCaseService.js` (e.g., `userService.js`)
- Controllers: `camelCaseController.js` (e.g., `userController.js`)
- Views: `PascalCase.jsx` (e.g., `Home.jsx`)
- Components: `PascalCase.jsx` (e.g., `ProductCard.jsx`)
- Hooks: `useCamelCase.js` (e.g., `useAuth.js`)

---

## Best Practices

### Backend:
1. ✅ Keep controllers thin - delegate to services
2. ✅ Keep services focused - single responsibility
3. ✅ Use middleware for cross-cutting concerns
4. ✅ Validate input at controller level
5. ✅ Handle errors consistently
6. ✅ Use async/await properly
7. ✅ Return consistent response formats

### Frontend:
1. ✅ Keep views simple - delegate to controllers
2. ✅ Use controllers for state management
3. ✅ Keep components reusable
4. ✅ Use hooks for shared logic
5. ✅ Handle loading and error states
6. ✅ Use TypeScript or PropTypes
7. ✅ Optimize re-renders

---

## Migration Checklist

- [ ] Create proper folder structure
- [ ] Move files to correct locations
- [ ] Create services layer (backend)
- [ ] Refactor controllers to use services
- [ ] Update all imports
- [ ] Create proper models
- [ ] Add validation layer
- [ ] Add error handling
- [ ] Update documentation
- [ ] Test all functionality

---

## Example Code Structure

### Backend Controller Example:
```javascript
// controllers/userController.js
import { userService } from '../services/userService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user._id);
  res.json({ success: true, data: user });
});
```

### Backend Service Example:
```javascript
// services/userService.js
import User from '../models/User.js';

export const userService = {
  async getUserById(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) throw new Error('User not found');
    return user;
  }
};
```

### Frontend Controller Example:
```javascript
// controllers/productController.js
import { productService } from '../services/productService.js';

export class ProductController {
  static async fetchProducts(setProducts, setLoading) {
    try {
      setLoading(true);
      const products = await productService.getAllProducts();
      setProducts(products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }
}
```

### Frontend View Example:
```javascript
// views/user/Home.jsx
import { useEffect, useState } from 'react';
import { ProductController } from '../../controllers/productController.js';
import ProductCard from '../../components/product/ProductCard.jsx';

export const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ProductController.fetchProducts(setProducts, setLoading);
  }, []);

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
};
```

---

This structure ensures maintainability, scalability, and testability of the application.
