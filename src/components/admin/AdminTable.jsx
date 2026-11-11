
import React from "react";
import { Trash2 } from "lucide-react";
import EmptyState from "./EmptyState";

export function StudentTable({ students, onDelete, compact }) {
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
          {students.map((student) => {
            const studentName =
              student.name ||
              `${student.firstName || ""} ${student.surname || ""}`.trim() ||
              `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
              "Name unavailable";

            return (
              <tr key={student.id}>
                <td className="admin-id">
                  {student.admissionNumber || student.id}
                </td>

                <td>
                  <strong>{studentName}</strong>
                </td>

                <td>{student.className}</td>

                <td>{student.department || "—"}</td>

                <td>{student.gender || "—"}</td>

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

                {!compact && (
                  <td>
                    <button
                      className="admin-icon-action danger"
                      title="Delete student"
                      onClick={() => onDelete(student.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ScoreTable({ scores }) {
  if (!scores.length) {
    return (
      <EmptyState text="No score records found for this selection." />
    );
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
                  <strong>
                    {score.studentName || score.student || "—"}
                  </strong>
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
                <td>
                  <strong>{score.totalScore}</strong>
                </td>
                <td>
                  <strong>{score.grade || "—"}</strong>
                </td>
                <td>{score.remark || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
