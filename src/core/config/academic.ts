/**
 * Academic Calendars & Structure Configuration
 */

export const academicConfig = Object.freeze({
  defaultAcademicYear: "2026-27",
  defaultSemester: "SEM-3",
  
  // Naming configuration settings
  semesters: [
    { id: "SEM-1", name: "Semester I", status: "inactive" },
    { id: "SEM-2", name: "Semester II", status: "inactive" },
    { id: "SEM-3", name: "Semester III", status: "active" },
    { id: "SEM-4", name: "Semester IV", status: "inactive" },
    { id: "SEM-5", name: "Semester V", status: "inactive" },
    { id: "SEM-6", name: "Semester VI", status: "inactive" },
    { id: "SEM-7", name: "Semester VII", status: "inactive" },
    { id: "SEM-8", name: "Semester VIII", status: "inactive" },
  ],
  
  // Section definitions
  sections: ["A", "B", "C", "D"],
  
  // Validation constraints for roll numbers
  rollNumberConstraint: {
    minLength: 5,
    maxLength: 20,
    patternDescription: "Alphanumeric university format",
  },
});

export type AcademicConfig = typeof academicConfig;
