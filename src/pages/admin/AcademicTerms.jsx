
import React from "react";
import {
  CalendarDays,
  Lock,
  Unlock,
  X,
  CheckCircle2,
} from "lucide-react";

function AcademicTerms({
  terms,
  toggleTerm,
  publishTerm,
}) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <h3>Academic terms</h3>

          <p>
            Lock or unlock terms and publish or
            unpublish completed terms.
          </p>
        </div>
      </div>

      <div className="admin-term-management">
        {terms.map((term) => (
          <div
            className="admin-term-card"
            key={term.id}
          >
            <div className="admin-term-card-icon">
              <CalendarDays size={22} />
            </div>

            <div className="admin-term-card-info">
              <strong>{term.name}</strong>
              <span>{term.session}</span>

              <div className="admin-term-statuses">
                <span
                  className={`admin-status ${
                    term.isLocked ? "locked" : "open"
                  }`}
                >
                  {term.isLocked ? "Locked" : "Unlocked"}
                </span>

                <span
                  className={`admin-status ${
                    term.isPublished ? "published" : "open"
                  }`}
                >
                  {term.isPublished
                    ? "Published"
                    : "Unpublished"}
                </span>
              </div>
            </div>

            <div className="admin-term-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => toggleTerm(term.id)}
              >
                {term.isLocked ? (
                  <Unlock size={15} />
                ) : (
                  <Lock size={15} />
                )}

                {term.isLocked ? "Unlock" : "Lock"}
              </button>

              <button
                type="button"
                className="admin-primary-button"
                onClick={() => publishTerm(term.id)}
              >
                {term.isPublished ? (
                  <X size={15} />
                ) : (
                  <CheckCircle2 size={15} />
                )}

                {term.isPublished
                  ? "Unpublish"
                  : "Publish"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default AcademicTerms;
