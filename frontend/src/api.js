export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://127.0.0.1:10001";

/** JSON fetch helper; adds Authorization if token exists */
export async function api(path, { method = "GET", headers = {}, body } = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch (err) {
      console.log(err);
    }
    throw new Error(msg);
  }
  return res.json();
}

// ----- Auth store (localStorage) -----
export const AUTH_KEY = "auth_token";
export const USER_KEY = "auth_user";

export function saveAuth({ token, user }) {
  if (token) localStorage.setItem(AUTH_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function getToken() {
  return localStorage.getItem(AUTH_KEY);
}
export function getUser() {
  try {
    const s = localStorage.getItem(USER_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}
export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
}

// ----- High level API -----
export async function register(email, password) {
  return api("/api/users/register", { method: "POST", body: { email, password } });
}
export async function login(email, password) {
  const data = await api("/api/users/login", { method: "POST", body: { email, password } });
  saveAuth(data);            // expects { token, user }
  return data;
}