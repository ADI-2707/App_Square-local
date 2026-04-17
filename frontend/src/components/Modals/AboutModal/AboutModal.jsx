import "./aboutModal.css";

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>How to Use APP SQUARE</h2>

        <ol>
          <li>Create a Template</li>
          <li>Add Equipment (Devices)</li>
          <li>Define Tags</li>
          <li>Create Area (Recipe Group)</li>
          <li>Create Recipes</li>
          <li>Load Recipe into Workspace</li>
        </ol>

        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}