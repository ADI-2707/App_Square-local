import { useUiLock } from "../../../context/UiLockContext/UiLockContext";
import "./UiLockOverlay.css";

export default function UiLockOverlay() {
  const { isLocked, message } = useUiLock();

  if (!isLocked) return null;

  return (
    <div className="ui-lock-overlay">
      <div className="ui-lock-content">
        <div className="loader"></div>
        <p>{message}</p>
      </div>
    </div>
  );
}