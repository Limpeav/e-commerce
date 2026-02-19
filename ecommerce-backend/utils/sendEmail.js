import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Send password reset code email (Facebook-style 6-digit code)
export const sendPasswordResetCode = async (email, userName, resetCode) => {
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const fromName = process.env.EMAIL_FROM_NAME || "Baby Product Website";

  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: [email],
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
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <p class="logo-text">${fromName}</p>
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
              &copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.
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
      
      ${fromName}
    `,
  });

  if (error) {
    console.error("❌ Resend error:", error);
    throw new Error(error.message || "Failed to send email via Resend");
  }

  console.log("✅ Password reset code email sent successfully via Resend!");
  console.log("   Message ID:", data?.id);
  console.log("   To:", email);

  return data;
};
