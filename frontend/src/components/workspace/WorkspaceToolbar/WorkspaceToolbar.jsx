import "./workspaceToolbar.css";

export default function WorkspaceToolbar({ onUpload, onDownload }) {

  return (
    <div className="workspace-toolbar">

      <div className="toolbar-left">
        <span className="toolbar-label">Workspace Controls</span>
      </div>

      <div className="toolbar-actions">

        <button
          className="toolbar-btn upload-btn"
          onClick={onUpload}
        >
          Upload
        </button>

        <button
          className="toolbar-btn download-btn"
          onClick={onDownload}
        >
          Download
        </button>

      </div>

    </div>
  );
}