# Deployment Guide for E-Commerce App

## 1. Prerequisites
- **GitHub Account**: Push your code to a GitHub repository.
- **MongoDB Atlas Account**: For your database.
- **Render/Railway Account**: For hosting the backend.
- **Vercel/Netlify Account**: For hosting the frontend.

## 2. Deploy Database (MongoDB Atlas)
1.  Create a cluster on MongoDB Atlas (Free Tier).
2.  Create a database user (username/password).
3.  Whitelist "Allow Access from Anywhere" (0.0.0.0/0) in Network Access.
4.  Get your **Connection String**: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/ecommerce?retryWrites=true&w=majority`

## 3. Deploy Backend (Render)
1.  Click **New +** -> **Web Service**.
2.  Connect your GitHub repository.
3.  Select the `backend` folder as Root Directory.
4.  **Build Command**: `npm install`
5.  **Start Command**: `node server.js`
6.  **Environment Variables**:
    - `MONGO_URI`: Your MongoDB connection string.
    - `JWT_SECRET`: A secret string (e.g., `mysecret123`).
    - `CLOUDINARY_...`: Your Cloudinary keys.
    - `REMOVE_BG_API_KEY`: remove.bg API key for automatic product image background removal.
    - `GOOGLE_...`: Your Google OAuth keys.
    - `ALLOWED_ORIGINS`: Your deployed frontend origin.
      - Example: `https://baby-products-wtux.onrender.com`
    - `FRONTEND_URL`: Same value as your deployed frontend origin.
      - Example: `https://baby-products-wtux.onrender.com`
    - `PORT`: `10000` (Render sets this automatically, but good to know).
7.  Deploy! You will get a URL like `https://my-ecommerce-backend.onrender.com`.

## 4. Deploy Frontend (Vercel)
1.  Import your GitHub repository.
2.  Select `user-frontend` as the Root Directory.
3.  **Framework Preset**: Vite.
4.  **Build Command**: `npm run build`
5.  **Output Directory**: `dist`
6.  **Environment Variables**:
    - `VITE_API_URL`: The URL of your deployed backend, **with /api at the end**.
      - Example: `https://my-ecommerce-backend.onrender.com/api`
    - `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
    - `VITE_GOOGLE_MAPS_API_KEY`: Your Google Maps Key.
7.  Deploy!

## 5. Final Checks
- Go to your Vercel URL.
- Try to log in.
- Try to view products.
- If something fails, check the "Console" in your browser (F12) or the logs in Render/Vercel dashboard.
- For a Render static frontend, do not leave `VITE_API_URL` as `/api` unless you have a real proxy in front of the backend. Set it to the backend origin, for example `https://my-ecommerce-backend.onrender.com`. The frontend code appends `/api` automatically when needed.
- In Google Cloud Console, add the deployed frontend origin to **Authorized JavaScript origins**. Example: `https://baby-products-wtux.onrender.com`.

## Important Note on CORS
The backend reads allowed origins from `ALLOWED_ORIGINS`, or falls back to `FRONTEND_URL` and `ADMIN_FRONTEND_URL`.
For production, set these values explicitly in Render so browser requests from your frontend pass CORS checks.
