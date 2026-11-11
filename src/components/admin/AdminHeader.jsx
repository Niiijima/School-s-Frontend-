
import React from "react";
import {
  ChevronRight,
  Menu,
  Bell,
  CalendarDays,
} from "lucide-react";

function AdminHeader({
  activePage,
  pageTitle,
  currentAcademicYear,
  setSidebarOpen,
  showNotice,
}) {
  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <button
          className="admin-menu-toggle"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div>
          <div className="admin-breadcrumb">
            Administration
            <ChevronRight size={13} />
            {activePage}
          </div>

          <h1>{pageTitle}</h1>
        </div>
      </div>

      <div className="admin-topbar-right">
        <span className="admin-session-label">
          <span />
          {currentAcademicYear} Academic Session
        </span>

        <button
          className="admin-notification"
          aria-label="Notifications"
          onClick={() =>
            showNotice("You are all caught up.")
          }
        >
          <Bell size={19} />
        </button>

        <div className="admin-profile">
          <div className="admin-avatar">A</div>

          <div>
            <strong>Administrator</strong>
            <span>School Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
