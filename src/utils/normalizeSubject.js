
function normalizeDepartment(department) {
  if (!department) return null;

  const normalized = String(department).trim().toLowerCase();

  if (normalized === "art" || normalized === "arts") return "Arts";
  if (normalized === "science") return "Science";
  if (normalized === "commercial") return "Commercial";

  return department;
}

function requiresDepartment(className = "") {
  return ["SS2", "SS3"].includes(
    String(className).trim().toUpperCase()
  );
}

export function normalizeSubject(s) {
  const legacyAssignments =
    s.className || s.currentClass
      ? [
          {
            className: s.className || s.currentClass,
            department: normalizeDepartment(s.department),
          },
        ]
      : [];

  return {
    id: s._id || s.id,
    name: s.subjectName || s.name || "",
    code: s.subjectCode || s.code || "",
    classAssignments: Array.isArray(s.classAssignments)
      ? s.classAssignments.map((assignment) => ({
          className: assignment.className,
          department: requiresDepartment(assignment.className)
            ? normalizeDepartment(assignment.department)
            : null,
        }))
      : legacyAssignments.map((assignment) => ({
          ...assignment,
          department: requiresDepartment(assignment.className)
            ? assignment.department
            : null,
        })),
  };
}
