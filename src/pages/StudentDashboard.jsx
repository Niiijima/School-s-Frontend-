import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import api from "../api/axios";
import { logout } from "../api/auth";
import "./StudentDashboard.css";
import schoolLogo from "../assets/logo.jpeg";
import schoolStamp from "../assets/stamp.jpeg";

const CURRENT_ACADEMIC_YEAR = "2025/2026";
const PDF_PURPLE = [88, 28, 135];
const PDF_LIGHT_PURPLE = [245, 237, 252];

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
  const percentage =
    maximumScore > 0
      ? (total / maximumScore) * 100
      : Number(subject.percentage || 0);
  const roundedPercentage = Number(percentage.toFixed(2));
  const ca =
    subject.ca ??
    Number(subject.test1 || 0) +
      Number(subject.test2 || 0) +
      Number(subject.test3 || 0) +
      Number(subject.assignment || 0);

  return {
    ...subject,
    name: subject.name || subject.subjectName || subject.subject || "Subject",
    ca: Number(ca),
    exam: Number(subject.exam || 0),
    total: total || Number(ca) + Number(subject.exam || 0),
    percentage: roundedPercentage,
    ...getGradeAndRemark(roundedPercentage, currentClass),
  };
}

function getResultSummary(result, currentClass) {
  const subjects = (result.subjects || []).map((s) =>
    getSubjectResult(s, currentClass)
  );
  const totalScore = subjects.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const totalMaximumScore = subjects.reduce(
    (sum, s) => sum + Number(s.maximumScore ?? 100),
    0
  );
  const totalPercentage =
    totalMaximumScore > 0 ? (totalScore / totalMaximumScore) * 100 : 0;
  const subjectsOffered = subjects.length;
  const terminalAverage =
    subjectsOffered > 0
      ? subjects.reduce((sum, s) => sum + s.percentage, 0) / subjectsOffered
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
  return String(name)
    .split(" ")
    .map((p) => p[0])
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
      if (!response.ok) throw new Error(`Image request failed: ${response.status}`);
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
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create image canvas.");
    ctx.drawImage(image, 0, 0);
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Unable to load PDF image:", imageUrl, error);
    return null;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

function mergeTermAcademicResponses(responses) {
  const mergedSubjects = new Map();
  responses.forEach(({ data, term }) => {
    if (!data || !Array.isArray(data.reportCardSummary)) return;
    data.reportCardSummary.forEach((subject) => {
      const subjectKey =
        subject.subjectCode || subject.subjectName || subject._id || subject.name;
      if (!subjectKey) return;
      if (!mergedSubjects.has(subjectKey)) {
        mergedSubjects.set(subjectKey, {
          subjectName: subject.subjectName || subject.name || "Subject",
          subjectCode: subject.subjectCode || "",
        });
      }
      const existing = mergedSubjects.get(subjectKey);
      if (subject.firstTerm) existing.firstTerm = subject.firstTerm;
      if (subject.secondTerm) existing.secondTerm = subject.secondTerm;
      if (subject.thirdTerm) existing.thirdTerm = subject.thirdTerm;
      const termKey = {
        "First Term": "firstTerm",
        "Second Term": "secondTerm",
        "Third Term": "thirdTerm",
      }[term];
      if (termKey && subject[termKey]) existing[termKey] = subject[termKey];
    });
  });

  const firstResponse = responses.find((i) => i.data)?.data;
  const classSizeResponse = responses
    .map((i) => i.data)
    .find(
      (d) =>
        d?.classSize != null || d?.noInClass != null || d?.studentsInClass != null
    );

  return {
    academicYear: firstResponse?.academicYear || CURRENT_ACADEMIC_YEAR,
    reportCardSummary: Array.from(mergedSubjects.values()),
    termResponses: responses,
    classSize:
      classSizeResponse?.classSize ??
      classSizeResponse?.noInClass ??
      classSizeResponse?.studentsInClass ??
      null,
  };
}

function buildTermResults(academic) {
  const empty = {
    first: {
      label: "First Term Result",
      uploaded: false,
      subjects: [],
      term: "First Term",
      academicYear: CURRENT_ACADEMIC_YEAR,
    },
    second: {
      label: "Second Term Result",
      uploaded: false,
      subjects: [],
      term: "Second Term",
      academicYear: CURRENT_ACADEMIC_YEAR,
    },
    third: {
      label: "Third Term / Annual Report",
      uploaded: false,
      subjects: [],
      term: "Third Term",
      academicYear: CURRENT_ACADEMIC_YEAR,
    },
  };
  if (!academic) return empty;
  const reportSubjects = academic.reportCardSummary || [];
  if (!reportSubjects.length) return empty;

  const getTermSubjects = (termKey) =>
    reportSubjects
      .filter((s) => s[termKey])
      .map((s) => ({
        ...s[termKey],
        name: s.subjectName,
        subjectName: s.subjectName,
        subjectCode: s.subjectCode,
      }));

  const firstSubjects = getTermSubjects("firstTerm");
  const secondSubjects = getTermSubjects("secondTerm");
  const thirdSubjects = getTermSubjects("thirdTerm");

  return {
    first: {
      label: "First Term Result",
      uploaded: firstSubjects.length > 0,
      academicYear: academic.academicYear || CURRENT_ACADEMIC_YEAR,
      term: "First Term",
      subjects: firstSubjects,
    },
    second: {
      label: "Second Term Result",
      uploaded: secondSubjects.length > 0,
      academicYear: academic.academicYear || CURRENT_ACADEMIC_YEAR,
      term: "Second Term",
      subjects: secondSubjects,
    },
    third: {
      label: "Third Term / Annual Report",
      uploaded: thirdSubjects.length > 0,
      academicYear: academic.academicYear || CURRENT_ACADEMIC_YEAR,
      term: "Third Term",
      subjects: thirdSubjects,
    },
  };
}

function StudentHeader({ student, academicYear }) {
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
        <span className="student-session">
          {academicYear || CURRENT_ACADEMIC_YEAR} Academic Session
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
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");

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
              <line x1={left} x2={left + chartWidth} y1={y} y2={y} className="chart-grid" />
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
            <text x={point.x} y={point.y - 13} textAnchor="middle" className="chart-value">
              {point.score}%
            </text>
            <text x={point.x} y="177" textAnchor="middle" className="chart-axis-label">
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
  const margin = 14;

  const summary = getResultSummary(result, student.currentClass);
  const adminComment = getAutomaticAdminComment(summary.terminalAverage);
  const yearTutorComment = getAutomaticYearTutorComment(summary.terminalAverage);

  let backendOrigin = window.location.origin;
  try {
    if (api.defaults.baseURL) {
      backendOrigin = new URL(api.defaults.baseURL, window.location.origin).origin;
    }
  } catch (e) {
    console.warn(e);
  }

  const [logoData, profileImageData, stampData] = await Promise.all([
    loadImageForPDF(schoolLogo, window.location.origin),
    loadImageForPDF(student.profileImage, backendOrigin),
    loadImageForPDF(schoolStamp, window.location.origin),
  ]);

  if (logoData) {
    try {
      pdf.addImage(logoData, "PNG", margin, 8, 18, 18);
    } catch (e) {
      console.warn(e);
    }
  }
  if (profileImageData) {
    try {
      pdf.addImage(profileImageData, "PNG", pageWidth - margin - 18, 8, 18, 18);
    } catch (e) {
      console.warn(e);
    }
  }

  pdf.setTextColor(...PDF_PURPLE);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.text("O'LAK TRIUMPH SCHOOL", pageWidth / 2, 16, { align: "center" });
  pdf.setFontSize(9);
  pdf.setTextColor(40, 40, 40);
  pdf.setFont("helvetica", "normal");
  pdf.text("REPORT SHEET FOR SECONDARY SCHOOL", pageWidth / 2, 22, {
    align: "center",
  });

  let y = 28;
  pdf.setDrawColor(...PDF_PURPLE);
  pdf.setLineWidth(0.4);
  pdf.rect(margin, y, pageWidth - margin * 2, 20);

  pdf.setFontSize(7.5);
  pdf.setFont("helvetica", "bold");
  pdf.text(
    `SESSION: ${result.academicYear || CURRENT_ACADEMIC_YEAR} SESSION`,
    margin + 2,
    y + 5
  );
  pdf.text(`TERM: ${String(result.term || "").toUpperCase()}`, margin + 72, y + 5);
  pdf.text(`CLASS: ${formatClass(student)}`, margin + 120, y + 5);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    `STUDENT NAME: ${String(student.name || "").toUpperCase()}`,
    margin + 2,
    y + 11
  );
  pdf.text(`SEX: ${String(student.gender || "—").toUpperCase()}`, margin + 110, y + 11);
  pdf.text(`STUDENT NO: ${student.admissionNumber || "—"}`, margin + 2, y + 17);
  pdf.text(`NO. IN CLASS: ${studentsInClass}`, margin + 110, y + 17);

  y = 54;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...PDF_PURPLE);
  pdf.text("PERFORMANCE IN SUBJECTS", pageWidth / 2, y, { align: "center" });

  y = 58;
  pdf.setFillColor(...PDF_PURPLE);
  pdf.setTextColor(255, 255, 255);
  pdf.rect(margin, y, pageWidth - margin * 2, 7, "F");
  pdf.setFontSize(7);

  const col = {
    subject: margin + 2,
    ca: margin + 70,
    exam: margin + 95,
    pct: margin + 122,
    grade: margin + 148,
    remark: margin + 165,
  };

  pdf.text("SUBJECTS", col.subject, y + 4.5);
  pdf.text("CA / 40", col.ca, y + 4.5);
  pdf.text("EXAM / 60", col.exam, y + 4.5);
  pdf.text("PERCENTAGE(%)", col.pct, y + 4.5);
  pdf.text("GRADE", col.grade, y + 4.5);
  pdf.text("REMARK", col.remark, y + 4.5);

  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(40, 40, 40);

  summary.subjects.forEach((subject, index) => {
    if (y > pageHeight - 70) {
      pdf.addPage();
      y = 20;
    }
    if (index % 2 === 0) {
      pdf.setFillColor(...PDF_LIGHT_PURPLE);
      pdf.rect(margin, y, pageWidth - margin * 2, 6.5, "F");
    }
    pdf.text(String(subject.name).toUpperCase().slice(0, 28), col.subject, y + 4.2);
    pdf.text(`${subject.ca}/40`, col.ca, y + 4.2);
    pdf.text(`${subject.exam}/60`, col.exam, y + 4.2);
    pdf.text(String(subject.percentage.toFixed(0)), col.pct, y + 4.2);
    pdf.text(String(subject.grade), col.grade, y + 4.2);
    pdf.text(String(subject.remark || "").slice(0, 14), col.remark, y + 4.2);
    y += 6.5;
  });

  y += 3;
  pdf.setDrawColor(...PDF_PURPLE);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 6;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(40, 40, 40);
  // TOTAL under Exam column
  pdf.text("TOTAL:", col.subject, y);
  pdf.text(String(summary.totalScore.toFixed(2)), col.exam, y);
  y += 5;
  pdf.text("SUBJECT OFFERED:", col.subject, y);
  pdf.text(String(summary.subjectsOffered), col.exam, y);
  y += 5;
  // PERCENTAGE AGGREGATE under Percentage column
  pdf.setTextColor(...PDF_PURPLE);
  pdf.text("PERCENTAGE AGGREGATE:", col.subject, y);
  pdf.text(`${summary.terminalAverage.toFixed(2)}%`, col.pct, y);

  y += 10;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...PDF_PURPLE);
  pdf.text("RATING", pageWidth / 2, y, { align: "center" });
  y += 3;

  const ratingTop = y;
  const ratingHeight = 14;
  const ratingWidth = pageWidth - margin * 2;
  const cellW = ratingWidth / 6;
  const ranges = ["70-100", "60-69.99", "50-59.99", "45-49.99", "40-44.99", "0-39.99"];
  const keys = ["A", "B", "C", "D", "E", "F"];

  pdf.setDrawColor(...PDF_PURPLE);
  pdf.setLineWidth(0.3);
  pdf.setFillColor(...PDF_LIGHT_PURPLE);
  pdf.rect(margin, ratingTop, ratingWidth, ratingHeight / 2, "FD");
  pdf.setFillColor(255, 255, 255);
  pdf.rect(margin, ratingTop + ratingHeight / 2, ratingWidth, ratingHeight / 2, "FD");
  for (let i = 0; i <= 6; i++) {
    pdf.line(margin + i * cellW, ratingTop, margin + i * cellW, ratingTop + ratingHeight);
  }
  pdf.line(
    margin,
    ratingTop + ratingHeight / 2,
    margin + ratingWidth,
    ratingTop + ratingHeight / 2
  );

  pdf.setFontSize(6.5);
  pdf.setTextColor(...PDF_PURPLE);
  ranges.forEach((label, i) => {
    pdf.text(label, margin + i * cellW + cellW / 2, ratingTop + 4.5, { align: "center" });
  });
  pdf.setFontSize(9);
  pdf.setTextColor(40, 40, 40);
  keys.forEach((label, i) => {
    pdf.text(label, margin + i * cellW + cellW / 2, ratingTop + ratingHeight - 2.5, {
      align: "center",
    });
  });

  y = ratingTop + ratingHeight + 8;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...PDF_PURPLE);
  pdf.text("Teacher's Comment:", margin + 2, y);
  y += 4;
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(50, 50, 50);
  const tutorLines = pdf.splitTextToSize(yearTutorComment, pageWidth - margin * 2);
  pdf.text(tutorLines, margin + 2, y);
  y += tutorLines.length * 3.8 + 5;

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...PDF_PURPLE);
  pdf.text("Principal/Headmaster's Comment:", margin + 2, y);
  y += 4;
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(50, 50, 50);
  const adminLines = pdf.splitTextToSize(adminComment, pageWidth - margin * 2);
  pdf.text(adminLines, margin + 2, y);
  y += adminLines.length * 3.8 + 8;

  const stampW = 28;
  let stampH = 18;
  if (stampData) {
    try {
      const props = pdf.getImageProperties(stampData);
      stampH = Math.min(stampW / (props.width / props.height), 22);
    } catch {
      stampH = 18;
    }
  }
  if (y + stampH + 16 > pageHeight - 10) {
    pdf.addPage();
    y = 20;
  } else {
    y += 8;
  }

  const lineWidth = 55;
  const lineX = pageWidth - margin - lineWidth;
  const lineY = y + (stampData ? stampH + 2 : 0) + 4;
  const stampX = lineX + (lineWidth - stampW) / 2;
  const stampY = lineY - stampH - 1;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...PDF_PURPLE);
  pdf.text("Head Teacher", lineX + lineWidth / 2, stampY - 3, { align: "center" });

  if (stampData) {
    try {
      pdf.addImage(stampData, "PNG", stampX, stampY, stampW, stampH);
    } catch (e) {
      console.warn(e);
    }
  }

  pdf.setDrawColor(...PDF_PURPLE);
  pdf.setLineWidth(0.5);
  pdf.line(lineX, lineY, lineX + lineWidth, lineY);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(100, 100, 100);
  pdf.text("Signature / Stamp", lineX + lineWidth / 2, lineY + 4, { align: "center" });

  pdf.save(
    `${student.admissionNumber || "result"}-${String(result.term)
      .replaceAll(" ", "-")
      .toLowerCase()}.pdf`
  );
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
              {(student.status || "Active").replace(/^\w/, (c) => c.toUpperCase())} Student
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
          <span className="section-caption">Select a term to view your report</span>
        </div>
        <div className="term-result-grid">
          {Object.entries(results).map(([key, result]) => (
            <button
              key={key}
              type="button"
              className={`term-result-card ${!result.uploaded ? "term-result-unavailable" : ""}`}
              disabled={!result.uploaded}
              onClick={() => {
                if (result.uploaded) navigateTo(`/student/results/${key}`);
              }}
            >
              <span className="term-icon">▤</span>
              <span className="term-card-copy">
                <strong>{result.label}</strong>
                <small>
                  {result.uploaded ? "View result and download PDF" : "Yet to be uploaded"}
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
          onClick={() => downloadResultPDF(student, result, studentsInClass)}
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
                <th>Percentage (%)</th>
                <th>Grade</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              {summary.subjects.map((subject) => (
                <tr key={subject.name}>
                  <td>{String(subject.name).toUpperCase()}</td>
                  <td>{subject.ca}/40</td>
                  <td>{subject.exam}/60</td>
                  <td>{subject.percentage.toFixed(0)}%</td>
                  <td>
                    <span className="grade-pill">{subject.grade}</span>
                  </td>
                  <td>{subject.remark}</td>
                </tr>
              ))}

              <tr className="result-summary-row">
                <td colSpan={2}>
                  <strong>TOTAL</strong>
                </td>
                <td>
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
                <td colSpan={3} />
              </tr>

              <tr className="result-summary-row result-summary-aggregate">
                <td colSpan={3}>
                  <strong>PERCENTAGE AGGREGATE</strong>
                </td>
                <td>
                  <strong>{summary.terminalAverage.toFixed(2)}%</strong>
                </td>
                <td colSpan={2} />
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

  const currentPath = window.location.pathname;
  const resultPrefix = "/student/results/";
  const isResultPage = currentPath.startsWith(resultPrefix);
  const term = isResultPage
    ? currentPath.slice(resultPrefix.length).replace(/\/+$/, "")
    : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await api.get("/students/profile/me", {
          params: { academicYear: CURRENT_ACADEMIC_YEAR },
        });
        const me = profileRes.data?.profile;
        if (!me) throw new Error("Student profile was not returned by the server.");
        const id = me.id || me._id;
        if (!id) throw new Error("Student ID was not returned by the profile endpoint.");

        setStudent({
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
        });

        const terms = ["First Term", "Second Term", "Third Term"];
        const termResponses = await Promise.all(
          terms.map(async (termName) => {
            try {
              const response = await api.get(`/grades/student/${id}/academic-profile`, {
                params: { academicYear: CURRENT_ACADEMIC_YEAR, term: termName },
              });
              return { term: termName, data: response.data };
            } catch (err) {
              console.error(termName, err.response?.data || err.message);
              return { term: termName, data: null };
            }
          })
        );

        const successful = termResponses.filter((i) => i.data);
        setAcademic(successful.length ? mergeTermAcademicResponses(successful) : null);
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
        <div style={{ padding: 48, textAlign: "center" }}>Loading your portal...</div>
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
    academic?.classSize ?? academic?.noInClass ?? academic?.studentsInClass ?? "—";

  const performance = [];
  ["first", "second", "third"].forEach((key, index) => {
    const result = results[key];
    if (result?.uploaded) {
      const summary = getResultSummary(result, student.currentClass);
      const score = Number(
        result.average || result.terminalAverage || summary.terminalAverage || 0
      );
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
        academicYear={academic?.academicYear || CURRENT_ACADEMIC_YEAR}
      />
      {isResultPage ? (
        <ResultPage
          term={term}
          student={student}
          results={results}
          studentsInClass={studentsInClass}
        />
      ) : (
        <ProfilePage student={student} results={results} performance={performance} />
      )}
      <footer className="student-footer">
        © {new Date().getFullYear()} O&apos;lak Triumph School
      </footer>
    </div>
  );
}