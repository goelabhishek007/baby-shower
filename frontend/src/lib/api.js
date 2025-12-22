const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data;
}

export const api = {
  // Public RSVP (open to everyone)
  submitRSVP: (payload) =>
    request("/api/submit-rsvp", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Host-only
  admin: {
    listRSVPs: (adminKey) =>
      request("/api/admin/rsvps", {
        method: "GET",
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
      }),

    createRSVP: (adminKey, payload) =>
      request("/api/admin/rsvps", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
        body: JSON.stringify(payload),
      }),

    updateRSVP: (adminKey, id, payload) =>
      request(`/api/admin/rsvps/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
        body: JSON.stringify(payload),
      }),

    deleteRSVP: (adminKey, id) =>
      request(`/api/admin/rsvps/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "X-Admin-Key": adminKey },
      }),
  },
};
