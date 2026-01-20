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
  // For Gmail, you can use OAuth2 or App Password
  // For development, you can use Ethereal Email (https://ethereal.email) for testing
  
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
      secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Option 3: Development - Ethereal Email (for testing without real email)
  // This creates a test account automatically
  return nodemailer.createTransporter({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: process.env.ETHEREAL_USER,
      pass: process.env.ETHEREAL_PASSWORD,
    },
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    // Dynamic import nodemailer for getTestMessageUrl
    let nodemailer;
    try {
      const nodemailerModule = await import("nodemailer");
      nodemailer = nodemailerModule.default;
    } catch (e) {
      nodemailer = null;
    }
    
    const transporter = await createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "Ecommerce Store"}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Password Reset Request</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hello,</p>
            <p style="font-size: 16px;">You requested to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        display: inline-block; 
                        font-weight: bold;
                        font-size: 16px;">
                Reset Password
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
            <p style="font-size: 12px; color: #999; word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">
              ${resetUrl}
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              This link will expire in <strong>1 hour</strong>.
            </p>
            <p style="font-size: 14px; color: #666;">
              If you didn't request this password reset, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        You requested to reset your password. Click the link below to reset it:
        
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request this password reset, please ignore this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log("✅ Password reset email sent successfully!");
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
    console.error("   Full error:", error);
    
    // Provide helpful error messages
    if (error.message.includes("Invalid login")) {
      console.error("   ⚠️  Gmail authentication failed. Check your EMAIL_USER and EMAIL_PASSWORD in .env");
      console.error("   ⚠️  Make sure you're using an App Password, not your regular Gmail password!");
    } else if (error.message.includes("self signed certificate")) {
      console.error("   ⚠️  SSL certificate issue. Try setting EMAIL_SECURE=false");
    } else if (error.code === "EAUTH") {
      console.error("   ⚠️  Authentication failed. Verify your email credentials in .env");
    }
    
    throw error;
  }
};
