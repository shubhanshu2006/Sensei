export interface PaymentConfirmationData {
  recruiterName: string;
  credits: number;
  amountPaid: number;
  orderId: string;
  paymentId: string;
  newBalance: number;
  transactionDate: string;
}

export const paymentConfirmationTemplate = (data: PaymentConfirmationData) => ({
  subject: `Payment Confirmed - ${data.credits} Interview Credits Added`,

  textBody: `
Hello ${data.recruiterName},

Your payment has been successfully processed!

Transaction Details:
- Credits Purchased: ${data.credits}
- Amount Paid: ₹${data.amountPaid}
- Order ID: ${data.orderId}
- Payment ID: ${data.paymentId}
- Transaction Date: ${data.transactionDate}

New Credit Balance: ${data.newBalance} credits

Your credits are now available and ready to use for conducting interviews. You can start scheduling interviews immediately from your dashboard.

Need help? Contact our support team anytime.

Thank you for using Sensei AI!
The Sensei Team
  `.trim(),

  htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .success-icon {
      font-size: 64px;
      margin-bottom: 15px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #333;
      margin-bottom: 20px;
    }
    .highlight-box {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      margin: 30px 0;
      box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
    }
    .credits-amount {
      font-size: 56px;
      font-weight: bold;
      margin: 15px 0;
    }
    .credits-label {
      font-size: 18px;
      opacity: 0.95;
      margin-top: 10px;
    }
    .transaction-details {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 25px;
      margin: 25px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e9ecef;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #666;
      font-size: 14px;
    }
    .detail-value {
      color: #333;
      font-weight: 600;
      font-size: 14px;
    }
    .balance-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 25px;
      border-radius: 8px;
      text-align: center;
      margin: 25px 0;
    }
    .balance-amount {
      font-size: 42px;
      font-weight: bold;
      margin: 10px 0;
    }
    .balance-label {
      font-size: 16px;
      opacity: 0.9;
    }
    .cta-button {
      display: inline-block;
      background-color: #667eea;
      color: #ffffff !important;
      padding: 16px 40px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
    }
    .cta-button:hover {
      background-color: #5568d3;
      box-shadow: 0 6px 8px rgba(102, 126, 234, 0.4);
    }
    .info-box {
      background-color: #e7f5ff;
      border-left: 4px solid #339af0;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 25px 0;
    }
    .feature-card {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .feature-icon {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .feature-title {
      font-size: 14px;
      color: #333;
      font-weight: 600;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 30px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .footer-links {
      margin-top: 15px;
    }
    .footer-link {
      color: #667eea;
      text-decoration: none;
      margin: 0 10px;
    }
    @media (max-width: 600px) {
      .features-grid {
        grid-template-columns: 1fr;
      }
      .detail-row {
        flex-direction: column;
      }
      .detail-value {
        margin-top: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">✅</div>
      <h1>Payment Successful!</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Hello <strong>${data.recruiterName}</strong>,</p>
      
      <p>Your payment has been successfully processed and your credits have been added to your account!</p>
      
      <div class="highlight-box">
        <div style="font-size: 18px; opacity: 0.95;">Credits Added</div>
        <div class="credits-amount">${data.credits}</div>
        <div class="credits-label">Interview Credits</div>
      </div>
      
      <div class="transaction-details">
        <h3 style="margin-top: 0; color: #333; font-size: 18px;">Transaction Details</h3>
        <div class="detail-row">
          <span class="detail-label">Amount Paid</span>
          <span class="detail-value">₹${data.amountPaid.toLocaleString("en-IN")}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Order ID</span>
          <span class="detail-value">${data.orderId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment ID</span>
          <span class="detail-value">${data.paymentId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Transaction Date</span>
          <span class="detail-value">${data.transactionDate}</span>
        </div>
      </div>
      
      <div class="balance-box">
        <div class="balance-label">New Credit Balance</div>
        <div class="balance-amount">${data.newBalance}</div>
        <div class="balance-label">Interview Credits Available</div>
      </div>
      
      <div style="text-align: center;">
        <a href="https://sensei.ai/recruiter/dashboard" class="cta-button">Go to Dashboard</a>
      </div>
      
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🎯</div>
          <div class="feature-title">Schedule Interviews</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🤖</div>
          <div class="feature-title">AI Screening</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <div class="feature-title">View Analytics</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⭐</div>
          <div class="feature-title">Review Candidates</div>
        </div>
      </div>
      
      <div class="info-box">
        <p style="margin: 0;"><strong>💡 What's Next?</strong></p>
        <p style="margin: 10px 0 0 0; color: #1864ab;">
          Your credits are ready to use! Head to your dashboard to schedule interviews, 
          screen candidates with AI, and find the perfect talent for your team.
        </p>
      </div>
      
      <p style="margin-top: 30px; color: #666;">
        If you have any questions about your purchase or need assistance, 
        our support team is here to help.
      </p>
      
      <p style="margin-top: 20px;">
        Thank you for choosing Sensei AI!<br>
        <strong>The Sensei Team</strong>
      </p>
    </div>
    
    <div class="footer">
      <p>This is a payment confirmation for your Sensei AI purchase.</p>
      <div class="footer-links">
        <a href="https://sensei.ai/invoices" class="footer-link">View Invoice</a>
        <a href="https://sensei.ai/help" class="footer-link">Help Center</a>
        <a href="https://sensei.ai/contact" class="footer-link">Contact Support</a>
      </div>
      <p style="margin-top: 15px; color: #999; font-size: 12px;">
        © 2026 Sensei AI. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim(),
});
