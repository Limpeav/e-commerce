# Google Maps API Setup Guide

## Current Issue
You're seeing an **"Invalid API Key"** error because the API key needs to be properly configured in Google Cloud Console.

Your API key should be stored only in your local `.env` file or hosting provider environment variables.

---

## How to Fix This

### Step 1: Access Google Cloud Console
1. Go to: https://console.cloud.google.com/
2. Sign in with your Google account (the one associated with this API key)

### Step 2: Enable Maps JavaScript API
1. Click on the **hamburger menu** (☰) in the top-left corner
2. Navigate to: **APIs & Services** → **Library**
3. In the search bar, type: **"Maps JavaScript API"**
4. Click on **"Maps JavaScript API"**
5. Click the **"ENABLE"** button
6. Wait for it to enable (this might take a few seconds)

### Step 3: Configure API Key Restrictions (Important!)
1. Go to: **APIs & Services** → **Credentials**
2. Find your Google Maps API key
3. Click on the API key to edit it

#### Set Application Restrictions:
- Choose: **"HTTP referrers (websites)"**
- Add these referrers:
  ```
  http://localhost:5173/*
  http://localhost:*
  http://127.0.0.1:*
  ```
- For production, add your domain:
  ```
  https://yourdomain.com/*
  ```

#### Set API Restrictions:
- Choose: **"Restrict key"**
- Select these APIs:
  - ✅ **Maps JavaScript API**
  - ✅ **Geocoding API** (for address lookup)
  - ✅ **Places API** (for search autocomplete)
  - ✅ **Geolocation API** (optional, for IP-based location)

4. Click **"SAVE"** at the bottom

### Step 4: Additional Recommended APIs
To enable all features of the map picker, also enable these APIs:

1. **Geocoding API** (for converting coordinates to addresses)
   - Go to: APIs & Services → Library
   - Search: "Geocoding API"
   - Click ENABLE

2. **Places API** (for location search)
   - Go to: APIs & Services → Library
   - Search: "Places API"
   - Click ENABLE

3. **Geolocation API** (optional, for IP-based location)
   - Go to: APIs & Services → Library
   - Search: "Geolocation API"
   - Click ENABLE

---

## Billing Setup (Required!)

**IMPORTANT:** Google Maps requires a billing account to be set up, even though there's a generous free tier.

### Free Tier Limits:
- **Maps JavaScript API**: $200/month free credit
- This covers approximately **28,000 map loads** per month for free!
- You won't be charged unless you exceed the free quota

### To Set Up Billing:
1. In Google Cloud Console, click **Billing** in the left menu
2. Click **"Link a billing account"** or **"Create billing account"**
3. Enter your payment information (you won't be charged for normal usage)
4. Google provides **$200 free credit every month** automatically

---

## Testing After Setup

Once you've completed the steps above:

1. **Wait 1-2 minutes** for the changes to propagate
2. **Refresh your browser** (hard refresh with Cmd+Shift+R or Ctrl+Shift+F5)
3. Navigate to: http://localhost:5173/location
4. The map should now load successfully!

---

## What Features Will Work After Setup

✅ **Interactive Google Maps** with Cambodia as default location  
✅ **Search bar** with autocomplete for addresses  
✅ **Current location detection** using GPS  
✅ **Click to select** any location on the map  
✅ **Drag marker** to fine-tune position  
✅ **Address display** with real-time geocoding  
✅ **Coordinates display** showing exact lat/lng  

---

## Troubleshooting

### If you still see "Invalid API Key":
1. Make sure you're using the correct Google account
2. Check that Maps JavaScript API is **ENABLED**
3. Verify the API key has **NO IP restrictions** (or includes localhost)
4. Wait a few minutes and try again (changes can take time to propagate)
5. Try incognito mode to clear cache

### If you see "This API project is not authorized...":
- You need to set up billing (see above)
- Even with $200/month free credit, billing must be enabled

### If search doesn't work:
- Enable **Places API** in the Library
- Add it to your API key restrictions

### If address display doesn't work:
- Enable **Geocoding API** in the Library  
- Add it to your API key restrictions

---

## Alternative: Create a New API Key

If you can't access the existing key, create a new one:

1. Go to: **APIs & Services** → **Credentials**
2. Click: **"+ CREATE CREDENTIALS"** → **"API key"**
3. Copy the new API key
4. Follow Steps 2-4 above to configure it
5. Replace the key in your `.env` file (if you create one) or in `GoogleMapPicker.jsx`

---

## Security Best Practices

🔒 **For Production:**
1. **Never commit API keys** to GitHub
2. Use **environment variables** instead:
   ```bash
   # Create .env file
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```
   
3. Update `GoogleMapPicker.jsx` to use env variable:
   ```javascript
   const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
   ```

4. Add `.env` to `.gitignore`

5. Use **HTTP referrer restrictions** (not IP restrictions)

---

## Need Help?

- Google Maps Platform Documentation: https://developers.google.com/maps/documentation
- Pricing: https://cloud.google.com/maps-platform/pricing
- Support: https://support.google.com/googleapi

---

**After completing these steps, your professional Google Maps implementation will be fully functional! 🗺️**
