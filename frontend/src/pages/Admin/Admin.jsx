import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import eyeOpen from "../../assets/icons/eye-open.svg";
import eyeClosed from "../../assets/icons/eye-closed.svg";
import api from "../../Utility/api";
import "./admin.css";

export default function Admin() {
  const [operators, setOperators] = useState([]);
  const [opPasswords, setOpPasswords] = useState({});
  const [loadingOps, setLoadingOps] = useState(false);
  const [blinking, setBlinking] = useState({});

  const navigate = useNavigate();

  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
    operators: {},
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const triggerBlink = (key) => {
    setBlinking((prev) => ({ ...prev, [key]: true }));

    setTimeout(() => {
      setBlinking((prev) => ({ ...prev, [key]: false }));
    }, 150);
  };

  const toggleMainPassword = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
    triggerBlink(field);
  };

  const toggleOperatorPassword = (id) => {
    setShowPassword((prev) => ({
      ...prev,
      operators: {
        ...prev.operators,
        [id]: !prev.operators[id],
      },
    }));
    triggerBlink(id);
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
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to load operators");
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
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to update operator");
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
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to update password");
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
              <div className="password-field">
                <input
                  type={showPassword.current ? "text" : "password"}
                  name="current_password"
                  value={form.current_password}
                  onChange={handleChange}
                />
                <img
                  src={showPassword.current ? eyeOpen : eyeClosed}
                  alt="toggle"
                  className={`eye-icon ${blinking.current ? "blink" : ""}`}
                  onClick={() => toggleMainPassword("current")}
                />
              </div>
            </div>

            <div className="form-group">
              <label>New Password</label>
              <div className="password-field">
                <input
                  type={showPassword.new ? "text" : "password"}
                  name="new_password"
                  value={form.new_password}
                  onChange={handleChange}
                />
                <img
                  src={showPassword.new ? eyeOpen : eyeClosed}
                  alt="toggle"
                  className={`eye-icon ${blinking.new ? "blink" : ""}`}
                  onClick={() => toggleMainPassword("new")}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <div className="password-field">
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  name="confirm_password"
                  value={form.confirm_password}
                  onChange={handleChange}
                />
                <img
                  src={showPassword.confirm ? eyeOpen : eyeClosed}
                  alt="toggle"
                  className={`eye-icon ${blinking.confirm ? "blink" : ""}`}
                  onClick={() => toggleMainPassword("confirm")}
                />
              </div>
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
                    className={`status-dot ${
                      op.is_active ? "active" : "inactive"
                    }`}
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
                  <div className="password-field">
                    <input
                      type={showPassword.operators[op.id] ? "text" : "password"}
                      placeholder="New Password"
                      value={opPasswords[op.id] || ""}
                      onChange={(e) =>
                        handleOpPasswordChange(op.id, e.target.value)
                      }
                    />
                    <img
                      src={showPassword.operators[op.id] ? eyeOpen : eyeClosed}
                      alt="toggle"
                      className={`eye-icon ${blinking[op.id] ? "blink" : ""}`}
                      onClick={() => toggleOperatorPassword(op.id)}
                    />
                  </div>

                  <button onClick={() => handleOpPasswordSubmit(op.id)}>
                    Update
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="admin-panel">
        <div className="admin-panel-header">System Logs</div>

        <div className="admin-panel-body">
          <button className="admin-btn" onClick={() => navigate("/admin/logs")}>
            View Logs →
          </button>
        </div>
      </div>
    </div>
  );
}
