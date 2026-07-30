# Admin Frontend

Separate admin/staff portal for Render deployment. This app is self-contained:
the admin UI and supporting frontend code live under `admin-frontend/src`.

## Render Static Site

- Root Directory: `admin-frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

## Environment Variables

```env
VITE_API_URL=https://backend-80bu.onrender.com/api
VITE_APP_PORTAL=admin
VITE_ADMIN_URL=https://admin-frontend-02jx.onrender.com
VITE_CUSTOMER_URL=https://cherishbabykhstore.store
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Routes

- `/admin/login`
- `/seller/login`
- `/delivery/login`
- `/admin`
- `/admin/products`
- `/admin/orders`
- `/seller/dashboard`
- `/seller/orders`
- `/delivery/orders`
