const BASE = import.meta.env.VITE_API_BASE;

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
  checkGuest: (name) => request("/api/check-guest", { method: "POST", body: JSON.stringify({ name }) }),
  submitRSVP: (payload) => request("/api/submit-rsvp", { method: "POST", body: JSON.stringify(payload) }),
  getRSVPs: () => request("/api/rsvps"),
};
