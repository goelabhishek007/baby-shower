import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Baby, CalendarDays, MapPin, Gift, Shirt, Sparkles, Heart, Send, Star, Moon } from "lucide-react";
import { api } from "../lib/api";

const cx = (...c) => c.filter(Boolean).join(" ");

// ---------- little visual helpers ----------
function Floaty({ className, delay = 0, duration = 7 }) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -14, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

function Twinkle({ className, delay = 0, children }) {
  return (
    <motion.div
      className={className}
      animate={{ opacity: [0.35, 1, 0.35], scale: [0.95, 1.05, 0.95] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {children}
    </motion.div>
  );
}

function SubmittingOverlay() {
  return (
    <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-xl ring-1 ring-black/5 p-6 text-center">
        <div className="text-3xl mb-3 animate-pulse">💙</div>
        <h3 className="text-lg font-semibold text-slate-900">
          Submitting your RSVP…
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          This may take a few moments. Please don’t refresh — we’ve got it 🙂
        </p>
      </div>
    </div>
  );
}


function Chip({ icon: Icon, children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm shadow-soft ring-1 ring-black/5">
      <Icon className="h-4 w-4 text-slate-700" />
      <span className="text-slate-800">{children}</span>
    </div>
  );
}

function Section({ id, title, icon: Icon, subtitle, children }) {
  return (
    <section id={id} className="py-10 scroll-mt-24">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl bg-white/70 p-3 shadow-soft ring-1 ring-black/5">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{title}</h2>
            {subtitle ? <p className="mt-1 text-slate-600">{subtitle}</p> : null}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};


export default function InvitePage() {
  const event = useMemo(
    () => ({
      babyName: "Our Baby Boy",
      parentNames: "Evann & Abhishek",
      dateLabel: "Saturday, Jan 31st, 2026",
      timeLabel: "12:30 PM",
      locationLabel: "Issaquah Community Center",
      mapsUrl: "https://maps.google.com/?q=Issaquah%20Community%20Center",
      amazonRegistry: "https://www.amazon.com/baby-reg/evann-goel-march-2026-issaquah/426YVA1Z363P",
      babylistRegistry: "https://my.babylist.com/evann-goel",
      // ✅ nicer comfy dress code
      dressCode: "Wear whatever makes you feel comfortable — cozy, casual, and totally you 💙",
      note:
        "Join us for a cozy baby shower filled with love, laughter, and sweet memories as we get ready to welcome our little one.",
    }),
    []
  );

  // RSVP state (open to all; max 10 plus-ones)
  const [name, setName] = useState("");
  const [attendees, setAttendees] = useState([]); // plus-ones only
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(false);

  const MAX_PLUS_ONES = 10;
  const lastGuestRef = useRef(null);

  function setMsg(type, msg) {
    setStatus({ type, msg });
  }

  function updateAttendee(i, patch) {
    setAttendees((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }

  function addAttendee() {
    setAttendees((prev) => {
      if (prev.length >= MAX_PLUS_ONES) return prev;
      return [...prev, { name: "", age: "adult" }];
    });

    // scroll to the new row after it renders
    setTimeout(() => {
      lastGuestRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  }


  function removeAttendee(i) {
    setAttendees((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSubmitRSVP(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("", "");

    const primaryGuest = (name || "").trim();
    if (!primaryGuest) {
      setLoading(false);
      setMsg("warn", "Please enter your name 😊");
      return;
    }

    const cleaned = attendees
      .map((a) => ({ ...a, name: (a.name || "").trim() }))
      .filter((a) => a.name.length > 0)
      .slice(0, MAX_PLUS_ONES);

    try {
      await api.submitRSVP({
        primaryGuest,
        attendees: cleaned,
      });

      setMsg("ok", "RSVP received! 🎉 Can’t wait to celebrate with you 💙");
      setName("");
      setAttendees([]);
    } catch (err) {
      setMsg("error", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 -z-10 bg-white/25 backdrop-blur-[2px]" />
      <div id="top" className="min-h-screen">
          {loading && <SubmittingOverlay />}
        {/* Background photo */}
        <div className="fixed inset-0 -z-10 bg-center bg-cover" style={{ backgroundImage: "url(/bg2.png)" }}>
          <div className="absolute inset-0 bg-white/35" />
          <div className="absolute inset-0 bg-gradient-to-b from-sky-100/25 via-white/20 to-emerald-50/25" />
          <div className="absolute inset-0 backdrop-blur-[0.5px]" />
        </div>

        {/* floating decor */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <Floaty className="absolute left-6 top-20 h-28 w-28 rounded-full bg-white/35 blur-xl" delay={0.2} />
          <Floaty className="absolute right-10 top-28 h-36 w-36 rounded-full bg-white/35 blur-xl" delay={0.6} duration={8} />
          <Floaty className="absolute left-1/3 bottom-10 h-44 w-44 rounded-full bg-white/30 blur-2xl" delay={1.2} duration={9} />

          <Twinkle className="absolute left-10 top-36 text-sky-600/40" delay={0.2}>
            <Star className="h-6 w-6" />
          </Twinkle>
          <Twinkle className="absolute right-16 top-44 text-indigo-600/30" delay={1.1}>
            <Sparkles className="h-6 w-6" />
          </Twinkle>
          <Twinkle className="absolute left-1/2 top-24 text-amber-500/20" delay={0.8}>
            <Moon className="h-6 w-6" />
          </Twinkle>
        </div>

        {/* RSVP deadline banner */}
        <div className="mx-auto max-w-5xl px-4">
          <div className="mt-3 rounded-2xl bg-white/80 shadow-soft ring-1 ring-black/5 px-4 py-3 flex items-start gap-3">
            <div className="shrink-0 rounded-xl bg-blue-100 p-2 ring-1 ring-black/5">📌</div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900">
                Please RSVP by <span className="underline underline-offset-4">January 18, 2026</span>
              </div>
              <div className="text-sm text-slate-600">
                It helps us plan food, seating, and all the cute little details 💙
              </div>
            </div>
          </div>
        </div>

        {/* NAV */}
        <div className="relative z-30 backdrop-blur bg-white/60 border-b border-white/40">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <a href="#top" className="flex items-center gap-2 font-semibold">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-100 ring-1 ring-black/5">
                <Baby className="h-5 w-5" />
              </span>
              <span>Baby Shower</span>
            </a>
          </div>

          <div className="mx-auto max-w-5xl px-4 pb-3 md:hidden">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {[
                ["Details", "#details"],
                ["Expectations", "#expect"],
                // photos removed for now
                ["Registry", "#registry"],
                ["Dress", "#dresscode"],
                ["RSVP", "#rsvp"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="shrink-0 rounded-full bg-white/75 px-3 py-1.5 text-sm ring-1 ring-black/5"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* HERO */}
        <header className="relative">
          <div className="mx-auto max-w-5xl px-4 pt-10 pb-6 md:pt-16 md:pb-10">
            <motion.div variants={fadeUp} initial="hidden" animate="show">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm shadow-soft ring-1 ring-black/5">
                <Sparkles className="h-4 w-4" />
                <span>Baby Shower Invitation</span>
              </div>

              <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
                A little boy is on the way <span className="align-middle">💙</span>
{/*                 <span className="block"> */}
{/*                   Baby Shower <span className="align-middle">💙</span> */}
{/*                 </span> */}
              </h1>

              <p className="mt-3 text-slate-700 text-lg">{event.note}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Chip icon={CalendarDays}>{event.dateLabel}</Chip>
                <a
                  href={event.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm shadow-soft ring-1 ring-black/5 text-slate-800 underline decoration-dotted underline-offset-4 hover:bg-white active:scale-[0.98] transition"
                >
                  <MapPin className="h-4 w-4" />
                  <span>{event.locationLabel}</span>
                </a>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="#rsvp"
                  className="inline-flex items-center justify-center rounded-full bg-[#EAF6FF] px-6 py-3 text-slate-900 font-semibold shadow-soft ring-1 ring-black/5 hover:bg-[#DDF0FF] active:scale-[0.97] transition"
                >
                  RSVP Now ✨
                </a>
              </div>
            </motion.div>

            <motion.div
              className="mt-6 rounded-3xl bg-white/75 shadow-soft ring-1 ring-black/5 p-5 md:p-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.45 }}
            >
              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-3xl bg-white/75 p-6 shadow-soft ring-1 ring-black/5">
                  <div className="text-slate-500">Hosted by</div>
                  <div className="text-xl font-semibold">{event.parentNames}</div>
                </div>

                <div className="rounded-3xl bg-white/75 p-6 shadow-soft ring-1 ring-black/5">
                  <div className="text-slate-500">Bring</div>
                  <div className="text-xl font-semibold">Smiles & Blessings ⭐</div>
                </div>
              </div>
            </motion.div>
          </div>
        </header>

        {/* DETAILS */}
        <Section id="details" title="Event Details" icon={CalendarDays} subtitle="Save the date & set your reminders ⏰">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Date", value: event.dateLabel },
              { label: "Time", value: event.timeLabel },
              { label: "Location", value: event.locationLabel },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                className="rounded-3xl bg-white/75 p-5 shadow-soft ring-1 ring-black/5"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="text-sm text-slate-500">{item.label}</div>
                <div className="mt-1 text-lg font-semibold">{item.value}</div>
              </motion.div>
            ))}
          </div>
        </Section>


        {/* ✅ What to expect - NOT collapsible anymore */}
        <Section
          id="expect"
          title="What to expect"
          icon={Sparkles}
          subtitle="A few fun things planned for the day ✨"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-3xl bg-white/75 p-5 shadow-soft ring-1 ring-black/5">
              <div className="text-sm text-slate-500">🍼 Activities</div>
              <div className="mt-1 text-slate-800">
                Baby-themed games & giggles
              </div>
            </div>

            <div className="rounded-3xl bg-white/75 p-5 shadow-soft ring-1 ring-black/5">
              <div className="text-sm text-slate-500">🍰 Treats</div>
              <div className="mt-1 text-slate-800">
                Snacks, sweets, and a few tasty surprises
              </div>
            </div>

            <div className="rounded-3xl bg-white/75 p-5 shadow-soft ring-1 ring-black/5 md:col-span-2">
              <div className="text-sm text-slate-500">💙 The vibe</div>
              <div className="mt-1 text-slate-800">
                Lots of love for the parents-to-be
              </div>
            </div>
          </div>
        </Section>


        {/* ✅ Maternity photos removed/commented for now */}
        {/*
        <Section id="gallery" title="Maternity Photos" icon={Images} subtitle="We'll decide later 💙">
          ...
        </Section>
        */}

        <Section
                  id="good-to-know"
                  title="Good to know"
                  icon={Sparkles}
                  subtitle="Quick details to make your visit easy 💙"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    {/* Parking - Option C */}
                    <div className="rounded-3xl bg-white/75 p-5 shadow-soft ring-1 ring-black/5">
                      <div className="text-sm text-slate-500">🚗 Parking</div>
                      <div className="mt-1 text-slate-800">
                        Free parking is available on-site
                      </div>
                    </div>

                    {/* Kids */}
                    <div className="rounded-3xl bg-white/75 p-5 shadow-soft ring-1 ring-black/5">
                      <div className="text-sm text-slate-500">👶 Kids</div>
                      <div className="mt-1 text-slate-800">
                        Kids are welcome! The venue is stroller-friendly.
                      </div>
                    </div>

                    {/* Photos */}
                    <div className="rounded-3xl bg-white/75 p-5 shadow-soft ring-1 ring-black/5">
                      <div className="text-sm text-slate-500">📸 Photos</div>
                      <div className="mt-1 text-slate-800">
                        We’ll be taking a few photos — feel free to join in, and no worries if you’d rather not.
                      </div>
                    </div>
                  </div>
                </Section>

        {/* REGISTRY */}
        <Section id="registry" title="Registry" icon={Gift} subtitle="Gifts are not expected, but for those who wish to, we’ve shared our registries below 💙">
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={event.amazonRegistry}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-2xl bg-white/80 px-5 py-4 text-center font-medium shadow-soft ring-1 ring-black/5 hover:bg-white active:scale-[0.98] transition"
            >
              🛒 Amazon
            </a>
            <a
              href={event.babylistRegistry}
              target="_blank"
              rel="noreferrer"
              className="flex-1 rounded-2xl bg-white/80 px-5 py-4 text-center font-medium shadow-soft ring-1 ring-black/5 hover:bg-white active:scale-[0.98] transition"
            >
              🍼 Babylist
            </a>
          </div>
        </Section>

        {/* DRESS CODE */}
        <Section id="dresscode" title="Dress Code" icon={Shirt} subtitle="Comfort > everything 💙">
          <div className="rounded-3xl bg-white/75 p-6 shadow-soft ring-1 ring-black/5">
            <p className="text-slate-700 text-lg">{event.dressCode}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Chip icon={Sparkles}>Comfy</Chip>
              <Chip icon={Heart}>Cozy</Chip>
              <Chip icon={Star}>You do you</Chip>
            </div>
          </div>
        </Section>

        {/* ✅ RSVP (no email field; no find name; max 10) */}
        <Section id="rsvp" title="RSVP" icon={Send} subtitle="Kindly RSVP by January 18, 2026">
          <div className="rounded-3xl bg-white/75 p-6 shadow-soft ring-1 ring-black/5">
            <div className="flex items-center gap-2">
              <div className="rounded-2xl bg-blue-100 p-2 ring-1 ring-black/5">
                <Baby className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">Confirm your spot 💙</h3>
            </div>

            <form className="mt-5 space-y-3" onSubmit={onSubmitRSVP}>
              <label className="block">
                <span className="text-sm text-slate-700">Your Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="e.g., Abhishek Goel"
                  required
                />
              </label>

              <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">Plus-ones (optional)</div>
                    <div className="text-sm text-slate-600">Max {MAX_PLUS_ONES}</div>
                  </div>

                </div>

                <div className="mt-3 grid gap-2">
                  {attendees.map((a, idx) => {
                    const isLast = idx === attendees.length - 1;

                    return (
                      <div
                        key={idx}
                        ref={isLast ? lastGuestRef : null}
                        className="rounded-2xl bg-white p-3 ring-1 ring-black/5"
                      >
                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px_44px] gap-2 items-center">
                        <input
                          value={a.name}
                          onChange={(e) => updateAttendee(idx, { name: e.target.value })}
                          className="min-w-0 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                          placeholder={`Guest ${idx + 1} name`}
                        />

                        <select
                          value={a.age}
                          onChange={(e) => updateAttendee(idx, { age: e.target.value })}
                          className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                        >
                          <option value="adult">Adult</option>
                          <option value="child">Child</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => removeAttendee(idx)}
                          className="h-10 w-full sm:w-10 grid place-items-center rounded-2xl bg-white ring-1 ring-black/10 hover:bg-slate-50 active:scale-[0.98] transition"
                          title="Remove"
                          aria-label="Remove"
                        >
                          ✕
                        </button>
                      </div>
                        </div>
                      );
                    })}
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-600">
                    You can add up to <b>{MAX_PLUS_ONES}</b> guests.
                  </p>

                  <button
                    type="button"
                    onClick={addAttendee}
                    disabled={attendees.length >= MAX_PLUS_ONES}
                    className={cx(
                      "w-full sm:w-auto rounded-2xl px-4 py-3 font-semibold transition",
                      attendees.length >= MAX_PLUS_ONES
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-white/80 ring-1 ring-black/10 hover:bg-white active:scale-[0.99]"
                    )}
                  >
                    + Add guest
                  </button>
                </div>

              </div>

              {status.msg ? (
                <div
                  className={cx(
                    "rounded-2xl p-3 text-sm ring-1",
                    status.type === "ok" && "bg-emerald-50 ring-emerald-200 text-emerald-900",
                    status.type === "warn" && "bg-amber-50 ring-amber-200 text-amber-900",
                    status.type === "error" && "bg-rose-50 ring-rose-200 text-rose-900"
                  )}
                >
                  {status.msg}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className={`rounded-2xl px-5 py-3 font-semibold transition
                  ${loading
                    ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"}
                `}
              >
                {loading ? "Submitting…" : "Submit RSVP 💙"}
              </button>
            </form>
          </div>
        </Section>

        <footer className="pb-24 md:pb-10 pt-8 text-center text-sm text-slate-600">
          Made with Love by Goel Family 💙
        </footer>

        {/* Mobile-only RSVP Now button */}
        <div className="fixed bottom-4 left-0 right-0 z-40 px-4 sm:hidden">
          <a
            href="#rsvp"
            className="block w-full rounded-2xl bg-blue-600 text-white text-center px-5 py-3 font-semibold shadow-lg active:scale-[0.98] transition"
          >
            RSVP Now 💙
          </a>
        </div>

      </div>
    </>
  );
}
