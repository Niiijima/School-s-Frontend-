import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import api from "../api/axios";
import { logout } from "../api/auth";
import "./StudentDashboard.css";
import schoolLogo from "../assets/logo.jpeg";
import schoolStamp from "../assets/stamp.jpeg";

const CURRENT_ACADEMIC_YEAR = "2026/2027";

const DEFAULT_SESSIONS = ["2025/2026", "2026/2027"];

const SESSION_STORAGE_KEY = "studentAcademicYear";

function readStoredAcademicYear() {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored && /^\d{4}\/\d{4}$/.test(stored.trim())) {
      return stored.trim();
    }
  } catch {
    // ignore
  }
  return CURRENT_ACADEMIC_YEAR;
}

function writeStoredAcademicYear(year) {
  try {
    const clean = String(year || "").trim();
    if (/^\d{4}\/\d{4}$/.test(clean)) {
      localStorage.setItem(SESSION_STORAGE_KEY, clean);
    }
  } catch {
    // ignore
  }
}

const PDF_PURPLE = [88, 28, 135];
const PDF_LIGHT_PURPLE = [245, 237, 252];

const TERMS = [
  {
    key: "firstTerm",
    route: "first",
    label: "First Term Result",
    term: "First Term",
  },
  {
    key: "secondTerm",
    route: "second",
    label: "Second Term Result",
    term: "Second Term",
  },
  {
    key: "thirdTerm",
    route: "third",
    label: "Third Term / Annual Report",
    term: "Third Term",
  },
];

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function safeNumber(value) {
  return hasValue(value) && Number.isFinite(Number(value))
    ? Number(value)
    : null;
}

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
  const test1 = safeNumber(subject.test1);
  const test2 = safeNumber(subject.test2);
  const notes = safeNumber(subject.notes);
  const oral = safeNumber(subject.oral);
  const test3 = safeNumber(subject.test3);
  const assignment = safeNumber(subject.assignment);

  const examValue =
    safeNumber(subject.exam) ??
    safeNumber(subject.examination) ??
    safeNumber(subject.examScore) ??
    safeNumber(subject.examMark) ??
    safeNumber(subject.examinationScore);

  const caDirect =
    safeNumber(subject.ca) ??
    safeNumber(subject.caTotal) ??
    safeNumber(subject.continuousAssessment);

  const storedTotal =
    safeNumber(subject.totalScore) ??
    safeNumber(subject.total) ??
    safeNumber(subject.grandTotal);

  const newCAComplete = [test1, test2, notes, oral].every((v) => v !== null);
  const legacyCAComplete = [test1, test2, test3, assignment].every(
    (v) => v !== null
  );
  const hasNewParts = [notes, oral].some((v) => v !== null);
  const hasLegacyParts = [test3, assignment].some((v) => v !== null);

  let ca = null;

  if (newCAComplete) {
    ca = Number(test1) + Number(test2) + Number(notes) + Number(oral);
  } else if (legacyCAComplete) {
    ca =
      Number(test1) + Number(test2) + Number(test3) + Number(assignment);
  } else if (caDirect !== null) {
    ca = caDirect;
  } else if (subject.caSubmitted === true || hasNewParts) {
    if ([test1, test2, notes, oral].some((v) => v !== null)) {
      ca =
        Number(test1 || 0) +
        Number(test2 || 0) +
        Number(notes || 0) +
        Number(oral || 0);
    }
  } else if (hasLegacyParts) {
    ca =
      Number(test1 || 0) +
      Number(test2 || 0) +
      Number(test3 || 0) +
      Number(assignment || 0);
  }

  // Exam recovery (including older rows that only stored total)
  let exam = null;
  if (examValue !== null) {
    exam = examValue;
  } else if (subject.examSubmitted === true) {
    exam = 0;
  } else if (ca !== null && storedTotal !== null) {
    const derived = Number(storedTotal) - Number(ca);
    if (Number.isFinite(derived) && derived >= 0) {
      exam = derived;
    }
  }

  const examStatus = String(subject.examStatus || "").toLowerCase();
  const examNotTaken =
    examStatus === "not taken" ||
    examStatus === "nottaken" ||
    subject.examNotTaken === true;

  let total = null;
  let complete = false;

  if (ca !== null && exam !== null) {
    total = storedTotal !== null ? storedTotal : ca + exam;
    complete = true;
  } else if (storedTotal !== null) {
    total = storedTotal;
    complete = true;
    if (ca === null && exam !== null) {
      const maybeCa = Number(storedTotal) - Number(exam);
      if (Number.isFinite(maybeCa) && maybeCa >= 0 && maybeCa <= 40) {
        ca = maybeCa;
      }
    }
  }

  const percentage = total !== null ? Number(Number(total).toFixed(2)) : null;

  const calculatedGrade =
    percentage !== null
      ? getGradeAndRemark(percentage, currentClass)
      : { grade: null, remark: null };

  return {
    ...subject,
    name:
      subject.name ||
      subject.subjectName ||
      subject.subject ||
      "Subject",
    test1,
    test2,
    notes,
    oral,
    test3,
    assignment,
    ca,
    caSubmitted: ca !== null,
    exam,
    examSubmitted: exam !== null,
    examNotTaken,
    total,
    percentage,
    grade: complete
      ? subject.grade || calculatedGrade.grade
      : null,
    remark: complete
      ? subject.remark || calculatedGrade.remark
      : null,
    complete,
  };
}

function getResultSummary(result, currentClass) {
  const subjects = (result.subjects || []).map((subject) =>
    getSubjectResult(subject, currentClass)
  );

  const completedSubjects = subjects.filter((subject) => subject.complete);

  const totalScore = completedSubjects.reduce(
    (sum, subject) => sum + Number(subject.total || 0),
    0
  );

  const totalMaximumScore = completedSubjects.length * 100;

  const terminalAverage =
    completedSubjects.length > 0
      ? completedSubjects.reduce(
          (sum, subject) => sum + Number(subject.percentage || 0),
          0
        ) / completedSubjects.length
      : null;

  return {
    subjects,
    totalScore,
    totalMaximumScore,
    subjectsOffered: subjects.length,
    completedSubjects: completedSubjects.length,
    pendingSubjects: subjects.length - completedSubjects.length,
    terminalAverage:
      terminalAverage !== null ? Number(terminalAverage.toFixed(2)) : null,
  };
}

function getAutomaticYearTutorComment(averageScore) {
  if (averageScore === null) {
    return "Your result is incomplete. Continue working hard while outstanding scores are being processed.";
  }

  if (averageScore >= 75) {
    return "An exceptionally brilliant performance. Keep maintaining this golden standard.";
  }

  if (averageScore >= 65) {
    return "A highly commendable result. With this consistency, top honours are within reach next term.";
  }

  if (averageScore >= 50) {
    return "A good performance, but you possess the capability to attain higher credit marks.";
  }

  if (averageScore >= 40) {
    return "Passable terminal record. Step up your study habits and work towards better results.";
  }

  return "An unsatisfactory performance. Intensive remedial study and closer supervision are recommended.";
}

function getAutomaticAdminComment(averageScore) {
  if (averageScore === null) {
    return "The result is incomplete. Outstanding assessments should be resolved before a final academic assessment is made.";
  }

  if (averageScore >= 75) {
    return "Outstanding academic excellence. A proud reflection of hard work. Keep it up!";
  }

  if (averageScore >= 65) {
    return "Very impressive progress. Promising results showing dedication to studies.";
  }

  if (averageScore >= 50) {
    return "A satisfactory performance. Focus more on weak areas to secure higher marks.";
  }

  if (averageScore >= 40) {
    return "Fair trial, but there is room for improvement. Double your efforts.";
  }

  return "Performance is below the expected standard. A renewed commitment to academic work is required.";
}

function initials(name = "") {
  return String(name)
    .trim()
    .split(/\s+/)
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

  if (student.department) {
    return `${student.currentClass || ""} ${student.department}`.trim();
  }

  return student.currentClass || "—";
}

function formatDate(value) {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function safeFileName(value) {
  return String(value || "Student")
    .trim()
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^\w-]/g, "");
}

async function loadImageForPDF(imageUrl, baseUrl = window.location.origin) {
  if (!imageUrl || typeof imageUrl !== "string") return null;

  let objectUrl = null;

  try {
    const resolvedUrl = /^(https?:|data:|blob:)/i.test(imageUrl)
      ? imageUrl
      : new URL(imageUrl, baseUrl).href;

    let imageSource = resolvedUrl;

    if (!/^(data:|blob:)/i.test(resolvedUrl)) {
      const response = await fetch(resolvedUrl, {
        credentials: "same-origin",
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`Image request failed: ${response.status}`);
      }

      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);
      imageSource = objectUrl;
    }

    const image = new Image();

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("Image could not be decoded."));
      image.src = imageSource;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not create image canvas.");
    }

    context.drawImage(image, 0, 0);

    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Unable to load PDF image:", imageUrl, error);
    return null;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

function pickTermPayload(subject, termKey) {
  // Nested shape: { firstTerm: { test1, exam, ... } }
  if (subject[termKey] && typeof subject[termKey] === "object") {
    return subject[termKey];
  }

  // Alternate nest keys
  const altKeys = {
    firstTerm: ["first", "First Term", "first_term"],
    secondTerm: ["second", "Second Term", "second_term"],
    thirdTerm: ["third", "Third Term", "third_term"],
  };

  for (const key of altKeys[termKey] || []) {
    if (subject[key] && typeof subject[key] === "object") {
      return subject[key];
    }
  }

  // Flat shape from term-specific API call: scores live on the subject itself
  const scoreKeys = [
    "test1",
    "test2",
    "test3",
    "notes",
    "oral",
    "assignment",
    "ca",
    "exam",
    "totalScore",
    "total",
    "grade",
    "remark",
    "caSubmitted",
    "examSubmitted",
    "percentage",
  ];

  const hasFlatScores = scoreKeys.some(
    (key) => subject[key] !== null && subject[key] !== undefined && subject[key] !== ""
  );

  if (hasFlatScores) {
    const payload = {};
    scoreKeys.forEach((key) => {
      if (subject[key] !== undefined) payload[key] = subject[key];
    });
    return payload;
  }

  return null;
}

function mergeTermAcademicResponses(responses, fallbackYear = CURRENT_ACADEMIC_YEAR) {
  const mergedSubjects = new Map();

  const termKeyFromLabel = (term) => {
    const normalized = String(term || "").trim().toLowerCase();
    if (normalized.startsWith("first")) return "firstTerm";
    if (normalized.startsWith("second")) return "secondTerm";
    if (normalized.startsWith("third")) return "thirdTerm";
    return {
      "First Term": "firstTerm",
      "Second Term": "secondTerm",
      "Third Term": "thirdTerm",
      first: "firstTerm",
      second: "secondTerm",
      third: "thirdTerm",
      firstTerm: "firstTerm",
      secondTerm: "secondTerm",
      thirdTerm: "thirdTerm",
    }[term];
  };

  responses.forEach(({ data, term }) => {
    if (!data) return;

    const termKey = termKeyFromLabel(term);
    if (!termKey) return;

    // Prefer reportCardSummary; fall back to subjects / grades arrays
    const rows =
      (Array.isArray(data.reportCardSummary) && data.reportCardSummary) ||
      (Array.isArray(data.subjects) && data.subjects) ||
      (Array.isArray(data.grades) && data.grades) ||
      (Array.isArray(data.results) && data.results) ||
      [];

    if (!rows.length) return;

    rows.forEach((subject) => {
      const subjectKey =
        subject.subjectCode ||
        subject.subjectName ||
        subject.name ||
        subject.subject ||
        subject._id ||
        subject.id;

      if (!subjectKey) return;

      if (!mergedSubjects.has(subjectKey)) {
        mergedSubjects.set(subjectKey, {
          subjectName:
            subject.subjectName ||
            subject.name ||
            subject.subject ||
            "Subject",
          subjectCode: subject.subjectCode || subject.code || "",
        });
      }

      const existing = mergedSubjects.get(subjectKey);
      const payload = pickTermPayload(subject, termKey);

      if (payload) {
        existing[termKey] = {
          ...payload,
          name:
            payload.name ||
            subject.subjectName ||
            subject.name ||
            existing.subjectName,
          subjectName:
            payload.subjectName ||
            subject.subjectName ||
            subject.name ||
            existing.subjectName,
          subjectCode:
            payload.subjectCode ||
            subject.subjectCode ||
            existing.subjectCode,
        };
      }
    });
  });

  const firstResponse = responses.find((item) => item.data)?.data;

  const classSizeResponse = responses
    .map((item) => item.data)
    .find(
      (data) =>
        data?.classSize != null ||
        data?.noInClass != null ||
        data?.studentsInClass != null
    );

  return {
    academicYear:
      firstResponse?.academicYear || fallbackYear || CURRENT_ACADEMIC_YEAR,
    reportCardSummary: Array.from(mergedSubjects.values()),
    termResponses: responses,
    classSize:
      classSizeResponse?.classSize ??
      classSizeResponse?.noInClass ??
      classSizeResponse?.studentsInClass ??
      null,
  };
}

function buildTermResults(academic, sessionYear = CURRENT_ACADEMIC_YEAR) {
  const year =
    academic?.academicYear || sessionYear || CURRENT_ACADEMIC_YEAR;

  const empty = {
    first: {
      label: "First Term Result",
      uploaded: false,
      subjects: [],
      term: "First Term",
      academicYear: year,
    },
    second: {
      label: "Second Term Result",
      uploaded: false,
      subjects: [],
      term: "Second Term",
      academicYear: year,
    },
    third: {
      label: "Third Term / Annual Report",
      uploaded: false,
      subjects: [],
      term: "Third Term",
      academicYear: year,
    },
  };

  if (!academic) return empty;

  const reportSubjects = academic.reportCardSummary || [];

  if (!reportSubjects.length) return empty;

  const getTermSubjects = (termKey) =>
    reportSubjects
      .filter((subject) => subject[termKey])
      .map((subject) => ({
        ...subject[termKey],
        name: subject.subjectName,
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
      }));

  const firstSubjects = getTermSubjects("firstTerm");
  const secondSubjects = getTermSubjects("secondTerm");
  const thirdSubjects = getTermSubjects("thirdTerm");

  return {
    first: {
      label: "First Term Result",
      uploaded: firstSubjects.length > 0,
      academicYear: year,
      term: "First Term",
      subjects: firstSubjects,
    },
    second: {
      label: "Second Term Result",
      uploaded: secondSubjects.length > 0,
      academicYear: year,
      term: "Second Term",
      subjects: secondSubjects,
    },
    third: {
      label: "Third Term / Annual Report",
      uploaded: thirdSubjects.length > 0,
      academicYear: year,
      term: "Third Term",
      subjects: thirdSubjects,
    },
  };
}

function StudentHeader({
  student,
  academicYear,
  availableSessions = [],
  sessionMenuOpen,
  onToggleSessionMenu,
  onSelectSession,
}) {
  const sessions =
    availableSessions.length > 0
      ? availableSessions
      : [academicYear || CURRENT_ACADEMIC_YEAR];

  return (
    <header className="student-header">
      <div className="student-brand">
        <img className="student-brand-logo" src={schoolLogo} alt="School logo" />

        <div>
          <strong>O'lak Triumph School</strong>
          <span>Student Portal</span>
        </div>
      </div>

      <div className="student-header-right">
        <div className="student-session-picker" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="student-session-trigger"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSessionMenu?.();
            }}
            aria-haspopup="listbox"
            aria-expanded={!!sessionMenuOpen}
          >
            <span className="student-session-dot" />
            <span className="student-session-text">
              {academicYear || CURRENT_ACADEMIC_YEAR} Academic Session
            </span>
            <span
              className={`student-session-chevron ${
                sessionMenuOpen ? "open" : ""
              }`}
            >
              ›
            </span>
          </button>

          {sessionMenuOpen ? (
            <div
              className="student-session-menu"
              role="listbox"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="student-session-menu-title">Academic sessions</p>
              <p className="student-session-menu-hint">
                Switch session to view results from another academic year.
              </p>
              <div className="student-session-list">
                {sessions.map((year) => (
                  <button
                    key={year}
                    type="button"
                    role="option"
                    className={`student-session-option ${
                      year === academicYear ? "active" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectSession?.(year);
                    }}
                  >
                    <span>{year}</span>
                    {year === academicYear ? <span>✓</span> : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

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

      <svg viewBox={`0 0 ${width} ${height}`} role="img">
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

async function downloadResultPDF(student, result, studentsInClass = "—") {
  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;

  const summary = getResultSummary(result, student.currentClass);

  const adminComment = getAutomaticAdminComment(summary.terminalAverage);
  const yearTutorComment = getAutomaticYearTutorComment(
    summary.terminalAverage
  );

  let backendOrigin = window.location.origin;

  try {
    if (api.defaults.baseURL) {
      backendOrigin = new URL(
        api.defaults.baseURL,
        window.location.origin
      ).origin;
    }
  } catch (error) {
    console.warn(error);
  }

  const [logoData, profileImageData, stampData] = await Promise.all([
    loadImageForPDF(schoolLogo, window.location.origin),
    loadImageForPDF(student.profileImage, backendOrigin),
    loadImageForPDF(schoolStamp, window.location.origin),
  ]);

  if (logoData) {
    try {
      pdf.addImage(logoData, "PNG", margin, 8, 18, 18);
    } catch (error) {
      console.warn(error);
    }
  }

  if (profileImageData) {
    try {
      pdf.addImage(
        profileImageData,
        "PNG",
        pageWidth - margin - 18,
        8,
        18,
        18
      );
    } catch (error) {
      console.warn(error);
    }
  }

  pdf.setTextColor(...PDF_PURPLE);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);

  pdf.text("O'LAK TRIUMPH SCHOOL", pageWidth / 2, 16, {
    align: "center",
  });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(50, 50, 50);

  pdf.text(
    "12 Oseni Shotonwa Street, Ebute, Ikorodu, Lagos",
    pageWidth / 2,
    19,
    { align: "center" }
  );

  pdf.setFontSize(9);

  pdf.text("REPORT SHEET FOR SECONDARY SCHOOL", pageWidth / 2, 23, {
    align: "center",
  });

  let y = 29;

  pdf.setDrawColor(...PDF_PURPLE);
  pdf.setLineWidth(0.4);
  pdf.rect(margin, y, pageWidth - margin * 2, 21);

  pdf.setFontSize(7.5);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(40, 40, 40);

  pdf.text(
    `SESSION: ${result.academicYear || CURRENT_ACADEMIC_YEAR}`,
    margin + 2,
    y + 5
  );

  pdf.text(
    `TERM: ${String(result.term || "").toUpperCase()}`,
    margin + 76,
    y + 5
  );

  pdf.text(`CLASS: ${formatClass(student)}`, margin + 132, y + 5);

  pdf.text(
    `STUDENT NAME: ${String(student.name || "").toUpperCase()}`,
    margin + 2,
    y + 11
  );

  pdf.text(
    `SEX: ${String(student.gender || "—").toUpperCase()}`,
    margin + 132,
    y + 11
  );

  pdf.text(
    `STUDENT NO: ${student.admissionNumber || "—"}`,
    margin + 2,
    y + 17
  );

  pdf.text(`NO. IN CLASS: ${studentsInClass ?? "—"}`, margin + 132, y + 17);

  y = 57;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...PDF_PURPLE);

  pdf.text("PERFORMANCE IN SUBJECTS", pageWidth / 2, y, {
    align: "center",
  });

  y = 61;

  const tableWidth = pageWidth - margin * 2;

  const columns = [
    { label: "SUBJECT", x: margin + 2 },
    { label: "CA / 40", x: margin + 73 },
    { label: "EXAM / 60", x: margin + 94 },
    { label: "TOTAL", x: margin + 119 },
    { label: "GRADE", x: margin + 141 },
    { label: "REMARK", x: margin + 158 },
  ];

  pdf.setFillColor(...PDF_PURPLE);
  pdf.rect(margin, y, tableWidth, 8, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6.5);
  pdf.setTextColor(255, 255, 255);

  columns.forEach((column) => {
    pdf.text(column.label, column.x, y + 5);
  });

  y += 8;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(40, 40, 40);

  summary.subjects.forEach((subject, index) => {
    if (y > pageHeight - 45) {
      pdf.addPage();
      y = 20;
    }

    if (index % 2 === 0) {
      pdf.setFillColor(...PDF_LIGHT_PURPLE);
      pdf.rect(margin, y, tableWidth, 8, "F");
    }

    pdf.text(
      String(subject.name).toUpperCase().slice(0, 30),
      columns[0].x,
      y + 5
    );

    pdf.text(
      subject.caSubmitted ? `${subject.ca}/40` : "Pending",
      columns[1].x,
      y + 5
    );

    pdf.text(
      subject.examSubmitted
        ? `${subject.exam}/60`
        : subject.examNotTaken
          ? "Not Taken"
          : "Pending",
      columns[2].x,
      y + 5
    );

    pdf.text(
      subject.total !== null ? String(subject.total) : "Pending",
      columns[3].x,
      y + 5
    );

    pdf.text(subject.grade || "—", columns[4].x, y + 5);

    pdf.text(String(subject.remark || "—").slice(0, 15), columns[5].x, y + 5);

    y += 8;
  });

  y += 4;

  if (y > pageHeight - 65) {
    pdf.addPage();
    y = 20;
  }

  pdf.setDrawColor(...PDF_PURPLE);
  pdf.line(margin, y, pageWidth - margin, y);

  y += 7;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(40, 40, 40);

  pdf.text("TOTAL OF COMPLETED SUBJECTS:", margin + 2, y);
  pdf.text(summary.totalScore.toFixed(2), margin + 78, y);

  y += 6;

  pdf.text("SUBJECTS OFFERED:", margin + 2, y);
  pdf.text(String(summary.subjectsOffered), margin + 78, y);

  y += 6;

  pdf.text("COMPLETED SUBJECTS:", margin + 2, y);
  pdf.text(String(summary.completedSubjects), margin + 78, y);

  y += 6;

  pdf.text("PENDING SUBJECTS:", margin + 2, y);
  pdf.text(String(summary.pendingSubjects), margin + 78, y);

  y += 6;

  pdf.setTextColor(...PDF_PURPLE);
  pdf.text("AVERAGE OF COMPLETED SUBJECTS:", margin + 2, y);

  pdf.text(
    summary.terminalAverage !== null
      ? `${summary.terminalAverage.toFixed(2)}%`
      : "Pending",
    margin + 78,
    y
  );

  y += 11;

  if (y > pageHeight - 65) {
    pdf.addPage();
    y = 20;
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...PDF_PURPLE);

  pdf.text("RATING", pageWidth / 2, y, { align: "center" });

  y += 4;

  const ratingWidth = pageWidth - margin * 2;
  const cellWidth = ratingWidth / 6;
  const ratingHeight = 14;

  const ranges = [
    "70-100",
    "60-69.99",
    "50-59.99",
    "45-49.99",
    "40-44.99",
    "0-39.99",
  ];

  const keys = ["A", "B", "C", "D", "E", "F"];

  pdf.setDrawColor(...PDF_PURPLE);
  pdf.setLineWidth(0.3);
  pdf.setFillColor(...PDF_LIGHT_PURPLE);

  pdf.rect(margin, y, ratingWidth, ratingHeight / 2, "FD");

  pdf.setFillColor(255, 255, 255);
  pdf.rect(margin, y + ratingHeight / 2, ratingWidth, ratingHeight / 2, "FD");

  for (let index = 0; index <= 6; index++) {
    pdf.line(
      margin + index * cellWidth,
      y,
      margin + index * cellWidth,
      y + ratingHeight
    );
  }

  pdf.line(margin, y + ratingHeight / 2, margin + ratingWidth, y + ratingHeight / 2);

  pdf.setFontSize(6.5);
  pdf.setTextColor(...PDF_PURPLE);

  ranges.forEach((label, index) => {
    pdf.text(label, margin + index * cellWidth + cellWidth / 2, y + 4.5, {
      align: "center",
    });
  });

  pdf.setFontSize(9);
  pdf.setTextColor(40, 40, 40);

  keys.forEach((label, index) => {
    pdf.text(
      label,
      margin + index * cellWidth + cellWidth / 2,
      y + ratingHeight - 2.5,
      { align: "center" }
    );
  });

  y += ratingHeight + 9;

  if (y > pageHeight - 55) {
    pdf.addPage();
    y = 20;
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...PDF_PURPLE);

  pdf.text("Teacher's Comment:", margin + 2, y);

  y += 4;

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(50, 50, 50);

  const tutorLines = pdf.splitTextToSize(
    yearTutorComment,
    pageWidth - margin * 2
  );

  pdf.text(tutorLines, margin + 2, y);

  y += tutorLines.length * 3.8 + 5;

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...PDF_PURPLE);

  pdf.text("Principal/Headmaster's Comment:", margin + 2, y);

  y += 4;

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(50, 50, 50);

  const adminLines = pdf.splitTextToSize(
    adminComment,
    pageWidth - margin * 2
  );

  pdf.text(adminLines, margin + 2, y);

  y += adminLines.length * 3.8 + 8;

  const stampWidth = 28;
  let stampHeight = 18;

  if (stampData) {
    try {
      const properties = pdf.getImageProperties(stampData);

      stampHeight = Math.min(
        stampWidth / (properties.width / properties.height),
        22
      );
    } catch {
      stampHeight = 18;
    }
  }

  if (y + stampHeight + 16 > pageHeight - 10) {
    pdf.addPage();
    y = 20;
  } else {
    y += 5;
  }

  const signatureWidth = 55;
  const signatureX = pageWidth - margin - signatureWidth;
  const signatureY = y + (stampData ? stampHeight + 2 : 0) + 4;

  const stampX = signatureX + (signatureWidth - stampWidth) / 2;
  const stampY = signatureY - stampHeight - 1;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...PDF_PURPLE);

  pdf.text("Head Teacher", signatureX + signatureWidth / 2, stampY - 3, {
    align: "center",
  });

  if (stampData) {
    try {
      pdf.addImage(
        stampData,
        "PNG",
        stampX,
        stampY,
        stampWidth,
        stampHeight
      );
    } catch (error) {
      console.warn(error);
    }
  }

  pdf.setDrawColor(...PDF_PURPLE);
  pdf.setLineWidth(0.5);

  pdf.line(signatureX, signatureY, signatureX + signatureWidth, signatureY);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(100, 100, 100);

  pdf.text(
    "Signature / Stamp",
    signatureX + signatureWidth / 2,
    signatureY + 4,
    { align: "center" }
  );

  const studentFileName = safeFileName(student.name);
  const admissionNumber = safeFileName(student.admissionNumber);
  const termName = safeFileName(result.term || "Result");

  const fileName = [studentFileName, admissionNumber, termName, "Result"]
    .filter(Boolean)
    .join("_");

  pdf.save(`${fileName}.pdf`);
}

function ProfilePage({ student, results, performance }) {
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
              {(student.status || "Active").replace(/^\w/, (c) =>
                c.toUpperCase()
              )}{" "}
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
              key={key}
              type="button"
              className={`term-result-card ${
                !result.uploaded ? "term-result-unavailable" : ""
              }`}
              disabled={!result.uploaded}
              onClick={() => {
                if (result.uploaded) {
                  navigateTo(`/student/results/${key}`);
                }
              }}
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

              <span className="term-arrow">
                {result.uploaded ? "→" : "—"}
              </span>
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
          <p>
            Attendance records will be available here in a future update.
          </p>
        </div>

        <button className="secondary-button" type="button" disabled>
          Coming later
        </button>
      </section>
    </main>
  );
}

function ResultPage({ term, student, results, studentsInClass }) {
  const result = results[term];

  if (!result || !result.uploaded) {
    return (
      <main className="student-main">
        <button
          className="back-button"
          type="button"
          onClick={() => navigateTo("/student/dashboard")}
        >
          ← Back to profile
        </button>

        <div className="empty-result">
          <div className="empty-result-icon">▤</div>
          <h1>Yet to be uploaded</h1>
          <p>
            This result is not available yet. Please check again later.
          </p>
        </div>
      </main>
    );
  }

  const summary = getResultSummary(result, student.currentClass);

  const adminComment = getAutomaticAdminComment(summary.terminalAverage);
  const yearTutorComment = getAutomaticYearTutorComment(
    summary.terminalAverage
  );

  return (
    <main className="student-main">
      <button
        className="back-button"
        type="button"
        onClick={() => navigateTo("/student/dashboard")}
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
          type="button"
          onClick={() =>
            downloadResultPDF(student, result, studentsInClass)
          }
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

        <div>
          <span>Term</span>
          <strong>{result.term}</strong>
        </div>

        <div>
          <span>Session</span>
          <strong>{result.academicYear}</strong>
        </div>
      </section>

      <section className="student-panel result-table-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PERFORMANCE IN SUBJECTS</p>
            <h2>{result.term}</h2>
          </div>
        </div>

        <div className="result-table-wrap">
          <table className="result-table">
            <thead>
              <tr>
                <th>Subjects</th>
                <th>CA / 40</th>
                <th>Exam / 60</th>
                <th>Total / 100</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>Remark</th>
              </tr>
            </thead>

            <tbody>
              {summary.subjects.map((subject, index) => (
                <tr
                  key={
                    subject._id ||
                    subject.subjectCode ||
                    `${subject.name}-${index}`
                  }
                >
                  <td>{String(subject.name).toUpperCase()}</td>

                  <td>
                    {subject.caSubmitted
                      ? `${subject.ca}/40`
                      : "Yet to be uploaded"}
                  </td>

                  <td>
                    {subject.examSubmitted
                      ? `${subject.exam}/60`
                      : subject.examNotTaken
                        ? "Not Taken"
                        : "Yet to be uploaded"}
                  </td>

                  <td>
                    {subject.total !== null
                      ? `${subject.total}/100`
                      : "Pending"}
                  </td>

                  <td>
                    {subject.percentage !== null
                      ? `${subject.percentage.toFixed(2)}%`
                      : "Pending"}
                  </td>

                  <td>
                    {subject.grade ? (
                      <span className="grade-pill">{subject.grade}</span>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>{subject.remark || "—"}</td>
                </tr>
              ))}

              <tr className="result-summary-row">
                <td colSpan={2}>
                  <strong>TOTAL OF COMPLETED SUBJECTS</strong>
                </td>

                <td colSpan={2}>
                  <strong>{summary.totalScore.toFixed(2)}</strong>
                </td>

                <td colSpan={3} />
              </tr>

              <tr className="result-summary-row">
                <td colSpan={2}>
                  <strong>SUBJECTS OFFERED</strong>
                </td>

                <td>
                  <strong>{summary.subjectsOffered}</strong>
                </td>

                <td colSpan={4} />
              </tr>

              <tr className="result-summary-row">
                <td colSpan={2}>
                  <strong>COMPLETED SUBJECTS</strong>
                </td>

                <td>
                  <strong>{summary.completedSubjects}</strong>
                </td>

                <td colSpan={4} />
              </tr>

              <tr className="result-summary-row">
                <td colSpan={2}>
                  <strong>PENDING SUBJECTS</strong>
                </td>

                <td>
                  <strong>{summary.pendingSubjects}</strong>
                </td>

                <td colSpan={4} />
              </tr>

              <tr className="result-summary-row result-summary-aggregate">
                <td colSpan={3}>
                  <strong>AVERAGE OF COMPLETED SUBJECTS</strong>
                </td>

                <td>
                  <strong>
                    {summary.terminalAverage !== null
                      ? `${summary.terminalAverage.toFixed(2)}%`
                      : "Pending"}
                  </strong>
                </td>

                <td colSpan={3} />
              </tr>
            </tbody>
          </table>
        </div>

        <div className="result-rating-table-wrap">
          <p className="result-rating-title">RATING</p>

          <table className="result-rating-table">
            <thead>
              <tr>
                <th>70 – 100</th>
                <th>60 – 69.99</th>
                <th>50 – 59.99</th>
                <th>45 – 49.99</th>
                <th>40 – 44.99</th>
                <th>0 – 39.99</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>A</td>
                <td>B</td>
                <td>C</td>
                <td>D</td>
                <td>E</td>
                <td>F</td>
              </tr>
            </tbody>
          </table>

          <p className="result-rating-key-label">KEY</p>
        </div>

        <div className="result-comments-section">
          <div className="result-comment">
            <strong>Teacher&apos;s Comment</strong>
            <p>{yearTutorComment}</p>
          </div>

          <div className="result-comment">
            <strong>Principal / Headmaster&apos;s Comment</strong>
            <p>{adminComment}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [academic, setAcademic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(
    () => readStoredAcademicYear()
  );
  const [availableSessions, setAvailableSessions] = useState(DEFAULT_SESSIONS);
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);

  const currentPath = window.location.pathname;
  const resultPrefix = "/student/results/";

  const isResultPage = currentPath.startsWith(resultPrefix);

  const term = isResultPage
    ? currentPath.slice(resultPrefix.length).replace(/\/+$/, "")
    : null;

  // Persist session so /student/results/* does not snap back to default year
  useEffect(() => {
    writeStoredAcademicYear(selectedAcademicYear);
  }, [selectedAcademicYear]);

  // Close session menu on outside click
  useEffect(() => {
    if (!sessionMenuOpen) return undefined;

    const handleOutside = () => setSessionMenuOpen(false);
    const timer = window.setTimeout(() => {
      document.addEventListener("click", handleOutside);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", handleOutside);
    };
  }, [sessionMenuOpen]);

  // Load profile once, then reload results whenever the session changes
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const profileRes = await api.get("/students/profile/me", {
          params: {
            academicYear: selectedAcademicYear,
          },
        });

        const me = profileRes.data?.profile;

        if (!me) {
          throw new Error("Student profile was not returned by the server.");
        }

        const id = me.id || me._id;

        if (!id) {
          throw new Error(
            "Student ID was not returned by the profile endpoint."
          );
        }

        const studentData = {
          id,
          name:
            me.name ||
            `${me.firstName || ""} ${me.surname || ""}`.trim() ||
            "Student",
          admissionNumber: me.admissionNumber || "—",
          currentClass: me.currentClass || me.className || "",
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
        };

        if (cancelled) return;

        setStudent(studentData);

        // Probe known sessions so the picker lists years that have data
        const yearsToProbe = [
          ...new Set([
            ...DEFAULT_SESSIONS,
            selectedAcademicYear,
            CURRENT_ACADEMIC_YEAR,
            "2025/2026",
            "2026/2027",
          ]),
        ];

        const probeResults = await Promise.all(
          yearsToProbe.map(async (year) => {
            try {
              const response = await api.get(
                `/grades/student/${id}/academic-profile`,
                {
                  params: {
                    academicYear: year,
                    term: "First Term",
                  },
                }
              );
              const summary = response.data?.reportCardSummary;
              const hasData =
                Array.isArray(summary) && summary.length > 0
                  ? true
                  : Boolean(response.data);
              return {
                year,
                hasData:
                  hasData ||
                  response.data?.academicYear === year ||
                  Boolean(response.data),
                data: response.data,
              };
            } catch {
              return { year, hasData: false, data: null };
            }
          })
        );

        if (cancelled) return;

        const yearsWithAnyResponse = probeResults
          .filter((item) => item.data)
          .map((item) => item.year);

        setAvailableSessions((current) => {
          const merged = new Set([
            ...current,
            ...DEFAULT_SESSIONS,
            ...yearsWithAnyResponse,
            selectedAcademicYear,
          ]);
          return [...merged].filter(Boolean).sort();
        });

        // Full term load for the selected session
        const termResponses = await Promise.all(
          TERMS.map(async ({ term: termName }) => {
            // Some backends accept "First Term", others "first" / "First"
            const termAttempts = [
              termName,
              termName.replace(" Term", ""),
              termName.split(" ")[0].toLowerCase(),
            ];

            for (const termParam of termAttempts) {
              try {
                const response = await api.get(
                  `/grades/student/${id}/academic-profile`,
                  {
                    params: {
                      academicYear: selectedAcademicYear,
                      term: termParam,
                    },
                  }
                );

                if (response.data) {
                  return {
                    term: termName,
                    data: response.data,
                  };
                }
              } catch (err) {
                console.error(
                  `${termName} (${termParam}):`,
                  err.response?.data || err.message
                );
              }
            }

            return {
              term: termName,
              data: null,
            };
          })
        );

        if (cancelled) return;

        const successful = termResponses.filter((item) => item.data);

        setAcademic(
          successful.length
            ? mergeTermAcademicResponses(successful, selectedAcademicYear)
            : {
                academicYear: selectedAcademicYear,
                reportCardSummary: [],
                termResponses: termResponses,
                classSize: null,
              }
        );
      } catch (err) {
        console.error("Student dashboard error:", err);

        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load your profile. Please log in again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [selectedAcademicYear]);

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
          <p style={{ marginBottom: 16 }}>
            {error || "Profile not found"}
          </p>

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

  const results = buildTermResults(academic, selectedAcademicYear);

  const studentsInClass =
    academic?.classSize ??
    academic?.noInClass ??
    academic?.studentsInClass ??
    "—";

  const performance = [];

  ["first", "second", "third"].forEach((key, index) => {
    const result = results[key];

    if (result?.uploaded) {
      const summary = getResultSummary(result, student.currentClass);

      if (summary.terminalAverage !== null) {
        performance.push({
          term:
            index === 0 ? "First" : index === 1 ? "Second" : "Third",
          score: Number(summary.terminalAverage.toFixed(1)),
        });
      }
    }
  });

  return (
    <div className="student-app">
      <StudentHeader
        student={student}
        academicYear={selectedAcademicYear}
        availableSessions={availableSessions}
        sessionMenuOpen={sessionMenuOpen}
        onToggleSessionMenu={() =>
          setSessionMenuOpen((open) => !open)
        }
        onSelectSession={(year) => {
          const clean = String(year || "").trim();
          if (!clean || clean === selectedAcademicYear) {
            setSessionMenuOpen(false);
            return;
          }
          setSessionMenuOpen(false);
          setSelectedAcademicYear(clean);
          // Stay on profile when switching year so term cards reload cleanly
          if (window.location.pathname.startsWith("/student/results/")) {
            navigateTo("/student/dashboard");
          }
        }}
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
        />
      )}

      <footer className="student-footer">
        © {new Date().getFullYear()} O&apos;lak Triumph School
      </footer>
    </div>
  );
}
