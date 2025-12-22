const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Resend } = require("resend");
const { createClient } = require("@supabase/supabase-js");

const app = express();

/**
 * CORS: allow local dev + your deployed frontend(s).
 * Add your Vercel prod URL and preview URLs here if needed.
 */
const allowedOrigins = [
  "http://localhost:5173",
  "https://baby-shower-five-taupe.vercel.app",
  process.env.FRONTEND_ORIGIN, // e.g. https://baby-shower-five-taupe.vercel.app
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // allow curl/postman (no origin)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS: " + origin));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-admin-key"],
  })
);

app.use(express.json());

/** ---------------- Clients ---------------- */
const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/** ---------------- Helpers ---------------- */
function normalizeName(name) {
  return String(name || "").trim();
}

function makeKey(name) {
  return normalizeName(name).toLowerCase();
}

function requireAdmin(req, res, next) {
  const key = req.header("X-Admin-Key");
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function sanitizeAttendees(attendees) {
  const list = Array.isArray(attendees) ? attendees : [];
  const cleaned = list
    .map((a) => ({
      name: String(a?.name || "").trim(),
      age: a?.age === "child" ? "child" : "adult",
    }))
    .filter((a) => a.name.length > 0);

  // Max 10 plus-ones
  return cleaned.slice(0, 10);
}

/** ---------------- Email ---------------- */
async function sendRSVPEmail({ primaryGuest, attendees = [] }) {
  const primary = normalizeName(primaryGuest);
  const plusOnes = sanitizeAttendees(attendees);

  const allAttendees = [{ name: primary, age: "adult" }, ...plusOnes];

  const adults = allAttendees.filter((a) => a.age === "adult").length;
  const children = allAttendees.filter((a) => a.age === "child").length;
  const totalCount = allAttendees.length;

  const attendeeList = allAttendees
    .map(
      (a, i) => `${i + 1}. ${a.name} (${a.age === "child" ? "Child" : "Adult"})`
    )
    .join("\n");

  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const subject = `🎉 New RSVP from ${primary}`;

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont,'Segoe UI', Arial, sans-serif; background:#f2f6fb; margin:0; padding:20px; color:#2c2c2c; }
      .container { max-width:600px; margin:0 auto; background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,.08);}
      .header { background:linear-gradient(135deg,#8fbce8,#a7d0f5); padding:35px 25px; text-align:center; color:#fff;}
      .header h1{ margin:0; font-size:30px;}
      .sub{ margin-top:8px; font-size:16px; opacity:.95;}
      .content{ padding:30px;}
      .card{ background:#fff; border-radius:12px; padding:20px; margin-bottom:18px; border-left:5px solid #8fbce8;}
      .card h3{ margin:0 0 10px; color:#4b77a6; font-size:18px;}
      .stats{ display:flex; gap:12px; margin:25px 0;}
      .stat{ flex:1; background:#f7fbff; border-radius:12px; padding:18px 10px; text-align:center; box-shadow:inset 0 0 0 1px #e3eef9;}
      .num{ font-size:34px; font-weight:700; color:#6ea8de; line-height:1;}
      .lab{ margin-top:6px; font-size:13px; color:#6b7280;}
      .att{ background:#f0f6fc; border-radius:10px; padding:15px; font-size:15px; line-height:1.6;}
      .footer{ background:#f7f9fc; text-align:center; padding:18px; font-size:13px; color:#6b7280; border-top:1px solid #e5e7eb;}
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎈 New RSVP Received!</h1>
        <div class="sub">Someone just confirmed for the baby shower 💙</div>
      </div>

      <div class="content">
        <div class="card">
          <h3>👤 Primary Guest</h3>
          <p><strong>${primary}</strong></p>
        </div>

        <div class="stats">
          <div class="stat"><div class="num">${totalCount}</div><div class="lab">Total Guests</div></div>
          <div class="stat"><div class="num">${adults}</div><div class="lab">Adults</div></div>
          <div class="stat"><div class="num">${children}</div><div class="lab">Children</div></div>
        </div>

        <div class="card">
          <h3>👨‍👩‍👧‍👦 Attending Party</h3>
          <div class="att">
            ${attendeeList.split("\n").map((line) => `${line}`).join("<br/>")}
          </div>
        </div>

        <div class="card">
          <h3>📅 Event Details</h3>
          <p><strong>Date:</strong> Saturday, Jan 31st, 2026</p>
          <p><strong>Time:</strong> 12:00 PM</p>
          <p><strong>Location:</strong> Issaquah Community Center</p>
        </div>
      </div>

      <div class="footer">
        <p>Automated notification from your Baby Shower RSVP system.</p>
        <p>Submitted at: ${new Date().toLocaleString()}</p>
      </div>
    </div>
  </body>
  </html>
  `;

  const result = await resend.emails.send({
    from: `"Baby Shower RSVP 💙" <${fromEmail}>`,
    to: [process.env.EMAIL_HOST_EMAIL],
    subject,
    html,
  });

  return { success: true, messageId: result?.id };
}

/** ---------------- Public: Submit RSVP ---------------- */
app.post("/api/submit-rsvp", async (req, res) => {
  try {
    const primaryGuest = normalizeName(req.body?.primaryGuest);
    if (!primaryGuest) return res.status(400).json({ error: "primaryGuest required" });

    const attendees = sanitizeAttendees(req.body?.attendees);

    // 1) Upsert rsvp by primary_guest_key
    const key = makeKey(primaryGuest);

    const { data: rsvpRow, error: upErr } = await supabase
      .from("rsvps")
      .upsert(
        { primary_guest_name: primaryGuest, primary_guest_key: key },
        { onConflict: "primary_guest_key" }
      )
      .select("id")
      .single();

    if (upErr) throw upErr;

    // 2) Replace attendees for this RSVP
    const { error: delErr } = await supabase
      .from("rsvp_attendees")
      .delete()
      .eq("rsvp_id", rsvpRow.id);

    if (delErr) throw delErr;

    if (attendees.length > 0) {
      const rows = attendees.map((a) => ({
        rsvp_id: rsvpRow.id,
        name: a.name,
        age: a.age,
      }));
      const { error: insErr } = await supabase.from("rsvp_attendees").insert(rows);
      if (insErr) throw insErr;
    }

    // 3) Email: fire-and-forget
    sendRSVPEmail({ primaryGuest, attendees })
      .then(() => console.log("✅ Resend email queued/sent"))
      .catch((e) => console.error("⚠️ Resend email failed:", e?.message || e));

    return res.json({ success: true, message: "RSVP submitted successfully" });
  } catch (e) {
    console.error("submit-rsvp error:", e?.message || e);
    return res.status(500).json({ error: "Server error" });
  }
});

/** ---------------- Admin: CRUD RSVPs ---------------- */
app.get("/api/admin/rsvps", requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("rsvps")
      .select(`id, primary_guest_name, updated_at, rsvp_attendees ( id, name, age )`)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return res.json({ rsvps: data || [] });
  } catch (e) {
    console.error("admin list rsvps error:", e?.message || e);
    return res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/admin/rsvps", requireAdmin, async (req, res) => {
  try {
    const primaryGuest = normalizeName(req.body?.primaryGuest);
    if (!primaryGuest) return res.status(400).json({ error: "primaryGuest required" });

    const attendees = sanitizeAttendees(req.body?.attendees);
    const key = makeKey(primaryGuest);

    const { data: rsvpRow, error: upErr } = await supabase
      .from("rsvps")
      .upsert(
        { primary_guest_name: primaryGuest, primary_guest_key: key },
        { onConflict: "primary_guest_key" }
      )
      .select("id")
      .single();

    if (upErr) throw upErr;

    await supabase.from("rsvp_attendees").delete().eq("rsvp_id", rsvpRow.id);
    if (attendees.length > 0) {
      await supabase.from("rsvp_attendees").insert(
        attendees.map((a) => ({ rsvp_id: rsvpRow.id, name: a.name, age: a.age }))
      );
    }

    return res.json({ success: true });
  } catch (e) {
    console.error("admin create rsvp error:", e?.message || e);
    return res.status(500).json({ error: "Server error" });
  }
});

app.patch("/api/admin/rsvps/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const primaryGuest = normalizeName(req.body?.primaryGuest);
    if (!primaryGuest) return res.status(400).json({ error: "primaryGuest required" });

    const attendees = sanitizeAttendees(req.body?.attendees);
    const key = makeKey(primaryGuest);

    const { error: updErr } = await supabase
      .from("rsvps")
      .update({ primary_guest_name: primaryGuest, primary_guest_key: key })
      .eq("id", id);

    if (updErr) throw updErr;

    await supabase.from("rsvp_attendees").delete().eq("rsvp_id", id);
    if (attendees.length > 0) {
      await supabase.from("rsvp_attendees").insert(
        attendees.map((a) => ({ rsvp_id: id, name: a.name, age: a.age }))
      );
    }

    return res.json({ success: true });
  } catch (e) {
    console.error("admin update rsvp error:", e?.message || e);
    return res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/admin/rsvps/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const { error } = await supabase.from("rsvps").delete().eq("id", id);
    if (error) throw error;
    return res.json({ success: true });
  } catch (e) {
    console.error("admin delete rsvp error:", e?.message || e);
    return res.status(500).json({ error: "Server error" });
  }
});

/** ---------------- Health ---------------- */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  });