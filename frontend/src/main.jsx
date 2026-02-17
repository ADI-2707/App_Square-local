import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext/AuthContext";
import { EntityProvider } from "./context/EntityContext/EntityContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <EntityProvider>
          <App />
        </EntityProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);