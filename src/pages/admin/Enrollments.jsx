
import React from "react";
import PanelHeading from "../../components/admin/PanelHeading";
import EmptyState from "../../components/admin/EmptyState";

function Enrollments({
  enrollments,
  search,
  setSearch,
  onAdd,
}) {
  return (
    <section className="admin-panel">
      <PanelHeading
        title="Student enrollments"
        subtitle={`${enrollments.length} enrollment record${
          enrollments.length === 1 ? "" : "s"
        }`}
        search={search}
        setSearch={setSearch}
        action={onAdd}
        actionLabel="Enroll student"
      />

      {enrollments.length === 0 ? (
        <EmptyState text="No enrollment records found." />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Enrollment ID</th>
                <th>Student</th>
                <th>Class</th>
                <th>Department</th>
                <th>Term</th>
                <th>Academic session</th>
              </tr>
            </thead>

            <tbody>
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id}>
                  <td className="admin-id">
                    {enrollment.id}
                  </td>

                  <td>
                    <strong>{enrollment.student}</strong>
                  </td>

                  <td>{enrollment.className}</td>

                  <td>
                    {enrollment.department || "—"}
                  </td>

                  <td>{enrollment.term}</td>

                  <td>{enrollment.session}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default Enrollments;
