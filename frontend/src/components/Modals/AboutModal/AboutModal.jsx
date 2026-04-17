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
          <h2>About APP SQUARE</h2>
          <span className="modal-close" onClick={onClose}>×</span>
        </div>

        <div className="modal-content">
          <p>
            APP SQUARE is an industrial application designed for managing
            production templates, equipment, and recipes in real-time.
          </p>

          <p>
            It enables operators and engineers to efficiently configure
            processes and execute workflows with consistency.
          </p>

          <ul>
            <li>Centralized template management</li>
            <li>Equipment and tag configuration</li>
            <li>Structured recipe creation</li>
            <li>Real-time workspace execution</li>
          </ul>
        </div>

        <div className="modal-footer">
          <button onClick={onClose}>Close</button>
        </div>

      </div>
    </div>
  );
}