import { useState } from "react";
import "./changeLogBanner.css";

export default function ChangeLogBanner({ changes }) {
  const [dismissed, setDismissed] = useState(false);

  if (!changes || changes.length === 0 || dismissed) return null;

  return (
    <div className="change-banner">
      <div className="change-banner-header">
        <div className="change-banner-title">⚠ Template Updates Detected</div>
        <button className="change-banner-close" onClick={() => setDismissed(true)}>✕</button>
      </div>

      <ul className="change-banner-list">
        {changes.map((change, index) => (
          <li key={index} className="change-banner-item">
            {change.label}
          </li>
        ))}
      </ul>
    </div>
  );
}