
import React from "react";
import { Search, Plus } from "lucide-react";

function PanelHeading({
  title,
  subtitle,
  search,
  setSearch,
  action,
  actionLabel,
}) {
  return (
    <div className="admin-panel-heading admin-panel-heading-wrap">
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>

      <div className="admin-panel-tools">
        {typeof search === "string" && (
          <div className="admin-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search records..."
            />
          </div>
        )}

        {action && (
          <button
            className="admin-primary-button"
            onClick={action}
          >
            <Plus size={17} />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default PanelHeading;
