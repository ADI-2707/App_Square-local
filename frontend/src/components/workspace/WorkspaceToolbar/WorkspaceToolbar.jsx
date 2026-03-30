import "./workspaceToolbar.css";

export default function WorkspaceToolbar({
  onUpload,
  onDownload,
  isEditing,
  onEditToggle,
  onCancel,
  showEdit,
  viewMode,
  setViewMode,
}) {
  const isToggleDisabled = isEditing;

  const handleToggle = () => {
    if (isToggleDisabled) return;

    setViewMode((prev) => (prev === "device" ? "tag" : "device"));
  };

  return (
    <div className="workspace-toolbar">
      <div className="toolbar-left">
        <span className="toolbar-title">Workspace Controls:</span>
      </div>

      <div className="toolbar-actions">
        {showEdit && (
          <div className="view-toggle">
            <button
              className={`view-btn ${isToggleDisabled ? "disabled" : ""}`}
              onClick={handleToggle}
              disabled={isToggleDisabled}
              aria-disabled={isToggleDisabled}
              title={
                isToggleDisabled
                  ? "Cannot change view while editing"
                  : viewMode === "device"
                    ? "Switch to Tag View"
                    : "Switch to Device View"
              }
            >
              <img
                src={
                  viewMode === "device"
                    ? "/icons/tag-view.svg"
                    : "/icons/device-view.svg"
                }
                alt="toggle-view"
              />
            </button>
          </div>
        )}

        {showEdit && isEditing && (
          <button className="hmi-btn cancel-btn" onClick={onCancel}>
            <img src="/icons/close.svg" className="btn-icon" alt="cancel" />
            Cancel
          </button>
        )}

        {showEdit && (
          <button
            className={`hmi-btn ${isEditing ? "apply-btn" : "edit-btn"}`}
            onClick={onEditToggle}
          >
            <img
              src={isEditing ? "/icons/check.svg" : "/icons/edit.svg"}
              className="btn-icon"
              alt="edit-toggle"
            />
            {isEditing ? "Save" : "Edit"}
          </button>
        )}

        <button className="hmi-btn" onClick={onUpload}>
          <img src="/icons/upload.svg" className="btn-icon" alt="upload" />
          Upload
        </button>

        <button className="hmi-btn" onClick={onDownload}>
          <img src="/icons/download.svg" className="btn-icon" alt="download" />
          Download
        </button>
      </div>
    </div>
  );
}
