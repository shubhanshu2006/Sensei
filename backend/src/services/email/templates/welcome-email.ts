export interface WelcomeEmailData {
  userName?: string;
  userEmail: string;
  dashboardLink?: string;
}

export const welcomeEmailTemplate = (data: WelcomeEmailData) => {
  const name = data.userName?.trim() || "there";
  const dashboardLink = data.dashboardLink || "https://sensei-prep.com/candidate/dashboard";

  const orangeColor = "#ff6a00";
  const pinkColor = "#ec1684";
  const roseGradient = "linear-gradient(135deg, #ff6a00 0%, #f5384f 55%, #ec1684 100%)";

  return {
    subject: "Welcome to Sensei — 2 Free AI Practice Interviews are Ready!",

    textBody: `
Hi ${name},

I'm Shubhanshu Singh, the founder of Sensei — and I'm genuinely thrilled to have you here. You just took the first step toward never missing the right opportunity again.

Here's what you can do right now:
✦ Claim your 2 Free AI Practice Interviews (already loaded into your account)
✦ Set your preferences — target roles, seniority level, and core technologies
✦ Practice real-world technical and behavioral mock rounds with adaptive voice AI
✦ Get instant bar-raiser scorecards, speech analysis, and personalized tips

The early bird really does get the role — our data shows prepared applicants are 4× more likely to land an interview. Let's make sure you're always early.

Start practicing now: ${dashboardLink}

Warmly,
Shubhanshu Singh
Founder, Sensei
support: shubhanshus450@gmail.com
    `.trim(),

    htmlBody: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Sensei</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #374151;
      background-color: #fff9f6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #fff9f6;
      padding: 40px 16px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid #fce3d8;
      box-shadow: 0 10px 35px -5px rgba(255, 106, 0, 0.08);
    }
    .header {
      background: ${roseGradient};
      padding: 38px 30px;
      text-align: center;
    }
    .logo {
      font-size: 32px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
      margin: 0;
      display: inline-block;
    }
    .logo-dot {
      color: #ffd2b3;
    }
    .header-sub {
      color: rgba(255, 255, 255, 0.92);
      font-size: 14px;
      margin: 8px 0 0 0;
      font-weight: 500;
    }
    .content {
      padding: 36px 32px;
    }
    .greeting {
      font-size: 19px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 16px;
    }
    .feature-card {
      background: linear-gradient(135deg, #fff7f2 0%, #fff1f6 100%);
      border: 1px solid rgba(255, 106, 0, 0.14);
      border-radius: 14px;
      padding: 20px 22px;
      margin: 22px 0 26px;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0 28px;
    }
    .btn {
      background: ${roseGradient};
      color: #ffffff !important;
      padding: 15px 36px;
      text-decoration: none;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 15px;
      display: inline-block;
      box-shadow: 0 10px 24px -6px rgba(240, 60, 90, 0.45);
    }
    .signoff {
      margin-top: 26px;
      padding-top: 20px;
      border-top: 1px solid #f3f4f6;
    }
    .footer {
      background-color: #fafaf9;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #f5ebe6;
      font-size: 12px;
      color: #9ca3af;
    }
    .footer a {
      color: ${orangeColor};
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="logo">Sensei<span class="logo-dot">•</span></h1>
        <p class="header-sub">Your AI-Powered Technical Interview Partner</p>
      </div>

      <div class="content">
        <h2 class="greeting">Welcome, ${name}!</h2>

        <p style="margin: 0 0 18px; font-size: 16px; color: #374151; line-height: 1.7;">
          I'm <strong style="color: #111827;">Shubhanshu Singh</strong>, the founder of Sensei — and I'm genuinely thrilled to have you here. You just took the first step toward never missing the right opportunity again.
        </p>

        <p style="margin: 0 0 16px; font-size: 16px; color: #374151; line-height: 1.7;">
          Here's what you can do right now:
        </p>

        <div class="feature-card">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
            <tr>
              <td style="padding: 9px 0; font-size: 15px; color: #1f2937; line-height: 1.5;">
                <span style="color: ${orangeColor}; font-weight: 700; margin-right: 10px; font-size: 16px;">✦</span>
                <strong>2 Free AI Practice Interviews</strong> — already loaded into your account
              </td>
            </tr>
            <tr>
              <td style="padding: 9px 0; font-size: 15px; color: #1f2937; line-height: 1.5;">
                <span style="color: ${pinkColor}; font-weight: 700; margin-right: 10px; font-size: 16px;">✦</span>
                <strong>Set your preferences</strong> — target roles, seniority level, and tech stack
              </td>
            </tr>
            <tr>
              <td style="padding: 9px 0; font-size: 15px; color: #1f2937; line-height: 1.5;">
                <span style="color: ${orangeColor}; font-weight: 700; margin-right: 10px; font-size: 16px;">✦</span>
                <strong>Practice real-world mock rounds</strong> with an adaptive voice-first AI interviewer
              </td>
            </tr>
            <tr>
              <td style="padding: 9px 0; font-size: 15px; color: #1f2937; line-height: 1.5;">
                <span style="color: ${pinkColor}; font-weight: 700; margin-right: 10px; font-size: 16px;">✦</span>
                <strong>Instant scorecards & feedback</strong> benchmarked against FAANG & top tech rubrics
              </td>
            </tr>
          </table>
        </div>

        <p style="margin: 0 0 20px; font-size: 16px; color: #374151; line-height: 1.7;">
          The early bird really does get the role — our data shows prepared applicants are <strong style="color: ${orangeColor}; font-size: 17px;">4× more likely</strong> to land an interview. Let's make sure you're always early.
        </p>

        <div class="btn-container">
          <a href="${dashboardLink}" class="btn" target="_blank">
            Start Practicing Free &rarr;
          </a>
        </div>

        <div class="signoff">
          <p style="margin: 0 0 4px; font-size: 15px; color: #4b5563;">Warmly,</p>
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #111827;">Shubhanshu Singh</p>
          <p style="margin: 2px 0 0; font-size: 13px; color: ${pinkColor}; font-weight: 600;">Founder, Sensei</p>
        </div>
      </div>

      <div class="footer">
        <p style="margin: 0 0 6px;">
          Sensei • Educational Technology & AI Candidate Prep Platform
        </p>
        <p style="margin: 0;">
          Need help? Contact us at <a href="mailto:shubhanshus450@gmail.com">shubhanshus450@gmail.com</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
};
