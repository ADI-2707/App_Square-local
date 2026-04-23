import { useEffect } from "react";
import "./aboutModal.css";

export default function AboutModal({ isOpen, onClose }) {
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
            <h2>About APP SQUARE</h2>
          </div>

          <span className="modal-close" onClick={onClose}>
            ×
          </span>
        </div>

        <div className="modal-content">
          <p>
            APP SQUARE is an industrial application designed for managing
            production templates, equipment, and recipes in real-time.
          </p>

          <p>
            It enables operators and engineers to configure processes, maintain
            consistency, and execute production workflows efficiently.
          </p>

          <h4 className="modal-section-title">Key Capabilities</h4>

          <ul>
            <li>Centralized template management</li>
            <li>Equipment and tag configuration</li>
            <li>Structured recipe creation</li>
            <li>Real-time workspace execution</li>
          </ul>

          <h4 className="modal-section-title">Why It Matters</h4>

          <ul>
            <li>Reduces manual configuration errors</li>
            <li>Improves production consistency</li>
            <li>Speeds up setup and changeovers</li>
            <li>Provides clear visibility of process data</li>
          </ul>
        </div>

        <div className="modal-footer">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
