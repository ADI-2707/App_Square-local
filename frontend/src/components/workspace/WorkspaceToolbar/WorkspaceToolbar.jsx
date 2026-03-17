import "./workspaceToolbar.css";

export default function WorkspaceToolbar({
  onUpload,
  onDownload,
  isEditing,
  onEditToggle,
  showEdit,
}) {
  return (
    <div className="workspace-toolbar">
      <div className="toolbar-left">
        <span className="toolbar-title">Workspace Controls:</span>
      </div>

      <div className="toolbar-actions">
        {showEdit && (
          <button
            className={`hmi-btn ${isEditing ? "apply-btn" : "edit-btn"}`}
            onClick={onEditToggle}
          >
            <img
              src={isEditing ? "/icons/check.svg" : "/icons/edit.svg"}
              className="btn-icon"
            />
            {isEditing ? "Apply" : "Edit"}
          </button>
        )}

        <button className="hmi-btn" onClick={onUpload}>
          <img src="/icons/upload.svg" className="btn-icon" />
          Upload
        </button>

        <button className="hmi-btn" onClick={onDownload}>
          <img src="/icons/download.svg" className="btn-icon" />
          Download
        </button>
      </div>
    </div>
  );
}
