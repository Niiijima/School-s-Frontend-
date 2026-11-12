
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
} from "lucide-react";

import api from "../../api/axios";
import { logout } from "../../api/auth";
import { normalizeStudent } from "../../utils/normalizeStudent";
import { normalizeSubject } from "../../utils/normalizeSubject";

import {
  calculateGrade,
  getStudentSection,
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

const CURRENT_ACADEMIC_YEAR = "2025/2026";

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
    subjectName: subject.subjectName || subject.name || "Unknown subject",
    subjectCode: subject.subjectCode || subject.code || "",
    term: grade.term || "",
    academicYear: grade.academicYear || "",
    test1: Number(grade.test1 || 0),
    test2: Number(grade.test2 || 0),
    test3: Number(grade.test3 || 0),
    assignment: Number(grade.assignment || 0),
    exam: Number(grade.exam || 0),
    totalScore: Number(grade.totalScore || 0),
    grade: grade.grade || "",
    remark: grade.remark || "",
    noInClass: grade.manualNoInClass ?? null,
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
    test3: "",
    assignment: "",
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
              academicYear: CURRENT_ACADEMIC_YEAR,
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

      setStudents(studentList.map(normalizeStudent));
      setSubjects(subjectList.map(normalizeSubject));
      setScores(gradeList.map(normalizeGrade));

      const savedStatuses = termStatusesRes.data?.statuses || [];

      setTerms((current) =>
        current.map((term) => {
          const savedStatus = savedStatuses.find(
            (status) => status.currentTerm === term.name
          );

          if (term.session !== CURRENT_ACADEMIC_YEAR) {
            return term;
          }

          return {
            ...term,
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
  }, [showNotice]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        session: CURRENT_ACADEMIC_YEAR,
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
      session: CURRENT_ACADEMIC_YEAR,
    }));

    setEnrollments((current) => [...current, ...newOnes]);

    showNotice(`${newOnes.length} students enrolled (local preview).`);
  };

  // ======================================================
  // SCORE ACTIONS
  // ======================================================

  const addScore = async (event) => {
    event.preventDefault();

    if (!scoreForm.student || !scoreForm.subject) {
      showNotice("Please select a student and subject.");
      return;
    }

    const fields = ["test1", "test2", "test3", "assignment", "exam"];

    if (
      fields.some(
        (field) =>
          scoreForm[field] === "" ||
          !Number.isFinite(Number(scoreForm[field]))
      )
    ) {
      showNotice("Please complete all score fields.");
      return;
    }

    const test1 = Number(scoreForm.test1);
    const test2 = Number(scoreForm.test2);
    const test3 = Number(scoreForm.test3);
    const assignment = Number(scoreForm.assignment);
    const exam = Number(scoreForm.exam);

    if (
      [test1, test2, test3, assignment].some(
        (value) => value < 0 || value > 10
      )
    ) {
      showNotice("Each CA component must be between 0 and 10.");
      return;
    }

    if (exam < 0 || exam > 60) {
      showNotice("Exam score must be between 0 and 60.");
      return;
    }

    if (
      scoreForm.noInClass !== "" &&
      (!Number.isInteger(Number(scoreForm.noInClass)) ||
        Number(scoreForm.noInClass) < 1)
    ) {
      showNotice("Class position must be a positive whole number.");
      return;
    }

    const selectedStudent = students.find(
      (student) => student.id === scoreForm.student
    );

    const selectedSubject = subjects.find(
      (subject) => subject.id === scoreForm.subject
    );

    if (!selectedStudent || !selectedSubject) {
      showNotice("Selected student or subject not found.");
      return;
    }

    const subjectAssigned = selectedSubject.classAssignments.some(
      (assignmentItem) => {
        if (assignmentItem.className !== selectedStudent.className) {
          return false;
        }

        if (requiresDepartment(selectedStudent.className)) {
          return (
            normalizeDepartment(assignmentItem.department) ===
            normalizeDepartment(selectedStudent.department)
          );
        }

        return true;
      }
    );

    if (!subjectAssigned) {
      showNotice(
        "This subject is not assigned to the selected student's class and department."
      );
      return;
    }

    const academicYear = scoreForm.academicYear.trim();

    try {
      const response = await api.post("/grades/submit-scores", {
        admissionNumber: selectedStudent.admissionNumber,
        subjectCode: selectedSubject.code,
        test1,
        test2,
        test3,
        assignment,
        exam,
        term: scoreForm.term,
        academicYear,
        noInClass:
          scoreForm.noInClass === ""
            ? undefined
            : Number(scoreForm.noInClass),
      });

      const savedGrade = response.data?.result;

      if (savedGrade) {
        const normalizedSavedGrade = normalizeGrade({
          ...savedGrade,
          student: {
            _id: selectedStudent.id,
            firstName: selectedStudent.firstName,
            surname: selectedStudent.surname,
            name: selectedStudent.name,
            admissionNumber: selectedStudent.admissionNumber,
            currentClass: selectedStudent.className,
            department: selectedStudent.department,
          },
          subject: {
            _id: selectedSubject.id,
            subjectName: selectedSubject.name,
            subjectCode: selectedSubject.code,
          },
        });

        setScores((current) => [
          ...current.filter(
            (score) =>
              !(
                score.student === normalizedSavedGrade.student &&
                score.subject === normalizedSavedGrade.subject &&
                score.term === normalizedSavedGrade.term &&
                score.academicYear === normalizedSavedGrade.academicYear
              )
          ),
          normalizedSavedGrade,
        ]);
      } else {
        await loadData();
      }

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
      showNotice(
        err.response?.data?.message || "Failed to submit score."
      );
    }
  };

  // ======================================================
  // ACADEMIC TERM ACTIONS
  // ======================================================

  const toggleTerm = async (id) => {
    const term = terms.find((item) => item.id === id);
    if (!term) return;

    const nextLockedState = !term.isLocked;

    try {
      await api.patch("/grades/admin/toggle-lock", {
        academicYear: term.session,
        currentTerm: term.name,
        isLocked: nextLockedState,
      });

      setTerms((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, isLocked: nextLockedState }
            : item
        )
      );

      showNotice(
        `Term ${term.name} ${nextLockedState ? "locked" : "unlocked"} successfully.`
      );
    } catch (err) {
      showNotice(
        err.response?.data?.message || "Failed to update term lock."
      );
    }
  };

  const publishTerm = async (id) => {
    const term = terms.find((item) => item.id === id);
    if (!term) return;

    const nextPublishedState = !term.isPublished;

    try {
      setPublishingTermId(id);

      const response = await api.patch(
        "/grades/admin/publish-results",
        {
          academicYear: term.session,
          currentTerm: term.name,
          isPublished: nextPublishedState,
        }
      );

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
        response.data?.message ||
          `Results ${
            nextPublishedState ? "published" : "unpublished"
          } successfully.`
      );
    } catch (err) {
      console.error("Publish Results Error:", err);

      showNotice(
        err.response?.data?.message ||
          "Failed to update result publication status."
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

  // ======================================================
  // RESULT CALCULATIONS
  // ======================================================

  const classResultScores = scores.filter(
    (score) =>
      matchesClassFilter(
        score.className,
        score.department,
        resultClass,
        resultDepartment
      ) &&
      score.term === resultTerm &&
      score.academicYear === resultAcademicYear
  );

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
          studentId: score.admissionNumber || score.student,
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
    const total = result.scores.reduce(
      (sum, score) => sum + Number(score.totalScore || 0),
      0
    );

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

  // ======================================================
  // LIVE SCORE CALCULATION
  // ======================================================

  const scoreCA =
    Number(scoreForm.test1 || 0) +
    Number(scoreForm.test2 || 0) +
    Number(scoreForm.test3 || 0) +
    Number(scoreForm.assignment || 0);

  const scoreExam = Number(scoreForm.exam || 0);
  const scoreTotal = scoreCA + scoreExam;

  const selectedScoreStudent = students.find(
    (student) => student.id === scoreForm.student
  );

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
            <span className="admin-session-label">
              <span />
              {CURRENT_ACADEMIC_YEAR} Academic Session
            </span>

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
              {CURRENT_ACADEMIC_YEAR} Session
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
              <PanelHeading
                title="Student terminal results"
                subtitle="Subject grades, overall averages and automatically generated comments."
                search={search}
                setSearch={setSearch}
              />

              <ClassificationFilter
                selectedClass={resultClass}
                setSelectedClass={(value) => {
                  setResultClass(value);
                  setResultDepartment("Science");
                }}
                selectedDepartment={resultDepartment}
                setSelectedDepartment={setResultDepartment}
              />

              <div className="admin-form-two admin-results-filters">
                <FormField label="Academic term">
                  <select
                    value={resultTerm}
                    onChange={(e) => setResultTerm(e.target.value)}
                  >
                    <option>First Term</option>
                    <option>Second Term</option>
                    <option>Third Term</option>
                  </select>
                </FormField>

                <FormField label="Academic year">
                  <input
                    value={resultAcademicYear}
                    onChange={(e) => setResultAcademicYear(e.target.value)}
                    placeholder="2025/2026"
                  />
                </FormField>
              </div>

              <p className="admin-classification-note">
                Showing results for <strong>{resultClass}</strong>
                {requiresDepartment(resultClass) && (
                  <>
                    {" "}
                    — <strong>{resultDepartment}</strong> Department
                  </>
                )}
                {" · "}
                {resultTerm}, {resultAcademicYear}
              </p>

              {!groupedResults.length ? (
                <EmptyState text="No student results found for this selection." />
              ) : (
                <div className="admin-overall-results">
                  {groupedResults.map((result) => (
                    <article
                      className="admin-panel admin-student-result-card"
                      key={`${result.studentId}-${result.term}-${result.academicYear}`}
                    >
                      <div className="admin-panel-heading">
                        <div>
                          <h3>{result.studentName}</h3>
                          <p>
                            {result.studentId} · {result.className}
                            {result.department
                              ? ` · ${result.department}`
                              : ""}
                          </p>
                          <p>
                            {result.term} · {result.academicYear}
                          </p>
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
                                  <td>
                                    <strong>{score.subjectName}</strong>
                                  </td>
                                  <td>{score.test1}</td>
                                  <td>{score.test2}</td>
                                  <td>{score.test3}</td>
                                  <td>{score.assignment}</td>
                                  <td>{ca}</td>
                                  <td>{score.exam}</td>
                                  <td>
                                    <strong>{score.totalScore}</strong>
                                  </td>
                                  <td>
                                    <strong>{score.grade}</strong>
                                  </td>
                                  <td>{score.remark}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div
                        className="admin-result-comments"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 14,
                          width: "100%",
                        }}
                      >
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
                            {student.status}
                          </span>
                        </td>
                        <td>
                          <button
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
        addScore={addScore}
        departments={departments}
        secondaryClasses={secondaryClasses}
        enrollmentClassOptions={enrollmentClassOptions}
        subjectAssignmentOptions={subjectAssignmentOptions}
        requiresDepartment={requiresDepartment}
        scoreClass={scoreClass}
        scoreDepartment={scoreDepartment}
        scoreStudents={scoreStudents}
        scoreSubjects={scoreSubjects}
        scoreCA={scoreCA}
        scoreTotal={scoreTotal}
        liveGrade={liveGrade}
      />
    </div>
  );
}

export default AdminDashboard;
