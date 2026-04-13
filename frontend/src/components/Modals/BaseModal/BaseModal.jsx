import { useEffect, useState } from "react";
import "./baseModal.css";

export default function BaseModal({ isOpen, onClose, title, children }) {
  const [shake, setShake] = useState(false);
  const [highlightClose, setHighlightClose] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOutsideClick = () => {
    setShake(true);
    setHighlightClose(true);

    setTimeout(() => setShake(false), 300);
  };

  return (
    <div className="modal-overlay" onClick={handleOutsideClick}>
      <div
        className={`modal-container ${shake ? "shake" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          <button
            className={`modal-close ${
              highlightClose ? "highlight-close" : ""
            }`}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}