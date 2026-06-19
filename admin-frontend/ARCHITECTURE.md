# Admin Frontend Architecture

The admin portal follows an MVC-oriented data flow:

```text
View / Component
      ↓
Controller
      ↓
Model normalization
      ↓
Service
      ↓
HTTP API
```

## Folders

- `src/shared/views/` — React pages. Views render UI and coordinate local UI state.
- `src/shared/components/` — Reusable presentation components.
- `src/shared/controllers/` — Application actions and orchestration. Views call controllers instead of services.
- `src/shared/models/` — API response normalization and stable frontend data shapes.
- `src/shared/services/` — HTTP and realtime infrastructure only.
- `src/shared/config/` — Routes and environment-derived application configuration.
- `src/shared/utils/` — Pure helpers without API or React rendering responsibilities.

## Controller ownership

- `authController.js` — portal login and current-user requests.
- `dashboardController.js` — dashboard, order, product, and seller summary loading.
- `orderController.js` — order list mutations and receipt delivery.
- `productController.js` — product forms, images, CSV import, and CSV drafts.
- `userController.js` — customers and staff accounts.
- `bannerController.js` — home banner management.
- `cashReportController.js` — cash reports and CSV exports.
- `reportController.js` — combined reporting data.
- `reviewController.js` — review moderation.
- `adminController.js` — legacy result-style actions still used by protected routes and order details.
- `adminProductController.js` — legacy result-style product-list actions.

## Rules

1. Views must not import `services/api.js` or `services/adminService.js`.
2. Controllers may call services and models.
3. Services must not contain UI or navigation logic, except centralized authentication redirects in the HTTP interceptor.
4. Models must remain pure and side-effect free.
5. Shared formatting or calculation logic belongs in `utils/`, not in API services.
