export interface InterviewInvitationData {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  scheduledTime: string;
  interviewLink: string;
}

export const interviewInvitationTemplate = (data: InterviewInvitationData) => ({
  subject: `Interview Scheduled - ${data.jobTitle} at ${data.companyName}`,

  textBody: `
Hello ${data.candidateName},

Your interview has been scheduled!

Company: ${data.companyName}
Position: ${data.jobTitle}
Scheduled Time: ${data.scheduledTime}

Interview Link: ${data.interviewLink}

Please join the interview at the scheduled time using the link above.

Important Notes:
- Ensure you're in a quiet environment
- Use a stable internet connection
- Test your microphone and camera beforehand
- Have your resume handy for reference

The interview typically takes 30-45 minutes and includes both technical and behavioral questions.

Best regards,
Sensei AI Team
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
      padding: 0;
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
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #333;
      margin-bottom: 20px;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .info-item {
      margin: 12px 0;
      display: flex;
      align-items: flex-start;
    }
    .info-label {
      font-weight: 600;
      color: #555;
      min-width: 120px;
    }
    .info-value {
      color: #333;
      flex: 1;
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
      margin: 30px 0;
      text-align: center;
      box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
    }
    .cta-button:hover {
      background-color: #5568d3;
      box-shadow: 0 6px 8px rgba(102, 126, 234, 0.4);
    }
    .tips {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .tips h3 {
      margin-top: 0;
      color: #856404;
      font-size: 16px;
    }
    .tips ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .tips li {
      color: #856404;
      margin: 8px 0;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Interview Scheduled</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Hello <strong>${data.candidateName}</strong>,</p>
      
      <p>Great news! Your interview has been scheduled with <strong>${data.companyName}</strong>.</p>
      
      <div class="info-box">
        <div class="info-item">
          <span class="info-label">Company:</span>
          <span class="info-value">${data.companyName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Position:</span>
          <span class="info-value">${data.jobTitle}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Scheduled Time:</span>
          <span class="info-value">${data.scheduledTime}</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${data.interviewLink}" class="cta-button">Join Interview</a>
      </div>
      
      <div class="tips">
        <h3>⚡ Important: Prepare for Your Interview</h3>
        <ul>
          <li>Ensure you're in a <strong>quiet environment</strong> with good lighting</li>
          <li>Use a <strong>stable internet connection</strong> (wired connection recommended)</li>
          <li>Test your <strong>microphone and camera</strong> beforehand</li>
          <li>Have your <strong>resume</strong> and project details handy</li>
          <li>Join <strong>5 minutes early</strong> to test your setup</li>
        </ul>
      </div>
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        The interview typically takes <strong>30-45 minutes</strong> and includes both technical and behavioral questions. 
        Our AI interviewer will ask questions based on the job requirements and your experience.
      </p>
      
      <p style="margin-top: 30px;">
        Best wishes for your interview!<br>
        <strong>The Sensei AI Team</strong>
      </p>
    </div>
    
    <div class="footer">
      <p>You're receiving this email because you applied for a position through Sensei AI.</p>
      <div class="footer-links">
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
