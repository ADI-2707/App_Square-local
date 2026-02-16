import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../Utility/api";
import { AuthContext } from "../../context/AuthContext/AuthContext";
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
    <div className="login-container">
      <div className="login-box">
        <h2>{import.meta.env.VITE_APP_NAME}</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            required
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            required
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">LOGIN</button>
        </form>
      </div>
    </div>
  );
}