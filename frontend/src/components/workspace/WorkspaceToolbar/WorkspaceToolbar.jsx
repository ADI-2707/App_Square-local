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
  return (
    <div className="workspace-toolbar">
      <div className="toolbar-left">
        <span className="toolbar-title">Workspace Controls:</span>
      </div>

      <div className="toolbar-actions">
        {showEdit && (
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === "device" ? "device" : "tag"}`}
              onClick={() => {
                setViewMode((prev) => (prev === "device" ? "tag" : "device"))
              }}
              title={
                viewMode === "device"
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
              />
            </button>
          </div>
        )}

        {showEdit && isEditing && (
          <button className="hmi-btn cancel-btn" onClick={onCancel}>
            <img src="/icons/close.svg" className="btn-icon" />
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
            />
            {isEditing ? "Save" : "Edit"}
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
