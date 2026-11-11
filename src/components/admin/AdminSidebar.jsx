
import React from "react";
import schoolLogo from "../../assets/logo.jpeg";

import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserPlus,
  ClipboardList,
  GraduationCap,
  CalendarDays,
  TrendingUp,
  X,
  LogOut,
  ChevronRight,
  School,
  ArrowUpRight,
} from "lucide-react";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Students", icon: Users },
  { label: "Subjects", icon: BookOpen },
  { label: "Enrollments", icon: UserPlus },
  { label: "Submit Scores", icon: ClipboardList },
  { label: "Student Results", icon: GraduationCap },
  { label: "Academic Terms", icon: CalendarDays },
  { label: "Promote Students", icon: TrendingUp },
];

function AdminSidebar({
  activePage,
  openPage,
  sidebarOpen,
  setSidebarOpen,
  handleLogout,
}) {
  return (
    <>
      {sidebarOpen && (
        <button
          className="admin-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`admin-sidebar ${
          sidebarOpen ? "admin-sidebar-open" : ""
        }`}
      >
        <div className="admin-brand">
          <div className="admin-brand-logo">
            <img
              src={schoolLogo}
              alt="O'lak Triumph School"
            />
          </div>

          <div>
            <strong>O'lak Triumph</strong>
            <span>School Administration</span>
          </div>

          <button
            className="admin-mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="admin-nav-label">
          MAIN MENU
        </div>

        <nav className="admin-nav">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`admin-nav-link ${
                activePage === label ? "active" : ""
              }`}
              onClick={() => openPage(label)}
            >
              <Icon size={19} />

              <span>{label}</span>

              {activePage === label && (
                <ChevronRight
                  size={16}
                  className="admin-nav-arrow"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-note">
            <School size={20} />

            <div>
              <strong>O'lak Triumph School</strong>
              <span>Administrator workspace</span>
            </div>
          </div>

          <button
            className="admin-logout"
            onClick={handleLogout}
            style={{
              border: 0,
              background: "transparent",
              cursor: "pointer",
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>

          <a className="admin-home-link" href="/">
            Visit public website
            <ArrowUpRight size={15} />
          </a>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
