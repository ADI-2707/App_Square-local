import { createContext, useState, useEffect } from "react";
import api from "../../Utility/api";

export const AuthContext = createContext();

const decodeToken = (token) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
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
    isAuthenticated: false,
  });

  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("token");
    setAuthState({
      token: null,
      username: null,
      role: null,
      isAuthenticated: false,
    });
  };

  const setAxiosAuthHeader = (token) => {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  const clearAxiosAuthHeader = () => {
    delete api.defaults.headers.common["Authorization"];
  };

  const login = async (jwtToken) => {
    const decoded = decodeToken(jwtToken);

    if (!decoded || isTokenExpired(decoded)) {
      logout();
      return false;
    }

    localStorage.setItem("token", jwtToken);
    setAxiosAuthHeader(jwtToken);

    try {
      const response = await api.get("/auth/profile");

      setAuthState({
        token: jwtToken,
        username: response.data.username,
        role: response.data.role,
        isAuthenticated: true,
      });

      return true;
    } catch (error) {
      logout();
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      const decoded = decodeToken(storedToken);

      if (!decoded || isTokenExpired(decoded)) {
        logout();
        setLoading(false);
        return;
      }

      try {
        setAxiosAuthHeader(storedToken);

        const response = await api.get("/auth/profile");

        setAuthState({
          token: storedToken,
          username: response.data.username,
          role: response.data.role,
          isAuthenticated: true,
        });
      } catch (error) {
        logout();
        clearAxiosAuthHeader();
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};