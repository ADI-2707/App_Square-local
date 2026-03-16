import "./admin.css";

export default function Admin() {
  return (
    <div className="admin-page">

      <h2 className="admin-title">Admin Settings</h2>

      <div className="admin-panel">
        <div className="admin-panel-header">
          Account Security
        </div>

        <div className="admin-panel-body">
          <form className="admin-form">

            <div className="form-group">
              <label>Current Password</label>
              <input type="password" />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input type="password" />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" />
            </div>

            <div className="admin-actions">
              <button className="admin-btn">
                Update Password
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}