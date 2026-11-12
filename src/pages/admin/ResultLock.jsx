import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { Lock, Unlock, Search, ArrowLeft, CheckCircle2 } from "lucide-react";

const CURRENT_ACADEMIC_YEAR = "2025/2026";
const TERMS = ["First Term", "Second Term", "Third Term"];

export default function ResultLock() {
  const [students, setStudents] = useState([]);
  const [locks, setLocks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(null); // student object
  const [form, setForm] = useState({
    term: "First Term",
    isLocked: true,
    reason: "",
  });
  const [saving, setSaving] = useState(false);

  const showNotice = (msg) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [studentsRes, locksRes] = await Promise.all([
        api.get("/students"),
        api.get("/grades/admin/student-result-locks", {
          params: { academicYear: CURRENT_ACADEMIC_YEAR },
        }).catch(() => ({ data: { locks: [] } })),
      ]);

      const rawStudents = studentsRes.data;
      const studentList = Array.isArray(rawStudents)
        ? rawStudents
        : rawStudents?.students || rawStudents?.data || [];

      setStudents(
        studentList.map((s) => ({
          id: s._id || s.id,
          name: s.name || "",
          admissionNumber: s.admissionNumber || "",
          currentClass: s.currentClass || s.className || "",
          department: s.department || "",
        }))
      );

      setLocks(locksRes.data?.locks || []);
    } catch (err) {
      console.error(err);
      showNotice(err.response?.data?.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isLocked = (studentId, term) =>
    locks.some(
      (l) =>
        String(l.student?._id || l.student) === String(studentId) &&
        l.term === term &&
        l.academicYear === CURRENT_ACADEMIC_YEAR &&
        l.isLocked === true
    );

  const filtered = students.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.admissionNumber.toLowerCase().includes(q) ||
      s.currentClass.toLowerCase().includes(q)
    );
  });

  const submitLock = async (e) => {
    e.preventDefault();
    if (!selected) return;

    try {
      setSaving(true);
      await api.patch("/grades/admin/student-result-lock", {
        studentId: selected.id,
        academicYear: CURRENT_ACADEMIC_YEAR,
        term: form.term,
        isLocked: form.isLocked,
        reason: form.reason || "",
      });

      showNotice(
        form.isLocked
          ? `${form.term} locked for ${selected.name}`
          : `${form.term} unlocked for ${selected.name}`
      );

      setSelected(null);
      setForm({ term: "First Term", isLocked: true, reason: "" });
      await loadData();
    } catch (err) {
      showNotice(
        err.response?.data?.message || "Failed to update result lock."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <button
            type="button"
            style={styles.back}
            onClick={() => {
              window.location.href = "/admin/dashboard";
            }}
          >
            <ArrowLeft size={16} /> Back to dashboard
          </button>
          <h1 style={styles.title}>Student Result Locks</h1>
          <p style={styles.sub}>
            Lock a student’s term result even when the term is published. Locked
            students cannot view that term until you unlock them.
          </p>
        </div>
        <span style={styles.year}>{CURRENT_ACADEMIC_YEAR}</span>
      </header>

      <div style={styles.toolbar}>
        <div style={styles.search}>
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, admission no, class..."
            style={styles.searchInput}
          />
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#64748b" }}>Loading students...</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Admission No.</th>
                <th>Name</th>
                <th>Class</th>
                <th>Locked terms</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => {
                const lockedTerms = TERMS.filter((t) =>
                  isLocked(student.id, t)
                );
                return (
                  <tr key={student.id}>
                    <td>{student.admissionNumber}</td>
                    <td>
                      <strong>{student.name}</strong>
                    </td>
                    <td>
                      {student.currentClass}
                      {student.department ? ` · ${student.department}` : ""}
                    </td>
                    <td>
                      {lockedTerms.length ? (
                        lockedTerms.map((t) => (
                          <span key={t} style={styles.lockChip}>
                            {t}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "#94a3b8" }}>None</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        style={styles.actionBtn}
                        onClick={() => {
                          setSelected(student);
                          setForm({
                            term: "First Term",
                            isLocked: true,
                            reason: "",
                          });
                        }}
                      >
                        <Lock size={14} /> Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p style={{ padding: 16, color: "#64748b" }}>No students found.</p>
          )}
        </div>
      )}

      {selected && (
        <div
          style={styles.backdrop}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <form style={styles.modal} onSubmit={submitLock}>
            <h2 style={{ margin: "0 0 4px" }}>Manage result lock</h2>
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 14 }}>
              {selected.name} · {selected.admissionNumber}
            </p>

            <label style={styles.label}>
              Term
              <select
                value={form.term}
                onChange={(e) => setForm({ ...form, term: e.target.value })}
                style={styles.input}
              >
                {TERMS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              Action
              <select
                value={form.isLocked ? "lock" : "unlock"}
                onChange={(e) =>
                  setForm({ ...form, isLocked: e.target.value === "lock" })
                }
                style={styles.input}
              >
                <option value="lock">Lock (student cannot view)</option>
                <option value="unlock">
                  Unlock (student can view if published)
                </option>
              </select>
            </label>

            <label style={styles.label}>
              Reason (optional)
              <input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="e.g. Outstanding fees"
                style={styles.input}
              />
            </label>

            <div style={styles.modalActions}>
              <button
                type="button"
                style={styles.secondary}
                onClick={() => setSelected(null)}
              >
                Cancel
              </button>
              <button type="submit" style={styles.primary} disabled={saving}>
                {form.isLocked ? (
                  <>
                    <Lock size={14} /> {saving ? "Saving..." : "Lock result"}
                  </>
                ) : (
                  <>
                    <Unlock size={14} /> {saving ? "Saving..." : "Unlock result"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {notice && (
        <div style={styles.toast}>
          <CheckCircle2 size={16} /> {notice}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8f7fa",
    padding: "28px 5vw 60px",
    fontFamily: "system-ui, sans-serif",
    color: "#211b2b",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  back: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: 0,
    background: "transparent",
    color: "#8b45d6",
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
    marginBottom: 10,
  },
  title: { margin: 0, fontSize: 26 },
  sub: { margin: "8px 0 0", color: "#64748b", maxWidth: 560, fontSize: 14 },
  year: {
    background: "#f5edfc",
    color: "#8b45d6",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  toolbar: { marginBottom: 16 },
  search: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fff",
    border: "1px solid #ece9f0",
    borderRadius: 10,
    padding: "10px 12px",
    maxWidth: 360,
  },
  searchInput: {
    border: 0,
    outline: "none",
    width: "100%",
    fontSize: 14,
  },
  tableWrap: {
    background: "#fff",
    border: "1px solid #ece9f0",
    borderRadius: 14,
    overflow: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  lockChip: {
    display: "inline-block",
    marginRight: 6,
    marginBottom: 4,
    background: "#fef2f2",
    color: "#b91c1c",
    borderRadius: 999,
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 700,
  },
  actionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: 0,
    background: "#f5edfc",
    color: "#8b45d6",
    borderRadius: 8,
    padding: "8px 10px",
    fontWeight: 700,
    cursor: "pointer",
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 10, 25, 0.45)",
    display: "grid",
    placeItems: "center",
    padding: 16,
    zIndex: 50,
  },
  modal: {
    width: "min(420px, 100%)",
    background: "#fff",
    borderRadius: 14,
    padding: 22,
    boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
  },
  label: {
    display: "grid",
    gap: 6,
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 12,
    color: "#475569",
  },
  input: {
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    fontWeight: 500,
    color: "#0f172a",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  primary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: 0,
    background: "#8b45d6",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondary: {
    border: 0,
    background: "#f1f5f9",
    color: "#475569",
    borderRadius: 8,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  toast: {
    position: "fixed",
    right: 20,
    bottom: 20,
    background: "#211b2b",
    color: "#fff",
    padding: "12px 14px",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    gap: 8,
    zIndex: 60,
  },
};

// Basic table cell padding via global-ish injection alternative:
if (typeof document !== "undefined") {
  const id = "result-lock-table-style";
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      table th, table td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #ece9f0; }
      table th { font-size: 12px; color: #64748b; background: #fafafa; }
    `;
    document.head.appendChild(style);
  }
}