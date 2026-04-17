import { useEffect } from "react";
import "../AboutModal/aboutModal.css";

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <img src="/app.svg" alt="App Logo" className="modal-logo" />
            <h2>How to Use APP SQUARE</h2>
          </div>

          <span className="modal-close" onClick={onClose}>
            ×
          </span>
        </div>

        <div className="modal-content">
          <ol>
            <li>Create a Template</li>
            <li>Add Equipment (Devices)</li>
            <li>Define Tags</li>
            <li>Create Area (Recipe Group)</li>
            <li>Create Recipes</li>
            <li>Load Recipe into Workspace</li>
          </ol>
        </div>

        <div className="modal-footer">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
