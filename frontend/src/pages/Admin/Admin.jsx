import { useState, useEffect } from "react";
import api from "../../Utility/api";
import "./admin.css";

export default function Admin() {
  const [operators, setOperators] = useState([]);
  const [opPasswords, setOpPasswords] = useState({});
  const [loadingOps, setLoadingOps] = useState(false);

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

      localStorage.removeItem("token");
      window.location.href = "/";

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

  const fetchOperators = async () => {
    try {
      setLoadingOps(true);
      const res = await api.get("/admin/operators");
      setOperators(res.data);
    } catch (err) {
      alert("Failed to load operators");
    } finally {
      setLoadingOps(false);
    }
  };

  const handleToggle = async (id, currentState) => {
    if (currentState) {
      const confirmDeactivate = window.confirm(
        "Are you sure you want to deactivate this operator?\nThey will not be able to log in.",
      );

      if (!confirmDeactivate) return;
    }

    try {
      await api.patch(`/admin/operators/${id}/toggle`);
      fetchOperators();
    } catch {
      alert("Failed to update operator");
    }
  };

  const handleOpPasswordChange = (id, value) => {
    setOpPasswords((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleOpPasswordSubmit = async (id) => {
    const new_password = opPasswords[id];

    if (!new_password) {
      alert("Enter password");
      return;
    }

    try {
      await api.put(`/admin/operators/${id}/password`, new_password);
      alert("Password updated");

      setOpPasswords((prev) => ({
        ...prev,
        [id]: "",
      }));
    } catch {
      alert("Failed to update password");
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  return (
    <div className="admin-page">
      <h2 className="admin-title">Admin Settings</h2>

      <div className="admin-panel">
        <div className="admin-panel-header">Account Security</div>

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
      <div className="admin-panel">
        <div className="admin-panel-header">Operator Management</div>

        <div className="admin-panel-body">
          {loadingOps ? (
            <p>Loading operators...</p>
          ) : (
            operators.map((op) => (
              <div key={op.id} className="operator-row">
                <div className="op-name">
                  <span
                    className={`status-dot ${op.is_active ? "active" : "inactive"}`}
                  ></span>
                  {op.username}
                </div>

                <div className="op-toggle">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={op.is_active}
                      onChange={() => handleToggle(op.id, op.is_active)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="op-password">
                  <input
                    type="password"
                    placeholder="New Password"
                    value={opPasswords[op.id] || ""}
                    onChange={(e) =>
                      handleOpPasswordChange(op.id, e.target.value)
                    }
                  />
                  <button onClick={() => handleOpPasswordSubmit(op.id)}>
                    Update
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
