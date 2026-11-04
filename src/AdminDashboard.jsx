import React, { useState } from "react";
import schoolLogo from "./assets/logo.jpeg";

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

const departments = ["Science", "Arts", "Commercial"];

const juniorClasses = ["JSS 1", "JSS 2", "JSS 3"];
const seniorClasses = ["SS 1", "SS 2", "SS 3"];

const secondaryClasses = [...juniorClasses, ...seniorClasses];
const enrollmentClassOptions = [...secondaryClasses];

const CURRENT_ACADEMIC_YEAR = "2026/2027";

const initialStudents = [
  {
    id: "OTS001",
    name: "David Ibrahim",
    className: "JSS 1",
    gender: "Male",
    status: "Active",
  },
  {
    id: "OTS002",
    name: "Amara Johnson",
    className: "JSS 2",
    gender: "Female",
    status: "Active",
  },
  {
    id: "OTS003",
    name: "Daniel Okafor",
    className: "JSS 3",
    gender: "Male",
    status: "Active",
  },
  {
    id: "OTS004",
    name: "Grace Williams",
    className: "SS 1",
    department: "Science",
    gender: "Female",
    status: "Active",
  },
  {
    id: "OTS005",
    name: "Michael Okoro",
    className: "SS 2",
    department: "Arts",
    gender: "Male",
    status: "Active",
  },
  {
    id: "OTS006",
    name: "Esther Bello",
    className: "SS 1",
    department: "Commercial",
    gender: "Female",
    status: "Active",
  },
];

const initialSubjects = [
  {
    id: "SUB001",
    name: "Basic Science",
    code: "BSC",
    className: "JSS 1",
  },
  {
    id: "SUB002",
    name: "Mathematics",
    code: "MTH",
    className: "JSS 1",
  },
  {
    id: "SUB003",
    name: "Physics",
    code: "PHY",
    className: "SS 1",
    department: "Science",
  },
  {
    id: "SUB004",
    name: "Government",
    code: "GOV",
    className: "SS 2",
    department: "Arts",
  },
  {
    id: "SUB005",
    name: "Commerce",
    code: "COM",
    className: "SS 1",
    department: "Commercial",
  },
];

const initialEnrollments = [];

const initialScores = [
  {
    id: "SCR001",
    student: "OTS001",
    studentName: "David Ibrahim",
    admissionNumber: "OTS001",
    subject: "SUB001",
    subjectName: "Basic Science",
    subjectCode: "BSC",
    className: "JSS 1",
    department: "",
    term: "First Term",
    academicYear: CURRENT_ACADEMIC_YEAR,
    test1: 8,
    test2: 7,
    test3: 9,
    assignment: 8,
    exam: 55,
    totalScore: 87,
    grade: "A",
    remark: "Distinction",
    noInClass: null,
  },
  {
    id: "SCR002",
    student: "OTS004",
    studentName: "Grace Williams",
    admissionNumber: "OTS004",
    subject: "SUB003",
    subjectName: "Physics",
    subjectCode: "PHY",
    className: "SS 1",
    department: "Science",
    term: "First Term",
    academicYear: CURRENT_ACADEMIC_YEAR,
    test1: 8,
    test2: 7,
    test3: 8,
    assignment: 9,
    exam: 51,
    totalScore: 83,
    grade: "A1",
    remark: "Excellent",
    noInClass: null,
  },
  {
    id: "SCR003",
    student: "OTS005",
    studentName: "Michael Okoro",
    admissionNumber: "OTS005",
    subject: "SUB004",
    subjectName: "Government",
    subjectCode: "GOV",
    className: "SS 2",
    department: "Arts",
    term: "First Term",
    academicYear: CURRENT_ACADEMIC_YEAR,
    test1: 6,
    test2: 7,
    test3: 8,
    assignment: 9,
    exam: 45,
    totalScore: 75,
    grade: "A1",
    remark: "Excellent",
    noInClass: null,
  },
];

const initialTerms = [
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
    session: "2025/2026",
    isLocked: false,
    isPublished: true,
  },
  {
    id: "TERM003",
    name: "Third Term",
    session: "2025/2026",
    isLocked: true,
    isPublished: false,
  },
];

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

  if (index < 0 || index >= secondaryClasses.length - 1) {
    return className;
  }

  return secondaryClasses[index + 1];
}

// Matches the section-based grading in your backend gradeCalculator.js.
function calculateGrade(section, test1 = 0, test2 = 0, test3 = 0, assignment = 0, exam = 0) {
  const totalScore =
    Number(test1) +
    Number(test2) +
    Number(test3) +
    Number(assignment) +
    Number(exam);

  const standardSection = section ? section.toUpperCase() : "JSS";

  if (standardSection === "SSS") {
    if (totalScore >= 75) {
      return { totalScore, grade: "A1", remark: "Excellent" };
    }

    if (totalScore >= 70) {
      return { totalScore, grade: "B2", remark: "Very Good" };
    }

    if (totalScore >= 65) {
      return { totalScore, grade: "B3", remark: "Good" };
    }

    if (totalScore >= 60) {
      return { totalScore, grade: "C4", remark: "Credit" };
    }

    if (totalScore >= 55) {
      return { totalScore, grade: "C5", remark: "Credit" };
    }

    if (totalScore >= 50) {
      return { totalScore, grade: "C6", remark: "Credit" };
    }

    if (totalScore >= 45) {
      return { totalScore, grade: "D7", remark: "Pass" };
    }

    if (totalScore >= 40) {
      return { totalScore, grade: "E8", remark: "Fair" };
    }

    return { totalScore, grade: "F9", remark: "Fail" };
  }

  if (totalScore >= 70) {
    return { totalScore, grade: "A", remark: "Distinction" };
  }

  if (totalScore >= 60) {
    return { totalScore, grade: "B", remark: "Upper Credit" };
  }

  if (totalScore >= 50) {
    return { totalScore, grade: "C", remark: "Lower Credit" };
  }

  if (totalScore >= 40) {
    return { totalScore, grade: "P", remark: "Pass" };
  }

  return { totalScore, grade: "F", remark: "Fail" };
}

// Matches the backend's automatic year tutor comment.
function getAutomaticYearTutorComment(averageScore) {
  if (averageScore >= 75) {
    return "An exceptionally brilliant performance. Keep maintaining this golden standard.";
  }

  if (averageScore >= 65) {
    return "A highly commendable result. With this consistency, top honors are within reach next term.";
  }

  if (averageScore >= 50) {
    return "A good performance, but you possess the capability to attain higher credit marks.";
  }

  if (averageScore >= 40) {
    return "Passable terminal record. You are playing on the borderline; step up your study habits.";
  }

  return "An unsatisfactory performance. Intensive remedial study and closer supervision are urgently required.";
}

// Matches the backend's automatic principal/admin comment.
function getAutomaticAdminComment(averageScore) {
  if (averageScore >= 75) {
    return "Outstanding academic excellence. A proud reflection of hard work. Keep it up!";
  }

  if (averageScore >= 65) {
    return "Very impressive progress. Promising results showing dedication to studies.";
  }

  if (averageScore >= 50) {
    return "A satisfactory performance. Focus more on weak areas to secure top tiers next session.";
  }

  if (averageScore >= 40) {
    return "Fair trial, but there is vast room for improvement. Double your efforts.";
  }

  return "Unacceptable standard. Must show a completely renewed attitude to work next term to pass.";
}

function getStudentSection(className) {
  return isSeniorClass(className) ? "SSS" : "JSS";
}

function AdminDashboard() {
  const [activePage, setActivePage] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [students, setStudents] = useState(initialStudents);
  const [subjects, setSubjects] = useState(initialSubjects);
  const [enrollments, setEnrollments] = useState(initialEnrollments);
  const [scores, setScores] = useState(initialScores);
  const [terms, setTerms] = useState(initialTerms);

  const [modal, setModal] = useState("");
  const [notice, setNotice] = useState("");

  const [studentClass, setStudentClass] = useState("JSS 1");
  const [studentDepartment, setStudentDepartment] = useState("Science");

  const [subjectClass, setSubjectClass] = useState("JSS 1");
  const [subjectDepartment, setSubjectDepartment] = useState("Science");

  const [scoreClass, setScoreClass] = useState("JSS 1");
  const [scoreDepartment, setScoreDepartment] = useState("Science");

  const [resultClass, setResultClass] = useState("JSS 1");
  const [resultDepartment, setResultDepartment] = useState("Science");

  const [resultTerm, setResultTerm] = useState("First Term");
  const [resultAcademicYear, setResultAcademicYear] = useState(
    CURRENT_ACADEMIC_YEAR
  );

  const [promotionClass, setPromotionClass] = useState("JSS 1");
  const [promotionDepartment, setPromotionDepartment] = useState("Science");
  const [destinationClass, setDestinationClass] = useState("JSS 2");
  const [destinationDepartment, setDestinationDepartment] = useState("Science");

  const [studentForm, setStudentForm] = useState({
    name: "",
    className: "JSS 1",
    department: "Science",
    gender: "Female",
  });

  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    className: "JSS 1",
    department: "Science",
  });

  const [enrollmentForm, setEnrollmentForm] = useState({
    student: "",
    className: "JSS 1",
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

  const filtered = (items, fields) => {
    const query = search.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) =>
      fields.some((field) =>
        String(item[field] ?? "").toLowerCase().includes(query)
      )
    );
  };

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const openPage = (page) => {
    setActivePage(page);
    setSearch("");
    setSidebarOpen(false);
  };

  // Add student.
  const addStudent = (event) => {
    event.preventDefault();

    if (!studentForm.name.trim()) {
      showNotice("Please enter the student's full name.");
      return;
    }

    const senior = isSeniorClass(studentForm.className);

    if (senior && !studentForm.department) {
      showNotice("Please select a department for the SS class.");
      return;
    }

    setStudents((current) => [
      ...current,
      {
        id: `OTS${String(current.length + 1).padStart(3, "0")}`,
        name: studentForm.name.trim(),
        className: studentForm.className,
        department: senior ? studentForm.department : "",
        gender: studentForm.gender,
        status: "Active",
      },
    ]);

    setStudentForm({
      name: "",
      className: "JSS 1",
      department: "Science",
      gender: "Female",
    });

    setModal("");
    showNotice("Student added to the local preview.");
  };

  // Add subject.
  const addSubject = (event) => {
    event.preventDefault();

    if (!subjectForm.name.trim() || !subjectForm.code.trim()) {
      showNotice("Please enter the subject name and code.");
      return;
    }

    const senior = isSeniorClass(subjectForm.className);

    if (senior && !subjectForm.department) {
      showNotice("Please select a department for the SS class.");
      return;
    }

    setSubjects((current) => [
      ...current,
      {
        id: `SUB${String(current.length + 1).padStart(3, "0")}`,
        name: subjectForm.name.trim(),
        code: subjectForm.code.trim().toUpperCase(),
        className: subjectForm.className,
        department: senior ? subjectForm.department : "",
      },
    ]);

    setSubjectForm({
      name: "",
      code: "",
      className: "JSS 1",
      department: "Science",
    });

    setModal("");
    showNotice("Subject added to the local preview.");
  };

  // Manually enroll a student.
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

    const matchingStudent = students.find(
      (student) =>
        student.name.trim().toLowerCase() === studentName.toLowerCase() &&
        student.className === enrollmentForm.className &&
        (student.department || "") === department
    );

    const duplicate = enrollments.some((enrollment) => {
      const sameStudent =
        matchingStudent && enrollment.studentId
          ? enrollment.studentId === matchingStudent.id
          : enrollment.student.trim().toLowerCase() ===
            studentName.toLowerCase();

      return (
        sameStudent &&
        enrollment.className === enrollmentForm.className &&
        (enrollment.department || "") === department &&
        enrollment.term === enrollmentForm.term &&
        enrollment.session === CURRENT_ACADEMIC_YEAR
      );
    });

    if (duplicate) {
      showNotice("This student is already enrolled for the selected term.");
      return;
    }

    setEnrollments((current) => [
      ...current,
      {
        id: `ENR${String(current.length + 1).padStart(3, "0")}`,
        studentId: matchingStudent?.id || "",
        student: studentName,
        className: enrollmentForm.className,
        department,
        term: enrollmentForm.term,
        session: CURRENT_ACADEMIC_YEAR,
      },
    ]);

    setEnrollmentForm({
      student: "",
      className: "JSS 1",
      department: "",
      term: "First Term",
    });

    setModal("");
    showNotice("Student enrollment added to the local preview.");
  };

  // Enroll every student in the Students preview.
  const enrollAllStudents = () => {
    if (students.length === 0) {
      showNotice("There are no students available to enroll.");
      return;
    }

    const term = "First Term";
    const session = CURRENT_ACADEMIC_YEAR;

    const studentsToEnroll = students.filter((student) => {
      return !enrollments.some((enrollment) => {
        const sameStudent = enrollment.studentId
          ? enrollment.studentId === student.id
          : enrollment.student.trim().toLowerCase() ===
              student.name.trim().toLowerCase() &&
            enrollment.className === student.className &&
            (enrollment.department || "") === (student.department || "");

        return (
          sameStudent &&
          enrollment.className === student.className &&
          (enrollment.department || "") === (student.department || "") &&
          enrollment.term === term &&
          enrollment.session === session
        );
      });
    });

    if (studentsToEnroll.length === 0) {
      showNotice("All students are already enrolled for First Term.");
      return;
    }

    const newEnrollments = studentsToEnroll.map((student, index) => ({
      id: `ENR${String(enrollments.length + index + 1).padStart(3, "0")}`,
      studentId: student.id,
      student: student.name,
      className: student.className,
      department: student.department || "",
      term,
      session,
    }));

    setEnrollments((current) => [...current, ...newEnrollments]);

    showNotice(
      `${newEnrollments.length} student${
        newEnrollments.length === 1 ? "" : "s"
      } enrolled successfully for First Term.`
    );
  };

  const visibleStudents = filtered(
    students.filter(
      (student) =>
        student.className === studentClass &&
        (!isSeniorClass(studentClass) ||
          student.department === studentDepartment)
    ),
    ["id", "name", "className", "department", "gender"]
  );

  const visibleSubjects = filtered(
    subjects.filter(
      (subject) =>
        subject.className === subjectClass &&
        (!isSeniorClass(subjectClass) ||
          subject.department === subjectDepartment)
    ),
    ["id", "name", "code", "className", "department"]
  );

  const scoreStudents = students.filter(
    (student) =>
      student.className === scoreClass &&
      (!isSeniorClass(scoreClass) ||
        student.department === scoreDepartment)
  );

  const scoreSubjects = subjects.filter(
    (subject) =>
      subject.className === scoreClass &&
      (!isSeniorClass(scoreClass) ||
        subject.department === scoreDepartment)
  );

  // Submit or update a score using the backend-compatible fields.
  const addScore = (event) => {
    event.preventDefault();

    if (!scoreForm.student || !scoreForm.subject) {
      showNotice("Please select a student and subject.");
      return;
    }

    if (!scoreForm.academicYear.trim()) {
      showNotice("Please enter the academic year.");
      return;
    }

    const fields = ["test1", "test2", "test3", "assignment", "exam"];

    if (fields.some((field) => scoreForm[field] === "")) {
      showNotice("Please complete all score fields.");
      return;
    }

    const test1 = Number(scoreForm.test1);
    const test2 = Number(scoreForm.test2);
    const test3 = Number(scoreForm.test3);
    const assignment = Number(scoreForm.assignment);
    const exam = Number(scoreForm.exam);

    const caScores = [test1, test2, test3, assignment];

    if (
      caScores.some(
        (value) => !Number.isFinite(value) || value < 0 || value > 10
      )
    ) {
      showNotice("Each CA component must be between 0 and 10.");
      return;
    }

    if (!Number.isFinite(exam) || exam < 0 || exam > 60) {
      showNotice("Examination score must be between 0 and 60.");
      return;
    }

    if (
      scoreForm.noInClass !== "" &&
      (!Number.isInteger(Number(scoreForm.noInClass)) ||
        Number(scoreForm.noInClass) < 1)
    ) {
      showNotice("Manual class position must be a positive whole number.");
      return;
    }

    const selectedStudent = students.find(
      (student) => student.id === scoreForm.student
    );

    const selectedSubject = subjects.find(
      (subject) => subject.id === scoreForm.subject
    );

    if (!selectedStudent || !selectedSubject) {
      showNotice("The selected student or subject could not be found.");
      return;
    }

    if (
      selectedSubject.className !== selectedStudent.className ||
      (selectedSubject.department || "") !==
        (selectedStudent.department || "")
    ) {
      showNotice("The selected subject does not belong to this student's class and department.");
      return;
    }

    const lockedTerm = terms.find(
      (term) =>
        term.name === scoreForm.term &&
        term.session === scoreForm.academicYear.trim() &&
        term.isLocked
    );

    if (lockedTerm) {
      showNotice("This academic term is locked. Scores cannot be submitted.");
      return;
    }

    const gradeResult = calculateGrade(
      getStudentSection(selectedStudent.className),
      test1,
      test2,
      test3,
      assignment,
      exam
    );

    const scoreIdentity = (score) =>
      (score.admissionNumber || score.student) === selectedStudent.id &&
      (score.subjectCode
        ? score.subjectCode === selectedSubject.code
        : score.subject === selectedSubject.id) &&
      score.term === scoreForm.term &&
      score.academicYear === scoreForm.academicYear.trim();

    const existingScore = scores.find(scoreIdentity);

    const newScore = {
      id: existingScore?.id || `SCR${Date.now()}`,

      // IDs correspond to the backend's student and subject references.
      student: selectedStudent.id,
      subject: selectedSubject.id,

      // Display fields for this local frontend preview.
      studentName: selectedStudent.name,
      admissionNumber: selectedStudent.id,
      subjectName: selectedSubject.name,
      subjectCode: selectedSubject.code,

      className: selectedStudent.className,
      department: selectedStudent.department || "",

      term: scoreForm.term,
      academicYear: scoreForm.academicYear.trim(),

      test1,
      test2,
      test3,
      assignment,
      exam,

      totalScore: gradeResult.totalScore,
      grade: gradeResult.grade,
      remark: gradeResult.remark,

      // This is the frontend counterpart of backend noInClass.
      noInClass:
        scoreForm.noInClass === ""
          ? null
          : Number(scoreForm.noInClass),
    };

    setScores((current) => {
      const existingIndex = current.findIndex(scoreIdentity);

      if (existingIndex === -1) {
        return [...current, newScore];
      }

      return current.map((score, index) =>
        index === existingIndex ? newScore : score
      );
    });

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
    showNotice(
      existingScore
        ? "Existing score updated in the local preview."
        : "Score added to the local preview."
    );
  };

  const toggleTerm = (id) => {
    setTerms((current) =>
      current.map((term) =>
        term.id === id
          ? { ...term, isLocked: !term.isLocked }
          : term
      )
    );

    showNotice("Term lock status updated in the local preview.");
  };

  const publishTerm = (id) => {
    setTerms((current) =>
      current.map((term) =>
        term.id === id
          ? { ...term, isPublished: !term.isPublished }
          : term
      )
    );

    showNotice("Term publication status updated in the local preview.");
  };

  const promotionStudents = students.filter(
    (student) =>
      student.className === promotionClass &&
      (!isSeniorClass(promotionClass) ||
        student.department === promotionDepartment)
  );

  const promoteStudent = (id) => {
    if (
      destinationClass === promotionClass &&
      (!isSeniorClass(destinationClass) ||
        destinationDepartment === promotionDepartment)
    ) {
      showNotice("Choose a different destination class or department.");
      return;
    }

    setStudents((current) =>
      current.map((student) => {
        if (student.id !== id) return student;

        return {
          ...student,
          className: destinationClass,
          department: isSeniorClass(destinationClass)
            ? destinationDepartment
            : "",
          status: "Promoted",
        };
      })
    );

    showNotice("Student promoted in the local preview.");
  };

  const deleteStudent = (id) => {
    setStudents((current) =>
      current.filter((student) => student.id !== id)
    );

    showNotice("Student removed from the local preview.");
  };

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
    Subjects:
      "Manage secondary-school subjects by class and department.",
    Enrollments:
      "Manage JSS and SS student class, department and term enrollments.",
    "Submit Scores":
      "Record continuous assessment and examination scores by class and department.",
    "Student Results":
      "Review subject grades, terminal averages and automatic teacher comments.",
    "Academic Terms":
      "Control term access and publish academic terms.",
    "Promote Students":
      "Promote students by class and department.",
  };

  const pageTitle =
    activePage === "Submit Scores" ? "Score Management" : activePage;

  // Overall results are grouped by student, term and academic year.
  const classResultScores = scores.filter(
    (score) =>
      score.className === resultClass &&
      (!isSeniorClass(resultClass) ||
        score.department === resultDepartment) &&
      score.term === resultTerm &&
      score.academicYear === resultAcademicYear
  );

  const visibleResultScores = filtered(classResultScores, [
    "studentName",
    "student",
    "subjectName",
    "subject",
    "admissionNumber",
    "subjectCode",
  ]);

  const groupedResults = Object.values(
    visibleResultScores.reduce((groups, score) => {
      const key = `${score.admissionNumber || score.student}-${score.term}-${score.academicYear}`;

      if (!groups[key]) {
        groups[key] = {
          studentId: score.admissionNumber || score.student,
          studentName: score.studentName || score.student,
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

  return (
    <div className="admin-shell">
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

          <a className="admin-logout" href="/admin/login">
            <LogOut size={18} />
            <span>Back to Login</span>
          </a>

          <a className="admin-home-link" href="/">
            Visit public website
            <ArrowUpRight size={15} />
          </a>
        </div>
      </aside>

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
                Administration <ChevronRight size={13} /> {activePage}
              </div>
              <h1>{pageTitle}</h1>
            </div>
          </div>

          <div className="admin-topbar-right">
            <span className="admin-session-label">
              <span /> {CURRENT_ACADEMIC_YEAR} Academic Session
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
                    <span className="admin-stat-caption">Preview data</span>
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
                      <button
                        key={label}
                        onClick={() => openPage(page)}
                        className="admin-quick-action"
                      >
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
                    <button
                      className="admin-text-button"
                      onClick={() => openPage("Academic Terms")}
                    >
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
                  <button
                    className="admin-text-button"
                    onClick={() => openPage("Students")}
                  >
                    View students
                  </button>
                </div>

                <StudentTable
                  students={students.slice(-4).reverse()}
                  onDelete={deleteStudent}
                  compact
                />
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
                    className: "JSS 1",
                    department: "Science",
                    gender: "Female",
                  });
                  setModal("student");
                }}
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
              />

              <p className="admin-classification-note">
                Showing students in <strong>{studentClass}</strong>
                {isSeniorClass(studentClass) && (
                  <> — <strong>{studentDepartment}</strong> Department</>
                )}
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
                title="Subject records"
                subtitle={`${visibleSubjects.length} subjects in this selection`}
                search={search}
                setSearch={setSearch}
                action={() => {
                  setSubjectForm({
                    name: "",
                    code: "",
                    className: "JSS 1",
                    department: "Science",
                  });
                  setModal("subject");
                }}
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

              {visibleSubjects.length === 0 && (
                <EmptyState text="No subjects found for this class and department." />
              )}
            </section>
          )}

          {/* ENROLLMENTS */}
          {activePage === "Enrollments" && (
            <section className="admin-panel">
              <PanelHeading
                title="Student enrollments"
                subtitle={`${enrollments.length} enrollments in this preview`}
                search={search}
                setSearch={setSearch}
                action={() => {
                  setEnrollmentForm({
                    student: "",
                    className: "JSS 1",
                    department: "",
                    term: "First Term",
                  });
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
                    {filtered(enrollments, [
                      "id",
                      "student",
                      "className",
                      "department",
                      "term",
                      "session",
                    ]).map((item) => (
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
                <EmptyState text="No student enrollments yet. You can enroll students individually or use Enroll All below." />
              )}

              <div className="admin-enroll-all-footer">
                <span>
                  Enroll all {students.length} students in the student preview
                  for First Term, {CURRENT_ACADEMIC_YEAR}.
                </span>

                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={enrollAllStudents}
                  disabled={students.length === 0}
                >
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
                setSelectedClass={(value) => {
                  setScoreClass(value);
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
                    (score) =>
                      score.className === scoreClass &&
                      (!isSeniorClass(scoreClass) ||
                        score.department === scoreDepartment)
                  ),
                  [
                    "studentName",
                    "student",
                    "subjectName",
                    "subject",
                    "term",
                    "academicYear",
                  ]
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
                    placeholder="2026/2027"
                  />
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
                <EmptyState text="No student results found for this class, department, term and academic year." />
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
                          <span>
                            {result.total} / {result.subjectCount * 100}
                          </span>
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
                                  <td><strong>{score.totalScore}</strong></td>
                                  <td><strong>{score.grade}</strong></td>
                                  <td>{score.remark}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="admin-result-comments">
                        <div>
                          <div className="admin-result-comment-heading">
                            <GraduationCap size={18} />
                            <strong>Class Teacher / Year Tutor's Comment</strong>
                          </div>
                          <p>{result.yearTutorComment}</p>
                        </div>

                        <div>
                          <div className="admin-result-comment-heading">
                            <School size={18} />
                            <strong>Principal / Admin's Comment</strong>
                          </div>
                          <p>{result.adminComment}</p>
                        </div>
                      </div>

                      <div className="admin-result-footer">
                        <span>
                          Subjects recorded: {result.subjectCount}
                        </span>
                        <span>
                          Overall total: {result.total} marks
                        </span>
                        {result.scores.some(
                          (score) => score.noInClass != null
                        ) && (
                          <span>
                            Manual position:{" "}
                            {result.scores.find(
                              (score) => score.noInClass != null
                            ).noInClass}
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <p className="admin-footnote">
                <InfoIcon />
                The terminal average is calculated from the subjects with
                recorded scores for this student and term. Both comments use
                that average and follow your supplied backend comment rules.
                Results in this frontend preview are not saved to the backend.
              </p>
            </section>
          )}

          {/* ACADEMIC TERMS */}
          {activePage === "Academic Terms" && (
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h3>Academic terms</h3>
                  <p>
                    Lock or unlock terms and independently publish or
                    unpublish completed terms.
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
                      >
                        {term.isPublished ? (
                          <X size={15} />
                        ) : (
                          <CheckCircle2 size={15} />
                        )}
                        {term.isPublished ? "Unpublish" : "Publish"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="admin-footnote">
                <InfoIcon />
                Locking and publishing are independent actions. Changes
                in this preview are local only and are not saved to your
                backend. Your shared controller currently exposes term
                locking, but not term publishing.
              </p>
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

                    {isSeniorClass(destinationClass) && (
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
                    {filtered(promotionStudents, [
                      "id",
                      "name",
                      "className",
                      "department",
                    ]).map((student) => (
                      <tr key={student.id}>
                        <td className="admin-id">{student.id}</td>
                        <td><strong>{student.name}</strong></td>
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

              {promotionStudents.length === 0 && (
                <EmptyState text="No students found in this class and department." />
              )}

              <p className="admin-footnote">
                <InfoIcon />
                Promotions in this preview update local state only.
                They are not saved to your backend.
              </p>
            </section>
          )}

          <footer className="admin-content-footer">
            <span>© {new Date().getFullYear()} O'lak Triumph School</span>
            <span>School Administration Portal</span>
          </footer>
        </div>
      </main>

      {/* NOTIFICATION */}
      {notice && (
        <div className="admin-toast">
          <CheckCircle2 size={18} />
          {notice}
        </div>
      )}

      {/* MODALS */}
      {modal && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setModal("")
          }
        >
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

              <button
                onClick={() => setModal("")}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* ADD STUDENT */}
            {modal === "student" && (
              <form onSubmit={addStudent}>
                <FormField label="Student full name">
                  <input
                    required
                    value={studentForm.name}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        name: e.target.value,
                      })
                    }
                    placeholder="Enter student's full name"
                  />
                </FormField>

                <FormField label="Class">
                  <select
                    required
                    value={studentForm.className}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        className: e.target.value,
                        department: "Science",
                      })
                    }
                  >
                    {secondaryClasses.map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                </FormField>

                {isSeniorClass(studentForm.className) && (
                  <FormField label="Department">
                    <select
                      required
                      value={studentForm.department}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          department: e.target.value,
                        })
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

                <FormField label="Gender">
                  <select
                    value={studentForm.gender}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        gender: e.target.value,
                      })
                    }
                  >
                    <option>Female</option>
                    <option>Male</option>
                  </select>
                </FormField>

                <ModalActions onCancel={() => setModal("")} />
              </form>
            )}

            {/* ADD SUBJECT */}
            {modal === "subject" && (
              <form onSubmit={addSubject}>
                <FormField label="Subject name">
                  <input
                    required
                    value={subjectForm.name}
                    onChange={(e) =>
                      setSubjectForm({
                        ...subjectForm,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g. Mathematics"
                  />
                </FormField>

                <FormField label="Subject code">
                  <input
                    required
                    value={subjectForm.code}
                    onChange={(e) =>
                      setSubjectForm({
                        ...subjectForm,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g. MTH"
                  />
                </FormField>

                <FormField label="Class">
                  <select
                    required
                    value={subjectForm.className}
                    onChange={(e) =>
                      setSubjectForm({
                        ...subjectForm,
                        className: e.target.value,
                        department: "Science",
                      })
                    }
                  >
                    {secondaryClasses.map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                </FormField>

                {isSeniorClass(subjectForm.className) && (
                  <FormField label="Department">
                    <select
                      required
                      value={subjectForm.department}
                      onChange={(e) =>
                        setSubjectForm({
                          ...subjectForm,
                          department: e.target.value,
                        })
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

                <ModalActions onCancel={() => setModal("")} />
              </form>
            )}

            {/* ENROLL STUDENT */}
            {modal === "enrollment" && (
              <form onSubmit={addEnrollment}>
                <FormField label="Student full name">
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={enrollmentForm.student}
                    onChange={(e) =>
                      setEnrollmentForm({
                        ...enrollmentForm,
                        student: e.target.value,
                      })
                    }
                    placeholder="Enter student's full name"
                  />
                </FormField>

                <FormField label="Class">
                  <select
                    required
                    value={enrollmentForm.className}
                    onChange={(e) =>
                      setEnrollmentForm({
                        ...enrollmentForm,
                        className: e.target.value,
                        department: "",
                      })
                    }
                  >
                    {enrollmentClassOptions.map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                </FormField>

                {isSeniorClass(enrollmentForm.className) && (
                  <FormField label="Department">
                    <select
                      required
                      value={enrollmentForm.department}
                      onChange={(e) =>
                        setEnrollmentForm({
                          ...enrollmentForm,
                          department: e.target.value,
                        })
                      }
                    >
                      <option value="">Select department</option>
                      {departments.map((department) => (
                        <option key={department} value={department}>
                          {department}
                        </option>
                      ))}
                    </select>
                  </FormField>
                )}

                <FormField label="Term">
                  <select
                    value={enrollmentForm.term}
                    onChange={(e) =>
                      setEnrollmentForm({
                        ...enrollmentForm,
                        term: e.target.value,
                      })
                    }
                  >
                    <option>First Term</option>
                    <option>Second Term</option>
                    <option>Third Term</option>
                  </select>
                </FormField>

                <ModalActions
                  onCancel={() => setModal("")}
                  submitLabel="Enroll student"
                />
              </form>
            )}

            {/* SUBMIT SCORE */}
            {modal === "score" && (
              <form onSubmit={addScore}>
                <div className="admin-score-class-summary">
                  <strong>{scoreClass}</strong>
                  {isSeniorClass(scoreClass) && (
                    <span>{scoreDepartment} Department</span>
                  )}
                </div>

                <FormField label="Student">
                  <select
                    required
                    value={scoreForm.student}
                    onChange={(e) =>
                      setScoreForm({
                        ...scoreForm,
                        student: e.target.value,
                      })
                    }
                  >
                    <option value="">Select a student</option>
                    {scoreStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.id})
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Subject">
                  <select
                    required
                    value={scoreForm.subject}
                    onChange={(e) =>
                      setScoreForm({
                        ...scoreForm,
                        subject: e.target.value,
                      })
                    }
                  >
                    <option value="">Select a subject</option>
                    {scoreSubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} ({subject.code})
                      </option>
                    ))}
                  </select>
                </FormField>

                <div className="admin-form-two">
                  <FormField label="Academic term">
                    <select
                      required
                      value={scoreForm.term}
                      onChange={(e) =>
                        setScoreForm({
                          ...scoreForm,
                          term: e.target.value,
                        })
                      }
                    >
                      <option>First Term</option>
                      <option>Second Term</option>
                      <option>Third Term</option>
                    </select>
                  </FormField>

                  <FormField label="Academic year">
                    <input
                      required
                      value={scoreForm.academicYear}
                      onChange={(e) =>
                        setScoreForm({
                          ...scoreForm,
                          academicYear: e.target.value,
                        })
                      }
                      placeholder="2026/2027"
                    />
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
                      <input
                        required
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        value={scoreForm[field]}
                        onChange={(e) =>
                          setScoreForm({
                            ...scoreForm,
                            [field]: e.target.value,
                          })
                        }
                      />
                    </FormField>
                  ))}
                </div>

                <div className="admin-score-section-heading">
                  <strong>EXAMINATION</strong>
                  <span>Maximum: 60 marks</span>
                </div>

                <FormField label="Examination score (0–60)">
                  <input
                    required
                    type="number"
                    min="0"
                    max="60"
                    step="0.01"
                    value={scoreForm.exam}
                    onChange={(e) =>
                      setScoreForm({
                        ...scoreForm,
                        exam: e.target.value,
                      })
                    }
                  />
                </FormField>

                <FormField label="Manual class position (optional)">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={scoreForm.noInClass}
                    onChange={(e) =>
                      setScoreForm({
                        ...scoreForm,
                        noInClass: e.target.value,
                      })
                    }
                    placeholder="Enter position if manually assigned"
                  />
                </FormField>

                <div className="admin-score-calculation">
                  <div>
                    <span>Continuous assessment</span>
                    <strong>{scoreCA.toFixed(2)} / 40</strong>
                  </div>

                  <div>
                    <span>Total score</span>
                    <strong>{scoreTotal.toFixed(2)} / 100</strong>
                  </div>

                  {liveGrade && (
                    <>
                      <div>
                        <span>Calculated grade</span>
                        <strong>{liveGrade.grade}</strong>
                      </div>

                      <div>
                        <span>Subject remark</span>
                        <strong>{liveGrade.remark}</strong>
                      </div>
                    </>
                  )}
                </div>

                {scoreStudents.length === 0 && (
                  <p className="admin-footnote">
                    No students are currently registered in this class
                    and department.
                  </p>
                )}

                {scoreSubjects.length === 0 && (
                  <p className="admin-footnote">
                    No subjects are currently assigned to this class
                    and department.
                  </p>
                )}

                <ModalActions
                  onCancel={() => setModal("")}
                  submitLabel="Save score"
                />
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// CLASS AND DEPARTMENT FILTER
function ClassificationFilter({
  selectedClass,
  setSelectedClass,
  selectedDepartment,
  setSelectedDepartment,
}) {
  return (
    <div className="admin-classification-controls">
      <label className="admin-form-field">
        <span>Select class</span>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          {secondaryClasses.map((className) => (
            <option key={className} value={className}>
              {className}
            </option>
          ))}
        </select>
      </label>

      {isSeniorClass(selectedClass) && (
        <label className="admin-form-field">
          <span>Select department</span>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
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
  );
}

// PANEL HEADING
function PanelHeading({
  title,
  subtitle,
  search,
  setSearch,
  action,
  actionLabel,
}) {
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
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search records..."
            />
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

// STUDENT TABLE
function StudentTable({ students, onDelete, compact }) {
  if (!students.length) {
    return (
      <EmptyState text="No student records found for this class and department." />
    );
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Student ID</th>
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
              <td className="admin-id">{student.id}</td>
              <td><strong>{student.name}</strong></td>
              <td>{student.className}</td>
              <td>{student.department || "—"}</td>
              <td>{student.gender}</td>
              <td>
                <span
                  className={`admin-status ${
                    student.status === "Promoted" ? "published" : "open"
                  }`}
                >
                  {student.status}
                </span>
              </td>

              {!compact && (
                <td>
                  <button
                    className="admin-icon-action danger"
                    title="Remove from local preview"
                    onClick={() => onDelete(student.id)}
                  >
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

// SCORE TABLE
function ScoreTable({ scores }) {
  if (!scores.length) {
    return <EmptyState text="No score records found for this selection." />;
  }

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
                <td>
                  <strong>{score.studentName || score.student}</strong>
                </td>
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

// FORM FIELD
function FormField({ label, children }) {
  return (
    <label className="admin-form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

// MODAL ACTIONS
function ModalActions({
  onCancel,
  submitLabel = "Save record",
}) {
  return (
    <div className="admin-modal-actions">
      <button
        type="button"
        className="admin-secondary-button"
        onClick={onCancel}
      >
        Cancel
      </button>

      <button type="submit" className="admin-primary-button">
        {submitLabel}
      </button>
    </div>
  );
}

// EMPTY STATE
function EmptyState({ text }) {
  return (
    <div className="admin-empty">
      <FileText size={28} />
      <p>{text}</p>
    </div>
  );
}

function InfoIcon() {
  return <Eye size={15} />;
}

export default AdminDashboard;