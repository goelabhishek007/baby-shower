const BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data;
}

export const api = {
  // Guest APIs
  checkGuest: (name) =>
    request("/api/check-guest", { method: "POST", body: JSON.stringify({ name }) }),

  submitRSVP: (payload) =>
    request("/api/submit-rsvp", { method: "POST", body: JSON.stringify(payload) }),

  health: () => request("/api/health", { method: "GET" }),

  // Admin APIs (host dashboard only)
  adminListGuests: (adminKey) =>
    request("/api/admin/guests", { method: "GET", headers: { "x-admin-key": adminKey } }),

  adminAddGuest: (adminKey, payload) =>
    request("/api/admin/guests", {
      method: "POST",
      headers: { "x-admin-key": adminKey },
      body: JSON.stringify(payload),
    }),

  adminUpdateGuest: (adminKey, id, payload) =>
    request(`/api/admin/guests/${id}`, {
      method: "PATCH",
      headers: { "x-admin-key": adminKey },
      body: JSON.stringify(payload),
    }),

  adminDeleteGuest: (adminKey, id) =>
    request(`/api/admin/guests/${id}`, {
      method: "DELETE",
      headers: { "x-admin-key": adminKey },
    }),

  adminListRsvps: (adminKey) =>
    request("/api/admin/rsvps", { method: "GET", headers: { "x-admin-key": adminKey } }),
};
