import "./aboutModal.css";

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>About APP SQUARE</h2>

        <div className="modal-content">
          <p>
            APP SQUARE is an industrial application designed for managing
            production templates, equipment, and recipes in real-time.
          </p>

          <p>
            It enables operators and engineers to efficiently configure
            processes, monitor data, and execute production workflows.
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