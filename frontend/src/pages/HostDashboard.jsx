import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

export default function HostDashboard() {
  const [adminKey, setAdminKey] = useState(sessionStorage.getItem("ADMIN_KEY") || "");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");

  const [guests, setGuests] = useState([]);
  const [rsvps, setRsvps] = useState([]);

  const [newName, setNewName] = useState("");
  const [newPlus, setNewPlus] = useState(0);
  const [newKids, setNewKids] = useState(0);

  const totals = useMemo(() => {
    const totalAttending = rsvps.reduce((sum, r) => sum + (r.total_attending || 0), 0);
    return { totalAttending, totalRsvps: rsvps.length };
  }, [rsvps]);

  async function refresh(k) {
    const [g, r] = await Promise.all([api.adminListGuests(k), api.adminListRsvps(k)]);
    setGuests(g);
    setRsvps(r);
  }

  async function verifyAndEnter(k) {
    setError("");
    try {
      await refresh(k);
      sessionStorage.setItem("ADMIN_KEY", k);
      setAdminKey(k);
      setAuthed(true);
    } catch (e) {
      setAuthed(false);
      setError("Invalid host key or server error.");
    }
  }

  useEffect(() => {
    if (adminKey) verifyAndEnter(adminKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-black/5">
          <h1 className="text-2xl font-semibold">Host Access</h1>
          <p className="mt-2 text-slate-600 text-sm">Enter your host key to open the dashboard.</p>

          <input
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            type="password"
            placeholder="Host key"
            className="mt-4 w-full rounded-2xl bg-white px-4 py-3 ring-1 ring-black/10"
          />

          {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

          <button
            onClick={() => verifyAndEnter(adminKey)}
            className="mt-4 w-full rounded-2xl bg-[#EAF6FF] px-4 py-3 font-semibold ring-1 ring-black/5 hover:bg-[#DDF0FF] transition"
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Host Dashboard</h1>
          <div className="mt-2 text-slate-600 text-sm">
            Total RSVPs: <b>{totals.totalRsvps}</b> • Total attending: <b>{totals.totalAttending}</b>
          </div>
        </div>

        <button
          className="rounded-2xl bg-white/80 px-4 py-2 ring-1 ring-black/10"
          onClick={() => {
            sessionStorage.removeItem("ADMIN_KEY");
            setAuthed(false);
          }}
        >
          Lock
        </button>
      </div>

      {/* Add Guest */}
      <div className="rounded-3xl bg-white/80 p-5 shadow-soft ring-1 ring-black/5">
        <h2 className="text-xl font-semibold">Add Guest</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Full name (exact match)"
            className="md:col-span-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-black/10"
          />
          <input
            type="number"
            value={newPlus}
            onChange={(e) => setNewPlus(Number(e.target.value))}
            className="rounded-2xl bg-white px-4 py-3 ring-1 ring-black/10"
          />
          <input
            type="number"
            value={newKids}
            onChange={(e) => setNewKids(Number(e.target.value))}
            className="rounded-2xl bg-white px-4 py-3 ring-1 ring-black/10"
          />
        </div>

        <button
          className="mt-4 rounded-2xl bg-[#EAF6FF] px-4 py-3 font-semibold ring-1 ring-black/5 hover:bg-[#DDF0FF] transition"
          onClick={async () => {
            if (!newName.trim()) return;
            await api.adminAddGuest(adminKey, {
              full_name: newName.trim(),
              plus_ones_allowed: newPlus,
              kids_allowed: newKids,
            });
            setNewName("");
            setNewPlus(0);
            setNewKids(0);
            await refresh(adminKey);
          }}
        >
          Add guest
        </button>
      </div>

      {/* Guest List */}
      <div className="rounded-3xl bg-white/80 p-5 shadow-soft ring-1 ring-black/5">
        <h2 className="text-xl font-semibold">Guest List</h2>

        <div className="mt-4 space-y-3">
          {guests.map((g) => (
            <div key={g.id} className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{g.full_name}</div>
                  <div className="text-sm text-slate-600">
                    Plus ones: {g.plus_ones_allowed} • Kids: {g.kids_allowed}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="rounded-xl bg-white px-3 py-2 ring-1 ring-black/10"
                    onClick={async () => {
                      const plus = prompt("Plus ones allowed:", String(g.plus_ones_allowed));
                      const kids = prompt("Kids allowed:", String(g.kids_allowed));
                      if (plus === null || kids === null) return;

                      await api.adminUpdateGuest(adminKey, g.id, {
                        plus_ones_allowed: Number(plus),
                        kids_allowed: Number(kids),
                      });
                      await refresh(adminKey);
                    }}
                  >
                    Edit
                  </button>

                  <button
                    className="rounded-xl bg-white px-3 py-2 ring-1 ring-black/10"
                    onClick={async () => {
                      if (!confirm(`Delete ${g.full_name}?`)) return;
                      await api.adminDeleteGuest(adminKey, g.id);
                      await refresh(adminKey);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {guests.length === 0 ? <div className="text-sm text-slate-600">No guests yet.</div> : null}
        </div>
      </div>

      {/* RSVPs */}
      <div className="rounded-3xl bg-white/80 p-5 shadow-soft ring-1 ring-black/5">
        <h2 className="text-xl font-semibold">RSVPs</h2>

        <div className="mt-4 space-y-3">
          {rsvps.map((r) => (
            <div key={`${r.guest_id}-${r.updated_at}`} className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
              <div className="font-semibold">{r.guest_name}</div>
              <div className="text-sm text-slate-600">
                Attending: <b>{r.total_attending}</b> / Allowed: <b>{r.total_allowed}</b>
                {r.email ? ` • ${r.email}` : ""}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Updated: {new Date(r.updated_at).toLocaleString()}
              </div>

              <div className="mt-3 text-sm">
                <div className="font-semibold mb-1">Attendees</div>
                <ul className="list-disc pl-5 text-slate-700">
                  {r.attendees.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          {rsvps.length === 0 ? <div className="text-sm text-slate-600">No RSVPs yet.</div> : null}
        </div>
      </div>
    </div>
  );
}
