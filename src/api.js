const BASE = import.meta.env.VITE_API_URL || "/api";

export function money(value) {
  const num = Number(value || 0);
  return `Rs ${num.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getToken() {
  return localStorage.getItem("tl_token") || "";
}

export function setSession(token, role) {
  localStorage.setItem("tl_token", token);
  localStorage.setItem("tl_role", role);
}

export function clearSession() {
  localStorage.removeItem("tl_token");
  localStorage.removeItem("tl_role");
}

export function role() {
  return localStorage.getItem("tl_role") || "";
}

export async function api(path, options = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (options.form) {
    body = options.form;
  } else if (options.body) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }
  const response = await fetch(`${BASE}${path}`, {
    method: options.method || "GET",
    headers,
    body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Something went wrong");
  }
  return data;
}

export function statusLabel(kind, status) {
  if (kind === "deposit") {
    return { 0: "Initiated", 1: "Approved", 2: "Pending", 3: "Rejected" }[status] || "Unknown";
  }
  return { 1: "Approved", 2: "Pending", 3: "Rejected" }[status] || "Draft";
}
