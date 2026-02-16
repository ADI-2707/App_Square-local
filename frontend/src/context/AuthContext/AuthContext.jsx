import { createContext, useState, useEffect } from "react";
import api from "../../Utility/api";

export const AuthContext = createContext();

const decodeToken = (token) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
};

const isTokenExpired = (decoded) => {
  if (!decoded?.exp) return true;

  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: null,
    username: null,
    role: null,
  });

  const logout = () => {
    localStorage.removeItem("token");
    setAuthState({
      token: null,
      username: null,
      role: null,
    });
  };

  const login = async (jwtToken) => {
    const decoded = decodeToken(jwtToken);

    if (!decoded || isTokenExpired(decoded)) {
      logout();
      return;
    }

    localStorage.setItem("token", jwtToken);

    try {
      const response = await api.get("/auth/profile");

      setAuthState({
        token: jwtToken,
        username: response.data.username,
        role: response.data.role,
      });
    } catch {
      logout();
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) return;

    const decoded = decodeToken(storedToken);

    if (!decoded || isTokenExpired(decoded)) {
      logout();
      return;
    }

    const restoreSession = async () => {
      try {
        const response = await api.get("/auth/profile");

        setAuthState({
          token: storedToken,
          username: response.data.username,
          role: response.data.role,
        });
      } catch {
        logout();
      }
    };

    restoreSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};