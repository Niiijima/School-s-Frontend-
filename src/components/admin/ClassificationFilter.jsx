
import React from "react";

const departments = ["Science", "Arts", "Commercial"];

const juniorClasses = ["JSS1", "JSS2", "JSS3"];
const seniorClasses = ["SS1", "SS2", "SS3"];

const secondaryClasses = [
  ...juniorClasses,
  ...seniorClasses,
];

const filterClassOptions = ["All", ...secondaryClasses];

function requiresDepartment(className = "") {
  return ["SS2", "SS3"].includes(
    String(className).trim().toUpperCase()
  );
}

function ClassificationFilter({
  selectedClass,
  setSelectedClass,
  selectedDepartment,
  setSelectedDepartment,
  allowAll = false,
}) {
  const options = allowAll
    ? filterClassOptions
    : secondaryClasses;

  return (
    <div className="admin-classification-controls">
      <label className="admin-form-field">
        <span>Select class</span>

        <select
          value={selectedClass}
          onChange={(e) =>
            setSelectedClass(e.target.value)
          }
        >
          {options.map((className) => (
            <option key={className} value={className}>
              {className}
            </option>
          ))}
        </select>
      </label>

      {selectedClass !== "All" &&
        requiresDepartment(selectedClass) && (
          <label className="admin-form-field">
            <span>Select department</span>

            <select
              value={selectedDepartment}
              onChange={(e) =>
                setSelectedDepartment(e.target.value)
              }
            >
              {departments.map((department) => (
                <option
                  key={department}
                  value={department}
                >
                  {department}
                </option>
              ))}
            </select>
          </label>
        )}
    </div>
  );
}

export default ClassificationFilter;
