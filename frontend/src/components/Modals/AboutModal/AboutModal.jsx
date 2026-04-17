import "./aboutModal.css";

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>About APP SQUARE</h2>

        <p>
          APP SQUARE is an industrial application designed for managing
          production templates, equipment, and recipes in real-time.
        </p>

        <p>
          It enables operators and engineers to efficiently configure
          processes, monitor data, and execute production workflows
          with accuracy and consistency.
        </p>

        <ul>
          <li>Centralized template management</li>
          <li>Equipment and tag configuration</li>
          <li>Structured recipe creation</li>
          <li>Real-time workspace execution</li>
        </ul>

        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}