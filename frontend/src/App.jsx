import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext/AuthContext";
import Admin from "./pages/Admin/Admin";
import Login from "./pages/Login/Login";
import Layout from "./components/layout/Layout/Layout";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>

      <Route path="/" element={<Login />} />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Layout>
              <Admin />
            </Layout>
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

export default App;