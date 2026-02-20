import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Send password reset code email (Facebook-style 6-digit code)
export const sendPasswordResetCode = async (email, userName, resetCode) => {
  const fromName = process.env.EMAIL_FROM_NAME || "Baby Product Website";
  const fromEmail = process.env.EMAIL_USER;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
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
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Password reset code email sent successfully via Gmail!");
    console.log("   Message ID:", info.messageId);
    console.log("   To:", email);
    return info;
  } catch (error) {
    console.error("❌ Nodemailer error:", error);
    throw new Error(error.message || "Failed to send email via Gmail");
  }
};

// ─────────────────────────────────────────────────
// Send Delete Account OTP (for Google OAuth users)
// ─────────────────────────────────────────────────
export const sendDeleteAccountOtp = async (email, userName, otp) => {
  const fromName = process.env.EMAIL_FROM_NAME || "Baby Product Website";
  const fromEmail = process.env.EMAIL_USER;

  // Build individual digit boxes for a visual OTP display
  const digits = otp.split("");
  const digitBoxes = digits
    .map(
      (d) =>
        `<td style="padding:0 4px;">
          <div style="
            width:48px; height:60px;
            background:#fff1f2;
            border:2px solid #fecdd3;
            border-radius:12px;
            text-align:center;
            line-height:60px;
            font-size:28px;
            font-weight:800;
            color:#dc2626;
            font-family:'Courier New',monospace;
            display:inline-block;
          ">${d}</div>
        </td>`
    )
    .join("");

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject: `[Action Required] Confirm your account deletion — ${otp}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Delete Account Confirmation</title>
      </head>
      <body style="margin:0;padding:0;background:#fef2f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;padding:40px 16px;">
          <tr>
            <td align="center">
              <table width="100%" style="max-width:480px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);border:1px solid #fecdd3;">

                <!-- Header -->
                <tr>
                  <td style="background:#dc2626;padding:28px 32px;text-align:center;">
                    <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;text-transform:uppercase;">${fromName}</p>
                    <p style="margin:8px 0 0;font-size:13px;color:#fca5a5;font-weight:500;">Account Security Alert</p>
                  </td>
                </tr>

                <!-- Warning Icon row -->
                <tr>
                  <td style="padding:40px 32px 0;text-align:center;">
                    <div style="width:64px;height:64px;background:#fee2e2;border-radius:50%;border:4px solid #fecdd3;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:28px;line-height:64px;">
                      ⚠️
                    </div>
                    <h1 style="font-size:22px;font-weight:800;color:#18181b;margin:20px 0 8px;letter-spacing:-0.5px;">Delete Account Request</h1>
                    <p style="font-size:14px;line-height:1.7;color:#52525b;margin:0 0 32px;">
                      Hello <strong>${userName || "there"}</strong>,<br>
                      We received a request to permanently delete your account.<br>
                      Enter the code below in the app to confirm.
                    </p>
                  </td>
                </tr>

                <!-- OTP Digit Boxes -->
                <tr>
                  <td style="padding:0 32px 32px;text-align:center;">
                    <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;margin:0 0 16px;">Your Confirmation Code</p>
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>${digitBoxes}</tr>
                    </table>
                    <p style="font-size:13px;color:#9ca3af;margin:20px 0 0;">
                      ⏱ This code expires in <strong style="color:#dc2626;">10 minutes</strong>
                    </p>
                  </td>
                </tr>

                <!-- Warning box -->
                <tr>
                  <td style="padding:0 32px 32px;">
                    <div style="background:#fef2f2;border:1.5px solid #fecdd3;border-radius:14px;padding:16px 20px;">
                      <p style="margin:0;font-size:13px;line-height:1.6;color:#dc2626;font-weight:600;">
                        🚨 This action is permanent and irreversible.<br>
                        <span style="font-weight:400;color:#6b7280;">All your orders, reviews, and account data will be permanently deleted.</span>
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#fafafa;padding:24px 32px;text-align:center;border-top:1px solid #f4f4f5;">
                    <p style="font-size:12px;color:#a1a1aa;line-height:1.6;margin:0;">
                      If you did NOT request this, your account is safe — simply ignore this email.<br>
                      &copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
DELETE ACCOUNT CONFIRMATION CODE: ${otp}

Hello ${userName || "there"},

We received a request to permanently delete your ShopX account.
Enter the 6-digit code above in the app to confirm.

This code expires in 10 minutes.

WARNING: This action is PERMANENT and irreversible.

If you did NOT request this, please ignore this email — your account is safe.

${fromName}
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Delete account OTP email sent to:", email);
    return info;
  } catch (error) {
    console.error("❌ Failed to send delete OTP email:", error);
    throw new Error(error.message || "Failed to send confirmation email");
  }
};

