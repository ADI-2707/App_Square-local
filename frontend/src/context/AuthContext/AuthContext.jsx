import { createContext, useState, useEffect, useContext } from "react";
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

  const setAxiosAuthHeader = (token) => {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  const clearAxiosAuthHeader = () => {
    delete api.defaults.headers.common["Authorization"];
  };

  
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Backend logout failed:", error);
    } finally {
      localStorage.removeItem("token");
      clearAxiosAuthHeader();

      setAuthState({
        token: null,
        username: null,
        role: null,
        isAuthenticated: false,
      });
    }
  };

  const login = async (jwtToken) => {
    const decoded = decodeToken(jwtToken);

    if (!decoded || isTokenExpired(decoded)) {
      await logout();
      return false;
    }

    try {
      localStorage.setItem("token", jwtToken);
      setAxiosAuthHeader(jwtToken);

      const response = await api.get("/auth/profile");

      setAuthState({
        token: jwtToken,
        username: response.data.username,
        role: response.data.role,
        isAuthenticated: true,
      });

      return true;
    } catch (error) {
      console.error("Login profile fetch failed:", error);
      await logout();
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
        await logout();
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
        console.error("Session restore failed:", error);
        await logout();
      } finally {
        setLoading(false);
      }
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

export const useAuth = () => useContext(AuthContext);