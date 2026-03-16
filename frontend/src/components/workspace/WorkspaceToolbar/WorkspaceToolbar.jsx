import "./workspaceToolbar.css";

export default function WorkspaceToolbar({ onUpload, onDownload }) {
  return (
    <div className="workspace-toolbar">

      <div className="toolbar-title">
        Workspace Controls
      </div>

      <div className="toolbar-actions">

        <button
          className="hmi-btn"
          onClick={onUpload}
        >
          <img src="/icons/upload.svg" className="btn-icon" />
          Upload
        </button>

        <button
          className="hmi-btn"
          onClick={onDownload}
        >
          <img src="/icons/download.svg" className="btn-icon" />
          Download
        </button>

      </div>

    </div>
  );
}