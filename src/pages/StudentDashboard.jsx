import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import api from "../api/axios";
import { logout } from "../api/auth";
import "./StudentDashboard.css";

// ====================== HELPERS ======================

function getGradeAndRemark(score, currentClass = "") {
  const isSeniorClass = /^(SS|SSS)/i.test(String(currentClass).trim());

  if (isSeniorClass) {
    if (score >= 75) return { grade: "A1", remark: "Excellent" };
    if (score >= 70) return { grade: "B2", remark: "Very Good" };
    if (score >= 65) return { grade: "B3", remark: "Good" };
    if (score >= 60) return { grade: "C4", remark: "Credit" };
    if (score >= 55) return { grade: "C5", remark: "Credit" };
    if (score >= 50) return { grade: "C6", remark: "Credit" };
    if (score >= 45) return { grade: "D7", remark: "Pass" };
    if (score >= 40) return { grade: "E8", remark: "Fair" };
    return { grade: "F9", remark: "Fail" };
  }

  if (score >= 70) return { grade: "A", remark: "Distinction" };
  if (score >= 60) return { grade: "B", remark: "Upper Credit" };
  if (score >= 50) return { grade: "C", remark: "Lower Credit" };
  if (score >= 40) return { grade: "P", remark: "Pass" };
  return { grade: "F", remark: "Fail" };
}

function getSubjectResult(subject, currentClass) {
  const maximumScore = subject.maximumScore ?? 100;
  const total = Number(subject.total || subject.totalScore || 0);
  const percentage = maximumScore > 0 ? (total / maximumScore) * 100 : 0;
  const roundedPercentage = Number(percentage.toFixed(2));

  return {
    ...subject,
    name: subject.name || subject.subjectName || subject.subject || "Subject",
    ca:
      subject.ca ??
      Number(subject.test1 || 0) +
        Number(subject.test2 || 0) +
        Number(subject.test3 || 0) +
        Number(subject.assignment || 0),
    exam: Number(subject.exam || 0),
    total,
    percentage: roundedPercentage,
    ...getGradeAndRemark(roundedPercentage, currentClass),
  };
}

function getResultSummary(result, currentClass) {
  const subjects = (result.subjects || []).map((s) =>
    getSubjectResult(s, currentClass)
  );

  const totalScore = subjects.reduce(
    (sum, subject) => sum + Number(subject.total || 0),
    0
  );

  const totalMaximumScore = subjects.reduce(
    (sum, subject) => sum + Number(subject.maximumScore ?? 100),
    0
  );

  const totalPercentage =
    totalMaximumScore > 0 ? (totalScore / totalMaximumScore) * 100 : 0;

  const subjectsOffered = subjects.length;

  const terminalAverage =
    subjectsOffered > 0
      ? subjects.reduce((sum, subject) => sum + subject.percentage, 0) /
        subjectsOffered
      : 0;

  return {
    subjects,
    totalScore,
    totalMaximumScore,
    totalPercentage: Number(totalPercentage.toFixed(2)),
    subjectsOffered,
    terminalAverage: Number(terminalAverage.toFixed(2)),
  };
}

function getAutomaticYearTutorComment(averageScore) {
  if (averageScore >= 75)
    return "An exceptionally brilliant performance. Keep maintaining this golden standard.";
  if (averageScore >= 65)
    return "A highly commendable result. With this consistency, top honors are within reach next term.";
  if (averageScore >= 50)
    return "A good performance, but you possess the capability to attain higher credit marks.";
  if (averageScore >= 40)
    return "Passable terminal record. You are playing on the borderline; step up your study habits.";
  return "An unsatisfactory performance. Intensive remedial study and closer supervision are urgently required.";
}

function getAutomaticAdminComment(averageScore) {
  if (averageScore >= 75)
    return "Outstanding academic excellence. A proud reflection of hard work. Keep it up!";
  if (averageScore >= 65)
    return "Very impressive progress. Promising results showing dedication to studies.";
  if (averageScore >= 50)
    return "A satisfactory performance. Focus more on weak areas to secure top tiers next session.";
  if (averageScore >= 40)
    return "Fair trial, but there is vast room for improvement. Double your efforts.";
  return "Unacceptable standard. Must show a completely renewed attitude to work next term to pass.";
}

function initials(name = "") {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function navigateTo(path) {
  window.location.href = path;
}

function formatClass(student) {
  if (!student) return "—";
  if (student.department) return `${student.currentClass} ${student.department}`;
  return student.currentClass || "—";
}

function formatDate(value) {
  if (!value) return "Not provided";
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
}

// Normalize academic profile from backend into term keys
function buildTermResults(academic) {
  if (!academic) {
    return {
      first: { label: "First Term Result", uploaded: false, subjects: [] },
      second: { label: "Second Term Result", uploaded: false, subjects: [] },
      third: {
        label: "Third Term / Annual Report",
        uploaded: false,
        subjects: [],
      },
    };
  }

  const pick = (keys) => {
    for (const key of keys) {
      if (academic[key]) return academic[key];
      if (academic.terms?.[key]) return academic.terms[key];
    }
    return null;
  };

  const first = pick(["firstTerm", "First Term", "first"]);
  const second = pick(["secondTerm", "Second Term", "second"]);
  const third = pick(["thirdTerm", "Third Term", "third"]);

  const toResult = (raw, label, termName) => {
    if (!raw) {
      return {
        label,
        uploaded: false,
        academicYear: academic.academicYear || "—",
        term: termName,
        subjects: [],
      };
    }

    const subjects = raw.subjects || raw.scores || [];
    const uploaded =
      raw.uploaded === true ||
      raw.isPublished === true ||
      subjects.length > 0;

    return {
      label,
      uploaded,
      academicYear: raw.academicYear || academic.academicYear || "—",
      term: termName,
      subjects,
      average: raw.average || raw.terminalAverage,
    };
  };

  return {
    first: toResult(first, "First Term Result", "First Term"),
    second: toResult(second, "Second Term Result", "Second Term"),
    third: toResult(third, "Third Term / Annual Report", "Third Term"),
  };
}

// ====================== HEADER ======================

function StudentHeader({ student, academicYear }) {
  return (
    <header className="student-header">
      <div className="student-brand">
        <div className="student-brand-mark">OT</div>
        <div>
          <strong>O'lak Triumph School</strong>
          <span>Student Portal</span>
        </div>
      </div>

      <div className="student-header-right">
        <span className="student-session">
          {academicYear || "Current"} Academic Session
        </span>

        <div className="student-mini-avatar">
          {student?.profileImage ? (
            <img src={student.profileImage} alt="" />
          ) : (
            initials(student?.name || "ST")
          )}
        </div>

        <button
          className="secondary-button student-logout-button"
          type="button"
          onClick={() => {
            logout();
            navigateTo("/student/login");
          }}
        >
          Log out
        </button>
      </div>
    </header>
  );
}

// ====================== PERFORMANCE GRAPH ======================

function PerformanceGraph({ performance = [] }) {
  const width = 520;
  const height = 190;
  const left = 36;
  const bottom = 150;
  const chartWidth = 440;
  const chartHeight = 125;

  if (!performance.length) {
    return (
      <div className="performance-chart">
        <p className="chart-note">No performance data available yet.</p>
      </div>
    );
  }

  const points = performance.map((item, index) => ({
    ...item,
    x: left + (index * chartWidth) / Math.max(performance.length - 1, 1),
    y: bottom - (item.score / 100) * chartHeight,
  }));

  const line = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="performance-chart">
      <div className="chart-legend">
        <span />
        Average score (%)
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Academic performance across terms"
      >
        {[0, 25, 50, 75, 100].map((value) => {
          const y = bottom - (value / 100) * chartHeight;
          return (
            <g key={value}>
              <line
                x1={left}
                x2={left + chartWidth}
                y1={y}
                y2={y}
                className="chart-grid"
              />
              <text x="4" y={y + 4} className="chart-axis-label">
                {value}
              </text>
            </g>
          );
        })}

        <polyline points={line} className="chart-line" />

        {points.map((point) => (
          <g key={point.term}>
            <circle cx={point.x} cy={point.y} r="5" className="chart-point" />
            <text
              x={point.x}
              y={point.y - 13}
              textAnchor="middle"
              className="chart-value"
            >
              {point.score}%
            </text>
            <text
              x={point.x}
              y="177"
              textAnchor="middle"
              className="chart-axis-label"
            >
              {point.term} Term
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ====================== PDF DOWNLOAD ======================

function downloadResultPDF(student, result, studentsInClass = "—") {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const summary = getResultSummary(result, student.currentClass);
  const adminComment = getAutomaticAdminComment(summary.terminalAverage);
  const yearTutorComment = getAutomaticYearTutorComment(summary.terminalAverage);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("O'lak Triumph School", pageWidth / 2, 20, { align: "center" });

  pdf.setFontSize(13);
  pdf.text(result.term + " Result", pageWidth / 2, 30, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);

  const studentLines = [
    `Student: ${student.name}`,
    `Admission Number: ${student.admissionNumber}`,
    `Class: ${formatClass(student)}`,
    `Academic Year: ${result.academicYear}`,
    `No. in Class: ${studentsInClass}`,
  ];

  studentLines.forEach((line, index) => {
    pdf.text(line, 16, 43 + index * 7);
  });

  let y = 84;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text("Subject", 16, y);
  pdf.text("CA", 83, y);
  pdf.text("Exam", 99, y);
  pdf.text("Percentage", 113, y);
  pdf.text("Grade", 143, y);
  pdf.text("Remark", 160, y);
  pdf.line(16, y + 3, pageWidth - 16, y + 3);

  pdf.setFont("helvetica", "normal");

  summary.subjects.forEach((subject) => {
    y += 10;
    if (y > 260) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(String(subject.name).slice(0, 28), 16, y);
    pdf.text(String(subject.ca), 83, y);
    pdf.text(String(subject.exam), 99, y);
    pdf.text(`${subject.percentage.toFixed(2)}%`, 113, y);
    pdf.text(subject.grade, 143, y);
    pdf.text(String(subject.remark || "").slice(0, 18), 160, y);
  });

  y += 10;
  if (y > 230) {
    pdf.addPage();
    y = 20;
  }

  pdf.line(16, y - 5, pageWidth - 16, y - 5);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text(`Total: ${summary.totalPercentage.toFixed(2)}%`, 16, y);
  y += 9;
  pdf.text(`Subjects Offered: ${summary.subjectsOffered}`, 16, y);
  y += 12;
  pdf.setFontSize(11);
  pdf.text(`Terminal Average: ${summary.terminalAverage.toFixed(2)}%`, 16, y);
  y += 12;

  pdf.setFontSize(9);
  pdf.text("Admin's Comment", 16, y);
  y += 6;
  pdf.setFont("helvetica", "normal");
  const adminLines = pdf.splitTextToSize(adminComment, pageWidth - 32);
  pdf.text(adminLines, 16, y);
  y += adminLines.length * 5 + 8;

  pdf.setFont("helvetica", "bold");
  pdf.text("Year Tutor's Comment", 16, y);
  y += 6;
  pdf.setFont("helvetica", "normal");
  const tutorLines = pdf.splitTextToSize(yearTutorComment, pageWidth - 32);
  pdf.text(tutorLines, 16, y);
  y += tutorLines.length * 5 + 8;

  pdf.setFont("helvetica", "bold");
  pdf.text(`Subjects Recorded: ${summary.subjectsOffered}`, 16, y);

  pdf.save(
    `${student.admissionNumber}-${String(result.term).replaceAll(" ", "-")}.pdf`
  );
}

// ====================== PROFILE PAGE ======================

function ProfilePage({ student, results, performance, academicYear }) {
  const details = [
    ["Full name", student.name],
    ["Admission number", student.admissionNumber],
    ["Current class", formatClass(student)],
    ["Gender", student.gender],
    ["Date of birth", formatDate(student.dateOfBirth)],
    ["Address", student.address],
    ["Phone number", student.phone],
    ["Guardian's name", student.guardianName],
    ["Guardian's phone", student.guardianPhone],
    ["Email address", student.email],
  ];

  return (
    <main className="student-main">
      <div className="student-welcome">
        <div>
          <p className="eyebrow">STUDENT OVERVIEW</p>
          <h1>Welcome, {student.name?.split(" ")[0]}</h1>
          <p>Here is your profile and academic overview.</p>
        </div>
        <span className="class-pill">{formatClass(student)}</span>
      </div>

      <section className="student-profile-card">
        <div className="profile-identity">
          <div className="student-large-avatar">
            {student.profileImage ? (
              <img src={student.profileImage} alt={student.name} />
            ) : (
              initials(student.name)
            )}
          </div>
          <div>
            <h2>{student.name}</h2>
            <p>{student.admissionNumber}</p>
            <span className="profile-status">
              <i />
              {(student.status || "Active").replace(/^\w/, (c) => c.toUpperCase())}{" "}
              Student
            </span>
          </div>
        </div>

        <div className="profile-details">
          {details.map(([label, value]) => (
            <div className="profile-detail" key={label}>
              <span>{label}</span>
              <strong>{value || "Not provided"}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="student-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ACADEMIC RECORDS</p>
            <h2>Term Results</h2>
          </div>
          <span className="section-caption">
            Select a term to view your report
          </span>
        </div>

        <div className="term-result-grid">
          {Object.entries(results).map(([key, result]) => (
            <button
              className={`term-result-card ${
                !result.uploaded ? "term-result-unavailable" : ""
              }`}
              key={key}
              onClick={() => {
                if (result.uploaded) navigateTo(`/student/results/${key}`);
              }}
              disabled={!result.uploaded}
              type="button"
            >
              <span className="term-icon">▤</span>
              <span className="term-card-copy">
                <strong>{result.label}</strong>
                <small>
                  {result.uploaded
                    ? "View result and download PDF"
                    : "Yet to be uploaded"}
                </small>
              </span>
              <span className="term-arrow">{result.uploaded ? "→" : "—"}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="student-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR PROGRESS</p>
            <h2>Academic Performance</h2>
          </div>
          <span className="section-caption">Average score by term</span>
        </div>
        <div className="student-panel">
          <PerformanceGraph performance={performance} />
        </div>
      </section>

      <section className="student-section attendance-section">
        <div>
          <p className="eyebrow">SCHOOL RECORD</p>
          <h2>Attendance</h2>
          <p>Attendance records will be available here in a future update.</p>
        </div>
        <button className="secondary-button" type="button" disabled>
          Coming later
        </button>
      </section>
    </main>
  );
}

// ====================== RESULT PAGE ======================

function ResultPage({ term, student, results, studentsInClass }) {
  const result = results[term];

  if (!result || !result.uploaded) {
    return (
      <main className="student-main">
        <button
          className="back-button"
          onClick={() => navigateTo("/student/dashboard")}
          type="button"
        >
          ← Back to profile
        </button>

        <div className="empty-result">
          <div className="empty-result-icon">▤</div>
          <h1>Yet to be uploaded</h1>
          <p>This result is not available yet. Please check again later.</p>
        </div>
      </main>
    );
  }

  const summary = getResultSummary(result, student.currentClass);
  const adminComment = getAutomaticAdminComment(summary.terminalAverage);
  const yearTutorComment = getAutomaticYearTutorComment(summary.terminalAverage);

  return (
    <main className="student-main">
      <button
        className="back-button"
        onClick={() => navigateTo("/student/dashboard")}
        type="button"
      >
        ← Back to profile
      </button>

      <div className="result-page-heading">
        <div>
          <p className="eyebrow">ACADEMIC REPORT</p>
          <h1>{result.label}</h1>
          <p>{result.academicYear}</p>
        </div>

        <button
          className="primary-button"
          onClick={() => downloadResultPDF(student, result, studentsInClass)}
          type="button"
        >
          ↓ Download PDF
        </button>
      </div>

      <section className="student-profile-card result-student-summary">
        <div>
          <span>Student</span>
          <strong>{student.name}</strong>
        </div>
        <div>
          <span>Admission number</span>
          <strong>{student.admissionNumber}</strong>
        </div>
        <div>
          <span>Class</span>
          <strong>{formatClass(student)}</strong>
        </div>
        <div>
          <span>No. in Class</span>
          <strong>{studentsInClass}</strong>
        </div>
      </section>

      <section className="student-panel result-table-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{result.term.toUpperCase()}</p>
            <h2>Subject Performance</h2>
          </div>
        </div>

        <div className="result-table-wrap">
          <table className="result-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>CA</th>
                <th>Exam</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              {summary.subjects.map((subject) => (
                <tr key={subject.name}>
                  <td>{subject.name}</td>
                  <td>{subject.ca}</td>
                  <td>{subject.exam}</td>
                  <td>{subject.percentage.toFixed(2)}%</td>
                  <td>
                    <span className="grade-pill">{subject.grade}</span>
                  </td>
                  <td>{subject.remark}</td>
                </tr>
              ))}

              <tr className="result-summary-row">
                <td colSpan="3">
                  <strong>Total</strong>
                </td>
                <td>
                  <strong>{summary.totalPercentage.toFixed(2)}%</strong>
                </td>
                <td colSpan="2" />
              </tr>

              <tr className="result-summary-row">
                <td colSpan="3">
                  <strong>Subjects Offered</strong>
                </td>
                <td>
                  <strong>{summary.subjectsOffered}</strong>
                </td>
                <td colSpan="2" />
              </tr>
            </tbody>
          </table>
        </div>

        <div className="result-comments-section">
          <div className="result-average">
            <span>Terminal Average</span>
            <strong>{summary.terminalAverage.toFixed(2)}%</strong>
          </div>

          <div className="result-comment">
            <strong>Admin's Comment</strong>
            <p title={adminComment}>{adminComment}</p>
          </div>

          <div className="result-comment">
            <strong>Year Tutor's Comment</strong>
            <p title={yearTutorComment}>{yearTutorComment}</p>
          </div>

          <div className="result-subjects-recorded">
            <span>Subjects Recorded</span>
            <strong>{summary.subjectsOffered}</strong>
          </div>
        </div>
      </section>
    </main>
  );
}

// ====================== MAIN ======================

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [academic, setAcademic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentPath = window.location.pathname;
  const resultPrefix = "/student/results/";
  const isResultPage = currentPath.startsWith(resultPrefix);
  const term = isResultPage
    ? currentPath.slice(resultPrefix.length).replace(/\/+$/, "")
    : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. My profile
        // Prefer /students/me — fall back to stored user if needed
        let me;
        try {
          const meRes = await api.get("/students/me");
          me = meRes.data.student || meRes.data;
        } catch {
          const stored = localStorage.getItem("user");
          me = stored ? JSON.parse(stored) : null;
        }

        if (!me) throw new Error("Profile not found");

        setStudent({
          id: me._id || me.id,
          name: me.name,
          admissionNumber: me.admissionNumber,
          currentClass: me.currentClass || me.className,
          department: me.department || "",
          gender: me.gender,
          dateOfBirth: me.dateOfBirth,
          address: me.address,
          phone: me.phone,
          guardianName: me.guardianName,
          guardianPhone: me.guardianPhone,
          email: me.email,
          profileImage: me.profileImage || "",
          status: me.status || "active",
        });

        // 2. Academic profile / results
        const id = me._id || me.id;
        try {
          const academicRes = await api.get(
            `/grades/student/${id}/academic-profile`
          );
          setAcademic(academicRes.data);
        } catch {
          // Optional: try alternate endpoint if your backend uses a different path
          setAcademic(null);
        }
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load your profile. Please log in again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="student-app">
        <div style={{ padding: 48, textAlign: "center" }}>
          Loading your portal...
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="student-app">
        <div style={{ padding: 48, textAlign: "center" }}>
          <p style={{ marginBottom: 16 }}>{error || "Profile not found"}</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              logout();
              navigateTo("/student/login");
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const results = buildTermResults(academic);
  const studentsInClass =
    academic?.classSize || academic?.noInClass || academic?.studentsInClass || "—";

  const performance = [];
  ["first", "second", "third"].forEach((key, index) => {
    const r = results[key];
    if (r?.uploaded) {
      const summary = getResultSummary(r, student.currentClass);
      const score =
        Number(r.average || r.terminalAverage || summary.terminalAverage || 0);
      if (score > 0) {
        performance.push({
          term: index === 0 ? "First" : index === 1 ? "Second" : "Third",
          score: Number(score.toFixed(1)),
        });
      }
    }
  });

  return (
    <div className="student-app">
      <StudentHeader
        student={student}
        academicYear={academic?.academicYear}
      />

      {isResultPage ? (
        <ResultPage
          term={term}
          student={student}
          results={results}
          studentsInClass={studentsInClass}
        />
      ) : (
        <ProfilePage
          student={student}
          results={results}
          performance={performance}
          academicYear={academic?.academicYear}
        />
      )}

      <footer className="student-footer">
        © {new Date().getFullYear()} O'lak Triumph School
      </footer>
    </div>
  );
}