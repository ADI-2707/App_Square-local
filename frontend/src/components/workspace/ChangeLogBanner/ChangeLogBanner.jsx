import "./changeLogBanner.css";

export default function ChangeLogBanner({ changes }) {
  if (!changes || changes.length === 0) return null;

  return (
    <div className="change-banner">
      <div className="change-banner-title">
        ⚠ Template Updates Detected
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