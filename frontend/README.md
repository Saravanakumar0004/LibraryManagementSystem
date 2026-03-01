# 📚 Library Management System — React Frontend

A fully integrated React + Vite frontend connected to your real `LibraryManagementSystem.API`.

---

## 📁 Project Structure

```
lms/
├── .env                  ← API base URL config
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx          ← Entry point
    ├── App.jsx           ← All pages & components
    ├── api.js            ← All API calls (Books + Issuance)
    └── index.css         ← All styles
```

---

## ⚙️ Setup

### 1. Configure your API URL

Edit `.env` (already set to your backend):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

> If your backend runs on a different port, change it here only.

### 2. Install & Run

```bash
npm install
npm run dev
```

Open → **http://localhost:5173**

> ⚠️ Your backend (`http://localhost:5000`) must be running first.  
> The app will show clear error messages + a Retry button if the API is down.

---

## 🔌 API Endpoints Used

### Books
| Method | Endpoint | Used in |
|--------|----------|---------|
| GET | `/api/Books` | Books page (All tab), Dashboard |
| GET | `/api/Books/available` | Books page (Available tab), Issue modal dropdown |
| GET | `/api/Books/{id}` | — (available via api.js) |
| POST | `/api/Books` | Add Book modal |

**Add Book body:**
```json
{ "title": "Clean Code", "author": "Robert Martin", "isbn": "9780132350884", "totalCopies": 10 }
```

### Issuance
| Method | Endpoint | Used in |
|--------|----------|---------|
| GET | `/api/Issuance` | Issuance page |
| GET | `/api/Issuance/student/{studentId}` | Student ID filter bar |
| POST | `/api/Issuance/issue` | Issue Book modal |
| PUT | `/api/Issuance/return/{issuanceId}` | Return button |

**Issue body:**
```json
{ "bookId": 2, "studentName": "Jayasri", "studentId": "421622244014", "dueDays": 15 }
```

---

## ✨ Features

- 📊 **Dashboard** — Live stats, recent issuances, availability bars
- 📖 **Books** — List all / available, Add new book, stock bars
- 🔖 **Issuance** — Issue books, return with one click, filter by status/student
- ⚠️ **Overdue detection** — Highlighted in red automatically
- 🔴 **Live API indicator** — Shows your base URL in sidebar
- 💬 **Toast notifications** — Success/error feedback on every action
- 🔁 **Retry buttons** — When API is unreachable
- 📱 **Fully responsive** — Mobile sidebar with hamburger menu
- 🔒 **Env-driven** — Change API URL in `.env` only, no code changes needed
