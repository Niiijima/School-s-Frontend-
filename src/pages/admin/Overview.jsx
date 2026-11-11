import React from "react";
import {
  Users,
  BookOpen,
  UserPlus,
  ClipboardList,
  ChevronRight,
} from "lucide-react";

function Overview({ stats, terms, openPage }) {
  return (
    <>
      <div className="admin-stats-grid">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div className="admin-stat-card" key={label}>
            <div className={`admin-stat-icon ${color}`}>
              <Icon size={21} />
            </div>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-overview-grid">
        <section className="admin-panel admin-overview-panel">
          <div className="admin-panel-heading">
            <div>
              <h3>Quick actions</h3>
              <p>Shortcuts to common tasks</p>
            </div>
          </div>

          <div className="admin-quick-actions">
            {[
              ["Add a student", Users, "Students", "blue"],
              ["Manage subjects", BookOpen, "Subjects", "gold"],
              ["Enroll a student", UserPlus, "Enrollments", "green"],
              ["Submit scores", ClipboardList, "Submit Scores", "purple"],
            ].map(([label, Icon, page, color]) => (
              <button
                key={label}
                onClick={() => openPage(page)}
                className="admin-quick-action"
              >
                <span className={`admin-quick-icon ${color}`}>
                  <Icon size={19} />
                </span>
                <strong>{label}</strong>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h3>Academic terms</h3>
              <p>Current term status</p>
            </div>
            <button
              className="admin-text-button"
              onClick={() => openPage("Academic Terms")}
            >
              View all
            </button>
          </div>

          <div className="admin-term-list">
            {terms.map((term) => (
              <div className="admin-term-row" key={term.id}>
                <div>
                  <strong>{term.name}</strong>
                  <span>{term.session}</span>
                </div>
                <span
                  className={`admin-status ${
                    term.isLocked ? "locked" : "open"
                  }`}
                >
                  {term.isLocked ? "Locked" : "Open"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default Overview;