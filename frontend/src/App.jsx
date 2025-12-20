import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Baby,
  CalendarDays,
  MapPin,
  Gift,
  Shirt,
  Sparkles,
  Heart,
  Send,
  Images,
  Star,
  Moon,
} from "lucide-react";
import { api } from "./lib/api";

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

function Twinkle({ className, delay = 0 }) {
  return (
    <motion.div
      className={className}
      animate={{ opacity: [0.35, 1, 0.35], scale: [0.95, 1.05, 0.95] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay }}
    />
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

function MobileAccordionSection({
  id,
  title,
  subtitle,
  icon: Icon,
  open,
  setOpen,
  children,
}) {
  return (
    <section id={id} className="py-6 scroll-mt-24 md:hidden">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header is the trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full text-left"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
        >
          <div className="flex items-start gap-3 rounded-3xl bg-white/70 p-4 shadow-soft ring-1 ring-black/5">
            <div className="rounded-2xl bg-white/70 p-3 shadow-soft ring-1 ring-black/5">
              <Icon className="h-6 w-6" />
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">{title}</h2>
                  {subtitle ? (
                    <p className="mt-1 text-slate-600">{subtitle}</p>
                  ) : null}
                </div>

                {/* Expand/collapse button */}
                <div className="shrink-0">
                  <div className="rounded-full bg-white/70 px-3 py-2 text-sm shadow-soft ring-1 ring-black/5">
                    {open ? "Hide" : "Show"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* Collapsible content */}
        <motion.div
          id={`${id}-panel`}
          initial={false}
          animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="mt-4 rounded-3xl bg-white/75 p-4 shadow-soft ring-1 ring-black/5">
            {children}
          </div>
        </motion.div>
      </div>
    </section>
  );
}


const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};


export default function App() {
  // replace these details anytime
  const [openExpect, setOpenExpect] = useState(false);
  const [openPhotos, setOpenPhotos] = useState(false);


  const event = useMemo(
    () => ({
      babyName: "Our Baby Boy",
      parentNames: "Evann & Abhishek",
      dateLabel: "Saturday, Jan 31st, 2026",
      timeLabel: "12:00 PM",
      locationLabel: "Issaquah Community Center",
      mapsUrl: "https://maps.google.com/?q=Issaquah%20Community%20Center",
      registryUrl: "https://www.amazon.com/baby-reg/evann-goel-march-2026-issaquah/426YVA1Z363P",
      dressCode: "Pastels / cozy neutrals 💙 (sky blue welcome!)",
      amazonRegistry: "https://www.amazon.com/baby-reg/evann-goel-march-2026-issaquah/426YVA1Z363P",
      babylistRegistry: "https://my.babylist.com/evann-goel",
      targetRegistry: "https://www.target.com/gift-registry/your-registry",
      note:
        "We’re so excited to celebrate our little star with you. Come for smiles, snacks, and sweet memories.",
    }),
    []
  );

  // RSVP state
  const [name, setName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [step, setStep] = useState("check"); // check | form | done
  const [guestInfo, setGuestInfo] = useState(null);
  const [attendees, setAttendees] = useState([{ name: "", age: "adult" }]);
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(false);

  const maxSlots = guestInfo?.totalSlots ?? 0;

  function setMsg(type, msg) {
    setStatus({ type, msg });
  }

  async function onCheckGuest(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("", "");
    try {
      const data = await api.checkGuest(name);
      if (!data.found) {
        setMsg("warn", "I couldn’t find that name on the guest list. Try the full name 💙");
        return;
      }
      setGuestInfo(data);
      setStep("form");
      setMsg("ok", `Found you! You can add up to ${data.totalSlots} guest(s).`);
    } catch (err) {
      setMsg("error", err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateAttendee(i, patch) {
    setAttendees((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }

  function addAttendee() {
    if (attendees.length >= maxSlots) return;
    setAttendees((prev) => [...prev, { name: "", age: "adult" }]);
  }

  function removeAttendee(i) {
    setAttendees((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSubmitRSVP(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("", "");

    const cleaned = attendees
      .map((a) => ({ ...a, name: (a.name || "").trim() }))
      .filter((a) => a.name.length > 0);

    if (cleaned.length === 0) {
      setLoading(false);
      setMsg("warn", "Please add at least one attendee name 😊");
      return;
    }

    try {
      await api.submitRSVP({
        primaryGuest: name.trim(),
        guestEmail: guestEmail.trim(),
        attendees: cleaned,
      });

      setStep("done");
      setMsg("ok", "RSVP received! 🎉 Can’t wait to celebrate with you 💙");
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
      {/* Soft nursery sky background */}
      {/* Background photo + fade overlay */}
      <div
        className="fixed inset-0 -z-10 bg-center bg-cover"
        style={{ backgroundImage: "url(/bg2.png)" }}
      >
        {/* VERY light white wash */}
        <div className="absolute inset-0 bg-white/35" />

        {/* Soft pastel tint (subtle) */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-100/25 via-white/20 to-emerald-50/25" />

        {/* Optional: keep blur extremely subtle or remove */}
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

      {/* NAV (mobile-first) */}
      <div className="relative z-30 backdrop-blur bg-white/60 border-b border-white/40">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2 font-semibold">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-100 ring-1 ring-black/5">
              <Baby className="h-5 w-5" />
            </span>
            <span>Baby Shower</span>
          </a>

{/*            */}{/* Mobile: only RSVP button */}
{/*           <a */}
{/*             href="#rsvp" */}
{/*             className="rounded-full bg-slate-900 text-white px-4 py-2 text-sm shadow-soft active:scale-[0.98] transition" */}
{/*           > */}
{/*             RSVP ✨ */}
{/*           </a> */}
        </div>

        {/* Mobile tabs */}
        <div className="mx-auto max-w-5xl px-4 pb-3 md:hidden">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {[["Details", "#details"],
              ["Photos", "#gallery"],
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
              Welcome to our
              <span className="block">
                Baby Shower <span className="align-middle">💙</span>
              </span>
            </h1>

            <p className="mt-3 text-slate-700 text-lg">
              {event.note}
            </p>

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

            {/* Mobile-first CTA row */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="#rsvp"
                className="
                  inline-flex items-center justify-center
                  rounded-full
                  bg-[#EAF6FF]
                  px-6 py-3
                  text-slate-900
                  font-semibold
                  shadow-soft
                  ring-1 ring-black/5
                  hover:bg-[#DDF0FF]
                  active:scale-[0.97]
                  transition
                "
              >
                RSVP Now ✨
              </a>

            </div>
          </motion.div>

          {/* Cute “card” */}
          <motion.div
            className="mt-6 rounded-3xl bg-white/75 shadow-soft ring-1 ring-black/5 p-5 md:p-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
          >
            <div className="grid gap-2 md:grid-cols-2">
{/*               <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-white p-4 ring-1 ring-black/5"> */}
{/*                 <div className="text-sm text-slate-600">Little one</div> */}
{/*                 <div className="mt-1 text-lg font-semibold">{event.babyName}</div> */}
{/*               </div> */}
              <div className="rounded-3xl bg-white/75 p-6 shadow-soft ring-1 ring-black/5">
                <div className="text-slate-500">Hosted by</div>
                <div className="text-xl font-semibold">Evann & Abhishek</div>
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


      {/* WHAT TO EXPECT */}
      <MobileAccordionSection
        id="expect"
        title="What to expect"
        subtitle="A few fun things planned for the day ✨"
        icon={Sparkles}
        open={openExpect}
        setOpen={setOpenExpect}
      >
        <div className="space-y-3 text-slate-700">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">🍼 Baby-themed games & giggles</div>
{/*           <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">📸 Cute photo corner (props included!)</div> */}
          <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">🍰 Snacks + sweet treats</div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">💙 Lots of love for the mother-to-be</div>
        </div>
      </MobileAccordionSection>



      {/* GALLERY */}
<MobileAccordionSection
  id="gallery"
  title="Maternity Photos"
  subtitle="Tap to view 💙"
  icon={Images}
  open={openPhotos}
  setOpen={setOpenPhotos}
>
  <div className="grid grid-cols-2 gap-3">
    {[
      "https://images.unsplash.com/photo-1520975958225-6d294b3f8f64?auto=format&fit=crop&w=1200&q=60",
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=60",
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=60",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=60",
    ].map((src, i) => (
      <div
        key={src}
        className="rounded-3xl overflow-hidden bg-white/70 shadow-soft ring-1 ring-black/5"
      >
        <img
          src={src}
          alt={`maternity-${i}`}
          className="h-32 w-full object-cover"
          loading="lazy"
        />
      </div>
    ))}
  </div>
</MobileAccordionSection>

<div className="hidden md:block">
  <Section
    id="gallery-desktop"
    title="Maternity Photos"
    icon={Images}
    subtitle="A few sweet moments 💙"
  >
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        "https://images.unsplash.com/photo-1520975958225-6d294b3f8f64?auto=format&fit=crop&w=1200&q=60",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=60",
        "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=60",
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=60",
      ].map((src, i) => (
        <motion.div
          key={src}
          className="rounded-3xl overflow-hidden bg-white/70 shadow-soft ring-1 ring-black/5"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.04 }}
          whileHover={{ scale: 1.01 }}
        >
          <img
            src={src}
            alt={`maternity-${i}`}
            className="h-40 w-full object-cover"
            loading="lazy"
          />
        </motion.div>
      ))}
    </div>
  </Section>
</div>



      {/* REGISTRY */}
      <Section
        id="registry"
        title="Registry"
        icon={Gift}
        subtitle="If you’d like to bring a gift, here are our registries 💙"
      >
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
      <Section id="dresscode" title="Dress Code" icon={Shirt} subtitle="Let’s make the photos extra adorable 📸">
        <div className="rounded-3xl bg-white/75 p-6 shadow-soft ring-1 ring-black/5">
          <p className="text-slate-700 text-lg">{event.dressCode}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip icon={Sparkles}>Pastels</Chip>
            <Chip icon={Star}>Cozy</Chip>
            <Chip icon={Heart}>Camera-ready</Chip>
          </div>
        </div>
      </Section>

      {/* RSVP */}
      <Section id="rsvp" title="RSVP" icon={Send} subtitle="Mobile-friendly: big buttons, quick flow, done ✅">
        <div className="grid gap-6 md:grid-cols-2">
          {/* RSVP card */}
          <div className="rounded-3xl bg-white/75 p-6 shadow-soft ring-1 ring-black/5">
            <div className="flex items-center gap-2">
              <div className="rounded-2xl bg-blue-100 p-2 ring-1 ring-black/5">
                <Baby className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold">Confirm your spot 💙</h3>
            </div>

            <form className="mt-5 space-y-3" onSubmit={step === "check" ? onCheckGuest : onSubmitRSVP}>
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

              {step === "form" ? (
                <div className="rounded-2xl bg-blue-50 ring-1 ring-blue-200 p-4">
                  <div className="text-sm text-slate-700">
                    You can add up to <span className="font-semibold">{maxSlots}</span> guest(s).
                  </div>

                  <div className="mt-3 space-y-3">
                    {attendees.map((a, idx) => (
                      <div key={idx} className="rounded-2xl bg-white p-3 ring-1 ring-black/5">
                        <div className="flex gap-2">
                          <input
                            value={a.name}
                            onChange={(e) => updateAttendee(idx, { name: e.target.value })}
                            className="flex-1 rounded-2xl border border-black/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                            placeholder={idx === 0 ? "Guest name" : "Guest name"}
                          />
                          <select
                            value={a.age}
                            onChange={(e) => updateAttendee(idx, { age: e.target.value })}
                            className="rounded-2xl border border-black/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                          >
                            <option value="adult">Adult</option>
                            <option value="child">Child</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeAttendee(idx)}
                            className="rounded-2xl px-3 py-2 bg-white ring-1 ring-black/10 hover:bg-slate-50 active:scale-[0.98] transition"
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addAttendee}
                    disabled={attendees.length >= maxSlots}
                    className={cx(
                      "mt-3 w-full rounded-2xl px-4 py-2 bg-white ring-1 ring-black/10 hover:bg-slate-50 active:scale-[0.99] transition",
                      attendees.length >= maxSlots && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    Add another guest ➕
                  </button>
                </div>
              ) : null}

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

              {step === "check" ? (
                <button
                  className="w-full rounded-2xl bg-slate-900 text-white px-5 py-3 shadow-soft active:scale-[0.99] transition disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Checking..." : "Find My Name ✨"}
                </button>
              ) : step === "form" ? (
                <button
                  className="w-full rounded-2xl bg-blue-600 text-white px-5 py-3 shadow-soft active:scale-[0.99] transition disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit RSVP 💙"}
                </button>
              ) : (
                <a
                  href="#top"
                  className="block text-center w-full rounded-2xl bg-slate-900 text-white px-5 py-3 shadow-soft active:scale-[0.99] transition"
                >
                  Back to Top ⭐️
                </a>
              )}
            </form>
          </div>

           <div className="hidden md:block">
               <div className="rounded-3xl bg-white/75 p-6 shadow-soft ring-1 ring-black/5">
                 <h3 className="text-xl font-semibold flex items-center gap-2">
                   <Sparkles className="h-5 w-5" /> What to expect
                 </h3>

                 <div className="mt-4 space-y-3 text-slate-700">
                   <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                     🍼 Baby-themed games & giggles
                   </div>
{/*                    <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5"> */}
{/*                      📸 Cute photo corner (props included!) */}
{/*                    </div> */}
                   <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                     🍰 Snacks + sweet treats
                   </div>
                   <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                     💙 Lots of love for the mother-to-be
                   </div>
                 </div>
               </div>
             </div>
        </div>
      </Section>

      {/* Sticky mobile RSVP bar */}
      <div className="md:hidden fixed bottom-4 left-0 right-0 z-40 px-4">
        <a
          href="#rsvp"
          className="block rounded-2xl bg-blue-600 text-white text-center px-5 py-3 shadow-soft active:scale-[0.99] transition"
        >
          RSVP 💙
        </a>
      </div>

      <footer className="pb-24 md:pb-10 pt-8 text-center text-sm text-slate-600">
        Made with Love by Goel Family 💙
      </footer>
    </div>
    </>
  );
}
