const BASE = import.meta.env.VITE_API_BASE_URL;

if (!BASE) {
  throw new Error("VITE_API_BASE_URL is not defined. Please check your .env file.");
}

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);

  // Handle empty responses (e.g. 204 No Content)
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      (data && (data.message || data.title || JSON.stringify(data))) ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data;
}

// ── Books ─────────────────────────────────────────────────────────────────────
export const booksApi = {
  getAll:       ()        => request("GET",    "/Books"),
  getAvailable: ()        => request("GET",    "/Books/available"),
  getById:      (id)      => request("GET",    `/Books/${id}`),
  add:          (payload) => request("POST",   "/Books", payload),
  delete:       (id)      => request("DELETE", `/Books/${id}`),        // DELETE /api/Books/{id}
};

// ── Issuance ──────────────────────────────────────────────────────────────────
export const issuanceApi = {
  getAll:       ()           => request("GET",    "/Issuance"),
  getByStudent: (studentId)  => request("GET",    `/Issuance/student/${studentId}`),
  issue:        (payload)    => request("POST",   "/Issuance/issue", payload),
  returnBook:   (issuanceId) => request("PUT",    `/Issuance/return/${issuanceId}`),
  delete:       (id)         => request("DELETE", `/Issuance/${id}`),  // DELETE /api/Issuance/{issuanceId}
};