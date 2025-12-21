const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Resend } = require("resend");
const { createClient } = require("@supabase/supabase-js");

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();

/**
 * CORS: allow local dev + your deployed frontend(s).
 * Add your Vercel prod URL and preview URLs here if needed.
 */

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://baby-shower-five-taupe.vercel.app" // ✅ your Vercel frontend
];

app.use(
  cors({
    origin: (origin, cb) => {
      // allow server-to-server and curl requests with no origin
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-admin-key"],
  })
);

// ✅ make sure preflight requests succeed
app.options("*", cors());


app.use(express.json());

/** Admin auth middleware */
function requireAdmin(req, res, next) {
  const key = req.header("x-admin-key");
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ---------- Email (Resend) ----------
async function sendRSVPEmail(rsvpData) {
  const { primaryGuest, attendees = [], guestEmail } = rsvpData;

  const allAttendees = [{ name: primaryGuest, age: "adult" }, ...attendees];

  const adults = allAttendees.filter((a) => a.age === "adult").length;
  const children = allAttendees.filter((a) => a.age === "child").length;
  const totalCount = allAttendees.length;

  const attendeeList = allAttendees
    .map((a, i) => `${i + 1}. ${a.name} (${a.age === "child" ? "Child" : "Adult"})`)
    .join("\n");

  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const subject = `🎉 New RSVP from ${primaryGuest}`;

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background:#f2f6fb; margin:0; padding:20px; color:#2c2c2c; }
      .container { max-width:600px; margin:0 auto; background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.08); }
      .header { background:linear-gradient(135deg,#8fbce8,#a7d0f5); padding:35px 25px; text-align:center; color:#fff; }
      .header h1 { margin:0; font-size:30px; letter-spacing:0.5px; }
      .subheader { margin-top:8px; font-size:16px; opacity:.95; }
      .content { padding:30px; }
      .card { background:#fff; border-radius:12px; padding:20px; margin-bottom:18px; border-left:5px solid #8fbce8; }
      .card h3 { margin:0 0 10px; color:#4b77a6; font-size:18px; }
      .stats { display:flex; gap:12px; margin:25px 0; }
      .stat { flex:1; background:#f7fbff; border-radius:12px; padding:18px 10px; text-align:center; box-shadow: inset 0 0 0 1px #e3eef9; }
      .stat-number { font-size:34px; font-weight:700; color:#6ea8de; line-height:1; }
      .stat-label { margin-top:6px; font-size:13px; color:#6b7280; }
      .attendees { background:#f0f6fc; border-radius:10px; padding:15px; font-size:15px; line-height:1.6; }
      .event p { margin:6px 0; font-size:15px; }
      .footer { background:#f7f9fc; text-align:center; padding:18px; font-size:13px; color:#6b7280; border-top:1px solid #e5e7eb; }
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
          <div class="stat"><div class="stat-number">${totalCount}</div><div class="stat-label">Total Guests</div></div>
          <div class="stat"><div class="stat-number">${adults}</div><div class="stat-label">Adults</div></div>
          <div class="stat"><div class="stat-number">${children}</div><div class="stat-label">Children</div></div>
        </div>

        <div class="card">
          <h3>👨‍👩‍👧‍👦 Attending Party</h3>
          <div class="attendees">
            ${attendeeList.split("\n").map((line) => `${line}`).join("<br/>")}
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

    console.log("✅ Email sent (Resend):", result?.id || result);
    return { success: true, messageId: result?.id };
  } catch (error) {
    console.error("❌ Email failed (Resend):", error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}

// ---------- Public endpoints (guest-facing) ----------

app.post("/api/check-guest", async (req, res) => {
  const name = (req.body?.name || "").trim();
  if (!name) return res.status(400).json({ found: false, error: "Missing name" });

  try {
    const { data: guestRow, error } = await supabase
      .from("guests")
      .select("id, full_name, plus_ones_allowed, kids_allowed")
      .eq("full_name", name)
      .maybeSingle();

    if (error) throw error;
    if (!guestRow) return res.json({ found: false });

    return res.json({
      found: true,
      guestId: guestRow.id,
      plusOnes: guestRow.plus_ones_allowed,
      kids: guestRow.kids_allowed,
      totalSlots: guestRow.plus_ones_allowed + guestRow.kids_allowed,
    });
  } catch (e) {
    console.error("check-guest error:", e?.message || e);
    return res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/submit-rsvp", async (req, res) => {
  const primaryGuest = (req.body?.primaryGuest || "").trim();
  const attendees = Array.isArray(req.body?.attendees) ? req.body.attendees : [];
  const guestEmail = (req.body?.guestEmail || "").trim() || null;

  if (!primaryGuest) return res.status(400).json({ error: "Missing primaryGuest" });

  try {
    const { data: guestRow, error: guestErr } = await supabase
      .from("guests")
      .select("id, full_name, plus_ones_allowed, kids_allowed")
      .eq("full_name", primaryGuest)
      .maybeSingle();

    if (guestErr) throw guestErr;
    if (!guestRow) return res.status(400).json({ error: "Guest Not Found" });

    const maxSlots = guestRow.plus_ones_allowed + guestRow.kids_allowed;
    if (attendees.length > maxSlots) {
      return res.status(400).json({
        error: `Too many attendees. Allowed: ${maxSlots}, received: ${attendees.length}`,
      });
    }

    // Upsert RSVP (one per guest)
    const { data: rsvpRow, error: rsvpErr } = await supabase
      .from("rsvps")
      .upsert(
        {
          guest_id: guestRow.id,
          primary_guest_name: guestRow.full_name,
          guest_email: guestEmail,
        },
        { onConflict: "guest_id" }
      )
      .select("id")
      .single();

    if (rsvpErr) throw rsvpErr;

    // Replace attendees
    const { error: delErr } = await supabase.from("rsvp_attendees").delete().eq("rsvp_id", rsvpRow.id);
    if (delErr) throw delErr;

    if (attendees.length > 0) {
      const rows = attendees.map((a) => ({
        rsvp_id: rsvpRow.id,
        name: String(a.name || "").trim(),
        age: a.age === "child" ? "child" : "adult",
      }));

      const { error: insErr } = await supabase.from("rsvp_attendees").insert(rows);
      if (insErr) throw insErr;
    }

    // Fire-and-forget email
    sendRSVPEmail({ primaryGuest, attendees, guestEmail })
      .then((emailResult) => {
        if (emailResult.success) console.log("✅ Email notification sent to host");
        else console.error("⚠️ RSVP saved but email failed:", emailResult.error);
      })
      .catch((err) => console.error("⚠️ Email exception:", err?.message || err));

    return res.json({ success: true, message: "RSVP submitted successfully", emailSent: true });
  } catch (e) {
    console.error("submit-rsvp error:", e?.message || e);
    return res.status(500).json({ error: "Server error" });
  }
});

// ---------- Admin endpoints (host dashboard only) ----------

app.get("/api/admin/guests", requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from("guests")
    .select("id, full_name, plus_ones_allowed, kids_allowed, created_at")
    .order("full_name", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data || []);
});

app.post("/api/admin/guests", requireAdmin, async (req, res) => {
  const full_name = (req.body?.full_name || "").trim();
  const plus_ones_allowed = Number(req.body?.plus_ones_allowed ?? 0);
  const kids_allowed = Number(req.body?.kids_allowed ?? 0);

  if (!full_name) return res.status(400).json({ error: "full_name required" });

  const { data, error } = await supabase
    .from("guests")
    .insert([{ full_name, plus_ones_allowed, kids_allowed }])
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

app.patch("/api/admin/guests/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const patch = {};

  if (req.body.full_name !== undefined) patch.full_name = String(req.body.full_name).trim();
  if (req.body.plus_ones_allowed !== undefined) patch.plus_ones_allowed = Number(req.body.plus_ones_allowed);
  if (req.body.kids_allowed !== undefined) patch.kids_allowed = Number(req.body.kids_allowed);

  const { data, error } = await supabase
    .from("guests")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

app.delete("/api/admin/guests/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { error } = await supabase.from("guests").delete().eq("id", id);
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ success: true });
});

app.get("/api/admin/rsvps", requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from("rsvps")
    .select(`
      id,
      guest_id,
      primary_guest_name,
      guest_email,
      updated_at,
      guests ( full_name, plus_ones_allowed, kids_allowed ),
      rsvp_attendees ( name, age )
    `)
    .order("updated_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  const rows = (data || []).map((r) => ({
    guest_id: r.guest_id,
    guest_name: r.guests?.full_name || r.primary_guest_name,
    email: r.guest_email,
    total_allowed: (r.guests?.plus_ones_allowed || 0) + (r.guests?.kids_allowed || 0) + 1,
    total_attending: (r.rsvp_attendees?.length || 0) + 1,
    attendees: [
      `${r.primary_guest_name} (adult)`,
      ...(r.rsvp_attendees || []).map((a) => `${a.name} (${a.age})`),
    ],
    updated_at: r.updated_at,
  }));

  return res.json(rows);
});

// Health + root
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.json({
    message: "Baby Shower API Server",
    endpoints: {
      health: "GET /api/health",
      checkGuest: "POST /api/check-guest",
      submitRSVP: "POST /api/submit-rsvp",
      adminGuests: "GET/POST/PATCH/DELETE /api/admin/guests",
      adminRsvps: "GET /api/admin/rsvps",
    },
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("\n🚀 Baby Shower API Server");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
});
