const BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

async function request(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  // If body is a plain object, stringify it and set JSON content-type
  let body = options.body;
  const isPlainObject =
    body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob);

  if (isPlainObject) {
    body = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  } else {
    // If caller already passed a string body, ensure content-type is correct
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    body,
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

async function request(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  // If body is a plain object, stringify it and set JSON content-type
  let body = options.body;
  const isPlainObject =
    body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob);

  if (isPlainObject) {
    body = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  } else {
    // If caller already passed a string body, ensure content-type is correct
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    body,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data;
}


