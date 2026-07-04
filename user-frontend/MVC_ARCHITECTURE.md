# E-commerce Unified - MVC Architecture

## Project Structure

```
user-frontend/
├── src/
│   ├── controllers/          # Controllers (Handle user interactions and API calls)
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   ├── wishlistController.js
│   │   └── adminController.js
│   ├── models/              # Models (Data structures and validation)
│   │   ├── userModel.js
│   │   ├── productModel.js
│   │   ├── cartModel.js
│   │   └── orderModel.js
│   ├── services/            # Services (API calls and business logic)
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── productService.js
│   │   ├── cartService.js
│   │   ├── wishlistService.js
│   │   └── adminService.js
│   ├── store/               # State Management (Redux/Context)
│   │   ├── authStore.js
│   │   ├── cartStore.js
│   │   ├── wishlistStore.js
│   │   └── productStore.js
│   ├── views/               # Views (Pages - MVC Views)
│   │   ├── auth/            # Authentication pages
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── user/            # User-facing pages
│   │   │   ├── Home.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Cart.jsx
│   │   │   └── Wishlist.jsx
│   │   └── admin/           # Admin pages
│   │       ├── Dashboard.jsx
│   │       ├── Products.jsx
│   │       ├── Users.jsx
│   │       └── Orders.jsx
│   ├── components/          # Reusable UI Components
│   │   ├── common/          # Generic components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Loading.jsx
│   │   ├── layout/          # Layout components
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── auth/            # Auth components
│   │   ├── product/         # Product components
│   │   ├── cart/            # Cart components
│   │   ├── wishlist/        # Wishlist components
│   │   └── admin/           # Admin components
│   ├── utils/               # Utility functions and custom hooks
│   │   ├── helpers.js
│   │   ├── constants.js
│   │   ├── validators.js
│   │   └── hooks/
│   │       ├── useAuth.js
│   │       ├── useCart.js
│   │       └── useWishlist.js
│   ├── styles/              # Global styles
│   │   ├── globals.css
│   │   └── components.css
│   ├── assets/              # Static assets
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   ├── App.jsx              # Main App Component
│   └── main.jsx             # Entry Point
├── public/                  # Public files
├── package.json
└── vite.config.js
```

## MVC Pattern Implementation

### Models
- Data structures and validation schemas
- Business rules and data logic
- No UI or API calls

### Views
- React components that render UI
- Present user interface
- Handle user interactions
- Call controllers for actions

### Controllers
- Handle user input and interactions
- Coordinate between views and services
- Manage application state
- Make API calls through services

### Services
- API communication
- Business logic
- Data transformation
- External service integrations

### Store
- Global state management
- Data persistence
- State updates and subscriptions

## Key Features

1. **Unified Application**: Single app serving both user and admin interfaces
2. **Role-based Routing**: Different views based on user role
3. **Component Reusability**: Shared components across user and admin sections
4. **State Management**: Centralized state with Context API
5. **API Integration**: Organized service layer for API calls
6. **Type Safety**: PropTypes or TypeScript for type checking

## Benefits

1. **Maintainability**: Clear separation of concerns
2. **Scalability**: Easy to add new features
3. **Reusability**: Components and services can be reused
4. **Testability**: Each layer can be tested independently
5. **Performance**: Optimized rendering and data fetching
