import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "./navbar.css";

export default function Navbar() {
  const { logout, username, role } = useContext(AuthContext);
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

  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <div className="navbar">
      <div className="navbar-title">
        <Link to="/">{import.meta.env.VITE_APP_NAME}</Link>
      </div>

      <div className="navbar-right">
        {role === "admin" ? (
          isAdminPage ? (
            <Link to="/home" className="admin-link admin-role">
              <img src="/icons/home.svg" className="admin-icon" />
              <span className="admin-text">HOME</span>
            </Link>
          ) : (
            <Link to="/admin" className="admin-link admin-role">
              <img src="/icons/user.svg" className="admin-icon" />
              <span className="admin-text">{username?.toUpperCase()}</span>
            </Link>
          )
        ) : (
          <div className="admin-link disabled">
            <img src="/icons/user.svg" className="admin-icon" />
            {username?.toUpperCase()}
          </div>
        )}

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
