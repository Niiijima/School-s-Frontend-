
import React from "react";
import ClassificationFilter from "../../components/admin/ClassificationFilter";
import EmptyState from "../../components/admin/EmptyState";

function PromoteStudents({
  students,
  selectedClass,
  setSelectedClass,
  selectedDepartment,
  setSelectedDepartment,
  onPromote,
}) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <h3>Promote students</h3>
          <p>
            Select a class and promote eligible students
            to the next academic class.
          </p>
        </div>
      </div>

      <ClassificationFilter
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
      />

      {students.length === 0 ? (
        <EmptyState text="No eligible students found for this class and department." />
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Admission No.</th>
                  <th>Student name</th>
                  <th>Current class</th>
                  <th>Department</th>
                  <th>Gender</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="admin-id">
                      {student.admissionNumber || student.id}
                    </td>

                    <td>
                      <strong>{student.name}</strong>
                    </td>

                    <td>{student.className}</td>

                    <td>{student.department || "—"}</td>

                    <td>{student.gender}</td>

                    <td>
                      <span className="admin-status open">
                        {student.status || "Active"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="admin-primary-button"
                        onClick={() => onPromote(student)}
                      >
                        Promote
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

export default PromoteStudents;
