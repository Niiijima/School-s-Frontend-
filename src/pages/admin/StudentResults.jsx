
import React from "react";
import {
  GraduationCap,
  School,
  Info,
} from "lucide-react";

import PanelHeading from "../../components/admin/PanelHeading";
import ClassificationFilter from "../../components/admin/ClassificationFilter";
import FormField from "../../components/admin/FormField";
import EmptyState from "../../components/admin/EmptyState";

function StudentResults({
  groupedResults,
  resultClass,
  setResultClass,
  resultDepartment,
  setResultDepartment,
  resultTerm,
  setResultTerm,
  resultAcademicYear,
  setResultAcademicYear,
  termOptions = [],
  academicYearOptions = [],
  search,
  setSearch,
}) {
  return (
    <section className="admin-results-page">
      <PanelHeading
        title="Student results"
        subtitle="View students' academic performance and terminal results"
        search={search}
        setSearch={setSearch}
      />

      <div className="admin-results-filters">
        <ClassificationFilter
          selectedClass={resultClass}
          setSelectedClass={setResultClass}
          selectedDepartment={resultDepartment}
          setSelectedDepartment={setResultDepartment}
          allowAll
        />

        <FormField label="Select term">
          <select
            value={resultTerm}
            onChange={(e) => setResultTerm(e.target.value)}
          >
            <option value="All">All terms</option>

            {termOptions.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Academic year">
          <select
            value={resultAcademicYear}
            onChange={(e) =>
              setResultAcademicYear(e.target.value)
            }
          >
            <option value="All">All academic years</option>

            {academicYearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {groupedResults.length === 0 ? (
        <EmptyState text="No student results found for this selection." />
      ) : (
        <div className="admin-overall-results">
          {groupedResults.map((result) => (
            <article
              className="admin-student-result-card"
              key={`${result.studentId}-${result.term}-${result.academicYear}`}
            >
              <div className="admin-result-header">
                <div className="admin-result-student">
                  <div className="admin-result-icon">
                    <GraduationCap size={22} />
                  </div>

                  <div>
                    <h3>{result.studentName}</h3>

                    <p>
                      {result.admissionNumber ||
                        result.studentId}
                    </p>
                  </div>
                </div>

                <div className="admin-result-class">
                  <School size={16} />

                  <span>
                    {result.className}
                    {result.department
                      ? ` · ${result.department}`
                      : ""}
                  </span>
                </div>
              </div>

              <div className="admin-result-session">
                <span>{result.term}</span>
                <span>{result.academicYear}</span>
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
                            <strong>
                              {score.subjectName ||
                                score.subject}
                            </strong>
                          </td>

                          <td>{score.test1}</td>
                          <td>{score.test2}</td>
                          <td>{score.test3}</td>
                          <td>{score.assignment}</td>
                          <td>{ca}</td>
                          <td>{score.exam}</td>
                          <td>
                            <strong>
                              {score.totalScore}
                            </strong>
                          </td>
                          <td>
                            <strong>
                              {score.grade || "—"}
                            </strong>
                          </td>
                          <td>{score.remark || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="admin-result-average">
                <span>Terminal average</span>
                <strong>
                  {Number(result.average || 0).toFixed(2)}%
                </strong>
              </div>

              <div className="admin-result-comments">
                <div>
                  <strong>Admin's Comment</strong>
                  <p>
                    {result.adminComment ||
                      "No admin comment available."}
                  </p>
                </div>

                <div>
                  <strong>Year Tutor's Comment</strong>
                  <p>
                    {result.yearTutorComment ||
                      "No year tutor comment available."}
                  </p>
                </div>

                <div>
                  <strong>Subjects Recorded</strong>
                  <p>{result.subjectCount}</p>
                </div>
              </div>

              <div className="admin-result-footer">
                <Info size={15} />
                <span>
                  Results are based on the scores recorded
                  for this student, term, and academic year.
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default StudentResults;
