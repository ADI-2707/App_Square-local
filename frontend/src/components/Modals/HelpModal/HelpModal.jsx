import { useEffect, useState } from "react";
import "../AboutModal/aboutModal.css";

export default function HelpModal({ isOpen, onClose }) {
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  const steps = [
    { title: "Create a Template", details: ["Go to Templates", "Click Create", "Save"] },
    { title: "Add Equipment", details: ["Open template", "Add device", "Assign tags"] },
    { title: "Define Tags", details: ["Create tags", "Map to device"] },
    { title: "Create Area", details: ["Go to Recipes", "Create Area"] },
    { title: "Create Recipes", details: ["Add recipe", "Set values"] },
    { title: "Load Recipe", details: ["Select recipe", "Load"] }
  ];

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <img src="/app.svg" className="modal-logo" />
            <h2>How to Use APP SQUARE</h2>
          </div>
          <span className="modal-close" onClick={onClose}>×</span>
        </div>

        <div className="modal-content">
          {steps.map((step, index) => (
            <div key={index} className="help-item">
              <div className="help-header" onClick={() => toggle(index)}>
                <span>{index + 1}. {step.title}</span>
                <span className="help-arrow">
                  {openIndex === index ? "▼" : "▶"}
                </span>
              </div>

              {openIndex === index && (
                <ul className="help-details">
                  {step.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}