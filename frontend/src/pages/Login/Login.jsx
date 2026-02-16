import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../Utility/api";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import loginBg from "../../assets/login-bg.png";
import "./login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      await login(response.data.access_token);
      navigate("/home");
    } catch (error) {
      alert(error.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div
      className="login-container"
      style={{
        backgroundImage: `url(${loginBg})`,
      }}
    >
      <div className="login-box">
        <h2>{import.meta.env.VITE_APP_NAME}</h2>

        <p className="login-subtitle">
          Industrial production monitoring and recipe management system for
          steel plant operations.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">LOGIN</button>
        </form>
      </div>
    </div>
  );
}
