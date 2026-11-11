
import React, { useEffect, useState } from "react";
import FormField from "../../components/admin/FormField";
import {
  departments,
  secondaryClasses,
  requiresDepartment,
} from "../../utils/allowedClasses";

function getInitialForm(student) {
  return {
    name:
      student?.name ||
      [student?.firstName, student?.surname]
        .filter(Boolean)
        .join(" ") ||
      "",
    admissionNumber: student?.admissionNumber || "",
    className: student?.className || "JSS1",
    department: student?.department || "",
    gender: student?.gender || "Male",
    status: student?.status || "Active",
  };
}

function EditStudent({
  student,
  onSave,
  onCancel,
}) {
  const [form, setForm] = useState(() =>
    getInitialForm(student)
  );

  useEffect(() => {
    setForm(getInitialForm(student));
  }, [student]);

  if (!student) {
    return (
      <section className="admin-panel">
        <div className="admin-empty">
          <p>No student has been selected for editing.</p>

          <button
            type="button"
            className="admin-secondary-button"
            onClick={onCancel}
          >
            Back to students
          </button>
        </div>
      </section>
    );
  }

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "className" &&
      !requiresDepartment(value)
        ? { department: "" }
        : {}),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const updatedStudent = {
      ...student,
      ...form,
      department: requiresDepartment(form.className)
        ? form.department
        : "",
    };

    onSave(updatedStudent);
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <h3>Edit student</h3>
          <p>
            Update the student's personal and academic
            information.
          </p>
        </div>
      </div>

      <form
        className="admin-form"
        onSubmit={handleSubmit}
      >
        <div className="admin-form-grid">
          <FormField label="Student name">
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                updateField("name", e.target.value)
              }
              placeholder="Enter student's full name"
              required
            />
          </FormField>

          <FormField label="Admission number">
            <input
              type="text"
              value={form.admissionNumber}
              onChange={(e) =>
                updateField(
                  "admissionNumber",
                  e.target.value
                )
              }
              placeholder="Enter admission number"
              required
            />
          </FormField>

          <FormField label="Class">
            <select
              value={form.className}
              onChange={(e) =>
                updateField("className", e.target.value)
              }
              required
            >
              {secondaryClasses.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </FormField>

          {requiresDepartment(form.className) && (
            <FormField label="Department">
              <select
                value={form.department}
                onChange={(e) =>
                  updateField("department", e.target.value)
                }
                required
              >
                <option value="">Select department</option>

                {departments.map((department) => (
                  <option
                    key={department}
                    value={department}
                  >
                    {department}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <FormField label="Gender">
            <select
              value={form.gender}
              onChange={(e) =>
                updateField("gender", e.target.value)
              }
              required
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </FormField>

          <FormField label="Student status">
            <select
              value={form.status}
              onChange={(e) =>
                updateField("status", e.target.value)
              }
              required
            >
              <option value="Active">Active</option>
              <option value="Promoted">Promoted</option>
            </select>
          </FormField>
        </div>

        <div className="admin-modal-actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="admin-primary-button"
          >
            Save changes
          </button>
        </div>
      </form>
    </section>
  );
}

export default EditStudent;
