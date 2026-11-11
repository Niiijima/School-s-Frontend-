
export function normalizeStudent(student = {}) {
  const firstName =
    student.firstName ||
    student.first_name ||
    "";

  const surname =
    student.surname ||
    student.lastName ||
    student.last_name ||
    "";

  const fullName = `${firstName} ${surname}`.trim();

  const name =
    student.name ||
    student.fullName ||
    student.user?.name ||
    fullName ||
    "";

  return {
    ...student,

    id: student._id || student.id,

    name,

    firstName,
    surname,

    admissionNumber:
      student.admissionNumber ||
      student.admission_number ||
      "",

    className:
      student.currentClass ||
      student.className ||
      student.class ||
      "",

    department: student.department || "",

    gender: student.gender || "",

    status: student.status || "Active",
  };
}
