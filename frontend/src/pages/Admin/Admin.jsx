import { useState } from "react";
import api from "../../Utility/api";
import "./admin.css";

export default function Admin() {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.current_password || !form.new_password) {
      alert("All fields are required");
      return;
    }

    if (form.new_password !== form.confirm_password) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await api.put("/admin/change-password", {
        current_password: form.current_password,
        new_password: form.new_password,
      });

      alert("Password updated successfully");

      setForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      alert(error.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <h2 className="admin-title">Admin Settings</h2>

      <div className="admin-panel">
        <div className="admin-panel-header">
          Account Security
        </div>

        <div className="admin-panel-body">
          <form className="admin-form" onSubmit={handleSubmit}>
            
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="current_password"
                value={form.current_password}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="new_password"
                value={form.new_password}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
              />
            </div>

            <div className="admin-actions">
              <button className="admin-btn" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}