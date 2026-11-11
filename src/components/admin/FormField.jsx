
import React from "react";

function FormField({ label, children }) {
  return (
    <label className="admin-form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export default FormField;
