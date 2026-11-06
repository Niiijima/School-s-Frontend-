import React, { useState, useEffect } from "react";
import schoolLogo from "./assets/logo.jpeg";
import api from "./api/axios";
import { logout } from "./api/auth";

import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserPlus,
  ClipboardList,
  GraduationCap,
  CalendarDays,
  TrendingUp,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  Plus,
  ChevronRight,
  Lock,
  Unlock,
  Eye,
  Trash2,
  CheckCircle2,
  School,
  ArrowUpRight,
  FileText,
} from "lucide-react";

import "./AdminDashboard.css";

const departments = ["Science", "Art", "Commercial"];
const juniorClasses = ["JSS1", "JSS2", "JSS3"];
const seniorClasses = ["SS1", "SS2", "SS3"];
const secondaryClasses = [...juniorClasses, ...seniorClasses];
const enrollmentClassOptions = [...secondaryClasses];

const CURRENT_ACADEMIC_YEAR = "2025/2026";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Students", icon: Users },
  { label: "Subjects", icon: BookOpen },
  { label: "Enrollments", icon: UserPlus },
  { label: "Submit Scores", icon: ClipboardList },
  { label: "Student Results", icon: GraduationCap },
  { label: "Academic Terms", icon: CalendarDays },
  { label: "Promote Students", icon: TrendingUp },
];

function isSeniorClass(className) {
  return seniorClasses.includes(className);
}

function getNextClass(className) {
  const index = secondaryClasses.indexOf(className);
  if (index < 0 || index >= secondaryClasses.length - 1) return className;
  return secondaryClasses[index + 1];
}

function calculateGrade(section, test1 = 0, test2 = 0, test3 = 0, assignment = 0, exam = 0) {
  const totalScore =
    Number(test1) + Number(test2) + Number(test3) + Number(assignment) + Number(exam);
  const standardSection = section ? section.toUpperCase() : "JSS";

  if (standardSection === "SSS" || standardSection === "SS") {
    if (totalScore >= 75) return { totalScore, grade: "A1", remark: "Excellent" };
    if (totalScore >= 70) return { totalScore, grade: "B2", remark: "Very Good" };
    if (totalScore >= 65) return { totalScore, grade: "B3", remark: "Good" };
    if (totalScore >= 60) return { totalScore, grade: "C4", remark: "Credit" };
    if (totalScore >= 55) return { totalScore, grade: "C5", remark: "Credit" };
    if (totalScore >= 50) return { totalScore, grade: "C6", remark: "Credit" };
    if (totalScore >= 45) return { totalScore, grade: "D7", remark: "Pass" };
    if (totalScore >= 40) return { totalScore, grade: "E8", remark: "Fair" };
    return { totalScore, grade: "F9", remark: "Fail" };
  }

  if (totalScore >= 70) return { totalScore, grade: "A", remark: "Distinction" };
  if (totalScore >= 60) return { totalScore, grade: "B", remark: "Upper Credit" };
  if (totalScore >= 50) return { totalScore, grade: "C", remark: "Lower Credit" };
  if (totalScore >= 40) return { totalScore, grade: "P", remark: "Pass" };
  return { totalScore, grade: "F", remark: "Fail" };
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

function getStudentSection(className) {
  return isSeniorClass(className) ? "SSS" : "JSS";
}

function normalizeStudent(s) {
  return {
    id: s._id || s.id,
    name: s.name,
    admissionNumber: s.admissionNumber || s.id,
    className: s.currentClass || s.className,
    department: s.department || "",
    gender: s.gender || "",
    status: s.status || "active",
  };
}

function normalizeSubject(s) {
  return {
    id: s._id || s.id,
    name: s.name,
    code: s.code || s.subjectCode,
    className: s.className || s.currentClass || "",
    department: s.department || "",
  };
}

function AdminDashboard() {
  const [activePage, setActivePage] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [scores, setScores] = useState([]);
  const [terms, setTerms] = useState([
    { id: "TERM001", name: "First Term", session: CURRENT_ACADEMIC_YEAR, isLocked: false, isPublished: false },
    { id: "TERM002", name: "Second Term", session: CURRENT_ACADEMIC_YEAR, isLocked: false, isPublished: false },
    { id: "TERM003", name: "Third Term", session: CURRENT_ACADEMIC_YEAR, isLocked: false, isPublished: false },
  ]);

  const [modal, setModal] = useState("");
  const [notice, setNotice] = useState("");

  const [studentClass, setStudentClass] = useState("JSS1");
  const [studentDepartment, setStudentDepartment] = useState("Science");
  const [subjectClass, setSubjectClass] = useState("JSS1");
  const [subjectDepartment, setSubjectDepartment] = useState("Science");
  const [scoreClass, setScoreClass] = useState("JSS1");
  const [scoreDepartment, setScoreDepartment] = useState("Science");
  const [resultClass, setResultClass] = useState("JSS1");
  const [resultDepartment, setResultDepartment] = useState("Science");
  const [resultTerm, setResultTerm] = useState("First Term");
  const [resultAcademicYear, setResultAcademicYear] = useState(CURRENT_ACADEMIC_YEAR);
  const [promotionClass, setPromotionClass] = useState("JSS1");
  const [promotionDepartment, setPromotionDepartment] = useState("Science");
  const [destinationClass, setDestinationClass] = useState("JSS2");
  const [destinationDepartment, setDestinationDepartment] = useState("Science");

  const [studentForm, setStudentForm] = useState({
    name: "",
    admissionNumber: "",
    password: "",
    className: "JSS1",
    department: "Science",
    gender: "Female",
  });

  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    className: "JSS1",
    department: "Science",
  });

  const [enrollmentForm, setEnrollmentForm] = useState({
    student: "",
    className: "JSS1",
    department: "",
    term: "First Term",
  });

  const [scoreForm, setScoreForm] = useState({
    student: "",
    subject: "",
    test1: "",
    test2: "",
    test3: "",
    assignment: "",
    exam: "",
    term: "First Term",
    academicYear: CURRENT_ACADEMIC_YEAR,
    noInClass: "",
  });

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  };

  const openPage = (page) => {
    setActivePage(page);
    setSearch("");
    setSidebarOpen(false);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsRes, subjectsRes] = await Promise.all([
        api.get("/students"),
        api.get("/subjects").catch(() => ({ data: [] })),
      ]);

      const studentList = studentsRes.data.students || studentsRes.data || [];
      const subjectList = subjectsRes.data.subjects || subjectsRes.data || [];

      setStudents(studentList.map(normalizeStudent));
      setSubjects(subjectList.map(normalizeSubject));
    } catch (err) {
      showNotice(err.response?.data?.message || "Failed to load data from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = (items, fields) => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      fields.some((field) => String(item[field] ?? "").toLowerCase().includes(query))
    );
  };

  // ====================== API ACTIONS ======================

  const addStudent = async (event) => {
    event.preventDefault();
    if (!studentForm.name.trim() || !studentForm.admissionNumber.trim() || !studentForm.password) {
      showNotice("Please fill name, admission number and password.");
      return;
    }
    const senior = isSeniorClass(studentForm.className);
    if (senior && !studentForm.department) {
      showNotice("Please select a department for the SS class.");
      return;
    }

    try {
      await api.post("/students/register", {
        name: studentForm.name.trim(),
        admissionNumber: studentForm.admissionNumber.trim(),
        password: studentForm.password,
        currentClass: studentForm.className,
        department: senior ? studentForm.department : null,
        gender: studentForm.gender,
      });
      showNotice("Student registered successfully.");
      setModal("");
      setStudentForm({
        name: "",
        admissionNumber: "",
        password: "",
        className: "JSS1",
        department: "Science",
        gender: "Female",
      });
      await loadData();
    } catch (err) {
      showNotice(err.response?.data?.message || "Failed to register student.");
    }
  };

  const addSubject = async (event) => {
    event.preventDefault();
    if (!subjectForm.name.trim() || !subjectForm.code.trim()) {
      showNotice("Please enter subject name and code.");
      return;
    }
    const senior = isSeniorClass(subjectForm.className);
    if (senior && !subjectForm.department) {
      showNotice("Please select a department for the SS class.");
      return;
    }

    try {
      await api.post("/subjects", {
        name: subjectForm.name.trim(),
        code: subjectForm.code.trim().toUpperCase(),
        className: subjectForm.className,
        department: senior ? subjectForm.department : null,
      });
      showNotice("Subject added successfully.");
      setModal("");
      setSubjectForm({ name: "", code: "", className: "JSS1", department: "Science" });
      await loadData();
    } catch (err) {
      // Fallback local if subjects endpoint is not ready
      setSubjects((current) => [
        ...current,
        {
          id: `SUB${Date.now()}`,
          name: subjectForm.name.trim(),
          code: subjectForm.code.trim().toUpperCase(),
          className: subjectForm.className,
          department: senior ? subjectForm.department : "",
        },
      ]);
      setModal("");
      showNotice(err.response?.data?.message || "Subject saved locally (API may not be ready).");
    }
  };

  const addEnrollment = (event) => {
    event.preventDefault();
    const studentName = enrollmentForm.student.trim();
    if (!studentName) {
      showNotice("Please enter the student's full name.");
      return;
    }
    const senior = isSeniorClass(enrollmentForm.className);
    const department = senior ? enrollmentForm.department : "";
    if (senior && !department) {
      showNotice("Please select a department for the SS class.");
      return;
    }

    setEnrollments((current) => [
      ...current,
      {
        id: `ENR${Date.now()}`,
        student: studentName,
        className: enrollmentForm.className,
        department,
        term: enrollmentForm.term,
        session: CURRENT_ACADEMIC_YEAR,
      },
    ]);
    setEnrollmentForm({ student: "", className: "JSS1", department: "", term: "First Term" });
    setModal("");
    showNotice("Enrollment added (local preview).");
  };

  const enrollAllStudents = () => {
    if (students.length === 0) {
      showNotice("No students available to enroll.");
      return;
    }
    const newOnes = students.map((s, i) => ({
      id: `ENR${Date.now()}${i}`,
      studentId: s.id,
      student: s.name,
      className: s.className,
      department: s.department || "",
      term: "First Term",
      session: CURRENT_ACADEMIC_YEAR,
    }));
    setEnrollments((c) => [...c, ...newOnes]);
    showNotice(`${newOnes.length} students enrolled (local preview).`);
  };

  const addScore = async (event) => {
    event.preventDefault();
    if (!scoreForm.student || !scoreForm.subject) {
      showNotice("Please select a student and subject.");
      return;
    }
    const fields = ["test1", "test2", "test3", "assignment", "exam"];
    if (fields.some((f) => scoreForm[f] === "")) {
      showNotice("Please complete all score fields.");
      return;
    }

    const test1 = Number(scoreForm.test1);
    const test2 = Number(scoreForm.test2);
    const test3 = Number(scoreForm.test3);
    const assignment = Number(scoreForm.assignment);
    const exam = Number(scoreForm.exam);

    if ([test1, test2, test3, assignment].some((v) => v < 0 || v > 10)) {
      showNotice("Each CA component must be between 0 and 10.");
      return;
    }
    if (exam < 0 || exam > 60) {
      showNotice("Exam score must be between 0 and 60.");
      return;
    }

    const selectedStudent = students.find((s) => s.id === scoreForm.student);
    const selectedSubject = subjects.find((s) => s.id === scoreForm.subject);
    if (!selectedStudent || !selectedSubject) {
      showNotice("Selected student or subject not found.");
      return;
    }

    try {
      await api.post("/grades/submit-scores", {
        admissionNumber: selectedStudent.admissionNumber,
        subjectCode: selectedSubject.code,
        test1,
        test2,
        test3,
        assignment,
        exam,
        term: scoreForm.term,
        academicYear: scoreForm.academicYear.trim(),
        noInClass: scoreForm.noInClass === "" ? undefined : Number(scoreForm.noInClass),
      });

      const gradeResult = calculateGrade(
        getStudentSection(selectedStudent.className),
        test1, test2, test3, assignment, exam
      );

      setScores((current) => [
        ...current.filter(
          (s) =>
            !(
              s.admissionNumber === selectedStudent.admissionNumber &&
              s.subjectCode === selectedSubject.code &&
              s.term === scoreForm.term &&
              s.academicYear === scoreForm.academicYear.trim()
            )
        ),
        {
          id: `SCR${Date.now()}`,
          student: selectedStudent.id,
          studentName: selectedStudent.name,
          admissionNumber: selectedStudent.admissionNumber,
          subject: selectedSubject.id,
          subjectName: selectedSubject.name,
          subjectCode: selectedSubject.code,
          className: selectedStudent.className,
          department: selectedStudent.department || "",
          term: scoreForm.term,
          academicYear: scoreForm.academicYear.trim(),
          test1, test2, test3, assignment, exam,
          totalScore: gradeResult.totalScore,
          grade: gradeResult.grade,
          remark: gradeResult.remark,
          noInClass: scoreForm.noInClass === "" ? null : Number(scoreForm.noInClass),
        },
      ]);

      setScoreForm({
        student: "",
        subject: "",
        test1: "",
        test2: "",
        test3: "",
        assignment: "",
        exam: "",
        term: "First Term",
        academicYear: CURRENT_ACADEMIC_YEAR,
        noInClass: "",
      });
      setModal("");
      showNotice("Score submitted successfully.");
    } catch (err) {
      showNotice(err.response?.data?.message || "Failed to submit score.");
    }
  };

  const toggleTerm = async (id) => {
    const term = terms.find((t) => t.id === id);
    if (!term) return;

    try {
      await api.patch("/grades/admin/toggle-lock", {
        term: term.name,
        academicYear: term.session,
      });
      setTerms((current) =>
        current.map((t) => (t.id === id ? { ...t, isLocked: !t.isLocked } : t))
      );
      showNotice(`Term ${term.isLocked ? "unlocked" : "locked"} successfully.`);
    } catch (err) {
      // local fallback
      setTerms((current) =>
        current.map((t) => (t.id === id ? { ...t, isLocked: !t.isLocked } : t))
      );
      showNotice(err.response?.data?.message || "Term lock updated locally.");
    }
  };

  const publishTerm = (id) => {
    setTerms((current) =>
      current.map((t) => (t.id === id ? { ...t, isPublished: !t.isPublished } : t))
    );
    showNotice("Publication status updated (local preview).");
  };

  const promoteStudent = async (id) => {
    if (
      destinationClass === promotionClass &&
      (!isSeniorClass(destinationClass) || destinationDepartment === promotionDepartment)
    ) {
      showNotice("Choose a different destination class or department.");
      return;
    }

    try {
      await api.patch(`/students/${id}/promote`, {
        nextClass: destinationClass,
        department: isSeniorClass(destinationClass) ? destinationDepartment : null,
      });
      showNotice("Student promoted successfully.");
      await loadData();
    } catch (err) {
      // local fallback
      setStudents((current) =>
        current.map((s) =>
          s.id === id
            ? {
                ...s,
                className: destinationClass,
                department: isSeniorClass(destinationClass) ? destinationDepartment : "",
                status: "Promoted",
              }
            : s
        )
      );
      showNotice(err.response?.data?.message || "Student promoted locally.");
    }
  };

  const deleteStudent = async (id) => {
    if (!window.confirm("Delete this student permanently?")) return;
    try {
      await api.delete(`/students/${id}`);
      showNotice("Student deleted successfully.");
      await loadData();
    } catch (err) {
      showNotice(err.response?.data?.message || "Failed to delete student.");
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/admin/login";
  };

  // ====================== DERIVED DATA ======================

  const visibleStudents = filtered(
    students.filter(
      (s) =>
        s.className === studentClass &&
        (!isSeniorClass(studentClass) || s.department === studentDepartment)
    ),
    ["id", "name", "admissionNumber", "className", "department", "gender"]
  );

  const visibleSubjects = filtered(
    subjects.filter(
      (s) =>
        s.className === subjectClass &&
        (!isSeniorClass(subjectClass) || s.department === subjectDepartment)
    ),
    ["id", "name", "code", "className", "department"]
  );

  const scoreStudents = students.filter(
    (s) =>
      s.className === scoreClass &&
      (!isSeniorClass(scoreClass) || s.department === scoreDepartment)
  );

  const scoreSubjects = subjects.filter(
    (s) =>
      s.className === scoreClass &&
      (!isSeniorClass(scoreClass) || s.department === scoreDepartment)
  );

  const promotionStudents = students.filter(
    (s) =>
      s.className === promotionClass &&
      (!isSeniorClass(promotionClass) || s.department === promotionDepartment)
  );

  const classResultScores = scores.filter(
    (s) =>
      s.className === resultClass &&
      (!isSeniorClass(resultClass) || s.department === resultDepartment) &&
      s.term === resultTerm &&
      s.academicYear === resultAcademicYear
  );

  const visibleResultScores = filtered(classResultScores, [
    "studentName", "admissionNumber", "subjectName", "subjectCode",
  ]);

  const groupedResults = Object.values(
    visibleResultScores.reduce((groups, score) => {
      const key = `${score.admissionNumber}-${score.term}-${score.academicYear}`;
      if (!groups[key]) {
        groups[key] = {
          studentId: score.admissionNumber,
          studentName: score.studentName,
          className: score.className,
          department: score.department || "",
          term: score.term,
          academicYear: score.academicYear,
          scores: [],
        };
      }
      groups[key].scores.push(score);
      return groups;
    }, {})
  ).map((result) => {
    const total = result.scores.reduce((sum, s) => sum + Number(s.totalScore || 0), 0);
    const subjectCount = result.scores.length;
    const average = subjectCount ? total / subjectCount : 0;
    return {
      ...result,
      total,
      subjectCount,
      average,
      yearTutorComment: getAutomaticYearTutorComment(average),
      adminComment: getAutomaticAdminComment(average),
    };
  });

  const scoreCA =
    Number(scoreForm.test1 || 0) +
    Number(scoreForm.test2 || 0) +
    Number(scoreForm.test3 || 0) +
    Number(scoreForm.assignment || 0);
  const scoreExam = Number(scoreForm.exam || 0);
  const scoreTotal = scoreCA + scoreExam;

  const selectedScoreStudent = students.find((s) => s.id === scoreForm.student);
  const liveGrade = selectedScoreStudent
    ? calculateGrade(
        getStudentSection(selectedScoreStudent.className),
        scoreForm.test1 || 0,
        scoreForm.test2 || 0,
        scoreForm.test3 || 0,
        scoreForm.assignment || 0,
        scoreForm.exam || 0
      )
    : null;

  const stats = [
    { label: "Total Students", value: students.length, icon: Users, color: "blue" },
    { label: "Subjects", value: subjects.length, icon: BookOpen, color: "gold" },
    { label: "Enrollments", value: enrollments.length, icon: UserPlus, color: "green" },
    { label: "Scores Submitted", value: scores.length, icon: ClipboardList, color: "purple" },
  ];

  const pageDescriptions = {
    Overview: "Here's what's happening at your school today.",
    Students: "Create and manage secondary-school student records by class and department.",
    Subjects: "Manage secondary-school subjects by class and department.",
    Enrollments: "Manage JSS and SS student class, department and term enrollments.",
    "Submit Scores": "Record continuous assessment and examination scores by class and department.",
    "Student Results": "Review subject grades, terminal averages and automatic teacher comments.",
    "Academic Terms": "Control term access and publish academic terms.",
    "Promote Students": "Promote students by class and department.",
  };

  const pageTitle = activePage === "Submit Scores" ? "Score Management" : activePage;

  // ====================== RENDER ======================

  return (
    <div className="admin-shell">
      {sidebarOpen && (
        <button
          className="admin-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? "admin-sidebar-open" : ""}`}>
        <div className="admin-brand">
          <div className="admin-brand-logo">
            <img src={schoolLogo} alt="O'lak Triumph School" />
          </div>
          <div>
            <strong>O'lak Triumph</strong>
            <span>School Administration</span>
          </div>
          <button className="admin-mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="admin-nav-label">MAIN MENU</div>
        <nav className="admin-nav">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`admin-nav-link ${activePage === label ? "active" : ""}`}
              onClick={() => openPage(label)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {activePage === label && <ChevronRight size={16} className="admin-nav-arrow" />}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-note">
            <School size={20} />
            <div>
              <strong>O'lak Triumph School</strong>
              <span>Administrator workspace</span>
            </div>
          </div>
          <button className="admin-logout" onClick={handleLogout} style={{ border: 0, background: "transparent", cursor: "pointer", width: "100%", display: "flex", alignItems: "center", gap: 8 }}>
            <LogOut size={18} />
            <span>Log out</span>
          </button>
          <a className="admin-home-link" href="/">
            Visit public website
            <ArrowUpRight size={15} />
          </a>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button className="admin-menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
            <div>
              <div className="admin-breadcrumb">
                Administration <ChevronRight size={13} /> {activePage}
              </div>
              <h1>{pageTitle}</h1>
            </div>
          </div>
          <div className="admin-topbar-right">
            <span className="admin-session-label">
              <span /> {CURRENT_ACADEMIC_YEAR} Academic Session
            </span>
            <button className="admin-notification" aria-label="Notifications" onClick={() => showNotice("You are all caught up.")}>
              <Bell size={19} />
            </button>
            <div className="admin-profile">
              <div className="admin-avatar">A</div>
              <div>
                <strong>Administrator</strong>
                <span>School Admin</span>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {loading && (
            <p style={{ padding: "12px 0", color: "#64748b" }}>Loading data from server...</p>
          )}

          <div className="admin-welcome">
            <div>
              <p className="admin-eyebrow">O'LAK TRIUMPH SCHOOL</p>
              <h2>{activePage === "Overview" ? "Welcome to your dashboard" : `Manage ${activePage}`}</h2>
              <p>{pageDescriptions[activePage]}</p>
            </div>
            <div className="admin-date-chip">
              <CalendarDays size={16} />
              {CURRENT_ACADEMIC_YEAR} Session
            </div>
          </div>

          {/* OVERVIEW */}
          {activePage === "Overview" && (
            <>
              <div className="admin-stats-grid">
                {stats.map(({ label, value, icon: Icon, color }) => (
                  <div className="admin-stat-card" key={label}>
                    <div className={`admin-stat-icon ${color}`}>
                      <Icon size={21} />
                    </div>
                    <div>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="admin-overview-grid">
                <section className="admin-panel admin-overview-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <h3>Quick actions</h3>
                      <p>Shortcuts to common tasks</p>
                    </div>
                  </div>
                  <div className="admin-quick-actions">
                    {[
                      ["Add a student", Users, "Students", "blue"],
                      ["Manage subjects", BookOpen, "Subjects", "gold"],
                      ["Enroll a student", UserPlus, "Enrollments", "green"],
                      ["Submit scores", ClipboardList, "Submit Scores", "purple"],
                    ].map(([label, Icon, page, color]) => (
                      <button key={label} onClick={() => openPage(page)} className="admin-quick-action">
                        <span className={`admin-quick-icon ${color}`}>
                          <Icon size={19} />
                        </span>
                        <strong>{label}</strong>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                </section>

                <section className="admin-panel">
                  <div className="admin-panel-heading">
                    <div>
                      <h3>Academic terms</h3>
                      <p>Current term status</p>
                    </div>
                    <button className="admin-text-button" onClick={() => openPage("Academic Terms")}>
                      View all
                    </button>
                  </div>
                  <div className="admin-term-list">
                    {terms.slice(0, 3).map((term) => (
                      <div className="admin-term-row" key={term.id}>
                        <div className="admin-term-icon">
                          <CalendarDays size={18} />
                        </div>
                        <div className="admin-term-info">
                          <strong>{term.name}</strong>
                          <span>{term.session}</span>
                          <div className="admin-term-statuses">
                            <span className={`admin-status ${term.isLocked ? "locked" : "open"}`}>
                              {term.isLocked ? "Locked" : "Unlocked"}
                            </span>
                            <span className={`admin-status ${term.isPublished ? "published" : "open"}`}>
                              {term.isPublished ? "Published" : "Unpublished"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <section className="admin-panel admin-recent-panel">
                <div className="admin-panel-heading">
                  <div>
                    <h3>Recently added students</h3>
                    <p>Your latest student records</p>
                  </div>
                  <button className="admin-text-button" onClick={() => openPage("Students")}>
                    View students
                  </button>
                </div>
                <StudentTable students={students.slice(-4).reverse()} onDelete={deleteStudent} compact />
              </section>
            </>
          )}

          {/* STUDENTS */}
          {activePage === "Students" && (
            <section className="admin-panel">
              <PanelHeading
                title="Student records"
                subtitle={`${visibleStudents.length} students in this selection`}
                search={search}
                setSearch={setSearch}
                action={() => {
                  setStudentForm({
                    name: "",
                    admissionNumber: "",
                    password: "",
                    className: "JSS1",
                    department: "Science",
                    gender: "Female",
                  });
                  setModal("student");
                }}
                actionLabel="Add student"
              />
              <ClassificationFilter
                selectedClass={studentClass}
                setSelectedClass={(v) => {
                  setStudentClass(v);
                  setStudentDepartment("Science");
                }}
                selectedDepartment={studentDepartment}
                setSelectedDepartment={setStudentDepartment}
              />
              <p className="admin-classification-note">
                Showing students in <strong>{studentClass}</strong>
                {isSeniorClass(studentClass) && (
                  <> — <strong>{studentDepartment}</strong> Department</>
                )}
              </p>
              <StudentTable students={visibleStudents} onDelete={deleteStudent} />
            </section>
          )}

          {/* SUBJECTS */}
          {activePage === "Subjects" && (
            <section className="admin-panel">
              <PanelHeading
                title="Subject records"
                subtitle={`${visibleSubjects.length} subjects in this selection`}
                search={search}
                setSearch={setSearch}
                action={() => {
                  setSubjectForm({ name: "", code: "", className: "JSS1", department: "Science" });
                  setModal("subject");
                }}
                actionLabel="Add subject"
              />
              <ClassificationFilter
                selectedClass={subjectClass}
                setSelectedClass={(v) => {
                  setSubjectClass(v);
                  setSubjectDepartment("Science");
                }}
                selectedDepartment={subjectDepartment}
                setSelectedDepartment={setSubjectDepartment}
              />
              <p className="admin-classification-note">
                Showing subjects for <strong>{subjectClass}</strong>
                {isSeniorClass(subjectClass) && (
                  <> — <strong>{subjectDepartment}</strong> Department</>
                )}
              </p>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Subject ID</th>
                      <th>Subject name</th>
                      <th>Code</th>
                      <th>Class</th>
                      <th>Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleSubjects.map((subject) => (
                      <tr key={subject.id}>
                        <td className="admin-id">{subject.id}</td>
                        <td><strong>{subject.name}</strong></td>
                        <td>{subject.code}</td>
                        <td>{subject.className}</td>
                        <td>{subject.department || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {visibleSubjects.length === 0 && <EmptyState text="No subjects found for this class and department." />}
            </section>
          )}

          {/* ENROLLMENTS */}
          {activePage === "Enrollments" && (
            <section className="admin-panel">
              <PanelHeading
                title="Student enrollments"
                subtitle={`${enrollments.length} enrollments`}
                search={search}
                setSearch={setSearch}
                action={() => {
                  setEnrollmentForm({ student: "", className: "JSS1", department: "", term: "First Term" });
                  setModal("enrollment");
                }}
                actionLabel="Enroll student"
              />
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Enrollment ID</th>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Department</th>
                      <th>Term</th>
                      <th>Session</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered(enrollments, ["id", "student", "className", "department", "term", "session"]).map((item) => (
                      <tr key={item.id}>
                        <td className="admin-id">{item.id}</td>
                        <td><strong>{item.student}</strong></td>
                        <td>{item.className}</td>
                        <td>{item.department || "—"}</td>
                        <td>{item.term}</td>
                        <td>{item.session}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {enrollments.length === 0 && (
                <EmptyState text="No enrollments yet. Enroll students individually or use Enroll All." />
              )}
              <div className="admin-enroll-all-footer">
                <span>Enroll all {students.length} students for First Term, {CURRENT_ACADEMIC_YEAR}.</span>
                <button type="button" className="admin-primary-button" onClick={enrollAllStudents} disabled={students.length === 0}>
                  <UserPlus size={17} />
                  Enroll All
                </button>
              </div>
            </section>
          )}

          {/* SUBMIT SCORES */}
          {activePage === "Submit Scores" && (
            <section className="admin-panel">
              <PanelHeading
                title="Score records"
                subtitle="Continuous assessment: 40 marks | Examination: 60 marks"
                search={search}
                setSearch={setSearch}
                action={() => {
                  setScoreForm({
                    student: "",
                    subject: "",
                    test1: "",
                    test2: "",
                    test3: "",
                    assignment: "",
                    exam: "",
                    term: "First Term",
                    academicYear: CURRENT_ACADEMIC_YEAR,
                    noInClass: "",
                  });
                  setModal("score");
                }}
                actionLabel="Submit score"
              />
              <ClassificationFilter
                selectedClass={scoreClass}
                setSelectedClass={(v) => {
                  setScoreClass(v);
                  setScoreDepartment("Science");
                }}
                selectedDepartment={scoreDepartment}
                setSelectedDepartment={setScoreDepartment}
              />
              <p className="admin-classification-note">
                Showing scores for <strong>{scoreClass}</strong>
                {isSeniorClass(scoreClass) && (
                  <> — <strong>{scoreDepartment}</strong> Department</>
                )}
              </p>
              <ScoreTable
                scores={filtered(
                  scores.filter(
                    (s) =>
                      s.className === scoreClass &&
                      (!isSeniorClass(scoreClass) || s.department === scoreDepartment)
                  ),
                  ["studentName", "admissionNumber", "subjectName", "subjectCode", "term", "academicYear"]
                )}
              />
            </section>
          )}

          {/* STUDENT RESULTS */}
          {activePage === "Student Results" && (
            <section className="admin-panel">
              <PanelHeading
                title="Student terminal results"
                subtitle="Subject grades, overall averages and automatically generated comments."
                search={search}
                setSearch={setSearch}
              />
              <ClassificationFilter
                selectedClass={resultClass}
                setSelectedClass={(v) => {
                  setResultClass(v);
                  setResultDepartment("Science");
                }}
                selectedDepartment={resultDepartment}
                setSelectedDepartment={setResultDepartment}
              />
              <div className="admin-form-two admin-results-filters">
                <FormField label="Academic term">
                  <select value={resultTerm} onChange={(e) => setResultTerm(e.target.value)}>
                    <option>First Term</option>
                    <option>Second Term</option>
                    <option>Third Term</option>
                  </select>
                </FormField>
                <FormField label="Academic year">
                  <input value={resultAcademicYear} onChange={(e) => setResultAcademicYear(e.target.value)} placeholder="2025/2026" />
                </FormField>
              </div>
              <p className="admin-classification-note">
                Showing results for <strong>{resultClass}</strong>
                {isSeniorClass(resultClass) && (
                  <> — <strong>{resultDepartment}</strong> Department</>
                )}
                {" "}· {resultTerm}, {resultAcademicYear}
              </p>
              {groupedResults.length === 0 ? (
                <EmptyState text="No student results found for this selection." />
              ) : (
                <div className="admin-overall-results">
                  {groupedResults.map((result) => (
                    <article className="admin-panel admin-student-result-card" key={`${result.studentId}-${result.term}-${result.academicYear}`}>
                      <div className="admin-panel-heading">
                        <div>
                          <h3>{result.studentName}</h3>
                          <p>
                            {result.studentId} · {result.className}
                            {result.department ? ` · ${result.department}` : ""}
                          </p>
                          <p>{result.term} · {result.academicYear}</p>
                        </div>
                        <div className="admin-result-average">
                          <span>Terminal average</span>
                          <strong>{result.average.toFixed(2)}%</strong>
                        </div>
                      </div>
                      <div className="admin-table-wrap">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Subject</th>
                              <th>Test 1</th>
                              <th>Test 2</th>
                              <th>Test 3</th>
                              <th>Assignment</th>
                              <th>CA / 40</th>
                              <th>Exam / 60</th>
                              <th>Total / 100</th>
                              <th>Grade</th>
                              <th>Remark</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.scores.map((score) => {
                              const ca =
                                Number(score.test1 || 0) +
                                Number(score.test2 || 0) +
                                Number(score.test3 || 0) +
                                Number(score.assignment || 0);
                              return (
                                <tr key={score.id}>
                                  <td><strong>{score.subjectName}</strong></td>
                                  <td>{score.test1}</td>
                                  <td>{score.test2}</td>
                                  <td>{score.test3}</td>
                                  <td>{score.assignment}</td>
                                  <td>{ca}</td>
                                  <td>{score.exam}</td>
                                  <td><strong>{score.totalScore}</strong></td>
                                  <td><strong>{score.grade}</strong></td>
                                  <td>{score.remark}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="admin-result-comments" style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
                        <div style={{ width: "100%" }}>
                          <div className="admin-result-comment-heading">
                            <School size={18} />
                            <strong>Admin's Comment</strong>
                          </div>
                          <p>{result.adminComment}</p>
                        </div>
                        <div style={{ width: "100%" }}>
                          <div className="admin-result-comment-heading">
                            <GraduationCap size={18} />
                            <strong>Year Tutor's Comment</strong>
                          </div>
                          <p>{result.yearTutorComment}</p>
                        </div>
                        <div style={{ width: "100%" }}>
                          <div className="admin-result-comment-heading">
                            <FileText size={18} />
                            <strong>Subjects Recorded</strong>
                          </div>
                          <p>{result.subjectCount}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ACADEMIC TERMS */}
          {activePage === "Academic Terms" && (
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h3>Academic terms</h3>
                  <p>Lock or unlock terms and independently publish or unpublish completed terms.</p>
                </div>
              </div>
              <div className="admin-term-management">
                {terms.map((term) => (
                  <div className="admin-term-card" key={term.id}>
                    <div className="admin-term-card-icon">
                      <CalendarDays size={22} />
                    </div>
                    <div className="admin-term-card-info">
                      <strong>{term.name}</strong>
                      <span>{term.session}</span>
                      <div className="admin-term-statuses">
                        <span className={`admin-status ${term.isLocked ? "locked" : "open"}`}>
                          {term.isLocked ? "Locked" : "Unlocked"}
                        </span>
                        <span className={`admin-status ${term.isPublished ? "published" : "open"}`}>
                          {term.isPublished ? "Published" : "Unpublished"}
                        </span>
                      </div>
                    </div>
                    <div className="admin-term-actions">
                      <button type="button" className="admin-secondary-button" onClick={() => toggleTerm(term.id)}>
                        {term.isLocked ? <Unlock size={15} /> : <Lock size={15} />}
                        {term.isLocked ? "Unlock" : "Lock"}
                      </button>
                      <button type="button" className="admin-primary-button" onClick={() => publishTerm(term.id)}>
                        {term.isPublished ? <X size={15} /> : <CheckCircle2 size={15} />}
                        {term.isPublished ? "Unpublish" : "Publish"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* PROMOTE STUDENTS */}
          {activePage === "Promote Students" && (
            <section className="admin-panel">
              <PanelHeading
                title="Student promotion"
                subtitle="Select the current class and destination class to promote students."
                search={search}
                setSearch={setSearch}
              />
              <div className="admin-promotion-selection">
                <div className="admin-classification-group">
                  <h4>1. Select current class</h4>
                  <ClassificationFilter
                    selectedClass={promotionClass}
                    setSelectedClass={(v) => {
                      setPromotionClass(v);
                      setPromotionDepartment("Science");
                      setDestinationClass(getNextClass(v));
                      setDestinationDepartment("Science");
                    }}
                    selectedDepartment={promotionDepartment}
                    setSelectedDepartment={setPromotionDepartment}
                  />
                </div>
                <div className="admin-classification-group">
                  <h4>2. Select destination class</h4>
                  <div className="admin-classification-controls">
                    <label className="admin-form-field">
                      <span>Destination class</span>
                      <select
                        value={destinationClass}
                        onChange={(e) => {
                          setDestinationClass(e.target.value);
                          setDestinationDepartment("Science");
                        }}
                      >
                        {secondaryClasses.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    {isSeniorClass(destinationClass) && (
                      <label className="admin-form-field">
                        <span>Destination department</span>
                        <select value={destinationDepartment} onChange={(e) => setDestinationDepartment(e.target.value)}>
                          {departments.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                </div>
              </div>
              <p className="admin-classification-note">
                Students in <strong>{promotionClass}</strong>
                {isSeniorClass(promotionClass) && (
                  <> — <strong>{promotionDepartment}</strong> Department</>
                )}
                {" "}will be moved to <strong>{destinationClass}</strong>
                {isSeniorClass(destinationClass) && (
                  <> — <strong>{destinationDepartment}</strong> Department</>
                )}.
              </p>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Student name</th>
                      <th>Current class</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered(promotionStudents, ["id", "name", "className", "department"]).map((student) => (
                      <tr key={student.id}>
                        <td className="admin-id">{student.admissionNumber || student.id}</td>
                        <td><strong>{student.name}</strong></td>
                        <td>{student.className}</td>
                        <td>{student.department || "—"}</td>
                        <td>
                          <span className={`admin-status ${student.status === "Promoted" ? "published" : "open"}`}>
                            {student.status}
                          </span>
                        </td>
                        <td>
                          <button className="admin-table-action" onClick={() => promoteStudent(student.id)}>
                            <TrendingUp size={15} />
                            Promote
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {promotionStudents.length === 0 && <EmptyState text="No students found in this class and department." />}
            </section>
          )}

          <footer className="admin-content-footer">
            <span>© {new Date().getFullYear()} O'lak Triumph School</span>
            <span>School Administration Portal</span>
          </footer>
        </div>
      </main>

      {notice && (
        <div className="admin-toast">
          <CheckCircle2 size={18} />
          {notice}
        </div>
      )}

      {/* MODALS */}
      {modal && (
        <div className="admin-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModal("")}>
          <div className="admin-modal">
            <div className="admin-modal-heading">
              <div>
                <span className="admin-eyebrow">O'LAK TRIUMPH SCHOOL</span>
                <h3>
                  {modal === "student"
                    ? "Add a student"
                    : modal === "subject"
                    ? "Add a subject"
                    : modal === "enrollment"
                    ? "Enroll a student"
                    : "Submit a score"}
                </h3>
              </div>
              <button onClick={() => setModal("")} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {modal === "student" && (
              <form onSubmit={addStudent}>
                <FormField label="Student full name">
                  <input required value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} placeholder="Enter student's full name" />
                </FormField>
                <FormField label="Admission number">
                  <input required value={studentForm.admissionNumber} onChange={(e) => setStudentForm({ ...studentForm, admissionNumber: e.target.value })} placeholder="e.g. OTS/2025/001" />
                </FormField>
                <FormField label="Password">
                  <input required type="password" value={studentForm.password} onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })} placeholder="Set login password" />
                </FormField>
                <FormField label="Class">
                  <select required value={studentForm.className} onChange={(e) => setStudentForm({ ...studentForm, className: e.target.value, department: "Science" })}>
                    {secondaryClasses.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
                {isSeniorClass(studentForm.className) && (
                  <FormField label="Department">
                    <select required value={studentForm.department} onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}>
                      {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </FormField>
                )}
                <FormField label="Gender">
                  <select value={studentForm.gender} onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}>
                    <option>Female</option>
                    <option>Male</option>
                  </select>
                </FormField>
                <ModalActions onCancel={() => setModal("")} />
              </form>
            )}

            {modal === "subject" && (
              <form onSubmit={addSubject}>
                <FormField label="Subject name">
                  <input required value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="e.g. Mathematics" />
                </FormField>
                <FormField label="Subject code">
                  <input required value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })} placeholder="e.g. MTH" />
                </FormField>
                <FormField label="Class">
                  <select required value={subjectForm.className} onChange={(e) => setSubjectForm({ ...subjectForm, className: e.target.value, department: "Science" })}>
                    {secondaryClasses.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
                {isSeniorClass(subjectForm.className) && (
                  <FormField label="Department">
                    <select required value={subjectForm.department} onChange={(e) => setSubjectForm({ ...subjectForm, department: e.target.value })}>
                      {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </FormField>
                )}
                <ModalActions onCancel={() => setModal("")} />
              </form>
            )}

            {modal === "enrollment" && (
              <form onSubmit={addEnrollment}>
                <FormField label="Student full name">
                  <input required value={enrollmentForm.student} onChange={(e) => setEnrollmentForm({ ...enrollmentForm, student: e.target.value })} placeholder="Enter student's full name" />
                </FormField>
                <FormField label="Class">
                  <select required value={enrollmentForm.className} onChange={(e) => setEnrollmentForm({ ...enrollmentForm, className: e.target.value, department: "" })}>
                    {enrollmentClassOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
                {isSeniorClass(enrollmentForm.className) && (
                  <FormField label="Department">
                    <select required value={enrollmentForm.department} onChange={(e) => setEnrollmentForm({ ...enrollmentForm, department: e.target.value })}>
                      <option value="">Select department</option>
                      {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </FormField>
                )}
                <FormField label="Term">
                  <select value={enrollmentForm.term} onChange={(e) => setEnrollmentForm({ ...enrollmentForm, term: e.target.value })}>
                    <option>First Term</option>
                    <option>Second Term</option>
                    <option>Third Term</option>
                  </select>
                </FormField>
                <ModalActions onCancel={() => setModal("")} submitLabel="Enroll student" />
              </form>
            )}

            {modal === "score" && (
              <form onSubmit={addScore}>
                <div className="admin-score-class-summary">
                  <strong>{scoreClass}</strong>
                  {isSeniorClass(scoreClass) && <span>{scoreDepartment} Department</span>}
                </div>
                <FormField label="Student">
                  <select required value={scoreForm.student} onChange={(e) => setScoreForm({ ...scoreForm, student: e.target.value })}>
                    <option value="">Select a student</option>
                    {scoreStudents.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.admissionNumber})</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Subject">
                  <select required value={scoreForm.subject} onChange={(e) => setScoreForm({ ...scoreForm, subject: e.target.value })}>
                    <option value="">Select a subject</option>
                    {scoreSubjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </FormField>
                <div className="admin-form-two">
                  <FormField label="Academic term">
                    <select required value={scoreForm.term} onChange={(e) => setScoreForm({ ...scoreForm, term: e.target.value })}>
                      <option>First Term</option>
                      <option>Second Term</option>
                      <option>Third Term</option>
                    </select>
                  </FormField>
                  <FormField label="Academic year">
                    <input required value={scoreForm.academicYear} onChange={(e) => setScoreForm({ ...scoreForm, academicYear: e.target.value })} placeholder="2025/2026" />
                  </FormField>
                </div>
                <div className="admin-score-section-heading">
                  <strong>CONTINUOUS ASSESSMENT</strong>
                  <span>Maximum: 40 marks</span>
                </div>
                <div className="admin-form-two">
                  {[
                    ["test1", "First test (0–10)"],
                    ["test2", "Second test (0–10)"],
                    ["test3", "Third test (0–10)"],
                    ["assignment", "Assignment (0–10)"],
                  ].map(([field, label]) => (
                    <FormField label={label} key={field}>
                      <input required type="number" min="0" max="10" step="0.01" value={scoreForm[field]} onChange={(e) => setScoreForm({ ...scoreForm, [field]: e.target.value })} />
                    </FormField>
                  ))}
                </div>
                <div className="admin-score-section-heading">
                  <strong>EXAMINATION</strong>
                  <span>Maximum: 60 marks</span>
                </div>
                <FormField label="Examination score (0–60)">
                  <input required type="number" min="0" max="60" step="0.01" value={scoreForm.exam} onChange={(e) => setScoreForm({ ...scoreForm, exam: e.target.value })} />
                </FormField>
                <FormField label="Manual class position (optional)">
                  <input type="number" min="1" step="1" value={scoreForm.noInClass} onChange={(e) => setScoreForm({ ...scoreForm, noInClass: e.target.value })} placeholder="Enter position if manually assigned" />
                </FormField>
                <div className="admin-score-calculation">
                  <div><span>Continuous assessment</span><strong>{scoreCA.toFixed(2)} / 40</strong></div>
                  <div><span>Total score</span><strong>{scoreTotal.toFixed(2)} / 100</strong></div>
                  {liveGrade && (
                    <>
                      <div><span>Calculated grade</span><strong>{liveGrade.grade}</strong></div>
                      <div><span>Subject remark</span><strong>{liveGrade.remark}</strong></div>
                    </>
                  )}
                </div>
                <ModalActions onCancel={() => setModal("")} submitLabel="Save score" />
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ClassificationFilter({ selectedClass, setSelectedClass, selectedDepartment, setSelectedDepartment }) {
  return (
    <div className="admin-classification-controls">
      <label className="admin-form-field">
        <span>Select class</span>
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          {secondaryClasses.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      {isSeniorClass(selectedClass) && (
        <label className="admin-form-field">
          <span>Select department</span>
          <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
      )}
    </div>
  );
}

function PanelHeading({ title, subtitle, search, setSearch, action, actionLabel }) {
  return (
    <div className="admin-panel-heading admin-panel-heading-wrap">
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <div className="admin-panel-tools">
        {typeof search === "string" && (
          <div className="admin-search">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records..." />
          </div>
        )}
        {action && (
          <button className="admin-primary-button" onClick={action}>
            <Plus size={17} />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function StudentTable({ students, onDelete, compact }) {
  if (!students.length) return <EmptyState text="No student records found for this class and department." />;
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Admission No.</th>
            <th>Student name</th>
            <th>Class</th>
            <th>Department</th>
            <th>Gender</th>
            <th>Status</th>
            {!compact && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td className="admin-id">{student.admissionNumber || student.id}</td>
              <td><strong>{student.name}</strong></td>
              <td>{student.className}</td>
              <td>{student.department || "—"}</td>
              <td>{student.gender}</td>
              <td>
                <span className={`admin-status ${student.status === "Promoted" ? "published" : "open"}`}>
                  {student.status}
                </span>
              </td>
              {!compact && (
                <td>
                  <button className="admin-icon-action danger" title="Delete student" onClick={() => onDelete(student.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScoreTable({ scores }) {
  if (!scores.length) return <EmptyState text="No score records found for this selection." />;
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Subject</th>
            <th>Term</th>
            <th>Academic year</th>
            <th>Test 1 / 10</th>
            <th>Test 2 / 10</th>
            <th>Test 3 / 10</th>
            <th>Assignment / 10</th>
            <th>CA / 40</th>
            <th>Exam / 60</th>
            <th>Total / 100</th>
            <th>Grade</th>
            <th>Remark</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score) => {
            const ca =
              Number(score.test1 || 0) +
              Number(score.test2 || 0) +
              Number(score.test3 || 0) +
              Number(score.assignment || 0);
            return (
              <tr key={score.id}>
                <td><strong>{score.studentName || score.student}</strong></td>
                <td>{score.subjectName || score.subject}</td>
                <td>{score.term}</td>
                <td>{score.academicYear}</td>
                <td>{score.test1}</td>
                <td>{score.test2}</td>
                <td>{score.test3}</td>
                <td>{score.assignment}</td>
                <td>{ca}</td>
                <td>{score.exam}</td>
                <td><strong>{score.totalScore}</strong></td>
                <td><strong>{score.grade || "—"}</strong></td>
                <td>{score.remark || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label className="admin-form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ModalActions({ onCancel, submitLabel = "Save record" }) {
  return (
    <div className="admin-modal-actions">
      <button type="button" className="admin-secondary-button" onClick={onCancel}>Cancel</button>
      <button type="submit" className="admin-primary-button">{submitLabel}</button>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="admin-empty">
      <FileText size={28} />
      <p>{text}</p>
    </div>
  );
}

export default AdminDashboard;