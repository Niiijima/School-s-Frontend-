
import React from "react";
import ClassificationFilter from "../../components/admin/ClassificationFilter";
import FormField from "../../components/admin/FormField";

function SubmitScores({
  scoreClass,
  setScoreClass,
  scoreDepartment,
  setScoreDepartment,
  scoreStudents,
  scoreSubjects,
  scoreForm,
  setScoreForm,
  addScore,
  scoreCA,
  scoreTotal,
  liveGrade,
  termOptions = [],
  academicYearOptions = [],
}) {
  const updateField = (field, value) => {
    setScoreForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <h3>Submit student scores</h3>
          <p>
            Enter continuous assessment and examination
            scores for students.
          </p>
        </div>
      </div>

      <ClassificationFilter
        selectedClass={scoreClass}
        setSelectedClass={setScoreClass}
        selectedDepartment={scoreDepartment}
        setSelectedDepartment={setScoreDepartment}
      />

      <form
        className="admin-form"
        onSubmit={addScore}
      >
        <div className="admin-form-grid">
          <FormField label="Select student">
            <select
              value={scoreForm.studentId}
              onChange={(e) =>
                updateField("studentId", e.target.value)
              }
              required
            >
              <option value="">Select student</option>

              {scoreStudents.map((student) => (
                <option
                  key={student.id}
                  value={student.id}
                >
                  {student.name} (
                  {student.admissionNumber || student.id})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Select subject">
            <select
              value={scoreForm.subjectId}
              onChange={(e) =>
                updateField("subjectId", e.target.value)
              }
              required
            >
              <option value="">Select subject</option>

              {scoreSubjects.map((subject) => (
                <option
                  key={subject.id}
                  value={subject.id}
                >
                  {subject.name ||
                    subject.subjectName ||
                    subject.title}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Term">
            <select
              value={scoreForm.term}
              onChange={(e) =>
                updateField("term", e.target.value)
              }
              required
            >
              <option value="">Select term</option>

              {termOptions.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Academic year">
            <select
              value={scoreForm.academicYear}
              onChange={(e) =>
                updateField("academicYear", e.target.value)
              }
              required
            >
              <option value="">Select academic year</option>

              {academicYearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Test 1 (out of 10)">
            <input
              type="number"
              min="0"
              max="10"
              value={scoreForm.test1}
              onChange={(e) =>
                updateField("test1", e.target.value)
              }
              required
            />
          </FormField>

          <FormField label="Test 2 (out of 10)">
            <input
              type="number"
              min="0"
              max="10"
              value={scoreForm.test2}
              onChange={(e) =>
                updateField("test2", e.target.value)
              }
              required
            />
          </FormField>

          <FormField label="Test 3 (out of 10)">
            <input
              type="number"
              min="0"
              max="10"
              value={scoreForm.test3}
              onChange={(e) =>
                updateField("test3", e.target.value)
              }
              required
            />
          </FormField>

          <FormField label="Assignment (out of 10)">
            <input
              type="number"
              min="0"
              max="10"
              value={scoreForm.assignment}
              onChange={(e) =>
                updateField("assignment", e.target.value)
              }
              required
            />
          </FormField>

          <FormField label="Examination (out of 60)">
            <input
              type="number"
              min="0"
              max="60"
              value={scoreForm.exam}
              onChange={(e) =>
                updateField("exam", e.target.value)
              }
              required
            />
          </FormField>
        </div>

        <div className="admin-score-preview">
          <div>
            <span>Continuous assessment</span>
            <strong>{scoreCA} / 40</strong>
          </div>

          <div>
            <span>Total score</span>
            <strong>{scoreTotal} / 100</strong>
          </div>

          <div>
            <span>Grade</span>
            <strong>{liveGrade}</strong>
          </div>
        </div>

        <div className="admin-modal-actions">
          <button
            type="submit"
            className="admin-primary-button"
            disabled={
              !scoreStudents.length ||
              !scoreSubjects.length
            }
          >
            Submit score
          </button>
        </div>
      </form>
    </section>
  );
}

export default SubmitScores;
