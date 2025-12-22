import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

export default function HostDashboard() {
  const [adminKey, setAdminKey] = useState(sessionStorage.getItem("ADMIN_KEY") || "");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");

  const [rsvps, setRsvps] = useState([]);

  // editor
  const [editingId, setEditingId] = useState(null); // "new" | rsvpId | null
  const [primaryName, setPrimaryName] = useState("");
  const [attendees, setAttendees] = useState([]); // plus-ones only
  const MAX_PLUS_ONES = 10;

  const totals = useMemo(() => {
    // total attending = primary guest (1) + plus-ones count
    const totalAttending = rsvps.reduce((sum, r) => sum + 1 + (r?.rsvp_attendees?.length || 0), 0);
    return { totalAttending, totalRsvps: rsvps.length };
  }, [rsvps]);

  async function refresh(k) {
    const data = await api.admin.listRSVPs(k);
    setRsvps(data?.rsvps || []);
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

  function startCreate() {
    setEditingId("new");
    setPrimaryName("");
    setAttendees([]);
  }

  function startEdit(r) {
    setEditingId(r.id);
    setPrimaryName(r.primary_guest_name || "");
    setAttendees((r.rsvp_attendees || []).map((a) => ({ name: a.name, age: a.age })));
  }

  function cancelEdit() {
    setEditingId(null);
    setPrimaryName("");
    setAttendees([]);
  }

  function addAttendee() {
    setAttendees((prev) => (prev.length >= MAX_PLUS_ONES ? prev : [...prev, { name: "", age: "adult" }]));
  }

  function updateAttendee(i, patch) {
    setAttendees((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }

  function removeAttendee(i) {
    setAttendees((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    setError("");
    const primaryGuest = String(primaryName || "").trim();
    if (!primaryGuest) {
      setError("Primary guest name is required.");
      return;
    }

    const cleaned = attendees
      .map((a) => ({ name: String(a.name || "").trim(), age: a.age === "child" ? "child" : "adult" }))
      .filter((a) => a.name.length > 0)
      .slice(0, MAX_PLUS_ONES);

    try {
      if (editingId === "new") {
        await api.admin.createRSVP(adminKey, { primaryGuest, attendees: cleaned });
      } else {
        await api.admin.updateRSVP(adminKey, editingId, { primaryGuest, attendees: cleaned });
      }
      cancelEdit();
      await refresh(adminKey);
    } catch (e) {
      setError(e?.message || "Failed to save RSVP.");
    }
  }

  async function del(id) {
    if (!confirm("Delete this RSVP?")) return;
    setError("");
    try {
      await api.admin.deleteRSVP(adminKey, id);
      await refresh(adminKey);
    } catch (e) {
      setError(e?.message || "Failed to delete RSVP.");
    }
  }

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
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Host Dashboard</h1>
          <div className="mt-2 text-slate-600 text-sm">
            Total RSVPs: <b>{totals.totalRsvps}</b> • Total attending: <b>{totals.totalAttending}</b>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className="rounded-2xl bg-white/80 px-4 py-2 ring-1 ring-black/10"
            onClick={startCreate}
          >
            Add RSVP
          </button>

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
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {/* Editor */}
      {editingId ? (
        <div className="rounded-3xl bg-white/80 p-5 shadow-soft ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{editingId === "new" ? "Add RSVP" : "Edit RSVP"}</h2>
            <button className="rounded-xl bg-white px-3 py-2 ring-1 ring-black/10" onClick={cancelEdit}>
              Close
            </button>
          </div>

          <div className="mt-4">
            <div className="text-sm text-slate-600">Primary guest name</div>
            <input
              value={primaryName}
              onChange={(e) => setPrimaryName(e.target.value)}
              className="mt-1 w-full rounded-2xl bg-white px-4 py-3 ring-1 ring-black/10"
              placeholder="Full name"
            />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Plus-ones (max {MAX_PLUS_ONES})</div>
                <div className="text-sm text-slate-600">Leave blank entries empty.</div>
              </div>
              <button className="rounded-xl bg-white px-3 py-2 ring-1 ring-black/10" onClick={addAttendee}>
                + Add
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {attendees.map((a, idx) => (
                <div key={idx} className="rounded-2xl bg-white p-3 ring-1 ring-black/5">
                  <div className="flex gap-2">
                    <input
                      value={a.name}
                      onChange={(e) => updateAttendee(idx, { name: e.target.value })}
                      className="flex-1 rounded-2xl bg-white px-3 py-2 ring-1 ring-black/10"
                      placeholder={`Guest ${idx + 1} name`}
                    />
                    <select
                      value={a.age}
                      onChange={(e) => updateAttendee(idx, { age: e.target.value })}
                      className="rounded-2xl bg-white px-3 py-2 ring-1 ring-black/10"
                    >
                      <option value="adult">Adult</option>
                      <option value="child">Child</option>
                    </select>
                    <button
                      className="rounded-2xl bg-white px-3 py-2 ring-1 ring-black/10"
                      onClick={() => removeAttendee(idx)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              {attendees.length === 0 ? <div className="text-sm text-slate-600">No plus-ones.</div> : null}
            </div>
          </div>

          <button
            className="mt-4 rounded-2xl bg-[#EAF6FF] px-4 py-3 font-semibold ring-1 ring-black/5 hover:bg-[#DDF0FF] transition"
            onClick={save}
          >
            Save RSVP
          </button>
        </div>
      ) : null}

      {/* RSVPs list */}
      <div className="rounded-3xl bg-white/80 p-5 shadow-soft ring-1 ring-black/5">
        <h2 className="text-xl font-semibold">RSVPs</h2>

        <div className="mt-4 space-y-3">
          {rsvps.map((r) => {
            const plusOnes = r.rsvp_attendees || [];
            return (
              <div key={r.id} className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{r.primary_guest_name}</div>
                    <div className="text-sm text-slate-600">
                      Attending: <b>{1 + plusOnes.length}</b> (Primary + {plusOnes.length} plus-ones)
                    </div>

                    {plusOnes.length ? (
                      <div className="mt-2 text-sm text-slate-700">
                        <div className="font-semibold mb-1">Plus-ones</div>
                        <ul className="list-disc pl-5">
                          {plusOnes.map((a) => (
                            <li key={a.id || `${a.name}-${a.age}`}>{a.name} ({a.age})</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-slate-600">No plus-ones.</div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button className="rounded-xl bg-white px-3 py-2 ring-1 ring-black/10" onClick={() => startEdit(r)}>
                      Edit
                    </button>
                    <button className="rounded-xl bg-white px-3 py-2 ring-1 ring-black/10" onClick={() => del(r.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {rsvps.length === 0 ? <div className="text-sm text-slate-600">No RSVPs yet.</div> : null}
        </div>
      </div>
    </div>
  );
}
