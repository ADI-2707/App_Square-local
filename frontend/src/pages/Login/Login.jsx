import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../Utility/api";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import loginBg from "../../assets/login-bg.png";
import "./login.css";

export default function Login() {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (isLoading) return;
    setIsLoading(true);

    try {

      const response = await api.post("/auth/login", {
        username,
        password
      });

      await login(response.data.access_token);

      navigate("/home");

    } catch (error) {

      console.log(error);
      alert(error.response?.data?.detail || error.message);

    } finally {

      setIsLoading(false);

    }

  };

  return (
    <div
      className="login-container"
      style={{ backgroundImage: `url(${loginBg})` }}
    >

      <div className="login-box">
        <div className="login-left">
          <h1 className="welcome-title">
            Welcome to {import.meta.env.VITE_APP_NAME}
          </h1>

          <p className="welcome-text">
            Industrial production monitoring and recipe management platform
            designed for steel plant operations.
          </p>

          <p className="welcome-text">
            This system enables operators and engineers to manage production
            templates, recipes, device configurations, and process parameters
            in a centralized and reliable environment.
          </p>

          <p className="welcome-footer">
            Secure • Reliable • Industrial Grade
          </p>
        </div>

        <div className="login-right">
          <h2 className="login-heading">Login</h2>
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

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Logging in..." : "LOGIN"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}