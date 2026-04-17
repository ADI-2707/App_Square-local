import "./footer.css";

export default function Footer({ onOpenAbout }) {
  return (
    <div className="app-footer">
      <div className="footer-left">
        <img src="/app.svg" className="footer-logo" />
        <span className="footer-brand">APP SQUARE</span>
      </div>

      <div className="footer-right">
        <span className="footer-link" onClick={onOpenAbout}>
          About
        </span>
        <span className="footer-link">
          Help
        </span>
      </div>
    </div>
  );
}