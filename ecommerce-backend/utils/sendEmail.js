// Create reusable transporter object using SMTP transport
const createTransporter = async () => {
  // Dynamic import to avoid crashing if nodemailer is not installed
  let nodemailer;
  try {
    const nodemailerModule = await import("nodemailer");
    nodemailer = nodemailerModule.default;
  } catch (error) {
    throw new Error("Nodemailer is not installed. Please run: npm install nodemailer");
  }

  // Option 1: Gmail with App Password (Recommended for production)
  if (process.env.EMAIL_SERVICE === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use App Password, not regular password
      },
    });
  }

  // Option 2: Custom SMTP (for other email providers)
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Option 3: Development - Ethereal Email (for testing without real email)
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: process.env.ETHEREAL_USER,
      pass: process.env.ETHEREAL_PASSWORD,
    },
  });
};

// Send password reset code email (Facebook-style 6-digit code)
export const sendPasswordResetCode = async (email, userName, resetCode) => {
  try {
    let nodemailer;
    try {
      const nodemailerModule = await import("nodemailer");
      nodemailer = nodemailerModule.default;
    } catch (e) {
      nodemailer = null;
    }

    const transporter = await createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "Ecommerce Store"}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${resetCode} is your password reset code`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Code</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; color: #18181b; }
            .container { max-width: 480px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04); border: 1px solid #e4e4e7; }
            .header { background-color: #ffffff; padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #f4f4f5; }
            .logo-text { font-size: 20px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px; margin: 0; text-transform: uppercase; }
            .content { padding: 40px 32px; text-align: center; }
            .h1 { font-size: 24px; font-weight: 700; color: #18181b; margin: 0 0 16px; letter-spacing: -0.5px; }
            .p { font-size: 15px; line-height: 1.6; color: #52525b; margin: 0 0 32px; }
            .code-box { background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 16px; padding: 24px; margin: 0 0 32px; display: inline-block; min-width: 200px; }
            .code { font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; color: #4f46e5; letter-spacing: 8px; margin: 0; line-height: 1; display: block; }
            .code-label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 12px; display: block; letter-spacing: 1px; }
            .expiry { font-size: 13px; color: #71717a; background-color: #fafafa; padding: 12px; border-radius: 8px; display: inline-block; }
            .footer { background-color: #fafafa; padding: 24px 32px; text-align: center; border-top: 1px solid #f4f4f5; }
            .footer-text { font-size: 12px; color: #a1a1aa; line-height: 1.5; margin: 0; }
            .warning { color: #f59e0b; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <p class="logo-text">Baby Product Website</p>
            </div>
            <div class="content">
              <h1 class="h1">Password Reset Request</h1>
              <p class="p">Hello ${userName || "there"},<br>We received a request to reset your password. Use the code below to verify your identity.</p>
              
              <div class="code-box">
                <span class="code-label">Verification Code</span>
                <span class="code">${resetCode}</span>
              </div>

              <div class="expiry">
                This code expires in <strong>10 minutes</strong>.
              </div>
            </div>
            <div class="footer">
              <p class="footer-text">
                If you didn't request this code, you can safely ignore this email.<br>
                &copy; ${new Date().getFullYear()} Baby Product Website. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        VERIFICATION CODE: ${resetCode}
        
        Hello ${userName || "there"},
        
        We received a request to reset your password. Use the code above to verify your identity.
        This code expires in 10 minutes.
        
        If you didn't request this code, please ignore this email.
        
        Baby Product Website
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Password reset code email sent successfully!");
    console.log("   Message ID:", info.messageId);
    console.log("   To:", email);

    // If using Ethereal Email, log the preview URL
    if (process.env.EMAIL_SERVICE !== "gmail" && !process.env.EMAIL_HOST && nodemailer) {
      try {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log("   Preview URL:", previewUrl);
        }
      } catch (e) {
        // Ignore if getTestMessageUrl is not available
      }
    }

    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);

    if (error.message.includes("Invalid login")) {
      console.error("   ⚠️  Email authentication failed. Check your EMAIL_USER and EMAIL_PASSWORD in .env");
    } else if (error.code === "EAUTH") {
      console.error("   ⚠️  Authentication failed. Verify your email credentials in .env");
    }

    throw error;
  }
};
