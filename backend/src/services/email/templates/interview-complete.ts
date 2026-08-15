export interface InterviewCompleteData {
  candidateName: string;
  jobTitle: string;
  companyName?: string;
  resultsLink: string;
  interviewType: "HIRING" | "PRACTICE";
  overallScore?: number;
}

export const interviewCompleteTemplate = (data: InterviewCompleteData) => ({
  subject: `Interview Completed - ${data.jobTitle}${data.companyName ? ` at ${data.companyName}` : ""}`,

  textBody: `
Hello ${data.candidateName},

Thank you for completing your ${data.interviewType === "PRACTICE" ? "practice" : ""} interview for ${data.jobTitle}${data.companyName ? ` at ${data.companyName}` : ""}!

Your interview has been successfully recorded and ${data.interviewType === "PRACTICE" ? "evaluated" : "the recruiter will review your performance soon"}.

View Your Results: ${data.resultsLink}

What's Next:
${
  data.interviewType === "PRACTICE"
    ? "- Review your performance scorecard\n- Check personalized resume feedback\n- Practice more to improve your skills"
    : "- The recruiter will review your interview\n- You'll be notified of the next steps\n- Check your personalized feedback"
}

Your interview results include:
- Performance scorecard with detailed scores
- Communication and technical assessment
- Personalized resume improvement suggestions
- Areas of strength and improvement

Best wishes for your application!
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
    }
    .header {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
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
      font-size: 48px;
      margin-bottom: 10px;
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 25px;
      border-radius: 8px;
      text-align: center;
      margin: 30px 0;
    }
    .score {
      font-size: 48px;
      font-weight: bold;
      margin: 10px 0;
    }
    .score-label {
      font-size: 14px;
      opacity: 0.9;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #11998e;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .cta-button {
      display: inline-block;
      background-color: #11998e;
      color: #ffffff !important;
      padding: 16px 40px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 30px 0;
      box-shadow: 0 4px 6px rgba(17, 153, 142, 0.3);
      transition: all 0.3s ease;
    }
    .cta-button:hover {
      background-color: #0e8074;
      box-shadow: 0 6px 8px rgba(17, 153, 142, 0.4);
    }
    .next-steps {
      background-color: #e7f5ff;
      border-left: 4px solid #339af0;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .next-steps h3 {
      margin-top: 0;
      color: #1864ab;
      font-size: 16px;
    }
    .next-steps ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .next-steps li {
      color: #1864ab;
      margin: 8px 0;
    }
    .results-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 25px 0;
    }
    .result-card {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .result-icon {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .result-title {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    .result-value {
      font-size: 18px;
      font-weight: 600;
      color: #333;
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
      color: #11998e;
      text-decoration: none;
      margin: 0 10px;
    }
    @media (max-width: 600px) {
      .results-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">✅</div>
      <h1>Interview Completed!</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Hello <strong>${data.candidateName}</strong>,</p>
      
      <p>Congratulations on completing your ${data.interviewType === "PRACTICE" ? "practice" : ""} interview for <strong>${data.jobTitle}</strong>${data.companyName ? ` at <strong>${data.companyName}</strong>` : ""}!</p>
      
      ${
        data.overallScore
          ? `
      <div class="highlight-box">
        <div class="score-label">Overall Performance</div>
        <div class="score">${data.overallScore}/100</div>
        <p style="margin: 0; font-size: 14px;">Great job! See detailed breakdown below.</p>
      </div>
      `
          : ""
      }
      
      <div class="info-box">
        <p style="margin: 0;"><strong>Your interview results are ready!</strong></p>
        <p style="margin: 10px 0 0 0; color: #666;">
          ${
            data.interviewType === "PRACTICE"
              ? "We've analyzed your responses and prepared personalized feedback to help you improve."
              : "The recruiter will review your performance and get back to you soon."
          }
        </p>
      </div>
      
      <div style="text-align: center;">
        <a href="${data.resultsLink}" class="cta-button">View Detailed Results</a>
      </div>
      
      <div class="results-grid">
        <div class="result-card">
          <div class="result-icon">📊</div>
          <div class="result-title">Performance</div>
          <div class="result-value">Scorecard</div>
        </div>
        <div class="result-card">
          <div class="result-icon">💬</div>
          <div class="result-title">Communication</div>
          <div class="result-value">Analysis</div>
        </div>
        <div class="result-card">
          <div class="result-icon">📝</div>
          <div class="result-title">Resume</div>
          <div class="result-value">Feedback</div>
        </div>
        <div class="result-card">
          <div class="result-icon">🎯</div>
          <div class="result-title">Improvement</div>
          <div class="result-value">Tips</div>
        </div>
      </div>
      
      <div class="next-steps">
        <h3>📋 What's Next?</h3>
        <ul>
          ${
            data.interviewType === "PRACTICE"
              ? "<li>Review your <strong>performance scorecard</strong> with detailed scores</li><li>Check <strong>personalized resume feedback</strong></li><li>Practice more interviews to <strong>improve your skills</strong></li><li>Apply to real jobs when you feel confident</li>"
              : "<li>The recruiter will <strong>review your interview</strong></li><li>You'll be <strong>notified of next steps</strong> via email</li><li>Review your <strong>personalized feedback</strong> to improve</li><li>Check your application status in the dashboard</li>"
          }
        </ul>
      </div>
      
      <p style="margin-top: 30px;">
        ${
          data.interviewType === "PRACTICE"
            ? "Keep practicing to perfect your interview skills!"
            : "Best wishes for your application! We're rooting for you."
        }
        <br>
        <strong>The Sensei AI Team</strong>
      </p>
    </div>
    
    <div class="footer">
      <p>You're receiving this email because you completed an interview through Sensei AI.</p>
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
