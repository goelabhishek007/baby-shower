const BASE = import.meta.env.VITE_API_BASE_URL;
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
  checkGuest: (name) => request("/api/check-guest", { method: "POST", body: JSON.stringify({name}) }),
  submitRSVP: (payload) => request("/api/submit-rsvp", { method: "POST", body: JSON.stringify(payload) }),
  getRSVPs: () => request("/api/rsvps"),
};

//export async function checkGuest(name) {
//console.log(API_BASE)
//  const res = await fetch(`${API_BASE}/api/check-guest`, {
//    method: "POST",
//    headers: { "Content-Type": "application/json" },
//    body: JSON.stringify({ name }),
//  });
//  return res.json();
//}
//
//export async function submitRSVP(primaryGuest, attendees) {
//console.log(BASE)
//  const res = await fetch(`${API_BASE}/api/submit-rsvp`, {
//    method: "POST",
//    headers: { "Content-Type": "application/json" },
//    body: JSON.stringify({ primaryGuest, attendees }),
//  });
//  return res.json();
//}

//export async function checkGuest(name) {
//  const res = await fetch(`${API_BASE}/api/check-guest`, {
//    method: "POST",
//    headers: { "Content-Type": "application/json" },
//    body: JSON.stringify({ name }),
//  });
//  return res.json();
//}

export function checkGuest(name) {
  return request("/api/check-guest", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function submitRSVP(primaryGuest, attendees) {
  return request("/api/submit-rsvp", {
    method: "POST",
    body: JSON.stringify({ primaryGuest, attendees }),
  });
}

export function getRSVPs() {
  return request("/api/rsvps", { method: "GET" });
}

export function health() {
  return request("/api/health", { method: "GET" });
}