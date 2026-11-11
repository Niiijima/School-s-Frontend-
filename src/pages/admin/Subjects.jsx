
import React from "react";
import {
  BookOpen,
  Pencil,
  Trash2,
} from "lucide-react";

import PanelHeading from "../../components/admin/PanelHeading";
import ClassificationFilter from "../../components/admin/ClassificationFilter";
import EmptyState from "../../components/admin/EmptyState";

function Subjects({
  subjects,
  search,
  setSearch,
  selectedClass,
  setSelectedClass,
  selectedDepartment,
  setSelectedDepartment,
  onAdd,
  onEdit,
  onDelete,
}) {
  return (
    <section className="admin-panel">
      <PanelHeading
        title="Subject management"
        subtitle="Create, edit, and manage school subjects"
        search={search}
        setSearch={setSearch}
        action={onAdd}
        actionLabel="Add subject"
      />

      <ClassificationFilter
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
        allowAll
      />

      {subjects.length === 0 ? (
        <EmptyState text="No subjects found for this class and department." />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Subject code</th>
                <th>Assigned classes</th>
                <th>Department</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.id}>
                  <td>
                    <div className="admin-subject-name">
                      <span className="admin-subject-icon">
                        <BookOpen size={17} />
                      </span>

                      <strong>
                        {subject.name ||
                          subject.subjectName ||
                          subject.title}
                      </strong>
                    </div>
                  </td>

                  <td className="admin-id">
                    {subject.code || subject.subjectCode || "—"}
                  </td>

                  <td>
                    {subject.assignments
                      ? subject.assignments
                          .map((assignment) =>
                            typeof assignment === "string"
                              ? assignment
                              : assignment.className
                          )
                          .filter(Boolean)
                          .join(", ")
                      : subject.className || "—"}
                  </td>

                  <td>{subject.department || "—"}</td>

                  <td>
                    <div className="admin-table-actions">
                      <button
                        type="button"
                        className="admin-icon-action"
                        title="Edit subject"
                        onClick={() => onEdit(subject)}
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        className="admin-icon-action danger"
                        title="Delete subject"
                        onClick={() => onDelete(subject.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default Subjects;
