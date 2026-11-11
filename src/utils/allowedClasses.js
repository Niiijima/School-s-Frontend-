
export const departments = [
  "Science",
  "Arts",
  "Commercial",
];

export const juniorClasses = [
  "JSS1",
  "JSS2",
  "JSS3",
];

export const seniorClasses = [
  "SS1",
  "SS2",
  "SS3",
];

export const secondaryClasses = [
  ...juniorClasses,
  ...seniorClasses,
];

export const filterClassOptions = [
  "All",
  ...secondaryClasses,
];

export function requiresDepartment(className = "") {
  return ["SS2", "SS3"].includes(
    String(className).trim().toUpperCase()
  );
}

export function isSeniorClass(className = "") {
  return String(className)
    .trim()
    .toUpperCase()
    .startsWith("SS");
}
