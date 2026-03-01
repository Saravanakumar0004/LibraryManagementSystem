import { useState, useEffect, useCallback } from "react";

// ── API Layer (inline — reads from .env) ──────────────────────────────────────
const BASE = import.meta.env.VITE_API_BASE_URL; // http://localhost:5000/api

async function request(method, path, body = null) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = (data && (data.message || data.title || JSON.stringify(data))) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

const booksApi = {
  getAll:       ()        => request("GET",    "/Books"),
  getAvailable: ()        => request("GET",    "/Books/available"),
  getById:      (id)      => request("GET",    `/Books/${id}`),
  add:          (payload) => request("POST",   "/Books", payload),
  delete:       (id)      => request("DELETE", `/Books/${id}`),        // DELETE /api/Books/{id}
};

const issuanceApi = {
  getAll:       ()           => request("GET",    "/Issuance"),
  getByStudent: (studentId)  => request("GET",    `/Issuance/student/${studentId}`),
  issue:        (payload)    => request("POST",   "/Issuance/issue", payload),
  returnBook:   (issuanceId) => request("PUT",    `/Issuance/return/${issuanceId}`),
  delete:       (id)         => request("DELETE", `/Issuance/${id}`),  // DELETE /api/Issuance/{issuanceId}
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split("T")[0];

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function isOverdue(dueDate, returned) {
  if (returned) return false;
  return dueDate && new Date(dueDate) < new Date();
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Icons = {
  dashboard: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  books:     <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  issue:     <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
  plus:      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  search:    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  close:     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  check:     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  return:    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>,
  warning:   <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  refresh:   <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  spinner:   <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="spin"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
  trash:     <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
};

// ── Toast hook ────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, push };
}

// ── Toast UI ──────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === "error" ? "✕ " : "✓ "}{t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Confirm Delete Modal ──────────────────────────────────────────────────────
function ConfirmDelete({ title, message, onConfirm, onCancel, loading }) {
  useEffect(() => {
    const h = e => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCancel]);
  return (
    <div className="modal-overlay" onClick={e => e.target.classList.contains("modal-overlay") && onCancel()}>
      <div className="modal-box confirm-box">
        <div className="confirm-icon">🗑️</div>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-msg">{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? Icons.spinner : Icons.trash} {loading ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={e => e.target.classList.contains("modal-overlay") && onClose()}>
      <div className="modal-box">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}>{Icons.close}</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Shared states ─────────────────────────────────────────────────────────────
function Loader() {
  return <div className="center-state">{Icons.spinner}<span>Loading…</span></div>;
}
function ErrState({ msg, onRetry }) {
  return (
    <div className="center-state err-state">
      <span className="err-icon">⚠</span>
      <p>{msg}</p>
      {onRetry && <button className="btn btn-ghost" onClick={onRetry}>{Icons.refresh} Retry</button>}
    </div>
  );
}
function Empty({ msg }) {
  return <div className="center-state muted">{msg}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD  →  GET /api/Books  +  GET /api/Issuance
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard({ onNav }) {
  const [books,     setBooks]     = useState([]);
  const [issuances, setIssuances] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [b, i] = await Promise.all([booksApi.getAll(), issuanceApi.getAll()]);
      setBooks(Array.isArray(b) ? b : []);
      setIssuances(Array.isArray(i) ? i : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="page"><Loader /></div>;
  if (error)   return <div className="page"><ErrState msg={error} onRetry={load} /></div>;

  const totalCopies   = books.reduce((s, b) => s + (b.totalCopies || 0), 0);
  const availCopies   = books.reduce((s, b) => s + (b.availableCopies ?? b.available ?? 0), 0);
  const activeIssues  = issuances.filter(i => !i.returned && !i.returnedDate).length;
  const overdueIssues = issuances.filter(i => isOverdue(i.dueDate, i.returned || i.returnedDate)).length;
  const recent        = [...issuances].reverse().slice(0, 6);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Library overview — {fmtDate(today)}</p>
        </div>
        <button className="btn btn-ghost btn-sm-text" onClick={load}>{Icons.refresh} Refresh</button>
      </div>

      <div className="stats-grid">
        {[
          { label: "Total Books",   value: books.length,  sub: `${totalCopies} copies`,  color: "#6366f1", emoji: "📚" },
          { label: "Available",     value: availCopies,   sub: "copies free",             color: "#10b981", emoji: "✅" },
          { label: "Active Issues", value: activeIssues,  sub: "currently out",           color: "#f59e0b", emoji: "🔖" },
          { label: "Overdue",       value: overdueIssues, sub: "need attention",          color: "#ef4444", emoji: "⚠️" },
        ].map(s => (
          <div className="stat-card" key={s.label} style={{ "--ac": s.color }}>
            <div className="stat-emoji">{s.emoji}</div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-head">
            <span className="card-title">Recent Issuances</span>
            <button className="link-btn" onClick={() => onNav("issuance")}>View all →</button>
          </div>
          {recent.length === 0 ? <Empty msg="No issuances yet." /> : (
            <table className="table">
              <thead>
                <tr><th>Book</th><th>Student</th><th>Due</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recent.map(i => {
                  const ret  = i.returned || !!i.returnedDate;
                  const over = isOverdue(i.dueDate, ret);
                  return (
                    <tr key={i.id || i.issuanceId}>
                      <td className="td-bold">{i.bookTitle || i.book?.title || `Book #${i.bookId}`}</td>
                      <td>{i.studentName}<br/><span className="sid">{i.studentId}</span></td>
                      <td>{fmtDate(i.dueDate)}</td>
                      <td>
                        {ret  ? <span className="badge badge-green">Returned</span>
                              : over ? <span className="badge badge-red">Overdue</span>
                                     : <span className="badge badge-amber">Active</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <span className="card-title">Books — Availability</span>
            <button className="link-btn" onClick={() => onNav("books")}>View all →</button>
          </div>
          <div className="avail-list">
            {books.slice(0, 8).map(b => {
              const total = b.totalCopies || 1;
              const avail = b.availableCopies ?? b.available ?? 0;
              const pct   = Math.max(0, Math.min(100, (avail / total) * 100));
              const color = avail === 0 ? "#ef4444" : pct < 50 ? "#f59e0b" : "#10b981";
              return (
                <div key={b.id} className="avail-item">
                  <div className="avail-row">
                    <span className="avail-title">{b.title}</span>
                    <span className="avail-num" style={{ color }}>{avail}/{total}</span>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
            {books.length === 0 && <Empty msg="No books found." />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKS
//   GET    /api/Books
//   GET    /api/Books/available
//   POST   /api/Books          →  { title, author, isbn, totalCopies }
//   DELETE /api/Books/{id}
// ─────────────────────────────────────────────────────────────────────────────
function Books({ toast }) {
  const [books,   setBooks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [search,  setSearch]  = useState("");
  const [tab,     setTab]     = useState("all");
  const [modal,   setModal]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({ title: "", author: "", isbn: "", totalCopies: 1 });

  // DELETE confirm state
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, title }
  const [deleting,     setDeleting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = tab === "available"
        ? await booksApi.getAvailable()
        : await booksApi.getAll();
      setBooks(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const filtered = books.filter(b => {
    const q = search.toLowerCase();
    return b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.isbn?.includes(q);
  });

  // POST /api/Books
  async function handleAdd() {
    if (!form.title.trim() || !form.author.trim())
      return toast("Title and Author are required.", "error");
    setSaving(true);
    try {
      await booksApi.add({ ...form, totalCopies: +form.totalCopies });
      toast("Book added successfully!");
      setModal(false);
      setForm({ title: "", author: "", isbn: "", totalCopies: 1 });
      load();
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  }

  // DELETE /api/Books/{id}
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await booksApi.delete(deleteTarget.id);
      toast(`"${deleteTarget.title}" deleted successfully!`);
      setDeleteTarget(null);
      load();
    } catch (e) { toast(e.message, "error"); }
    finally { setDeleting(false); }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Books</h1>
          <p className="page-sub">{books.length} titles loaded</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm-text" onClick={load}>{Icons.refresh}</button>
          <button className="btn btn-primary" onClick={() => setModal(true)}>{Icons.plus} Add Book</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          {Icons.search}
          <input
            placeholder="Search title, author, ISBN…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="clear-btn" onClick={() => setSearch("")}>{Icons.close}</button>}
        </div>
        <div className="filter-tabs">
          {[["all", "All Books"], ["available", "Available"]].map(([v, l]) => (
            <button key={v} className={`filter-tab ${tab === v ? "active" : ""}`} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? <Loader /> : error ? <ErrState msg={error} onRetry={load} /> : (
        <div className="books-grid">
          {filtered.map(b => {
            const total = b.totalCopies || 0;
            const avail = b.availableCopies ?? b.available ?? 0;
            const pct   = total > 0 ? (avail / total) * 100 : 0;
            const color = avail === 0 ? "#ef4444" : pct < 50 ? "#f59e0b" : "#10b981";
            return (
              <div className="book-card" key={b.id}>
                <div className="book-spine" />
                <div className="book-body">
                  <div className="book-card-toprow">
                    <div className="book-id-chip">#{b.id}</div>
                    {/* DELETE /api/Books/{id} */}
                    <button
                      className="btn-icon-danger"
                      title="Delete book"
                      onClick={() => setDeleteTarget({ id: b.id, title: b.title })}
                    >
                      {Icons.trash}
                    </button>
                  </div>
                  <h3 className="book-title">{b.title}</h3>
                  <p className="book-author">by {b.author}</p>
                  {b.isbn && <p className="book-isbn">{b.isbn}</p>}
                  <div className="book-stock">
                    <div className="bar-bg">
                      <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="stock-lbl" style={{ color }}>{avail} / {total} available</span>
                  </div>
                  {avail === 0 && (
                    <span className="badge badge-red" style={{ width: "fit-content" }}>Out of Stock</span>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="grid-empty">No books found.</div>}
        </div>
      )}

      {/* Add Book Modal */}
      {modal && (
        <Modal title="Add New Book" onClose={() => setModal(false)}>
          <div className="form">
            <div className="form-row">
              <div className="field">
                <label>Title <span className="req">*</span></label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Clean Code" />
              </div>
              <div className="field">
                <label>Author <span className="req">*</span></label>
                <input value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} placeholder="e.g. Robert Martin" />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>ISBN</label>
                <input value={form.isbn} onChange={e => setForm(p => ({ ...p, isbn: e.target.value }))} placeholder="9780132350884" />
              </div>
              <div className="field">
                <label>Total Copies <span className="req">*</span></label>
                <input type="number" min={1} value={form.totalCopies} onChange={e => setForm(p => ({ ...p, totalCopies: e.target.value }))} />
              </div>
            </div>
            <div className="api-hint">POST /api/Books — <code>{`{ title, author, isbn, totalCopies }`}</code></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
                {saving ? Icons.spinner : Icons.check} {saving ? "Adding…" : "Add Book"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm Modal — DELETE /api/Books/{id} */}
      {deleteTarget && (
        <ConfirmDelete
          title="Delete Book"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ISSUANCE
//   GET    /api/Issuance
//   GET    /api/Issuance/student/{studentId}
//   POST   /api/Issuance/issue      →  { bookId, studentName, studentId, dueDays }
//   PUT    /api/Issuance/return/{issuanceId}
//   DELETE /api/Issuance/{issuanceId}
// ─────────────────────────────────────────────────────────────────────────────
function Issuance({ toast }) {
  const [issuances,      setIssuances]      = useState([]);
  const [availableBooks, setAvailableBooks] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [tab,            setTab]            = useState("active");
  const [search,         setSearch]         = useState("");
  const [modal,          setModal]          = useState(false);
  const [returning,      setReturning]      = useState(null);
  const [saving,         setSaving]         = useState(false);
  const [form,           setForm]           = useState({ bookId: "", studentName: "", studentId: "", dueDays: 15 });

  // DELETE confirm state
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, label }
  const [deleting,     setDeleting]     = useState(false);

  const [studentFilter, setStudentFilter] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const loadIssuances = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = studentFilter.trim()
        ? await issuanceApi.getByStudent(studentFilter.trim())
        : await issuanceApi.getAll();
      setIssuances(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [studentFilter]);

  useEffect(() => { loadIssuances(); }, [loadIssuances]);

  const loadAvailableBooks = useCallback(() => {
    booksApi.getAvailable().then(d => setAvailableBooks(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => { loadAvailableBooks(); }, [loadAvailableBooks]);

  // POST /api/Issuance/issue
  async function handleIssue() {
    if (!form.bookId || !form.studentName.trim() || !form.studentId.trim())
      return toast("All fields are required.", "error");
    setSaving(true);
    try {
      await issuanceApi.issue({
        bookId:      +form.bookId,
        studentName: form.studentName.trim(),
        studentId:   form.studentId.trim(),
        dueDays:     +form.dueDays,
      });
      toast("Book issued successfully!");
      setModal(false);
      setForm({ bookId: "", studentName: "", studentId: "", dueDays: 15 });
      loadIssuances();
      loadAvailableBooks();
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  }

  // PUT /api/Issuance/return/{issuanceId}
  async function handleReturn(id) {
    setReturning(id);
    try {
      await issuanceApi.returnBook(id);
      toast("Book returned successfully!");
      loadIssuances();
      loadAvailableBooks();
    } catch (e) { toast(e.message, "error"); }
    finally { setReturning(null); }
  }

  // DELETE /api/Issuance/{issuanceId}
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await issuanceApi.delete(deleteTarget.id);
      toast("Issuance record deleted successfully!");
      setDeleteTarget(null);
      loadIssuances();
    } catch (e) { toast(e.message, "error"); }
    finally { setDeleting(false); }
  }

  const displayed = issuances.filter(i => {
    const ret  = i.returned || !!i.returnedDate;
    const over = isOverdue(i.dueDate, ret);
    const matchTab =
      tab === "all"      ? true :
      tab === "active"   ? !ret && !over :
      tab === "overdue"  ? over :
      tab === "returned" ? ret : true;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (i.bookTitle || i.book?.title || "").toLowerCase().includes(q) ||
      (i.studentName || "").toLowerCase().includes(q) ||
      (i.studentId || "").toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const counts = {
    all:      issuances.length,
    active:   issuances.filter(i => !i.returned && !i.returnedDate && !isOverdue(i.dueDate, i.returned || i.returnedDate)).length,
    overdue:  issuances.filter(i => isOverdue(i.dueDate, i.returned || !!i.returnedDate)).length,
    returned: issuances.filter(i => i.returned || !!i.returnedDate).length,
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Issuance</h1>
          <p className="page-sub">Manage book borrowings and returns</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm-text" onClick={loadIssuances}>{Icons.refresh}</button>
          <button className="btn btn-primary" onClick={() => setModal(true)}>{Icons.plus} Issue Book</button>
        </div>
      </div>

      {/* Student filter bar — GET /api/Issuance/student/{studentId} */}
      <div className="student-filter-bar">
        <span className="sf-label">Filter by Student ID:</span>
        <div className="search-box sf-input">
          {Icons.search}
          <input
            placeholder="Enter student ID…"
            value={studentSearch}
            onChange={e => setStudentSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && setStudentFilter(studentSearch)}
          />
          {studentSearch && (
            <button className="clear-btn" onClick={() => { setStudentSearch(""); setStudentFilter(""); }}>{Icons.close}</button>
          )}
        </div>
        <button className="btn btn-ghost btn-sm-text" onClick={() => setStudentFilter(studentSearch)}>Search</button>
        {studentFilter && <button className="btn btn-ghost btn-sm-text" onClick={() => { setStudentSearch(""); setStudentFilter(""); }}>Clear</button>}
        {studentFilter && <span className="sf-active-chip">Showing: {studentFilter}</span>}
      </div>

      <div className="toolbar">
        <div className="search-box">
          {Icons.search}
          <input placeholder="Search book or student…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="clear-btn" onClick={() => setSearch("")}>{Icons.close}</button>}
        </div>
        <div className="filter-tabs">
          {[["active", "Active"], ["overdue", "Overdue"], ["returned", "Returned"], ["all", "All"]].map(([v, l]) => (
            <button key={v} className={`filter-tab ${tab === v ? "active" : ""}`} onClick={() => setTab(v)}>
              {l} <span className="tab-cnt">{counts[v]}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? <Loader /> : error ? <ErrState msg={error} onRetry={loadIssuances} /> : (
        <div className="card">
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr><th>#</th><th>Book</th><th>Student</th><th>Issue Date</th><th>Due Date</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {displayed.map((i, idx) => {
                  const id   = i.id || i.issuanceId;
                  const ret  = i.returned || !!i.returnedDate;
                  const over = isOverdue(i.dueDate, ret);
                  return (
                    <tr key={id} className={over ? "row-overdue" : ""}>
                      <td className="td-muted">{idx + 1}</td>
                      <td>
                        <div className="td-bold">{i.bookTitle || i.book?.title || `Book #${i.bookId}`}</div>
                        <div className="td-sm">ID: {i.bookId}</div>
                      </td>
                      <td>
                        <div className="student-cell">
                          <div className="s-avatar">{(i.studentName || "?")[0].toUpperCase()}</div>
                          <div>
                            <div className="td-bold">{i.studentName}</div>
                            <div className="sid">{i.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td>{fmtDate(i.issueDate || i.issuedDate)}</td>
                      <td>
                        <span className={over ? "td-red" : ""}>{fmtDate(i.dueDate)}</span>
                        {over && <span className="overdue-icon">{Icons.warning}</span>}
                      </td>
                      <td>
                        {ret  ? <span className="badge badge-green">Returned</span>
                              : over ? <span className="badge badge-red">Overdue</span>
                                     : <span className="badge badge-amber">Active</span>}
                      </td>
                      <td>
                        <div className="action-cell">
                          {/* PUT /api/Issuance/return/{issuanceId} */}
                          {!ret && (
                            <button
                              className="btn-sm btn-return"
                              onClick={() => handleReturn(id)}
                              disabled={returning === id}
                            >
                              {returning === id ? Icons.spinner : Icons.return}
                              {returning === id ? "…" : "Return"}
                            </button>
                          )}
                          {ret && (
                            <span className="td-muted td-sm">{fmtDate(i.returnedDate || i.returnDate)}</span>
                          )}
                          {/* DELETE /api/Issuance/{issuanceId} */}
                          <button
                            className="btn-sm btn-delete-sm"
                            title="Delete record"
                            onClick={() => setDeleteTarget({
                              id,
                              label: `${i.bookTitle || `Book #${i.bookId}`} — ${i.studentName}`,
                            })}
                          >
                            {Icons.trash}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {displayed.length === 0 && (
                  <tr><td colSpan={7} className="td-empty">No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issue Book Modal — POST /api/Issuance/issue */}
      {modal && (
        <Modal title="Issue a Book" onClose={() => setModal(false)}>
          <div className="form">
            <div className="field">
              <label>Book <span className="req">*</span></label>
              <select value={form.bookId} onChange={e => setForm(p => ({ ...p, bookId: e.target.value }))}>
                <option value="">— Select available book —</option>
                {availableBooks.map(b => (
                  <option key={b.id} value={b.id}>[{b.id}] {b.title} — {b.availableCopies ?? b.available ?? "?"} left</option>
                ))}
              </select>
              {availableBooks.length === 0 && <span className="field-hint">No available books. All are checked out.</span>}
            </div>
            <div className="form-row">
              <div className="field">
                <label>Student Name <span className="req">*</span></label>
                <input value={form.studentName} onChange={e => setForm(p => ({ ...p, studentName: e.target.value }))} placeholder="e.g. name" />
              </div>
              <div className="field">
                <label>Student ID <span className="req">*</span></label>
                <input value={form.studentId} onChange={e => setForm(p => ({ ...p, studentId: e.target.value }))} placeholder="e.g. 221622244014" />
              </div>
            </div>
            <div className="field">
              <label>Due Days <span className="req">*</span></label>
              <input type="number" min={1} max={90} value={form.dueDays} onChange={e => setForm(p => ({ ...p, dueDays: e.target.value }))} />
              <span className="field-hint">Book must be returned within this many days.</span>
            </div>
            <div className="api-hint">POST /api/Issuance/issue — <code>{`{ bookId, studentName, studentId, dueDays }`}</code></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleIssue} disabled={saving || !form.bookId}>
                {saving ? Icons.spinner : Icons.check} {saving ? "Issuing…" : "Confirm Issue"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm Modal — DELETE /api/Issuance/{issuanceId} */}
      {deleteTarget && (
        <ConfirmDelete
          title="Delete Issuance Record"
          message={`Delete issuance record for "${deleteTarget.label}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [page,        setPage]    = useState("dashboard");
  const [sidebarOpen, setSidebar] = useState(false);
  const { toasts, push }          = useToast();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Icons.dashboard },
    { id: "books",     label: "Books",     icon: Icons.books },
    { id: "issuance",  label: "Issuance",  icon: Icons.issue },
  ];

  const navigate = (p) => { setPage(p); setSidebar(false); };

  return (
    <div className={`layout ${sidebarOpen ? "sidebar-open" : ""}`}>

      <aside className="sidebar">
        <div className="sidebar-brand">
          <span style={{ fontSize: 22 }}>📚</span>
          <span className="brand-text">LibraryMS</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(n => (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? "active" : ""}`}
              onClick={() => navigate(n.id)}
            >
              {n.icon}<span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="api-env-pill">
            <span className="dot-live" />
            <code>{import.meta.env.VITE_API_BASE_URL}</code>
          </div>
          <div className="user-pill">
            <div className="u-avatar">A</div>
            <div>
              <div className="u-name">Admin</div>
              <div className="u-role">Librarian</div>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="overlay" onClick={() => setSidebar(false)} />}

      <div className="main-area">
        <header className="topbar">
          <button className="hamburger" onClick={() => setSidebar(o => !o)}>
            <span /><span /><span />
          </button>
          <span className="topbar-title">{navItems.find(n => n.id === page)?.label}</span>
          <div className="topbar-right">
            <div className="env-chip">
              <span className="dot-live" />
              <span>API Live</span>
            </div>
          </div>
        </header>

        <div className="content">
          <div key={page} className="tab-panel">
            {page === "dashboard" && <Dashboard onNav={navigate} />}
            {page === "books"     && <Books     toast={push} />}
            {page === "issuance"  && <Issuance  toast={push} />}
          </div>
        </div>
      </div>

      <Toast toasts={toasts} />
    </div>
  );
}