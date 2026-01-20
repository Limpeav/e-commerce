# Email Setup Guide for Password Reset

This guide will help you set up email functionality for password reset.

## Installation

First, install nodemailer:
```bash
npm install nodemailer
```

## Configuration Options

### Option 1: Gmail (Recommended for Production)

1. **Enable 2-Step Verification** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Add to `.env` file**:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM_NAME=Your Store Name
FRONTEND_URL=http://localhost:5173
```

### Option 2: Custom SMTP (For other email providers)

Add to `.env` file:
```env
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM_NAME=Your Store Name
FRONTEND_URL=http://localhost:5173
```

### Option 3: Ethereal Email (For Development/Testing)

Ethereal Email creates a test account automatically. No real emails are sent.

1. Visit https://ethereal.email
2. Create a test account
3. Add to `.env` file:
```env
ETHEREAL_USER=your-ethereal-username
ETHEREAL_PASSWORD=your-ethereal-password
FRONTEND_URL=http://localhost:5173
```

## Example .env Configuration

```env
# Email Configuration (Gmail Example)
EMAIL_SERVICE=gmail
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM_NAME=Ecommerce Store

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Other existing variables...
MONGO_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
PORT=4000
```

## Testing

After configuration, test the password reset:
1. Go to the forgot password page
2. Enter your email
3. Check your inbox (or Ethereal inbox if using test account)
4. Click the reset link in the email

## Troubleshooting

### Gmail Issues:
- Make sure you're using an **App Password**, not your regular Gmail password
- Enable "Less secure app access" is no longer needed - use App Passwords instead

### SMTP Issues:
- Check your email provider's SMTP settings
- Some providers require specific ports (587 for TLS, 465 for SSL)
- Verify firewall isn't blocking the connection

### Development:
- Use Ethereal Email for testing without real email accounts
- Check console logs for email preview URLs when using Ethereal
