
import React from "react";
import { CalendarDays } from "lucide-react";

function AdminPageIntro({
  activePage,
  pageDescription,
  currentAcademicYear,
}) {
  return (
    <div className="admin-welcome">
      <div>
        <p className="admin-eyebrow">
          O'LAK TRIUMPH SCHOOL
        </p>

        <h2>
          {activePage === "Overview"
            ? "Welcome to your dashboard"
            : `Manage ${activePage}`}
        </h2>

        <p>{pageDescription}</p>
      </div>

      <div className="admin-date-chip">
        <CalendarDays size={16} />
        {currentAcademicYear} Session
      </div>
    </div>
  );
}

export default AdminPageIntro;
