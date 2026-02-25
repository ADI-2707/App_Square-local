import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import { useNavigate } from "react-router-dom";
import "./navbar.css";

export default function Navbar() {
  const { logout, username } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/");
    }
  };

  return (
    <div className="navbar">
      <div className="navbar-title">
        {import.meta.env.VITE_APP_NAME}
      </div>

      <div className="navbar-right">
        <span className="user-info">
          {username?.toUpperCase()}
        </span>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}