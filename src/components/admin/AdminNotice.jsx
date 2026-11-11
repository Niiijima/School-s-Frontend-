
import React from "react";
import { CheckCircle2 } from "lucide-react";

function AdminNotice({ notice }) {
  if (!notice) return null;

  return (
    <div className="admin-toast">
      <CheckCircle2 size={18} />
      {notice}
    </div>
  );
}

export default AdminNotice;
