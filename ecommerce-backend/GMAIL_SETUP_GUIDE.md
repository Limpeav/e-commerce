# Gmail Setup Guide - Step by Step

Follow these steps to set up Gmail for sending password reset emails.

## Step 1: Enable 2-Step Verification

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click on **Security** (left sidebar)
3. Under "How you sign in to Google", find **2-Step Verification**
4. Click on it and follow the prompts to enable 2-Step Verification
   - You'll need to verify your phone number
   - Google will send you a verification code

## Step 2: Generate App Password

1. After enabling 2-Step Verification, go back to **Security** page
2. Look for **2-Step Verification** again
3. Click on it, then scroll down to find **App passwords**
4. Click on **App passwords**
5. You may need to sign in again
6. Under "Select app", choose **Mail**
7. Under "Select device", choose **Other (Custom name)**
8. Type: **Ecommerce Backend** (or any name you prefer)
9. Click **Generate**
10. Google will show you a **16-character password** (like: `abcd efgh ijkl mnop`)
11. **Copy this password immediately** - you won't see it again!

## Step 3: Configure .env File

Open your `ecommerce-backend/.env` file and add these lines:

```env
# Gmail Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM_NAME=Ecommerce Store
FRONTEND_URL=http://localhost:5173
```

**Important:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `abcd efgh ijkl mnop` with the 16-character App Password you just generated
- **Remove spaces** from the App Password (or keep them, both work)
- The `EMAIL_PASSWORD` should be the App Password, NOT your regular Gmail password

## Step 4: Install Nodemailer

Make sure nodemailer is installed:

```bash
cd ecommerce-backend
npm install nodemailer
```

## Step 5: Restart Your Backend Server

After updating the `.env` file:

1. Stop your backend server (Ctrl+C)
2. Start it again:
   ```bash
   npm run dev
   ```

## Step 6: Test

1. Go to your forgot password page
2. Enter your email address
3. Check your **backend console** - you should see:
   ```
   ✅ Password reset email sent successfully!
      Message ID: <some-id>
      To: your-email@gmail.com
   ```
4. Check your **Gmail inbox** (and spam folder)
5. Click the reset link in the email

## Troubleshooting

### ❌ "Invalid login" or "Authentication failed" error

**Solution:**
- Make sure you're using an **App Password**, not your regular Gmail password
- Verify 2-Step Verification is enabled
- Check that the App Password is copied correctly (no extra spaces)
- Make sure `EMAIL_USER` matches the Gmail account where you generated the App Password

### ❌ "Less secure app access" error

**Solution:**
- Google no longer supports "Less secure app access"
- You **MUST** use App Passwords with 2-Step Verification enabled
- This is the only way to send emails from Gmail now

### ❌ Email not received

**Check:**
1. **Spam folder** - Gmail might mark it as spam initially
2. **Backend console** - Look for error messages
3. **Email address** - Make sure the email in your account matches the one you're testing with
4. **Wait a few minutes** - Sometimes there's a delay

### ❌ "Nodemailer is not installed" error

**Solution:**
```bash
cd ecommerce-backend
npm install nodemailer
```

### ✅ Still not working?

Check your backend console when you click "Send Reset Link". Look for:
- `✅ Password reset email sent successfully!` = Email was sent
- `❌ Error sending email:` = There's a configuration problem
- `Manual reset URL (email failed):` = Email failed, but you can use the URL from console

## Example .env File

Here's a complete example of what your `.env` should look like:

```env
# Database
MONGO_URI=mongodb://localhost:27017/ecommerce

# JWT
JWT_SECRET=your-secret-key-here

# Server
PORT=4000

# Gmail Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=myemail@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM_NAME=Ecommerce Store
FRONTEND_URL=http://localhost:5173
```

## Need Help?

If you're still having issues:
1. Check the backend console for specific error messages
2. Verify all steps above are completed
3. Make sure your Gmail account has 2-Step Verification enabled
4. Double-check the App Password is correct in your `.env` file
