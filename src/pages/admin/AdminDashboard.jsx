import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserPlus,
  ClipboardList,
  GraduationCap,
  CalendarDays,
  TrendingUp,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Lock,
  Unlock,
  CheckCircle2,
  School,
  ArrowUpRight,
  FileText,
  Eye,
  Download,
  ArrowLeft,
} from "lucide-react";

import jsPDF from "jspdf";

import api from "../../api/axios";
import { logout } from "../../api/auth";
import { normalizeStudent } from "../../utils/normalizeStudent";
import { normalizeSubject } from "../../utils/normalizeSubject";

import {
  getAutomaticYearTutorComment,
  getAutomaticAdminComment,
} from "../../utils/gradeUtils";

import {
  departments,
  juniorClasses,
  secondaryClasses,
  requiresDepartment,
} from "../../utils/allowedClasses";

import AdminNotice from "../../components/admin/AdminNotice";
import AdminModal from "../../components/admin/AdminModal";
import PanelHeading from "../../components/admin/PanelHeading";
import ClassificationFilter from "../../components/admin/ClassificationFilter";
import { StudentTable } from "../../components/admin/AdminTable";
import FormField from "../../components/admin/FormField";
import EmptyState from "../../components/admin/EmptyState";

import Overview from "./Overview";

import "./AdminDashboard.css";
import schoolLogo from "../../assets/logo.jpeg";
import schoolStamp from "../../assets/stamp.jpeg";

// ======================================================
// CONSTANTS
// ======================================================

const enrollmentClassOptions = [...secondaryClasses];

const subjectAssignmentOptions = [
  ...juniorClasses.map((className) => ({
    className,
    department: null,
  })),
  { className: "SS1", department: null },
  ...["SS2", "SS3"].flatMap((className) =>
    departments.map((department) => ({
      className,
      department,
    }))
  ),
];

const CURRENT_ACADEMIC_YEAR = "2026/2027";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Students", icon: Users },
  { label: "Subjects", icon: BookOpen },
  { label: "Enrollments", icon: UserPlus },
  { label: "Submit Scores", icon: ClipboardList },
  { label: "Student Results", icon: GraduationCap },
  { label: "Academic Terms", icon: CalendarDays },
  { label: "Result Locks", icon: Lock },
  { label: "Promote Students", icon: TrendingUp },
];

// ======================================================
// HELPERS
// ======================================================

function normalizeDepartment(department) {
  if (!department) return null;

  const normalized = String(department).trim().toLowerCase();

  if (normalized === "science") return "Science";
  if (normalized === "art" || normalized === "arts") return "Arts";
  if (normalized === "commercial") return "Commercial";

  return department;
}

function getNextClass(className) {
  const normalizedClass = String(className || "").trim().toUpperCase();
  const index = secondaryClasses.indexOf(normalizedClass);

  if (index < 0 || index >= secondaryClasses.length - 1) {
    return normalizedClass;
  }

  return secondaryClasses[index + 1];
}

function formatSubjectAssignments(assignments = []) {
  if (!assignments.length) return "Not assigned";

  return assignments
    .map(({ className, department }) =>
      department ? `${className} — ${department}` : className
    )
    .join(", ");
}

function getReferenceId(reference) {
  if (!reference) return "";

  if (typeof reference === "object") {
    return String(reference._id || reference.id || "");
  }

  return String(reference);
}

function normalizeGrade(grade = {}) {
  const student =
    grade.student && typeof grade.student === "object"
      ? grade.student
      : {};

  const subject =
    grade.subject && typeof grade.subject === "object"
      ? grade.subject
      : {};

  const className =
    student.currentClass ||
    student.className ||
    student.class ||
    "";

  return {
    id: String(grade._id || grade.id || ""),

    student: getReferenceId(grade.student),

    studentName:
      student.name ||
      student.fullName ||
      `${student.firstName || ""} ${student.surname || ""}`.trim() ||
      "Name unavailable",

    admissionNumber: student.admissionNumber || "",

    className,

    department: requiresDepartment(className)
      ? student.department || ""
      : "",

    subject: getReferenceId(grade.subject),

    subjectName:
      subject.subjectName || subject.name || "Unknown subject",

    subjectCode:
      subject.subjectCode || subject.code || "",

    term: grade.term || "",
    academicYear: grade.academicYear || "",

    // Keep null when not submitted — do NOT coerce missing values to 0
    test1:
      grade.test1 === null || grade.test1 === undefined || grade.test1 === ""
        ? null
        : Number(grade.test1),
    test2:
      grade.test2 === null || grade.test2 === undefined || grade.test2 === ""
        ? null
        : Number(grade.test2),
    notes:
      grade.notes === null || grade.notes === undefined || grade.notes === ""
        ? null
        : Number(grade.notes),
    oral:
      grade.oral === null || grade.oral === undefined || grade.oral === ""
        ? null
        : Number(grade.oral),
    test3:
      grade.test3 === null || grade.test3 === undefined || grade.test3 === ""
        ? null
        : Number(grade.test3),
    assignment:
      grade.assignment === null ||
      grade.assignment === undefined ||
      grade.assignment === ""
        ? null
        : Number(grade.assignment),
    exam: (() => {
      const raw =
        grade.exam ??
        grade.examination ??
        grade.examScore ??
        grade.examMark ??
        grade.examMarks ??
        grade.examinationScore;
      if (raw === null || raw === undefined || raw === "") return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    })(),
    ca: (() => {
      const raw = grade.ca ?? grade.caTotal ?? grade.continuousAssessment;
      if (raw === null || raw === undefined || raw === "") return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    })(),

    // Submission statuses (may be missing on older records)
    caSubmitted: grade.caSubmitted === true,
    examSubmitted: grade.examSubmitted === true,

    totalScore:
      grade.totalScore === null || grade.totalScore === undefined
        ? null
        : Number(grade.totalScore),

    grade: grade.grade || "",
    remark: grade.remark || "",

    noInClass: grade.manualNoInClass ?? grade.noInClass ?? null,
  };
}

// ======================================================
// MAIN DASHBOARD
// ======================================================

function AdminDashboard() {
  // ----------------------------------------------------
  // NAVIGATION AND GENERAL STATE
  // ----------------------------------------------------

  const [activePage, setActivePage] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [scores, setScores] = useState([]);

  const [modal, setModal] = useState("");
  const [notice, setNotice] = useState("");

  // Student registration credentials
  const [createdStudentCredentials, setCreatedStudentCredentials] =
    useState(null);

  const [registeringStudent, setRegisteringStudent] = useState(false);

  // ----------------------------------------------------
  // ACADEMIC TERMS
  // ----------------------------------------------------

  const [terms, setTerms] = useState([
    {
      id: "TERM001",
      name: "First Term",
      session: CURRENT_ACADEMIC_YEAR,
      isLocked: false,
      isPublished: false,
    },
    {
      id: "TERM002",
      name: "Second Term",
      session: CURRENT_ACADEMIC_YEAR,
      isLocked: false,
      isPublished: false,
    },
    {
      id: "TERM003",
      name: "Third Term",
      session: CURRENT_ACADEMIC_YEAR,
      isLocked: false,
      isPublished: false,
    },
  ]);

  const [publishingTermId, setPublishingTermId] = useState(null);

  // ----------------------------------------------------
  // ACADEMIC SESSION (global picker)
  // ----------------------------------------------------

  const [selectedAcademicYear, setSelectedAcademicYear] = useState(
    CURRENT_ACADEMIC_YEAR
  );
  const [availableSessions, setAvailableSessions] = useState([
    "2025/2026",
    "2026/2027",
  ]);
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);
  const [newSessionInput, setNewSessionInput] = useState("");

  // ----------------------------------------------------
  // FILTER STATE
  // ----------------------------------------------------

  const [studentClass, setStudentClass] = useState("All");
  const [studentDepartment, setStudentDepartment] = useState("Science");

  const [subjectClass, setSubjectClass] = useState("All");
  const [subjectDepartment, setSubjectDepartment] = useState("Science");

  const [scoreClass, setScoreClass] = useState("JSS1");
  const [scoreDepartment, setScoreDepartment] = useState("Science");

  const [resultClass, setResultClass] = useState("JSS1");
  const [resultDepartment, setResultDepartment] = useState("Science");
  const [resultTerm, setResultTerm] = useState("First Term");
  const [resultAcademicYear, setResultAcademicYear] = useState(
    CURRENT_ACADEMIC_YEAR
  );

  // Individual student result sheet (Student Results page)
  const [selectedResultStudentId, setSelectedResultStudentId] =
    useState(null);

  const [promotionClass, setPromotionClass] = useState("JSS1");
  const [promotionDepartment, setPromotionDepartment] = useState("Science");
  const [destinationClass, setDestinationClass] = useState("JSS2");
  const [destinationDepartment, setDestinationDepartment] = useState("Science");

  // ----------------------------------------------------
  // FORMS
  // ----------------------------------------------------

  const [studentForm, setStudentForm] = useState({
    firstName: "",
    surname: "",
    email: "",
    className: "JSS1",
    department: "Science",
    gender: "Female",
  });

  const [subjectForm, setSubjectForm] = useState({
    id: null,
    name: "",
    code: "",
    classAssignments: [],
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
  notes: "",
  oral: "",
  exam: "",
  term: "First Term",
  academicYear: CURRENT_ACADEMIC_YEAR,
  noInClass: "",
});

  // ======================================================
  // GENERAL ACTIONS
  // ======================================================

  const showNotice = useCallback((message) => {
    setNotice(message);

    window.setTimeout(() => {
      setNotice("");
    }, 3500);
  }, []);

  const openPage = (page) => {
    if (page === "Result Locks") {
      window.location.href = "/admin/result-locks";
      return;
    }

    setActivePage(page);
    setSearch("");
    setSidebarOpen(false);
    setSelectedResultStudentId(null);
    setSessionMenuOpen(false);
  };

  const selectAcademicSession = (year) => {
    const clean = String(year || "").trim();
    if (!clean) return;

    setSelectedAcademicYear(clean);
    setResultAcademicYear(clean);
    setScoreForm((current) => ({
      ...current,
      academicYear: clean,
    }));
    setTerms((current) =>
      current.map((term) => ({
        ...term,
        session: clean,
        isLocked: false,
        isPublished: false,
      }))
    );
    setSelectedResultStudentId(null);
    setSessionMenuOpen(false);
    showNotice(`Switched to ${clean} academic session.`);
  };

  const addAcademicSession = () => {
    const clean = String(newSessionInput || "").trim();

    if (!clean) {
      showNotice("Enter a session like 2026/2027.");
      return;
    }

    if (!/^\d{4}\/\d{4}$/.test(clean)) {
      showNotice("Use the format YYYY/YYYY, e.g. 2026/2027.");
      return;
    }

    setAvailableSessions((current) => {
      if (current.includes(clean)) return current;
      return [...current, clean].sort();
    });
    setNewSessionInput("");
    selectAcademicSession(clean);
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/admin/login";
  };

  // ======================================================
  // DATA LOADING
  // ======================================================

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        studentsRes,
        subjectsRes,
        gradesRes,
        termStatusesRes,
      ] = await Promise.all([
        api.get("/students"),

        api.get("/subjects").catch((error) => {
          console.error("Subject loading error:", error);
          return { data: { subjects: [] } };
        }),

        api.get("/grades").catch((error) => {
          console.error("Grade loading error:", error);

          showNotice(
            error.response?.data?.message ||
              "Students loaded, but saved grades could not be retrieved."
          );

          return { data: { grades: [] } };
        }),

        api
          .get("/grades/admin/term-statuses", {
            params: {
              academicYear: selectedAcademicYear,
            },
          })
          .catch((error) => {
            console.error("Term status loading error:", error);
            return { data: { statuses: [] } };
          }),
      ]);

      const rawStudents = studentsRes.data;
      const rawSubjects = subjectsRes.data;
      const rawGrades = gradesRes.data;

      const studentList = Array.isArray(rawStudents)
        ? rawStudents
        : rawStudents?.students || rawStudents?.data || [];

      const subjectList = Array.isArray(rawSubjects)
        ? rawSubjects
        : rawSubjects?.subjects || rawSubjects?.data || [];

      const gradeList = Array.isArray(rawGrades)
        ? rawGrades
        : rawGrades?.grades || rawGrades?.data || [];

      const normalizedStudents = studentList.map(normalizeStudent);
      const studentById = new Map(
        normalizedStudents.map((student) => [String(student.id), student])
      );

      const normalizedGrades = gradeList.map((raw) => {
        const grade = normalizeGrade(raw);
        const linked = studentById.get(String(grade.student));

        // Enrich from the students list when grade.student was not populated
        if (linked) {
          return {
            ...grade,
            studentName: grade.studentName && grade.studentName !== "Name unavailable"
              ? grade.studentName
              : linked.name,
            admissionNumber: grade.admissionNumber || linked.admissionNumber || "",
            className: grade.className || linked.className || "",
            department:
              grade.department ||
              (requiresDepartment(linked.className)
                ? linked.department || ""
                : ""),
            gender: linked.gender || grade.gender || "",
          };
        }

        return grade;
      });

      setStudents(normalizedStudents);
      setSubjects(subjectList.map(normalizeSubject));
      setScores(normalizedGrades);

      // Build session list from grades the admin has already worked on
      const yearsFromGrades = [
        ...new Set(
          normalizedGrades
            .map((grade) => String(grade.academicYear || "").trim())
            .filter(Boolean)
        ),
      ];

      setAvailableSessions((current) => {
        const merged = new Set([
          ...current,
          ...yearsFromGrades,
          selectedAcademicYear,
          CURRENT_ACADEMIC_YEAR,
          "2025/2026",
          "2026/2027",
        ]);
        return [...merged].filter(Boolean).sort();
      });

      const savedStatuses = termStatusesRes.data?.statuses || [];

      setTerms((current) =>
        current.map((term) => {
          const savedStatus = savedStatuses.find(
            (status) => status.currentTerm === term.name
          );

          return {
            ...term,
            session: selectedAcademicYear,
            isLocked: savedStatus?.isLocked ?? false,
            isPublished: savedStatus?.isPublished ?? false,
          };
        })
      );
    } catch (err) {
      console.error("Load error:", err);

      showNotice(
        err.response?.data?.message || "Failed to load data from server."
      );

      setStudents([]);
      setSubjects([]);
      setScores([]);
    } finally {
      setLoading(false);
    }
  }, [showNotice, selectedAcademicYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keep forms and result filters in sync with the active session
  useEffect(() => {
    setResultAcademicYear(selectedAcademicYear);
    setScoreForm((current) => ({
      ...current,
      academicYear: selectedAcademicYear,
    }));
  }, [selectedAcademicYear]);

  // Close session menu when clicking outside
  useEffect(() => {
    if (!sessionMenuOpen) return undefined;

    const handleOutside = () => setSessionMenuOpen(false);
    // delay so the opening click does not immediately close it
    const timer = window.setTimeout(() => {
      document.addEventListener("click", handleOutside);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", handleOutside);
    };
  }, [sessionMenuOpen]);

  // ======================================================
  // SEARCH
  // ======================================================

  const filtered = (items, fields) => {
    const query = search.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) =>
      fields.some((field) =>
        String(item[field] ?? "").toLowerCase().includes(query)
      )
    );
  };

  // ======================================================
  // STUDENT ACTIONS
  // ======================================================

  const addStudent = async (event) => {
    event.preventDefault();

    const firstName = studentForm.firstName.trim();
    const surname = studentForm.surname.trim();
    const email = studentForm.email.trim().toLowerCase();

    if (!firstName || !surname || !email) {
      showNotice("Please complete the student's name and email.");
      return;
    }

    const needsDepartment = requiresDepartment(studentForm.className);

    if (needsDepartment && !studentForm.department) {
      showNotice("Please select a department for SS2 or SS3.");
      return;
    }

    try {
      setRegisteringStudent(true);

      const response = await api.post("/students/register", {
        firstName,
        surname,
        email,
        currentClass: studentForm.className,
        department: needsDepartment ? studentForm.department : null,
        gender: studentForm.gender,
      });

      const newStudent = response.data?.student;

      if (!newStudent?.admissionNumber) {
        throw new Error(
          "Student was registered, but the server did not return the generated admission number."
        );
      }

      setCreatedStudentCredentials({
        name: newStudent.name || `${firstName} ${surname}`,
        admissionNumber: newStudent.admissionNumber,
        initialPassword:
          response.data?.initialPassword || surname.toLowerCase(),
      });

      setStudentForm({
        firstName: "",
        surname: "",
        email: "",
        className: "JSS1",
        department: "Science",
        gender: "Female",
      });

      setModal("");

      showNotice("Student registered successfully.");

      await loadData();
    } catch (err) {
      console.error("Student registration error:", err);

      showNotice(
        err.response?.data?.message ||
          err.message ||
          "Failed to register student."
      );
    } finally {
      setRegisteringStudent(false);
    }
  };

  const copyAdmissionNumber = async () => {
    if (!createdStudentCredentials?.admissionNumber) return;

    try {
      await navigator.clipboard.writeText(
        createdStudentCredentials.admissionNumber
      );

      showNotice("Admission number copied successfully.");
    } catch (error) {
      console.error("Copy admission number error:", error);
      showNotice("Unable to copy admission number.");
    }
  };

  const deleteStudent = async (id) => {
    if (!window.confirm("Delete this student permanently?")) return;

    try {
      await api.delete(`/students/${id}`);
      showNotice("Student deleted successfully.");
      await loadData();
    } catch (err) {
      showNotice(
        err.response?.data?.message || "Failed to delete student."
      );
    }
  };

  // ======================================================
  // SUBJECT ACTIONS
  // ======================================================

  const toggleSubjectAssignment = (assignment) => {
    setSubjectForm((current) => {
      const exists = current.classAssignments.some(
        (item) =>
          item.className === assignment.className &&
          (item.department || null) === (assignment.department || null)
      );

      return {
        ...current,
        classAssignments: exists
          ? current.classAssignments.filter(
              (item) =>
                !(
                  item.className === assignment.className &&
                  (item.department || null) ===
                    (assignment.department || null)
                )
            )
          : [...current.classAssignments, assignment],
      };
    });
  };

  const openSubjectEditor = (subject = null) => {
    setSubjectForm(
      subject
        ? {
            id: subject.id,
            name: subject.name,
            code: subject.code,
            classAssignments: subject.classAssignments.map((item) => ({
              className: item.className,
              department: requiresDepartment(item.className)
                ? item.department || null
                : null,
            })),
          }
        : {
            id: null,
            name: "",
            code: "",
            classAssignments: [],
          }
    );

    setModal("subject");
  };

  const addSubject = async (event) => {
    event.preventDefault();

    if (
      !subjectForm.id &&
      (!subjectForm.name.trim() || !subjectForm.code.trim())
    ) {
      showNotice("Please enter subject name and code.");
      return;
    }

    if (!subjectForm.classAssignments.length) {
      showNotice(
        "Select at least one class or class/department assignment."
      );
      return;
    }

    const classAssignments = subjectForm.classAssignments.map((item) => ({
      className: item.className,
      department: requiresDepartment(item.className)
        ? normalizeDepartment(item.department)
        : null,
    }));

    if (
      classAssignments.some(
        (item) =>
          requiresDepartment(item.className) && !item.department
      )
    ) {
      showNotice("SS2 and SS3 subject assignments require a department.");
      return;
    }

    try {
      if (subjectForm.id) {
        await api.patch(
          `/subjects/${subjectForm.id}/assignments`,
          { classAssignments }
        );

        showNotice("Subject assignments updated successfully.");
      } else {
        await api.post("/subjects", {
          subjectName: subjectForm.name.trim(),
          subjectCode: subjectForm.code.trim().toUpperCase(),
          classAssignments,
        });

        showNotice("Subject created successfully.");
      }

      setModal("");

      setSubjectForm({
        id: null,
        name: "",
        code: "",
        classAssignments: [],
      });

      await loadData();
    } catch (err) {
      showNotice(
        err.response?.data?.message ||
          "Failed to save subject. Check the server and try again."
      );
    }
  };

  // ======================================================
  // ENROLLMENT ACTIONS
  // ======================================================

  const addEnrollment = (event) => {
    event.preventDefault();

    const studentName = enrollmentForm.student.trim();

    if (!studentName) {
      showNotice("Please enter the student's full name.");
      return;
    }

    const needsDepartment = requiresDepartment(enrollmentForm.className);
    const department = needsDepartment ? enrollmentForm.department : "";

    if (needsDepartment && !department) {
      showNotice("Please select a department for SS2 or SS3.");
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
        session: selectedAcademicYear,
      },
    ]);

    setEnrollmentForm({
      student: "",
      className: "JSS1",
      department: "",
      term: "First Term",
    });

    setModal("");
    showNotice("Enrollment added (local preview).");
  };

  const enrollAllStudents = () => {
    if (!students.length) {
      showNotice("No students available to enroll.");
      return;
    }

    const newOnes = students.map((student, index) => ({
      id: `ENR${Date.now()}${index}`,
      studentId: student.id,
      student: student.name,
      className: student.className,
      department: requiresDepartment(student.className)
        ? student.department || ""
        : "",
      term: "First Term",
      session: selectedAcademicYear,
    }));

    setEnrollments((current) => [...current, ...newOnes]);

    showNotice(`${newOnes.length} students enrolled (local preview).`);
  };

// ======================================================
// SCORE ACTIONS
// ======================================================

const submitComponentScores = async (event, payload) => {
    event.preventDefault();

    const {
      student: studentId,
      term,
      academicYear,
      noInClass,
      componentType,
      scores: subjectScores,
    } = payload;

    if (!studentId) {
      showNotice("Please select a student.");
      return;
    }

    if (!subjectScores?.length) {
      showNotice("No subjects found for this student.");
      return;
    }

    if (!academicYear?.trim()) {
      showNotice("Please enter the academic year.");
      return;
    }

    if (!["CA", "Exam"].includes(componentType)) {
      showNotice("Invalid score component selected.");
      return;
    }

    if (
      noInClass !== "" &&
      noInClass !== undefined &&
      (!Number.isInteger(Number(noInClass)) || Number(noInClass) < 1)
    ) {
      showNotice("Class position must be a positive whole number.");
      return;
    }

    const selectedStudent = students.find(
      (student) => String(student.id) === String(studentId)
    );

    if (!selectedStudent) {
      showNotice("Selected student could not be found.");
      return;
    }

    for (const item of subjectScores) {
      const selectedSubject = subjects.find(
        (subject) => String(subject.id) === String(item.subject)
      );

      if (!selectedSubject) {
        showNotice("One of the selected subjects could not be found.");
        return;
      }

      const assignments = selectedSubject.classAssignments || [];
      const isAssigned =
        !assignments.length ||
        assignments.some((assignment) => {
          if (assignment.className !== selectedStudent.className) {
            return false;
          }

          if (requiresDepartment(selectedStudent.className)) {
            return (
              normalizeDepartment(assignment.department) ===
              normalizeDepartment(selectedStudent.department)
            );
          }

          return true;
        });

      if (!isAssigned) {
        showNotice(
          `${selectedSubject.name} is not assigned to ${selectedStudent.className}. Assign the subject to this class under Subjects first.`
        );
        return;
      }

      const limits =
        componentType === "CA"
          ? { test1: 10, test2: 20, notes: 5, oral: 5 }
          : { exam: 60 };

      for (const [field, maximum] of Object.entries(limits)) {
        const value = item[field];

        if (
          value === "" ||
          value === undefined ||
          value === null ||
          !Number.isFinite(Number(value))
        ) {
          showNotice(
            `Please enter every ${componentType} score for ${selectedSubject.name}.`
          );
          return;
        }

        if (Number(value) < 0 || Number(value) > maximum) {
          showNotice(
            `${selectedSubject.name}: ${field} must be between 0 and ${maximum}.`
          );
          return;
        }
      }
    }

    const requestScores = subjectScores.map((item) => {
      const selectedSubject = subjects.find(
        (subject) => String(subject.id) === String(item.subject)
      );

      if (componentType === "CA") {
        return {
          subject: item.subject,
          subjectCode: selectedSubject?.code || selectedSubject?.subjectCode,
          test1: Number(item.test1),
          test2: Number(item.test2),
          notes: Number(item.notes),
          oral: Number(item.oral),
        };
      }

      return {
        subject: item.subject,
        subjectCode: selectedSubject?.code || selectedSubject?.subjectCode,
        exam: Number(item.exam),
      };
    });

    const endpoint =
      componentType === "CA" ? "/grades/submit-ca" : "/grades/submit-exam";

    const body = {
      student: studentId,
      admissionNumber: selectedStudent.admissionNumber,
      term,
      academicYear: academicYear.trim(),
      noInClass:
        noInClass === "" || noInClass === undefined
          ? undefined
          : Number(noInClass),
      scores: requestScores,
    };

    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token) {
        showNotice("You are not logged in. Please log in as admin again.");
        return;
      }

      if (role && role !== "admin" && role !== "teacher") {
        showNotice(
          `Score entry requires admin or teacher. Current role is "${role}".`
        );
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      let response;
      try {
        response = await api.post(endpoint, body, { headers });
      } catch (firstError) {
        if (firstError.response?.status === 404) {
          const fallback =
            componentType === "CA" ? "/grades/ca" : "/grades/exam";
          response = await api.post(fallback, body, { headers });
        } else {
          throw firstError;
        }
      }

      await loadData();

      setScoreForm({
        student: "",
        subject: "",
        test1: "",
        test2: "",
        notes: "",
        oral: "",
        exam: "",
        term: "First Term",
        academicYear: selectedAcademicYear,
        noInClass: "",
      });

      setModal("");

      showNotice(
        response?.data?.message ||
          (componentType === "CA"
            ? "All CA scores submitted successfully."
            : "All examination scores submitted successfully.")
      );
    } catch (error) {
      console.error("Score submission error:", error);
      console.error("Response:", error.response?.data);
      console.error("Payload sent:", body);

      const data = error.response?.data;
      const detail =
        data?.message ||
        data?.error ||
        (Array.isArray(data?.errors)
          ? data.errors.map((e) => e.msg || e.message || String(e)).join("; ")
          : null) ||
        (typeof data === "string" ? data : null) ||
        error.message ||
        `Failed to submit ${componentType} scores.`;

      showNotice(detail);
    }
  };


  // ======================================================
  // ACADEMIC TERM ACTIONS
  // ======================================================

  const getAdminAuthHeaders = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      throw new Error("You are not logged in. Please log in as admin again.");
    }

    if (role && role !== "admin") {
      throw new Error(
        `This action requires an admin account. Current role is "${role}". Log out and log in at /admin/login.`
      );
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const toggleTerm = async (id) => {
    const term = terms.find((item) => item.id === id);
    if (!term) return;

    const nextLockedState = !term.isLocked;

    try {
      const headers = getAdminAuthHeaders();

      // Prefer admin paths; fall back if backend uses alternate method/path
      try {
        await api.patch(
          "/grades/admin/toggle-lock",
          {
            academicYear: term.session || selectedAcademicYear,
            currentTerm: term.name,
            isLocked: nextLockedState,
          },
          { headers }
        );
      } catch (firstError) {
        const status = firstError.response?.status;
        const msg = firstError.response?.data?.message || "";

        // Fallback: POST same path (some servers only registered POST)
        if (status === 404 || status === 405) {
          await api.post(
            "/grades/admin/toggle-lock",
            {
              academicYear: term.session || selectedAcademicYear,
              currentTerm: term.name,
              isLocked: nextLockedState,
            },
            { headers }
          );
        } else {
          throw firstError;
        }
      }

      setTerms((current) =>
        current.map((item) =>
          item.id === id ? { ...item, isLocked: nextLockedState } : item
        )
      );

      showNotice(
        `Term ${term.name} ${
          nextLockedState ? "locked" : "unlocked"
        } successfully.`
      );
    } catch (err) {
      console.error("toggleTerm error:", err.response?.data || err.message);
      showNotice(
        err.response?.data?.message ||
          err.message ||
          "Failed to update term lock."
      );
    }
  };

  const publishTerm = async (id) => {
    const term = terms.find((item) => item.id === id);
    if (!term) return;

    const nextPublishedState = !term.isPublished;

    try {
      setPublishingTermId(id);
      const headers = getAdminAuthHeaders();

      let response;
      try {
        response = await api.patch(
          "/grades/admin/publish-results",
          {
            academicYear: term.session || selectedAcademicYear,
            currentTerm: term.name,
            isPublished: nextPublishedState,
          },
          { headers }
        );
      } catch (firstError) {
        const status = firstError.response?.status;
        if (status === 404 || status === 405) {
          response = await api.post(
            "/grades/admin/publish-results",
            {
              academicYear: term.session || selectedAcademicYear,
              currentTerm: term.name,
              isPublished: nextPublishedState,
            },
            { headers }
          );
        } else {
          throw firstError;
        }
      }

      const savedStatus = response.data?.status;

      setTerms((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                isPublished:
                  savedStatus?.isPublished ?? nextPublishedState,
              }
            : item
        )
      );

      showNotice(
        `Term ${term.name} ${
          nextPublishedState ? "published" : "unpublished"
        } successfully.`
      );
    } catch (err) {
      console.error("publishTerm error:", err.response?.data || err.message);
      showNotice(
        err.response?.data?.message ||
          err.message ||
          "Failed to update publication status."
      );
    } finally {
      setPublishingTermId(null);
    }
  };


  // ======================================================
  // PROMOTION ACTIONS
  // ======================================================

  const promoteStudent = async (id) => {
    const destinationNeedsDepartment =
      requiresDepartment(destinationClass);

    if (
      destinationClass === promotionClass &&
      (!destinationNeedsDepartment ||
        destinationDepartment === promotionDepartment)
    ) {
      showNotice(
        "Choose a different destination class or department."
      );
      return;
    }

    try {
      await api.post("/students/promote", {
        studentId: id,
        nextClass: destinationClass,
        department: destinationNeedsDepartment
          ? destinationDepartment
          : null,
      });

      showNotice("Student promoted successfully.");
      await loadData();
    } catch (err) {
      showNotice(
        err.response?.data?.message || "Failed to promote student."
      );
    }
  };

  // ======================================================
  // FILTER HELPERS AND VISIBLE DATA
  // ======================================================

  const matchesClassFilter = (
    itemClass,
    itemDept,
    selectedClass,
    selectedDept
  ) => {
    if (selectedClass === "All") return true;

    if (
      String(itemClass || "").trim().toUpperCase() !==
      String(selectedClass).trim().toUpperCase()
    ) {
      return false;
    }

    if (requiresDepartment(selectedClass)) {
      return (
        normalizeDepartment(itemDept) ===
        normalizeDepartment(selectedDept)
      );
    }

    return true;
  };

  const visibleStudents = filtered(
    students.filter((student) =>
      matchesClassFilter(
        student.className,
        student.department,
        studentClass,
        studentDepartment
      )
    ),
    [
      "id",
      "name",
      "admissionNumber",
      "className",
      "department",
      "gender",
    ]
  );

  const visibleSubjects = filtered(
    subjects.filter((subject) => {
      if (subjectClass === "All") return true;

      return subject.classAssignments.some((assignment) => {
        if (assignment.className !== subjectClass) return false;

        if (requiresDepartment(subjectClass)) {
          return (
            normalizeDepartment(assignment.department) ===
            normalizeDepartment(subjectDepartment)
          );
        }

        return true;
      });
    }),
    ["id", "name", "code"]
  );

  const scoreStudents = students.filter((student) =>
    matchesClassFilter(
      student.className,
      student.department,
      scoreClass,
      scoreDepartment
    )
  );

  const scoreSubjects = subjects.filter((subject) => {
    if (scoreClass === "All") return true;

    return subject.classAssignments.some((assignment) => {
      if (assignment.className !== scoreClass) return false;

      if (requiresDepartment(scoreClass)) {
        return (
          normalizeDepartment(assignment.department) ===
          normalizeDepartment(scoreDepartment)
        );
      }

      return true;
    });
  });

  // Students displayed on the Submit Scores page.
  // This includes students who have not submitted any scores yet.
  const visibleScoreStudents = filtered(scoreStudents, [
    "name",
    "admissionNumber",
    "className",
    "department",
    "gender",
  ]);

  const promotionStudents = students.filter((student) =>
    matchesClassFilter(
      student.className,
      student.department,
      promotionClass,
      promotionDepartment
    )
  );



  // Same completion rules as the student portal:
  // real scores count even if caSubmitted/examSubmitted flags are missing.
  /**
   * Unified subject display — supports BOTH:
   *  NEW: test1(10) + test2(20) + notes(5) + oral(5) = CA/40, exam/60
   *  OLD: test1 + test2 + test3 + assignment = CA/40 (or stored `ca`)
   *  Also accepts records that only have totalScore + grade/remark.
   *  If exam is missing but total + CA exist, exam is derived as total - CA.
   */
  const getAdminSubjectDisplay = (score = {}) => {
    const num = (value) =>
      value !== null &&
      value !== undefined &&
      value !== "" &&
      Number.isFinite(Number(value))
        ? Number(value)
        : null;

    const test1 = num(score.test1);
    const test2 = num(score.test2);
    const notes = num(score.notes);
    const oral = num(score.oral);
    const test3 = num(score.test3);
    const assignment = num(score.assignment);

    // Exam may live under several field names on older records
    const examValue =
      num(score.exam) ??
      num(score.examination) ??
      num(score.examScore) ??
      num(score.examMark) ??
      num(score.examMarks) ??
      num(score.examinationScore);

    const caDirect = num(score.ca) ?? num(score.caTotal) ?? num(score.continuousAssessment);
    const storedTotal =
      num(score.totalScore) ??
      num(score.total) ??
      num(score.grandTotal) ??
      num(score.overallTotal);

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
    } else if (score.caSubmitted === true || hasNewParts) {
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

    // Exam recovery
    let exam = null;
    if (examValue !== null) {
      exam = examValue;
    } else if (score.examSubmitted === true) {
      exam = 0;
    } else if (ca !== null && storedTotal !== null) {
      // Older records often only stored CA pieces + grand total
      const derived = Number(storedTotal) - Number(ca);
      if (Number.isFinite(derived) && derived >= 0 && derived <= 60) {
        exam = derived;
      } else if (Number.isFinite(derived) && derived >= 0 && derived <= 100) {
        exam = derived;
      }
    }

    let total = null;
    let complete = false;

    if (ca !== null && exam !== null) {
      total = storedTotal !== null ? storedTotal : ca + exam;
      complete = true;
    } else if (storedTotal !== null) {
      total = storedTotal;
      complete = true;
      // Still try to present CA / Exam when one side is known
      if (ca === null && exam !== null) {
        const maybeCa = Number(storedTotal) - Number(exam);
        if (Number.isFinite(maybeCa) && maybeCa >= 0 && maybeCa <= 40) {
          ca = maybeCa;
        }
      }
    }

    let grade = complete ? score.grade || null : null;
    let remark = complete ? score.remark || null : null;

    if (complete && total !== null && (!grade || grade === "—")) {
      const classHint = score.className || "";
      if (/^(SS|SSS)/i.test(String(classHint))) {
        if (total >= 75) grade = "A1";
        else if (total >= 70) grade = "B2";
        else if (total >= 65) grade = "B3";
        else if (total >= 60) grade = "C4";
        else if (total >= 55) grade = "C5";
        else if (total >= 50) grade = "C6";
        else if (total >= 45) grade = "D7";
        else if (total >= 40) grade = "E8";
        else grade = "F9";
      } else {
        if (total >= 70) grade = "A";
        else if (total >= 60) grade = "B";
        else if (total >= 50) grade = "C";
        else if (total >= 40) grade = "P";
        else grade = "F";
      }
    }

    return {
      ...score,
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
      total,
      percentage: total !== null ? Number(Number(total).toFixed(2)) : null,
      complete,
      grade: complete ? grade || "—" : null,
      remark: complete ? remark || "—" : null,
    };
  };

  // Count active students in a class (and department when required)
  const getClassSize = (className, department) => {
    return students.filter((student) => {
      if (String(student.className || "").trim().toUpperCase() !==
          String(className || "").trim().toUpperCase()) {
        return false;
      }
      if (String(student.status || "active").toLowerCase() === "withdrawn") {
        return false;
      }
      if (requiresDepartment(className)) {
        return (
          normalizeDepartment(student.department) ===
          normalizeDepartment(department)
        );
      }
      return true;
    }).length;
  };

  // ======================================================
  // RESULT CALCULATIONS
  // ======================================================

  const normalizeYear = (value) =>
    String(value || "")
      .trim()
      .replace(/\s+/g, "");

  const normalizeTerm = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();

  // Students in the selected class (used to recover scores with missing className)
  const studentsInResultClass = students.filter((student) =>
    matchesClassFilter(
      student.className,
      student.department,
      resultClass,
      resultDepartment
    )
  );
  const resultClassStudentIds = new Set(
    studentsInResultClass.map((student) => String(student.id))
  );
  const resultClassAdmissionNumbers = new Set(
    studentsInResultClass
      .map((student) => String(student.admissionNumber || "").trim())
      .filter(Boolean)
  );

  const classResultScores = scores.filter((score) => {
    const yearOk =
      normalizeYear(score.academicYear) === normalizeYear(resultAcademicYear);
    const termOk =
      normalizeTerm(score.term) === normalizeTerm(resultTerm);

    if (!yearOk || !termOk) return false;

    // Prefer class on the grade; fall back to matching the student roster
    if (score.className) {
      return matchesClassFilter(
        score.className,
        score.department,
        resultClass,
        resultDepartment
      );
    }

    return (
      resultClassStudentIds.has(String(score.student)) ||
      resultClassAdmissionNumbers.has(String(score.admissionNumber || "").trim())
    );
  });

  const visibleResultScores = filtered(classResultScores, [
    "studentName",
    "admissionNumber",
    "subjectName",
    "subjectCode",
  ]);

  const groupedResults = Object.values(
    visibleResultScores.reduce((groups, score) => {
      const key = `${score.admissionNumber || score.student}-${score.term}-${score.academicYear}`;

      if (!groups[key]) {
        groups[key] = {
          studentId: score.student,
          admissionNumber: score.admissionNumber || score.student,
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
    const displayScores = result.scores.map(getAdminSubjectDisplay);

    // Only fully completed subjects count toward average.
    // A genuine total of 0 still counts.
    const completedScores = displayScores.filter((score) => score.complete);

    const total = completedScores.reduce(
      (sum, score) => sum + Number(score.total || 0),
      0
    );

    const completedSubjectCount = completedScores.length;
    const average = completedSubjectCount
      ? total / completedSubjectCount
      : null;

    return {
      ...result,
      scores: displayScores,
      total,
      completedSubjectCount,
      subjectCount: displayScores.length,
      average,
      yearTutorComment:
        average === null
          ? "Awaiting completed subject results."
          : getAutomaticYearTutorComment(average),
      adminComment:
        average === null
          ? "Results are not yet complete."
          : getAutomaticAdminComment(average),
    };
  });

  // Students in the filtered class — list view (even if no scores yet)
  const resultListStudents = filtered(
    students.filter((student) =>
      matchesClassFilter(
        student.className,
        student.department,
        resultClass,
        resultDepartment
      )
    ),
    ["name", "admissionNumber", "className", "department"]
  ).map((student) => {
    const existing = groupedResults.find(
      (r) =>
        String(r.studentId) === String(student.id) ||
        String(r.admissionNumber) === String(student.admissionNumber)
    );

    return {
      id: student.id,
      name: student.name,
      admissionNumber: student.admissionNumber,
      className: student.className,
      department: student.department || "",
      gender: student.gender || "",
      classSize: getClassSize(student.className, student.department),
      result: existing || null,
    };
  });

  const selectedResult = selectedResultStudentId
    ? resultListStudents.find(
        (s) => String(s.id) === String(selectedResultStudentId)
      ) || null
    : null;

  const downloadStudentResultPDF = async (entry) => {
    if (!entry) return;

    const result = entry.result;
    const scores = result?.scores || [];
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const PDF_PURPLE = [88, 28, 135];
    const PDF_LIGHT_PURPLE = [245, 237, 252];

    const mappedSubjects = scores.map((raw) => {
      const score = getAdminSubjectDisplay(raw);
      return {
        name: score.subjectName || score.name || "Subject",
        ca: score.ca,
        caSubmitted: score.ca !== null,
        exam: score.exam,
        examSubmitted: score.exam !== null,
        total: score.total,
        percentage: score.percentage,
        grade: score.grade,
        remark: score.remark,
        complete: score.complete,
      };
    });

    const completed = mappedSubjects.filter((s) => s.complete);
    const totalScore = completed.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const terminalAverage =
      completed.length > 0
        ? Number(
            (
              completed.reduce((sum, s) => sum + Number(s.percentage || 0), 0) /
              completed.length
            ).toFixed(2)
          )
        : null;

    const yearTutorComment =
      terminalAverage === null
        ? "Awaiting completed subject results."
        : getAutomaticYearTutorComment(terminalAverage);
    const adminComment =
      terminalAverage === null
        ? "Results are not yet complete."
        : getAutomaticAdminComment(terminalAverage);

    const classLabel = entry.department
      ? `${entry.className} — ${entry.department}`
      : entry.className;

    const noInClass =
      entry.classSize != null && entry.classSize > 0
        ? String(entry.classSize)
        : "—";

    const loadImageForPDF = async (imageUrl) => {
      if (!imageUrl) return null;
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) return null;
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        try {
          const image = new Image();
          await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
            image.src = objectUrl;
          });
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return null;
          ctx.drawImage(image, 0, 0);
          return canvas.toDataURL("image/png");
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      } catch (e) {
        console.warn("PDF image load failed", e);
        return null;
      }
    };

    const [logoData, stampData] = await Promise.all([
      loadImageForPDF(schoolLogo),
      loadImageForPDF(schoolStamp),
    ]);

    if (logoData) {
      try {
        pdf.addImage(logoData, "PNG", margin, 8, 18, 18);
      } catch (e) {
        console.warn(e);
      }
    }

    pdf.setTextColor(...PDF_PURPLE);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.text("O'LAK TRIUMPH SCHOOL", pageWidth / 2, 16, { align: "center" });

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

    pdf.text(`SESSION: ${resultAcademicYear}`, margin + 2, y + 5);
    pdf.text(
      `TERM: ${String(resultTerm || "").toUpperCase()}`,
      margin + 76,
      y + 5
    );
    pdf.text(`CLASS: ${classLabel}`, margin + 132, y + 5);

    pdf.text(
      `STUDENT NAME: ${String(entry.name || "").toUpperCase()}`,
      margin + 2,
      y + 11
    );
    pdf.text(
      `SEX: ${String(entry.gender || "—").toUpperCase()}`,
      margin + 132,
      y + 11
    );

    pdf.text(
      `STUDENT NO: ${entry.admissionNumber || "—"}`,
      margin + 2,
      y + 17
    );
    pdf.text(`NO. IN CLASS: ${noInClass}`, margin + 132, y + 17);

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
    columns.forEach((column) => pdf.text(column.label, column.x, y + 5));
    y += 8;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(40, 40, 40);

    mappedSubjects.forEach((subject, index) => {
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
        subject.examSubmitted ? `${subject.exam}/60` : "Pending",
        columns[2].x,
        y + 5
      );
      pdf.text(
        subject.total !== null ? String(subject.total) : "Pending",
        columns[3].x,
        y + 5
      );
      pdf.text(subject.grade || "—", columns[4].x, y + 5);
      pdf.text(
        String(subject.remark || "—").slice(0, 15),
        columns[5].x,
        y + 5
      );
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
    pdf.text(totalScore.toFixed(2), margin + 78, y);
    y += 6;
    pdf.text("SUBJECTS OFFERED:", margin + 2, y);
    pdf.text(String(mappedSubjects.length), margin + 78, y);
    y += 6;
    pdf.text("COMPLETED SUBJECTS:", margin + 2, y);
    pdf.text(String(completed.length), margin + 78, y);
    y += 6;
    pdf.text("PENDING SUBJECTS:", margin + 2, y);
    pdf.text(String(mappedSubjects.length - completed.length), margin + 78, y);
    y += 6;
    pdf.setTextColor(...PDF_PURPLE);
    pdf.text("AVERAGE OF COMPLETED SUBJECTS:", margin + 2, y);
    pdf.text(
      terminalAverage !== null ? `${terminalAverage.toFixed(2)}%` : "Pending",
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
    pdf.line(
      margin,
      y + ratingHeight / 2,
      margin + ratingWidth,
      y + ratingHeight / 2
    );

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
      } catch (e) {
        console.warn(e);
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

    const safeName = String(entry.admissionNumber || entry.name || "result")
      .replace(/[^\w.-]+/g, "_");
    const safeTerm = String(resultTerm).replace(/\s+/g, "-").toLowerCase();
    pdf.save(`${safeName}-${safeTerm}.pdf`);
  };

  // ======================================================
  // LIVE SCORE CALCULATION
  // ======================================================

//  const scoreCA =
//    Number(scoreForm.test1 || 0) +
//    Number(scoreForm.test2 || 0) +
//   Number(scoreForm.test3 || 0) +
//    Number(scoreForm.assignment || 0);

//  const scoreExam = Number(scoreForm.exam || 0);
//  const scoreTotal = scoreCA + scoreExam;

//  const selectedScoreStudent = students.find(
//    (student) => student.id === scoreForm.student
//  );

//  const liveGrade = selectedScoreStudent
//    ? calculateGrade(
//        getStudentSection(selectedScoreStudent.className),
//        scoreForm.test1 || 0,
//        scoreForm.test2 || 0,
//        scoreForm.test3 || 0,
//        scoreForm.assignment || 0,
//        scoreForm.exam || 0
//      )
//    : null;

  // ======================================================
  // DASHBOARD DATA
  // ======================================================

  const stats = [
    {
      label: "Total Students",
      value: students.length,
      icon: Users,
      color: "blue",
    },
    {
      label: "Subjects",
      value: subjects.length,
      icon: BookOpen,
      color: "gold",
    },
    {
      label: "Enrollments",
      value: enrollments.length,
      icon: UserPlus,
      color: "green",
    },
    {
      label: "Scores Submitted",
      value: scores.length,
      icon: ClipboardList,
      color: "purple",
    },
  ];

  const pageDescriptions = {
    Overview: "Here's what's happening at your school today.",
    Students:
      "Create and manage secondary-school student records by class and department.",
    Subjects: "Manage secondary-school subjects by class and department.",
    Enrollments:
      "Manage JSS and SS student class, department and term enrollments.",
    "Submit Scores":
      "Record continuous assessment and examination scores by class and department.",
    "Student Results":
      "Review subject grades, terminal averages and automatic teacher comments.",
    "Academic Terms": "Control term access and publish academic terms.",
    "Promote Students": "Promote students by class and department.",
  };

  const pageTitle =
    activePage === "Submit Scores" ? "Score Management" : activePage;

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="admin-shell">
      {/* SIDEBAR */}

      {sidebarOpen && (
        <button
          className="admin-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`admin-sidebar ${
          sidebarOpen ? "admin-sidebar-open" : ""
        }`}
      >
        <div className="admin-brand">
          <div className="admin-brand-logo">
            <img src={schoolLogo} alt="O'lak Triumph School" />
          </div>

          <div>
            <strong>O'lak Triumph</strong>
            <span>School Administration</span>
          </div>

          <button
            className="admin-mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="admin-nav-label">MAIN MENU</div>

        <nav className="admin-nav">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`admin-nav-link ${
                activePage === label ? "active" : ""
              }`}
              onClick={() => openPage(label)}
            >
              <Icon size={19} />
              <span>{label}</span>

              {activePage === label && (
                <ChevronRight size={16} className="admin-nav-arrow" />
              )}
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

          <button
            className="admin-logout"
            onClick={handleLogout}
            style={{
              border: 0,
              background: "transparent",
              cursor: "pointer",
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>

          <a className="admin-home-link" href="/">
            Visit public website
            <ArrowUpRight size={15} />
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            <div>
              <div className="admin-breadcrumb">
                Administration
                <ChevronRight size={13} />
                {activePage}
              </div>
              <h1>{pageTitle}</h1>
            </div>
          </div>

          <div className="admin-topbar-right">
            <div
              className="admin-session-picker"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="admin-session-trigger"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSessionMenuOpen((open) => !open);
                }}
                aria-haspopup="listbox"
                aria-expanded={sessionMenuOpen}
              >
                <span className="admin-session-dot" />
                <span className="admin-session-text">
                  {selectedAcademicYear} Academic Session
                </span>
                <ChevronRight
                  size={14}
                  className={`admin-session-chevron ${
                    sessionMenuOpen ? "open" : ""
                  }`}
                />
              </button>

              {sessionMenuOpen ? (
                <div
                  className="admin-session-menu"
                  role="listbox"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="admin-session-menu-title">
                    Academic sessions
                  </p>
                  <p className="admin-session-menu-hint">
                    Sessions you have already worked on appear here. Pick
                    one to view or edit that year&apos;s results.
                  </p>

                  <div className="admin-session-list">
                    {(availableSessions.length
                      ? availableSessions
                      : [selectedAcademicYear]
                    ).map((year) => (
                      <button
                        key={year}
                        type="button"
                        role="option"
                        className={`admin-session-option ${
                          year === selectedAcademicYear ? "active" : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          selectAcademicSession(year);
                        }}
                      >
                        <span>{year}</span>
                        {year === selectedAcademicYear ? (
                          <CheckCircle2 size={15} />
                        ) : null}
                      </button>
                    ))}
                  </div>

                  <div className="admin-session-add">
                    <input
                      type="text"
                      value={newSessionInput}
                      onChange={(e) => setNewSessionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAcademicSession();
                        }
                      }}
                      placeholder="e.g. 2027/2028"
                      aria-label="New academic session"
                    />
                    <button
                      type="button"
                      className="admin-primary-button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addAcademicSession();
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <button
              className="admin-notification"
              aria-label="Notifications"
              onClick={() => showNotice("You are all caught up.")}
            >
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
            <p style={{ padding: "12px 0", color: "#64748b" }}>
              Loading data from server...
            </p>
          )}

          <div className="admin-welcome">
            <div>
              <p className="admin-eyebrow">O'LAK TRIUMPH SCHOOL</p>
              <h2>
                {activePage === "Overview"
                  ? "Welcome to your dashboard"
                  : `Manage ${activePage}`}
              </h2>
              <p>{pageDescriptions[activePage]}</p>
            </div>

            <div className="admin-date-chip">
              <CalendarDays size={16} />
              {selectedAcademicYear} Session
            </div>
          </div>

          {/* OVERVIEW */}

          {activePage === "Overview" && (
            <Overview stats={stats} terms={terms} openPage={openPage} />
          )}

          {/* STUDENTS */}

          {activePage === "Students" && (
            <section className="admin-panel">
              <PanelHeading
                title="Students"
                subtitle="All secondary-school students by class (no A/B/C arms)."
                search={search}
                setSearch={setSearch}
                action={() => setModal("student")}
                actionLabel="Add student"
              />

              <ClassificationFilter
                selectedClass={studentClass}
                setSelectedClass={(value) => {
                  setStudentClass(value);
                  setStudentDepartment("Science");
                }}
                selectedDepartment={studentDepartment}
                setSelectedDepartment={setStudentDepartment}
                allowAll
              />

              <p className="admin-classification-note">
                Showing{" "}
                <strong>
                  {studentClass === "All" ? "all classes" : studentClass}
                </strong>
                {studentClass !== "All" &&
                  requiresDepartment(studentClass) && (
                    <>
                      {" "}
                      — <strong>{studentDepartment}</strong> Department
                    </>
                  )}
                {" · "}
                {visibleStudents.length} student(s)
              </p>

              <StudentTable
                students={visibleStudents}
                onDelete={deleteStudent}
              />
            </section>
          )}

          {/* SUBJECTS */}

          {activePage === "Subjects" && (
            <section className="admin-panel">
              <PanelHeading
                title="Subjects"
                subtitle="Subjects organised by class and department."
                search={search}
                setSearch={setSearch}
                action={() => openSubjectEditor()}
                actionLabel="Add subject"
              />

              <ClassificationFilter
                selectedClass={subjectClass}
                setSelectedClass={(value) => {
                  setSubjectClass(value);
                  setSubjectDepartment("Science");
                }}
                selectedDepartment={subjectDepartment}
                setSelectedDepartment={setSubjectDepartment}
                allowAll
              />

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Subject</th>
                      <th>Class / Department assignments</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleSubjects.map((subject) => (
                      <tr key={subject.id}>
                        <td className="admin-id">{subject.code}</td>
                        <td>
                          <strong>{subject.name}</strong>
                        </td>
                        <td>
                          {formatSubjectAssignments(subject.classAssignments)}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="admin-table-action"
                            onClick={() => openSubjectEditor(subject)}
                          >
                            Edit assignments
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!visibleSubjects.length && (
                <EmptyState text="No subjects found for this selection." />
              )}
            </section>
          )}

          {/* ENROLLMENTS */}

          {activePage === "Enrollments" && (
            <section className="admin-panel">
              <PanelHeading
                title="Enrollments"
                subtitle="Class and term enrollments."
                search={search}
                setSearch={setSearch}
                action={() => setModal("enrollment")}
                actionLabel="Enroll student"
              />

              <div style={{ marginBottom: 16 }}>
                <button
                  className="admin-secondary-button"
                  onClick={enrollAllStudents}
                >
                  Enroll all students (preview)
                </button>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Department</th>
                      <th>Term</th>
                      <th>Session</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered(enrollments, [
                      "student",
                      "className",
                      "department",
                    ]).map((enrollment) => (
                      <tr key={enrollment.id}>
                        <td>
                          <strong>{enrollment.student}</strong>
                        </td>
                        <td>{enrollment.className}</td>
                        <td>{enrollment.department || "—"}</td>
                        <td>{enrollment.term}</td>
                        <td>{enrollment.session}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!enrollments.length && (
                <EmptyState text="No enrollments yet." />
              )}
            </section>
          )}

          {/* SUBMIT SCORES */}

          {activePage === "Submit Scores" && (
            <section className="admin-panel">
              <PanelHeading
                title="Submit scores"
                subtitle="Select a class and department to view all registered students and enter their scores."
                search={search}
                setSearch={setSearch}
                action={() => {
                  setScoreForm((current) => ({
                    ...current,
                    student: "",
                    subject: "",
                  }));
                  setModal("score");
                }}
                actionLabel="Add score"
              />

              <ClassificationFilter
                selectedClass={scoreClass}
                setSelectedClass={(value) => {
                  setScoreClass(value);
                  setScoreDepartment("Science");
                }}
                selectedDepartment={scoreDepartment}
                setSelectedDepartment={setScoreDepartment}
              />

              <p className="admin-classification-note">
                Showing students in <strong>{scoreClass}</strong>
                {requiresDepartment(scoreClass) && (
                  <>
                    {" "}
                    — <strong>{scoreDepartment}</strong> Department
                  </>
                )}
                {" · "}
                {visibleScoreStudents.length} student(s)
              </p>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Admission No.</th>
                      <th>Student Name</th>
                      <th>Class</th>
                      <th>Department</th>
                      <th>Gender</th>
                      <th>Scores Recorded</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleScoreStudents.map((student) => {
                      const studentScores = scores.filter(
                        (score) =>
                          score.student === student.id &&
                          score.term === scoreForm.term &&
                          score.academicYear === scoreForm.academicYear
                      );

                      return (
                        <tr key={student.id}>
                          <td className="admin-id">
                            {student.admissionNumber || "—"}
                          </td>

                          <td>
                            <strong>{student.name}</strong>
                          </td>

                          <td>{student.className}</td>

                          <td>{student.department || "—"}</td>

                          <td>{student.gender || "—"}</td>

                          <td>{studentScores.length} subject(s)</td>

                          <td>
                            <button
                              type="button"
                              className="admin-table-action"
                              onClick={() => {
                                setScoreForm((current) => ({
                                  ...current,
                                  student: student.id,
                                  subject: "",
                                }));

                                setModal("score");
                              }}
                            >
                              <ClipboardList size={15} />
                              Add score
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {!visibleScoreStudents.length && (
                <EmptyState
                  text="No registered students found in this class and department."
                />
              )}
            </section>
          )}

          {/* STUDENT RESULTS */}

          {activePage === "Student Results" && (
            <section className="admin-panel">
              {!selectedResult ? (
                <>
                  <PanelHeading
                    title="Student results"
                    subtitle="Select a class, then open one student to view their full result sheet."
                    search={search}
                    setSearch={setSearch}
                  />

                  <ClassificationFilter
                    selectedClass={resultClass}
                    setSelectedClass={(value) => {
                      setResultClass(value);
                      setResultDepartment("Science");
                      setSelectedResultStudentId(null);
                    }}
                    selectedDepartment={resultDepartment}
                    setSelectedDepartment={(value) => {
                      setResultDepartment(value);
                      setSelectedResultStudentId(null);
                    }}
                  />

                  <div className="admin-form-two admin-results-filters">
                    <FormField label="Academic term">
                      <select
                        value={resultTerm}
                        onChange={(e) => {
                          setResultTerm(e.target.value);
                          setSelectedResultStudentId(null);
                        }}
                      >
                        <option>First Term</option>
                        <option>Second Term</option>
                        <option>Third Term</option>
                      </select>
                    </FormField>

                    <FormField label="Academic year">
                      <input
                        value={resultAcademicYear}
                        onChange={(e) => {
                          setResultAcademicYear(e.target.value);
                          setSelectedResultStudentId(null);
                        }}
                        placeholder="2026/2027"
                      />
                    </FormField>
                  </div>

                  <p className="admin-classification-note">
                    Showing students in <strong>{resultClass}</strong>
                    {requiresDepartment(resultClass) && (
                      <>
                        {" "}
                        — <strong>{resultDepartment}</strong> Department
                      </>
                    )}
                    {" · "}
                    {resultTerm}, {resultAcademicYear}
                  </p>

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Admission No.</th>
                          <th>Student name</th>
                          <th>Class</th>
                          <th>Subjects recorded</th>
                          <th>Average</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultListStudents.map((entry) => (
                          <tr key={entry.id}>
                            <td className="admin-id">
                              {entry.admissionNumber || "—"}
                            </td>
                            <td>
                              <strong>{entry.name}</strong>
                            </td>
                            <td>
                              {entry.className}
                              {entry.department
                                ? ` · ${entry.department}`
                                : ""}
                            </td>
                            <td>
                              {entry.result
                                ? entry.result.subjectCount
                                : 0}
                            </td>
                            <td>
                              {entry.result?.average == null
                                ? "Pending"
                                : `${entry.result.average.toFixed(2)}%`}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="admin-table-action"
                                onClick={() =>
                                  setSelectedResultStudentId(entry.id)
                                }
                              >
                                <Eye size={14} />
                                View Results
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {!resultListStudents.length && (
                    <EmptyState text="No students found for this class and department." />
                  )}
                </>
              ) : (
                <>
                  <div className="admin-result-toolbar">
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={() => setSelectedResultStudentId(null)}
                    >
                      <ArrowLeft size={14} />
                      Back to student list
                    </button>

                    <button
                      type="button"
                      className="admin-primary-button"
                      onClick={() =>
                        downloadStudentResultPDF(selectedResult)
                      }
                    >
                      <Download size={14} />
                      Download PDF
                    </button>
                  </div>

                  <div className="admin-result-page-heading">
                    <div>
                      <p className="admin-eyebrow">ACADEMIC REPORT</p>
                      <h2>
                        {resultTerm.replace(" Term", "")} Term Result
                      </h2>
                      <p>{resultAcademicYear}</p>
                    </div>
                  </div>

                  <section className="admin-result-student-summary">
                    <div>
                      <span>Student</span>
                      <strong>{selectedResult.name}</strong>
                    </div>
                    <div>
                      <span>Admission number</span>
                      <strong>
                        {selectedResult.admissionNumber || "—"}
                      </strong>
                    </div>
                    <div>
                      <span>Class</span>
                      <strong>
                        {selectedResult.className}
                        {selectedResult.department
                          ? ` — ${selectedResult.department}`
                          : ""}
                      </strong>
                    </div>
                    <div>
                      <span>No. in Class</span>
                      <strong>
                        {selectedResult.classSize != null &&
                        selectedResult.classSize > 0
                          ? selectedResult.classSize
                          : "—"}
                      </strong>
                    </div>
                    <div>
                      <span>Term</span>
                      <strong>{resultTerm}</strong>
                    </div>
                    <div>
                      <span>Session</span>
                      <strong>{resultAcademicYear}</strong>
                    </div>
                    <div>
                      <span>Sex</span>
                      <strong>
                        {(selectedResult.gender || "—").toUpperCase()}
                      </strong>
                    </div>
                  </section>

                  <section className="admin-result-table-panel">
                    <div className="admin-result-section-heading">
                      <p className="admin-eyebrow">PERFORMANCE IN SUBJECTS</p>
                      <h3>{resultTerm}</h3>
                    </div>

                    <div className="admin-table-wrap">
                      <table className="admin-table admin-student-result-table">
                        <thead>
                          <tr>
                            <th>Subjects</th>
                            <th>CA / 40</th>
                            <th>Exam / 60</th>
                            <th>Total / 100</th>
                            <th>Percentage</th>
                            <th>Grade</th>
                            <th>Remark</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedResult.result?.scores || []).map(
                            (rawScore) => {
                              const score = getAdminSubjectDisplay(rawScore);

                              return (
                                <tr key={score.id}>
                                  <td>
                                    <strong>
                                      {String(
                                        score.subjectName || score.name || ""
                                      ).toUpperCase()}
                                    </strong>
                                  </td>
                                  <td>
                                    {score.ca !== null
                                      ? `${score.ca}/40`
                                      : "Yet to be uploaded"}
                                  </td>
                                  <td>
                                    {score.exam !== null
                                      ? `${score.exam}/60`
                                      : "Yet to be uploaded"}
                                  </td>
                                  <td>
                                    {score.total !== null
                                      ? `${score.total}/100`
                                      : "Pending"}
                                  </td>
                                  <td>
                                    {score.percentage !== null
                                      ? `${score.percentage.toFixed(2)}%`
                                      : "Pending"}
                                  </td>
                                  <td>
                                    {score.complete
                                      ? score.grade || "—"
                                      : "—"}
                                  </td>
                                  <td>
                                    {score.complete
                                      ? score.remark || "—"
                                      : "—"}
                                  </td>
                                  <td>
                                    <div style={{ display: "grid", gap: 4 }}>
                                      <small>
                                        CA:{" "}
                                        {score.ca !== null
                                          ? "Submitted"
                                          : "Pending"}
                                      </small>
                                      <small>
                                        Exam:{" "}
                                        {score.exam !== null
                                          ? "Submitted"
                                          : "Pending"}
                                      </small>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                          )}

                          {(() => {
                            const scores = (
                              selectedResult.result?.scores || []
                            ).map(getAdminSubjectDisplay);
                            const completed = scores.filter((s) => s.complete);
                            const totalSum = completed.reduce(
                              (sum, s) => sum + Number(s.total || 0),
                              0
                            );
                            const average =
                              completed.length > 0
                                ? totalSum / completed.length
                                : null;

                            return (
                              <>
                                <tr className="admin-result-summary-row">
                                  <td colSpan={2}>
                                    <strong>
                                      TOTAL OF COMPLETED SUBJECTS
                                    </strong>
                                  </td>
                                  <td colSpan={2}>
                                    <strong>{totalSum.toFixed(2)}</strong>
                                  </td>
                                  <td colSpan={4} />
                                </tr>
                                <tr className="admin-result-summary-row">
                                  <td colSpan={2}>
                                    <strong>SUBJECTS OFFERED</strong>
                                  </td>
                                  <td>
                                    <strong>{scores.length}</strong>
                                  </td>
                                  <td colSpan={5} />
                                </tr>
                                <tr className="admin-result-summary-row">
                                  <td colSpan={2}>
                                    <strong>COMPLETED SUBJECTS</strong>
                                  </td>
                                  <td>
                                    <strong>{completed.length}</strong>
                                  </td>
                                  <td colSpan={5} />
                                </tr>
                                <tr className="admin-result-summary-row">
                                  <td colSpan={2}>
                                    <strong>PENDING SUBJECTS</strong>
                                  </td>
                                  <td>
                                    <strong>
                                      {scores.length - completed.length}
                                    </strong>
                                  </td>
                                  <td colSpan={5} />
                                </tr>
                                <tr className="admin-result-summary-row admin-result-summary-aggregate">
                                  <td colSpan={3}>
                                    <strong>
                                      AVERAGE OF COMPLETED SUBJECTS
                                    </strong>
                                  </td>
                                  <td>
                                    <strong>
                                      {average == null
                                        ? "Pending"
                                        : `${average.toFixed(2)}%`}
                                    </strong>
                                  </td>
                                  <td colSpan={4} />
                                </tr>
                              </>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {!selectedResult.result?.scores?.length && (
                      <EmptyState text="No subject scores recorded for this student in the selected term." />
                    )}

                    <div className="admin-result-rating-wrap">
                      <p className="admin-result-rating-title">RATING</p>
                      <table className="admin-table admin-result-rating-table">
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
                      <p className="admin-result-rating-key">KEY</p>
                    </div>

                    <div className="admin-result-comments-section">
                      <div className="admin-result-comment-block">
                        <strong>Teacher&apos;s Comment</strong>
                        <p>
                          {selectedResult.result?.yearTutorComment ||
                            "Awaiting completed subject results."}
                        </p>
                      </div>
                      <div className="admin-result-comment-block">
                        <strong>
                          Principal / Headmaster&apos;s Comment
                        </strong>
                        <p>
                          {selectedResult.result?.adminComment ||
                            "Results are not yet complete."}
                        </p>
                      </div>
                    </div>

                    <div className="admin-report-signature">
                      <img
                        src={schoolStamp}
                        alt="School stamp"
                        className="admin-report-stamp"
                      />
                      <div className="admin-report-signature-line" />
                      <strong>Head Teacher</strong>
                      <span>Signature / Stamp</span>
                    </div>
                  </section>
                </>
              )}
            </section>
          )}

          {/* ACADEMIC TERMS */}

          {activePage === "Academic Terms" && (
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h3>Academic terms</h3>
                  <p>
                    Lock or unlock terms and publish or unpublish completed
                    terms.
                  </p>
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
                        <span
                          className={`admin-status ${
                            term.isLocked ? "locked" : "open"
                          }`}
                        >
                          {term.isLocked ? "Locked" : "Unlocked"}
                        </span>

                        <span
                          className={`admin-status ${
                            term.isPublished ? "published" : "open"
                          }`}
                        >
                          {term.isPublished ? "Published" : "Unpublished"}
                        </span>
                      </div>
                    </div>

                    <div className="admin-term-actions">
                      <button
                        type="button"
                        className="admin-secondary-button"
                        onClick={() => toggleTerm(term.id)}
                      >
                        {term.isLocked ? (
                          <Unlock size={15} />
                        ) : (
                          <Lock size={15} />
                        )}
                        {term.isLocked ? "Unlock" : "Lock"}
                      </button>

                      <button
                        type="button"
                        className="admin-primary-button"
                        onClick={() => publishTerm(term.id)}
                        disabled={publishingTermId === term.id}
                      >
                        {publishingTermId === term.id ? (
                          "Please wait..."
                        ) : term.isPublished ? (
                          <>
                            <X size={15} />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={15} />
                            Publish
                          </>
                        )}
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
                    setSelectedClass={(value) => {
                      setPromotionClass(value);
                      setPromotionDepartment("Science");
                      setDestinationClass(getNextClass(value));
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
                        {secondaryClasses.map((className) => (
                          <option key={className} value={className}>
                            {className}
                          </option>
                        ))}
                      </select>
                    </label>

                    {requiresDepartment(destinationClass) && (
                      <label className="admin-form-field">
                        <span>Destination department</span>
                        <select
                          value={destinationDepartment}
                          onChange={(e) =>
                            setDestinationDepartment(e.target.value)
                          }
                        >
                          {departments.map((department) => (
                            <option key={department} value={department}>
                              {department}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <p className="admin-classification-note">
                Students in <strong>{promotionClass}</strong>
                {requiresDepartment(promotionClass) && (
                  <>
                    {" "}
                    — <strong>{promotionDepartment}</strong> Department
                  </>
                )}{" "}
                will be moved to <strong>{destinationClass}</strong>
                {requiresDepartment(destinationClass) && (
                  <>
                    {" "}
                    — <strong>{destinationDepartment}</strong> Department
                  </>
                )}
                .
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
                    {filtered(promotionStudents, [
                      "id",
                      "name",
                      "className",
                      "department",
                    ]).map((student) => (
                      <tr key={student.id}>
                        <td className="admin-id">
                          {student.admissionNumber || student.id}
                        </td>
                        <td>
                          <strong>{student.name}</strong>
                        </td>
                        <td>{student.className}</td>
                        <td>{student.department || "—"}</td>
                        <td>
                          <span
                            className={`admin-status ${
                              student.status === "Promoted"
                                ? "published"
                                : "open"
                            }`}
                          >
                            {student.status || "Active"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="admin-table-action"
                            onClick={() => promoteStudent(student.id)}
                          >
                            <TrendingUp size={15} />
                            Promote
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!promotionStudents.length && (
                <EmptyState text="No students found in this class and department." />
              )}
            </section>
          )}

          {/* FOOTER */}

          <footer className="admin-content-footer">
            <span>
              © {new Date().getFullYear()} O'lak Triumph School
            </span>
            <span>School Administration Portal</span>
          </footer>
        </div>
      </main>

      {/* NOTIFICATION */}

      <AdminNotice notice={notice} />

      {/* STUDENT REGISTRATION MODAL */}

      {modal === "student" && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModal("");
            }
          }}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-student-title"
          >
            <div className="admin-modal-header">
              <div>
                <h2 id="add-student-title">Register Student</h2>
                <p>
                  Enter the student's details. The admission number will be
                  generated automatically.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModal("")}
                aria-label="Close registration form"
                disabled={registeringStudent}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={addStudent}>
              <div className="admin-modal-body">
                <div className="admin-form-two">
                  <FormField label="First name">
                    <input
                      type="text"
                      value={studentForm.firstName}
                      onChange={(e) =>
                        setStudentForm((current) => ({
                          ...current,
                          firstName: e.target.value,
                        }))
                      }
                      placeholder="Enter first name"
                      required
                    />
                  </FormField>

                  <FormField label="Surname">
                    <input
                      type="text"
                      value={studentForm.surname}
                      onChange={(e) =>
                        setStudentForm((current) => ({
                          ...current,
                          surname: e.target.value,
                        }))
                      }
                      placeholder="Enter surname"
                      required
                    />
                  </FormField>
                </div>

                <FormField label="Email address">
                  <input
                    type="email"
                    value={studentForm.email}
                    onChange={(e) =>
                      setStudentForm((current) => ({
                        ...current,
                        email: e.target.value,
                      }))
                    }
                    placeholder="Enter email address"
                    required
                  />
                </FormField>

                <div className="admin-form-two">
                  <FormField label="Class">
                    <select
                      value={studentForm.className}
                      onChange={(e) =>
                        setStudentForm((current) => ({
                          ...current,
                          className: e.target.value,
                          department: "Science",
                        }))
                      }
                    >
                      {enrollmentClassOptions.map((className) => (
                        <option key={className} value={className}>
                          {className}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  {requiresDepartment(studentForm.className) && (
                    <FormField label="Department">
                      <select
                        value={studentForm.department}
                        onChange={(e) =>
                          setStudentForm((current) => ({
                            ...current,
                            department: e.target.value,
                          }))
                        }
                      >
                        {departments.map((department) => (
                          <option key={department} value={department}>
                            {department}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  )}
                </div>

                <FormField label="Gender">
                  <select
                    value={studentForm.gender}
                    onChange={(e) =>
                      setStudentForm((current) => ({
                        ...current,
                        gender: e.target.value,
                      }))
                    }
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </FormField>

                <p className="admin-classification-note">
                  The system will generate the student's admission number
                  after registration. The initial password will be based on
                  the student's surname.
                </p>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => setModal("")}
                  disabled={registeringStudent}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={registeringStudent}
                >
                  {registeringStudent
                    ? "Registering..."
                    : "Register Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATED STUDENT CREDENTIALS */}

      {createdStudentCredentials && (
        <div className="admin-modal-backdrop">
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-created-title"
          >
            <div className="admin-modal-header">
              <div>
                <h2 id="student-created-title">
                  Student Registered Successfully
                </h2>
                <p>
                  Login credentials for {createdStudentCredentials.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCreatedStudentCredentials(null)}
                aria-label="Close credentials"
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-success-message">
                <CheckCircle2 size={36} />
                <p>
                  The student's admission number has been generated
                  successfully.
                </p>
              </div>

              <FormField label="Admission Number (Student Login ID)">
                <div className="admin-generated-credential">
                  <strong>
                    {createdStudentCredentials.admissionNumber}
                  </strong>

                  <button
                    type="button"
                    onClick={copyAdmissionNumber}
                    className="admin-secondary-button"
                  >
                    Copy
                  </button>
                </div>
              </FormField>

              <FormField label="Initial Password">
                <div className="admin-generated-credential">
                  <strong>
                    {createdStudentCredentials.initialPassword}
                  </strong>
                </div>
              </FormField>

              <p className="admin-classification-note">
                Give these login details to the student. They should use
                their admission number and initial password to log in.
              </p>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-primary-button"
                onClick={() => setCreatedStudentCredentials(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTHER MODALS */}
      <AdminModal
        modal={modal === "student" ? "" : modal}
        setModal={setModal}
        studentForm={studentForm}
        setStudentForm={setStudentForm}
        addStudent={addStudent}
        subjectForm={subjectForm}
        setSubjectForm={setSubjectForm}
        addSubject={addSubject}
        toggleSubjectAssignment={toggleSubjectAssignment}
        enrollmentForm={enrollmentForm}
        setEnrollmentForm={setEnrollmentForm}
        addEnrollment={addEnrollment}
        scoreForm={scoreForm}
        setScoreForm={setScoreForm}
        submitComponentScores={submitComponentScores}
        departments={departments}
        secondaryClasses={secondaryClasses}
        enrollmentClassOptions={enrollmentClassOptions}
        subjectAssignmentOptions={subjectAssignmentOptions}
        requiresDepartment={requiresDepartment}
        scoreClass={scoreClass}
        scoreDepartment={scoreDepartment}
        scoreStudents={scoreStudents}
        scoreSubjects={scoreSubjects}
      />
    </div>
  );
}

export default AdminDashboard;
