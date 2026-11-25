
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

import FormField from "./FormField";
import ModalActions from "./ModalActions";

function AdminModal({
  modal,
  setModal,

  studentForm,
  setStudentForm,
  addStudent,

  subjectForm,
  setSubjectForm,
  addSubject,
  toggleSubjectAssignment,

  enrollmentForm,
  setEnrollmentForm,
  addEnrollment,

  scoreForm,
  setScoreForm,
  addScore,
  submitComponentScores,

  scoreClass,
  scoreDepartment,
  scoreStudents,
  scoreSubjects,

  departments,
  secondaryClasses,
  enrollmentClassOptions,
  subjectAssignmentOptions,
  requiresDepartment,
}) {
  const [scoreType, setScoreType] = useState("CA");
  const [scoreRows, setScoreRows] = useState([]);

  // Load all subjects assigned to the selected class.
  useEffect(() => {
    setScoreRows(
      (scoreSubjects || []).map((subject) => ({
        subject: subject.id || subject._id,
        subjectName: subject.name || subject.subjectName || "",
        subjectCode: subject.code || subject.subjectCode || "",
        test1: "",
        test2: "",
        notes: "",
        oral: "",
        exam: "",
      }))
    );
  }, [scoreSubjects, scoreForm.student]);

  const updateScoreRow = (subjectId, field, value) => {
    setScoreRows((previousRows) =>
      previousRows.map((row) =>
        row.subject === subjectId
          ? { ...row, [field]: value }
          : row
      )
    );
  };

  // Keep blank scores blank. A score of zero is still valid.
  const getNumber = (value) => {
    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return null;
    }

    return Number(value);
  };

  const hasValue = (value) =>
    value !== "" && value !== null && value !== undefined;

  const getCATotal = (row) => {
    return (
      (getNumber(row.test1) ?? 0) +
      (getNumber(row.test2) ?? 0) +
      (getNumber(row.notes) ?? 0) +
      (getNumber(row.oral) ?? 0)
    );
  };

  const hasCAEntry = (row) =>
    hasValue(row.test1) ||
    hasValue(row.test2) ||
    hasValue(row.notes) ||
    hasValue(row.oral);

  const hasCompleteCA = (row) =>
    hasValue(row.test1) &&
    hasValue(row.test2) &&
    hasValue(row.notes) &&
    hasValue(row.oral);

  const handleStudentChange = (e) => {
    setScoreForm({
      ...scoreForm,
      student: e.target.value,
      subject: "",
    });
  };

  const handleScoreTypeChange = (e) => {
    setScoreType(e.target.value);
  };

  // Submit only subjects and score components that have values.
  const handleScoreSubmit = (e) => {
    e.preventDefault();

    if (!scoreForm.student) {
      alert("Please select a student.");
      return;
    }

    if (!scoreRows.length) {
      alert("No subjects are available for this class.");
      return;
    }

    const scores = scoreRows
      .map((row) => {
        if (scoreType === "CA") {
          const score = {
            subject: row.subject,
          };

          if (hasValue(row.test1)) {
            score.test1 = getNumber(row.test1);
          }

          if (hasValue(row.test2)) {
            score.test2 = getNumber(row.test2);
          }

          if (hasValue(row.notes)) {
            score.notes = getNumber(row.notes);
          }

          if (hasValue(row.oral)) {
            score.oral = getNumber(row.oral);
          }

          return hasCAEntry(row) ? score : null;
        }

        if (!hasValue(row.exam)) {
          return null;
        }

        return {
          subject: row.subject,
          exam: getNumber(row.exam),
        };
      })
      .filter(Boolean);

    if (scores.length === 0) {
      alert(
        scoreType === "CA"
          ? "Please enter at least one CA score before submitting."
          : "Please enter at least one examination score before submitting."
      );
      return;
    }

    const payload = {
      student: scoreForm.student,
      term: scoreForm.term,
      academicYear: scoreForm.academicYear,
      noInClass: scoreForm.noInClass,
      componentType: scoreType,
      scores,
    };

    if (submitComponentScores) {
      submitComponentScores(e, payload);
    } else if (addScore) {
      addScore(e, payload);
    } else {
      alert("The score submission function has not been connected.");
    }
  };

  if (!modal) return null;

  return (
    <div
      className="admin-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          setModal("");
        }
      }}
    >
      <div className="admin-modal">
        <div className="admin-modal-heading">
          <div>
            <span className="admin-eyebrow">
              O'LAK TRIUMPH SCHOOL
            </span>

            <h3>
              {modal === "student"
                ? "Add a student"
                : modal === "subject"
                ? subjectForm.id
                  ? "Edit subject assignments"
                  : "Add a subject"
                : modal === "enrollment"
                ? "Enroll a student"
                : "Submit student scores"}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setModal("")}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* ADD STUDENT */}

        {modal === "student" && (
          <form onSubmit={addStudent}>
            <div className="admin-form-two">
              <FormField label="First name">
                <input
                  required
                  value={studentForm.firstName}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      firstName: e.target.value,
                    })
                  }
                  placeholder="Enter first name"
                />
              </FormField>

              <FormField label="Surname">
                <input
                  required
                  value={studentForm.surname}
                  onChange={(e) =>
                    setStudentForm({
                      ...studentForm,
                      surname: e.target.value,
                    })
                  }
                  placeholder="Enter surname"
                />
              </FormField>
            </div>

            <FormField label="Student email">
              <input
                required
                type="email"
                value={studentForm.email}
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    email: e.target.value,
                  })
                }
                placeholder="student@example.com"
              />
            </FormField>

            <FormField label="Admission number">
              <input
                required
                value={studentForm.admissionNumber}
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    admissionNumber: e.target.value,
                  })
                }
                placeholder="e.g. SCH2025001"
              />
            </FormField>

            <p className="admin-classification-note">
              The initial login password is generated by
              the backend from the student's surname in
              lowercase. The student should change it
              after their first login.
            </p>

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

            {requiresDepartment(studentForm.className) && (
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

            <ModalActions
              onCancel={() => setModal("")}
              submitLabel="Register student"
            />
          </form>
        )}

        {/* ADD OR EDIT SUBJECT */}

        {modal === "subject" && (
          <form onSubmit={addSubject}>
            <FormField label="Subject name">
              <input
                required={!subjectForm.id}
                disabled={Boolean(subjectForm.id)}
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
                required={!subjectForm.id}
                disabled={Boolean(subjectForm.id)}
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

            <div className="admin-form-field">
              <span>Assign this subject to classes</span>

              <p className="admin-classification-note">
                Select every class and department that
                should offer this subject.
                <br />
                JSS1–JSS3 and SS1 use general class
                assignments.
                <br />
                Only SS2 and SS3 require departments.
              </p>

              <div
                className="admin-subject-assignment-list"
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                {subjectAssignmentOptions.map((assignment) => {
                  const checked =
                    subjectForm.classAssignments.some(
                      (item) =>
                        item.className === assignment.className &&
                        (item.department || null) ===
                          (assignment.department || null)
                    );

                  const label = assignment.department
                    ? `${assignment.className} — ${assignment.department}`
                    : assignment.className;

                  return (
                    <label
                      key={`${assignment.className}-${
                        assignment.department || "all"
                      }`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleSubjectAssignment(assignment)
                        }
                      />

                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>

              <p className="admin-classification-note">
                {subjectForm.classAssignments.length}{" "}
                assignment(s) selected.
              </p>
            </div>

            <ModalActions
              onCancel={() => setModal("")}
              submitLabel={
                subjectForm.id
                  ? "Update assignments"
                  : "Save subject"
              }
            />
          </form>
        )}

        {/* ENROLLMENT */}

        {modal === "enrollment" && (
          <form onSubmit={addEnrollment}>
            <FormField label="Student full name">
              <input
                required
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

            {requiresDepartment(enrollmentForm.className) && (
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

        {/* SUBMIT CA OR EXAM SCORES */}

        {modal === "score" && (
          <form onSubmit={handleScoreSubmit}>
            <div className="admin-score-class-summary">
              <strong>{scoreClass}</strong>

              {requiresDepartment(scoreClass) && (
                <span>{scoreDepartment} Department</span>
              )}
            </div>

            <FormField label="Select student">
              <select
                required
                value={scoreForm.student || ""}
                onChange={handleStudentChange}
              >
                <option value="">Select a student</option>

                {(scoreStudents || []).map((student) => (
                  <option
                    key={student.id || student._id}
                    value={student.id || student._id}
                  >
                    {student.name} ({student.admissionNumber})
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

            <div className="admin-form-field">
              <label htmlFor="score-component">
                Select score component
              </label>

              <select
                id="score-component"
                value={scoreType}
                onChange={handleScoreTypeChange}
              >
                <option value="CA">
                  Continuous Assessment (40 marks)
                </option>
                <option value="Exam">
                  Examination (60 marks)
                </option>
              </select>
            </div>

            <div className="admin-score-section-heading">
              <strong>
                {scoreType === "CA"
                  ? "CONTINUOUS ASSESSMENT"
                  : "EXAMINATION SCORES"}
              </strong>

              <span>
                {scoreType === "CA"
                  ? "Maximum: 40 marks"
                  : "Maximum: 60 marks"}
              </span>
            </div>

            {!scoreForm.student ? (
              <p className="admin-classification-note">
                Select a student to load their subjects.
              </p>
            ) : scoreRows.length === 0 ? (
              <p className="admin-classification-note">
                No subjects are currently assigned to this
                class or department.
              </p>
            ) : (
              <div
                className="admin-score-subject-list"
                style={{
                  display: "grid",
                  gap: 18,
                  marginTop: 16,
                }}
              >
                {scoreRows.map((row, index) => (
                  <div
                    key={row.subject}
                    className="admin-score-subject-card"
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        marginBottom: 14,
                      }}
                    >
                      <strong>
                        {index + 1}. {row.subjectName}
                      </strong>

                      <span>{row.subjectCode}</span>
                    </div>

                    {scoreType === "CA" ? (
                      <>
                        <div className="admin-form-two">
                          <FormField label="Test 1 (0–10)">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.01"
                              value={row.test1}
                              onChange={(e) =>
                                updateScoreRow(
                                  row.subject,
                                  "test1",
                                  e.target.value
                                )
                              }
                            />
                          </FormField>

                          <FormField label="Test 2 (0–20)">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.01"
                              value={row.test2}
                              onChange={(e) =>
                                updateScoreRow(
                                  row.subject,
                                  "test2",
                                  e.target.value
                                )
                              }
                            />
                          </FormField>

                          <FormField label="Notes (0–5)">
                            <input
                              type="number"
                              min="0"
                              max="5"
                              step="0.01"
                              value={row.notes}
                              onChange={(e) =>
                                updateScoreRow(
                                  row.subject,
                                  "notes",
                                  e.target.value
                                )
                              }
                            />
                          </FormField>

                          <FormField label="Oral (0–5)">
                            <input
                              type="number"
                              min="0"
                              max="5"
                              step="0.01"
                              value={row.oral}
                              onChange={(e) =>
                                updateScoreRow(
                                  row.subject,
                                  "oral",
                                  e.target.value
                                )
                              }
                            />
                          </FormField>
                        </div>

                        <div className="admin-score-calculation">
                          <div>
                            <span>
                              {hasCAEntry(row)
                                ? "Entered score total so far"
                                : "No CA scores entered"}
                            </span>

                            <strong>
                              {hasCAEntry(row)
                                ? `${getCATotal(row).toFixed(2)} / 40`
                                : "—"}
                            </strong>
                          </div>

                          {hasCAEntry(row) && (
                            <span className="admin-classification-note">
                              {hasCompleteCA(row)
                                ? "All CA components entered"
                                : "CA is still incomplete"}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <FormField label="Examination score (0–60)">
                        <input
                          type="number"
                          min="0"
                          max="60"
                          step="0.01"
                          value={row.exam}
                          onChange={(e) =>
                            updateScoreRow(
                              row.subject,
                              "exam",
                              e.target.value
                            )
                          }
                        />
                      </FormField>
                    )}
                  </div>
                ))}
              </div>
            )}

            <FormField label="Manual class position (optional)">
              <input
                type="number"
                min="1"
                step="1"
                value={scoreForm.noInClass || ""}
                onChange={(e) =>
                  setScoreForm({
                    ...scoreForm,
                    noInClass: e.target.value,
                  })
                }
                placeholder="Enter position if manually assigned"
              />
            </FormField>

            <p className="admin-classification-note">
              {scoreType === "CA"
                ? "Enter scores for whichever subjects you are ready to submit. You do not need to complete every subject or every CA component at once. Blank fields will be skipped."
                : "Enter examination scores for whichever subjects are ready. Blank subjects will be skipped, and previously submitted CA scores will remain unchanged."}
            </p>

            <ModalActions
              onCancel={() => setModal("")}
              submitLabel={
                scoreType === "CA"
                  ? "Submit CA scores"
                  : "Submit Exam scores"
              }
            />
          </form>
        )}
      </div>
    </div>
  );
}

export default AdminModal;
