import "./admin.css";

export default function Admin() {
  return (
    <div className="admin-page">
      <div className="admin-container">

        <h2 className="admin-title">Admin Settings</h2>

        <div className="admin-card">

          <h3 className="admin-section-title">
            Change Password
          </h3>

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

            <button className="admin-btn">
              Update Password
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}