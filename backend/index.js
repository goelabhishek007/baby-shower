const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const app = express();
app.use(cors());
app.use(express.json());

// Function to send RSVP email to host (Resend)
async function sendRSVPEmail(rsvpData) {
  const { primaryGuest, attendees = [], guestEmail } = rsvpData;

  // IMPORTANT: don't mutate incoming array (unshift mutates)
  const allAttendees = [{ name: primaryGuest, age: "adult" }, ...attendees];

  // Count adults and children
  const adults = allAttendees.filter((a) => a.age === "adult").length;
  const children = allAttendees.filter((a) => a.age === "child").length;
  const totalCount = allAttendees.length;

  // Create attendee list
  const attendeeList = allAttendees
    .map(
      (a, i) => `${i + 1}. ${a.name} (${a.age === "child" ? "Child" : "Adult"})`
    )
    .join("\n");

  // Resend requires a verified "from" (onboarding@resend.dev works for testing)
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const subject = `🎉 New RSVP from ${primaryGuest}`;

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
          Arial, sans-serif;
        background-color: #f2f6fb;
        margin: 0;
        padding: 20px;
        color: #2c2c2c;
      }

      .container {
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      }

      .header {
        background: linear-gradient(135deg, #8fbce8, #a7d0f5);
        padding: 35px 25px;
        text-align: center;
        color: #ffffff;
      }

      .header h1 {
        margin: 0;
        font-size: 30px;
        letter-spacing: 0.5px;
      }

      .subheader {
        margin-top: 8px;
        font-size: 16px;
        opacity: 0.95;
      }

      .content {
        padding: 30px;
      }

      .card {
        background: #ffffff;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 18px;
        border-left: 5px solid #8fbce8;
      }

      .card h3 {
        margin-top: 0;
        margin-bottom: 10px;
        color: #4b77a6;
        font-size: 18px;
      }

      .stats {
        display: flex;
        gap: 12px;
        margin: 25px 0;
      }

      .stat {
        flex: 1;
        background: #f7fbff;
        border-radius: 12px;
        padding: 18px 10px;
        text-align: center;
        box-shadow: inset 0 0 0 1px #e3eef9;
      }

      .stat-number {
        font-size: 34px;
        font-weight: 700;
        color: #6ea8de;
        line-height: 1;
      }

      .stat-label {
        margin-top: 6px;
        font-size: 13px;
        color: #6b7280;
      }

      .attendees {
        background: #f0f6fc;
        border-radius: 10px;
        padding: 15px;
        font-size: 15px;
        line-height: 1.6;
      }

      .event p {
        margin: 6px 0;
        font-size: 15px;
      }

      .footer {
        background: #f7f9fc;
        text-align: center;
        padding: 18px;
        font-size: 13px;
        color: #6b7280;
        border-top: 1px solid #e5e7eb;
      }
    </style>
  </head>

  <body>
    <div class="container">
      <div class="header">
        <h1>🎈 New RSVP Received!</h1>
        <div class="subheader">Someone just confirmed for the baby shower 💙</div>
      </div>

      <div class="content">
        <div class="card">
          <h3>👤 Primary Guest</h3>
          <p><strong>${primaryGuest}</strong></p>
          ${guestEmail ? `<p>📧 ${guestEmail}</p>` : ""}
        </div>

        <div class="stats">
          <div class="stat">
            <div class="stat-number">${totalCount}</div>
            <div class="stat-label">Total Guests</div>
          </div>
          <div class="stat">
            <div class="stat-number">${adults}</div>
            <div class="stat-label">Adults</div>
          </div>
          <div class="stat">
            <div class="stat-number">${children}</div>
            <div class="stat-label">Children</div>
          </div>
        </div>

        <div class="card">
          <h3>👨‍👩‍👧‍👦 Attending Party</h3>
          <div class="attendees">
            ${attendeeList
              .split("\n")
              .map((line) => `${line}`)
              .join("<br/>")}
          </div>
        </div>

        <div class="card event">
          <h3>📅 Event Details</h3>
          <p><strong>Date:</strong> Saturday, Jan 31st, 2026</p>
          <p><strong>Time:</strong> 12:00 PM</p>
          <p><strong>Location:</strong> Issaquah Community Center</p>
        </div>
      </div>

      <div class="footer">
        <p>This is an automated notification from your Baby Shower RSVP system.</p>
        <p>Submitted at: ${new Date().toLocaleString()}</p>
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    const result = await resend.emails.send({
      from: `"Baby Shower RSVP 💙" <${fromEmail}>`,
      to: [process.env.EMAIL_HOST_EMAIL],
      subject,
      html,
    });

    // Resend returns { id: "..."} on success
    console.log("✅ Email sent successfully (Resend):", result?.id || result);
    return { success: true, messageId: result?.id };
  } catch (error) {
    console.error("❌ Email sending failed (Resend):", error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}


const guest = new Map();

guest.set('Abhishek Goel', [{id: 1, full_name: "Abhishek Goel",plus_ones_allowed: 1,kids_allowed: 0}]);
guest.set('Janet Thompson', [{id: 2, full_name: "Janet Thompson",plus_ones_allowed: 1,kids_allowed: 0}]);


// API Endpoint 1: Check if guest exists
app.post('/api/check-guest', async (req, res) => {
  const { name } = req.body;

  console.log('Checking guest:', name);

  try {

    const result = guest.get(name.trim())
    console.log(result)
    if (result.length > 0) {
      const guest = result[0];
      console.log('Guest found:', guest.full_name);
      res.json({
        found: true,
        guestId: guest.id,
        plusOnes: guest.plus_ones_allowed,
        kids: guest.kids_allowed,
        totalSlots: guest.plus_ones_allowed + guest.kids_allowed
      });
    } else {
      console.log('Guest not found:', name);
      res.json({ found: false });
    }
  } catch (error) {
    res.status(400).json({ error: 'Guest Not Found' });
  }
});

// API Endpoint 2: Submit RSVP
app.post('/api/submit-rsvp', async (req, res) => {
  const { primaryGuest, attendees } = req.body;

  console.log('Submitting RSVP for:', primaryGuest);
  console.log('Attendees:', attendees);

  try {

    const guestResult = guest.get(primaryGuest.trim())[0];
    guestResult.rsvps = attendees;
//    console.log(guestResult);

    const emailResult = await sendRSVPEmail({
          primaryGuest,
          attendees
        });

        if (emailResult.success) {
          console.log('✅ Email notification sent to host');
        } else {
          console.error('⚠️ RSVP saved but email failed:', emailResult.error);
        }

    console.log('✅ RSVP submitted successfully');
    res.json({ success: true, message: 'RSVP submitted successfully' , emailSent: emailResult.success});
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


// API Endpoint 3: Get all RSVPs (for host)
app.get('/api/rsvps', async (req, res) => {
  try {
    const result = []
    const rsvp = {}
    for (const [name, data] of guest) {
      console.log(`${name}s RSVPs`);
      rsvp.guest_name = name;
      rsvp.attendee_count = data[0].rsvps.length;
      rsvp.attendees = data[0].rsvps.map(p => p.name).join(', ');
      console.log(rsvp);
      result.push(rsvp)
    }

    console.log('Retrieved', result, 'RSVPs');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Baby Shower API Server',
    endpoints: {
      health: 'GET /api/health',
      checkGuest: 'POST /api/check-guest',
      submitRSVP: 'POST /api/submit-rsvp',
      getRSVPs: 'GET /api/rsvps'
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('\n🚀 Baby Shower API Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log(`📊 RSVPs:  http://localhost:${PORT}/api/rsvps`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});