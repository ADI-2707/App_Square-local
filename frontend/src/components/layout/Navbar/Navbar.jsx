import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "./navbar.css";

export default function Navbar() {
  const { logout, username } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/");
    }
  };

  const isAdminPage = location.pathname === "/admin";

  return (
    <div className="navbar">
      <div className="navbar-title">
        <Link to="/">{import.meta.env.VITE_APP_NAME}</Link>
      </div>

      <div className="navbar-right">
        <Link to="/admin" className={`admin-link ${isAdminPage ? "active" : ""}`}>
          {username?.toUpperCase()}
        </Link>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}