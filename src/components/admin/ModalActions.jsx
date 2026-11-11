
import React from "react";

function ModalActions({
  onCancel,
  submitLabel = "Save record",
}) {
  return (
    <div className="admin-modal-actions">
      <button
        type="button"
        className="admin-secondary-button"
        onClick={onCancel}
      >
        Cancel
      </button>

      <button
        type="submit"
        className="admin-primary-button"
      >
        {submitLabel}
      </button>
    </div>
  );
}

export default ModalActions;
