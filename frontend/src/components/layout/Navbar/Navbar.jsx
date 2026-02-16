import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import { useNavigate } from "react-router-dom";
import "./navbar.css";

export default function Navbar() {
  const { logout, username, role } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="navbar">
      <div className="navbar-title">
        {import.meta.env.VITE_APP_NAME}
      </div>

      <div className="navbar-right">
        <span className="user-info">
          {username} ({role})
        </span>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}