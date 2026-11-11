
import React from "react";
import { FileText } from "lucide-react";

function EmptyState({ text }) {
  return (
    <div className="admin-empty">
      <FileText size={28} />
      <p>{text}</p>
    </div>
  );
}

export default EmptyState;
