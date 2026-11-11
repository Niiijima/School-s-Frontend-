
import React, { useMemo } from "react";
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

const DEPARTMENTS = ["Science", "Arts", "Commercial"];

const CLASSES = [
  "JSS1",
  "JSS2",
  "JSS3",
  "SS1",
  "SS2",
  "SS3",
];

function requiresDepartment(className) {
  return ["SS2", "SS3"].includes(
    String(className || "").trim().toUpperCase()
  );
}

export default function Students({
  students = [],
  search = "",
  setSearch = () => {},
  selectedClass = "All",
  setSelectedClass = () => {},
  selectedDepartment = "Science",
  setSelectedDepartment = () => {},
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
}) {
  const visibleStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const fullName =
        student.name ||
        `${student.firstName || ""} ${student.surname || ""}`.trim();

      const matchesSearch =
        !query ||
        [
          fullName,
          student.firstName,
          student.surname,
          student.admissionNumber,
          student.className,
          student.department,
        ].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

      const matchesClass =
        selectedClass === "All" ||
        String(student.className || "").toUpperCase() ===
          selectedClass;

      const matchesDepartment =
        selectedClass === "All" ||
        !requiresDepartment(selectedClass) ||
        student.department === selectedDepartment;

      return matchesSearch && matchesClass && matchesDepartment;
    });
  }, [students, search, selectedClass, selectedDepartment]);

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading admin-panel-heading-wrap">
        <div>
          <h3>Students</h3>
          <p>
            Manage registered students, personal records and
            class assignments.
          </p>
        </div>

        <div className="admin-panel-tools">
          <div className="admin-search">
            <Search size={16} />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or admission number..."
            />
          </div>

          <button
            type="button"
            className="admin-primary-button"
            onClick={onAddStudent}
          >
            <Plus size={17} />
            Add student
          </button>
        </div>
      </div>

      <div className="admin-classification-controls">
        <label className="admin-form-field">
          <span>Select class</span>

          <select
            value={selectedClass}
            onChange={(event) => {
              setSelectedClass(event.target.value);
              setSelectedDepartment("Science");
            }}
          >
            <option value="All">All classes</option>

            {CLASSES.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </label>

        {requiresDepartment(selectedClass) && (
          <label className="admin-form-field">
            <span>Select department</span>

            <select
              value={selectedDepartment}
              onChange={(event) =>
                setSelectedDepartment(event.target.value)
              }
            >
              {DEPARTMENTS.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <p className="admin-classification-note">
        Showing{" "}
        <strong>
          {selectedClass === "All" ? "all classes" : selectedClass}
        </strong>

        {selectedClass !== "All" &&
          requiresDepartment(selectedClass) && (
            <>
              {" "}
              — <strong>{selectedDepartment}</strong> Department
            </>
          )}

        {" · "}
        {visibleStudents.length} student(s)
      </p>

      {visibleStudents.length > 0 ? (
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
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {visibleStudents.map((student) => {
                const fullName =
                  student.name ||
                  `${student.firstName || ""} ${student.surname || ""}`.trim();

                return (
                  <tr key={student.id}>
                    <td className="admin-id">
                      {student.admissionNumber || "—"}
                    </td>

                    <td>
                      <strong>
                        {fullName || "Unnamed student"}
                      </strong>
                    </td>

                    <td>{student.className || "—"}</td>

                    <td>
                      {requiresDepartment(student.className)
                        ? student.department || "Not assigned"
                        : "—"}
                    </td>

                    <td>{student.gender || "Not provided"}</td>

                    <td>
                      <span
                        className={`admin-status ${
                          student.status === "active"
                            ? "open"
                            : "locked"
                        }`}
                      >
                        {student.status || "active"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-student-actions">
                        <button
                          type="button"
                          className="admin-table-action"
                          onClick={() => onEditStudent?.(student)}
                          title="Edit student profile"
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        <button
                          type="button"
                          className="admin-icon-action danger"
                          onClick={() =>
                            onDeleteStudent?.(student.id)
                          }
                          title="Delete student"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-empty">
          <Users size={28} />
          <p>
            No student records found for this class and search.
          </p>
        </div>
      )}
    </section>
  );
}
