# MVC Refactoring Guide

This guide will help you refactor your project to follow professional MVC architecture.

## Step-by-Step Refactoring Process

### Phase 1: Backend Refactoring

#### Step 1: Create Services Layer
1. ✅ Created `/services` directory
2. ✅ Created `productService.js` as example
3. ⏳ Create remaining services:
   - `userService.js`
   - `orderService.js`
   - `cartService.js`
   - `wishlistService.js`
   - `authService.js`
   - `adminService.js`

#### Step 2: Refactor Controllers
- Move business logic from controllers to services
- Controllers should only handle HTTP requests/responses
- Use `asyncHandler` for error handling

#### Step 3: Create Error Handling
- ✅ Created `AppError` class
- ⏳ Create global error handler middleware
- Update controllers to use AppError

#### Step 4: Create Validators
- Create validation schemas in `/validators`
- Use middleware for request validation

### Phase 2: Frontend Refactoring

#### Step 1: Organize Models
- Ensure models are properly structured
- Add validation schemas

#### Step 2: Refactor Controllers
- Move business logic from views to controllers
- Controllers should manage state and call services

#### Step 3: Organize Components
- Group components by feature
- Create reusable common components

#### Step 4: Update Views
- Views should only render UI
- Call controllers for actions

## Example Refactoring

### Before (Controller with Business Logic):
```javascript
// controllers/productController.js
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    // ... 50 lines of business logic ...
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
```

### After (Controller + Service):
```javascript
// controllers/productController.js
import { productService } from '../services/productService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(
    req.params.id,
    req.user?._id
  );
  res.json({ success: true, data: product });
});

// services/productService.js
export const productService = {
  async getProductById(productId, userId) {
    // ... business logic here ...
  }
};
```

## Migration Checklist

### Backend:
- [x] Create services directory
- [x] Create productService.js
- [ ] Create remaining services
- [ ] Refactor productController.js
- [ ] Refactor remaining controllers
- [ ] Create error handling middleware
- [ ] Create validators
- [ ] Update routes
- [ ] Test all endpoints

### Frontend:
- [ ] Organize models
- [ ] Refactor controllers
- [ ] Update views to use controllers
- [ ] Organize components
- [ ] Update imports
- [ ] Test all functionality

## Next Steps

1. Review the MVC_STRUCTURE.md document
2. Follow the refactoring guide step by step
3. Test after each refactoring step
4. Update documentation as you go
